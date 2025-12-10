'use client';

import { useEffect, useRef, useState} from "react";
import { useParams } from "next/navigation";
import Chart from 'chart.js/auto';
import { useAppLayoutContext } from "@/components/appLayout";

import { CHART_COLORS, getColorOfDataPoint, OUTLIER_DATA_POINT_COLOR } from "@/helper/chart";
import AppIcon from "../icon";
import Link from "next/link";

export default function LineChart({ categories = [], dataSeries = [], ucl = null, lcl = null }) {
  const { modal, toast, closeModal } = useAppLayoutContext();
  const { role_id, kpi_id, user_id } = useParams();
  
  const divRef = useRef(null);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const isValueExeedsLimits = (value) => {
    return ucl && lcl && (value > ucl || value < lcl);
  };

  const shouldHighlightGridLine = (ctx) => {
    return ucl && lcl && (ctx.tick.value == ucl || ctx.tick.value == lcl);
  };

  const shouldHighlightDataPoint = (ctx) => {
    return isValueExeedsLimits(ctx.parsed.y);
  };

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const fetchRCADetails = async () => {
    try {
      const res = await fetch("/api/v1/rca/list");
      const data = await res.json();

      const list = data?.data?.root_cause_analysis || [];

      return list;

    } catch (e) {
      console.error(e);
    }
  };


  const fetchCAPADetails = async () => {
    try {
      const res = await fetch("/api/v1/capa/list");
      const data = await res.json();

      const capalist = data?.data?.gap_analysis || [];

      return capalist;

    } catch (e) {
      console.error(e);
    }
  };

  const submitResponses = async (response_id, rcaRef=null, capaRef = null, user_id, kpi_id) => {
    const final_rca_id = rcaRef.current || null;
    const final_capa_id = capaRef.current || null;

    const formData = { response_id, rca_id: final_rca_id, capa_id: final_capa_id, user_id, kpi_id };
    
    console.log("FormData  : ", formData);
     
    try {
      const res = await fetch(`/api/v1/roles/${role_id}/responses/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast("success", "Updated successfully");
      closeModal();
    } catch (err) {
      toast("error", "Failed to update");
    }
  }

  const TabsComponent = ({ responseId,  list = [], capalist = [], rcaRef, capaRef }) => {
    const [tab, setTab] = useState("RCA");
    const selected = list.find((x) => x.id == rcaRef.current);
    const showCapa = selected?.gap_analysis_id != null || !rcaRef.current;
    const selectedCAPA = capalist.find((x) => x.ga_id == capaRef.current) || {};

    useEffect(() => {
      if (!showCapa && tab === "CAPA") setTab("RCA");
    }, [showCapa, tab]);

    const assign = async () => {
      await submitResponses(responseId, rcaRef, capaRef, user_id, kpi_id);
    };

    const remove = async () => {
      if (tab === "RCA") {
        rcaRef.current = null;
      }

      if (tab === "CAPA") {
        capaRef.current = null;
      }

      await submitResponses(responseId, rcaRef, capaRef, user_id, kpi_id);
    };

    return (
      <>
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button
              className={`nav-link ${tab === "RCA" ? "active" : ""}`}
              onClick={() => setTab("RCA")}
            >
              RCA
            </button>
          </li>

          {showCapa && (
            <li className="nav-item">
              <button
                className={`nav-link ${tab === "CAPA" ? "active" : ""}`}
                onClick={() => setTab("CAPA")}
              >
                CAPA
              </button>
            </li>
          )}
        </ul>

        {tab === "RCA" && (
          <>
            {rcaRef.current == null ? (
              <>
                <div className="mb-3 text-start">
                  <strong>Select Existing RCA</strong>
                  <select
                    className="form-control mt-2"
                    onChange={(e) => (rcaRef.current = e.target.value)}
                  >
                    <option value="">-- Select an RCA --</option>
                    {list.map((item, index) => (
                      <option key={`${item.id}-${index}`} value={item.id}>
                        {`${item.rca_no} - ${item.department} - (${formatDate(
                          item.date_of_report
                        )})`}
                      </option>
                    ))}
                  </select>

                  <Link
                    href="/rca/new"
                    className="btn btn-outline-primary w-100 mt-3"
                  >
                    <AppIcon ic="plus" /> Create New RCA
                  </Link>
                </div>

                <div className="d-flex justify-content-center gap-2 mt-2">
                  <button className="btn btn-success px-3" onClick={assign}>
                    Assign
                  </button>
                  <button className="btn btn-secondary px-3" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 className="text-success text-center">
                  <Link
                    href={`/rca/edit/${rcaRef.current}`}
                    className="text-success text-decoration-none d-inline-flex align-items-center justify-content-center gap-2 w-100"
                  >
                    {selected?.rca_no}
                    <AppIcon ic="open-in-new" />
                  </Link>
                </h4>

                <div className="d-flex justify-content-center mt-2">
                  <button className="btn btn-danger px-4" onClick={remove}>
                    Remove
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {tab === "CAPA" && showCapa && (
          <>
            {capaRef.current == null ? (
              <>
                <div className="mb-3 text-start">
                  <strong>Select Existing CAPA</strong>
                  <select
                    className="form-control mt-2"
                    onChange={(e) => (capaRef.current = e.target.value)}
                  >
                    <option value="">-- Select CAPA --</option>
                    {capalist.map((item, index) => (
                      <option key={`${item.ga_id}-${index}`} value={item.ga_id}>
                        {`${item.capa_no}`}
                      </option>
                    ))}
                  </select>

                  <Link
                    href="/capai/new"
                    className="btn btn-outline-primary w-100 mt-3"
                  >
                    <AppIcon ic="plus" /> Create New CAPA
                  </Link>
                </div>

                <div className="d-flex justify-content-center gap-2 mt-2">
                  <button className="btn btn-success px-3" onClick={assign}>
                    Assign
                  </button>
                  <button className="btn btn-secondary px-3" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 className="text-success text-center">
                  <Link
                    href={`/capa/edit/${capaRef.current}`}
                    className="text-success text-decoration-none d-inline-flex align-items-center justify-content-center gap-2 w-100"
                  >
                    {selectedCAPA?.capa_no}
                    <AppIcon ic="open-in-new" />
                  </Link>
                </h4>

                <div className="d-flex justify-content-center mt-2">
                  <button className="btn btn-danger px-4" onClick={remove}>
                    Remove
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </>
    );
  };

  const handleOpenRCAandCAPAModel = async (response_id, rca_id, capa_id) => {
    const list = await fetchRCADetails();
    const capalist = await fetchCAPADetails();

    const rcaRef = { current: rca_id || null };
    const capaRef = { current: capa_id || null };
    
    modal({
      title: "Link RCA / CAPA",
      body: (
        <TabsComponent
          responseId = {response_id}
          list={list}
          capalist={capalist}
          rcaRef={rcaRef}
          capaRef={capaRef}
        />
      ),
      okBtn: null,
      cancelBtn: null
    });
  };

  const isEventHighLightsExeededDataPoints = (elements, chart) => {
    if (elements.length > 0) {
      const el = elements[0];

      const value = chart.data.datasets[el.datasetIndex].data[el.index];

      if (isValueExeedsLimits(value)) {
        return chart.data.datasets[el.datasetIndex];
      }
    }

    return false;
  };

  useEffect(() => {
    (async () => {
      const targetValues = categories.map(cat => {
        const chartData = dataSeries?.[0]?.chart_data || [];
        const row = chartData.find(r => r?.label === cat);
        return row?.target ?? null;
      });
      
      const hasTargetValues = targetValues.some(v => v !== null && v !== undefined);

      if (chartRef.current && chartRef.current.destroy) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      let options = {
        type: 'line',
        data: {
          labels: categories,
          datasets: [
            ...dataSeries.map(d => {
              return {
                ...d,
                borderColor: getColorOfDataPoint(0),
                tension: 0.4,
                pointBackgroundColor: (ctx) => (shouldHighlightDataPoint(ctx) ? OUTLIER_DATA_POINT_COLOR : getColorOfDataPoint(0)),
                pointBorderColor: (ctx) => (shouldHighlightDataPoint(ctx) ? OUTLIER_DATA_POINT_COLOR : getColorOfDataPoint(0)),
                pointRadius: (ctx) => (shouldHighlightDataPoint(ctx) ? 6 : 3),
                pointHoverRadius: (ctx) => (shouldHighlightDataPoint(ctx) ? 8 : 4),
              };
            }),
            ...(hasTargetValues
              ? [
                  {
                    label: "Targets",
                    data: targetValues,
                    tension: 0.4,
                    spanGaps: true,
                    borderColor: getColorOfDataPoint(4),
                    pointBackgroundColor: (ctx) => (shouldHighlightDataPoint(ctx) ? getColorOfDataPoint(3) : getColorOfDataPoint(4)),
                    pointBorderColor: (ctx) => (shouldHighlightDataPoint(ctx) ? getColorOfDataPoint(3) : getColorOfDataPoint(4)),
                  }
                ]
              : []
            )
          ]
        },
        options: {
          scales: {
            y: {
              grid: {
                color: (ctx) =>  (shouldHighlightGridLine(ctx) ? OUTLIER_DATA_POINT_COLOR : 'rgba(0, 0, 0, 0.1)'),
                lineWidth: (ctx) =>  (shouldHighlightGridLine(ctx) ? 3 : 1),
              },
              min: 0,
            },
          },
          onHover: (event, elements, chart) => {
            const canvas = chart.canvas;

            if (isEventHighLightsExeededDataPoints(elements, chart)) {
              canvas.style.cursor = 'pointer';
            } else {
              canvas.style.cursor = 'default';
            }
          },
          onClick: (event, elements, chart) => {
            const dataPoint = isEventHighLightsExeededDataPoints(elements, chart);

            if (dataPoint != 0) {
              if (!elements.length) return;

              const { datasetIndex, index } = elements[0];
              const data = dataSeries[datasetIndex].data;
              const chartData = dataSeries[datasetIndex].chart_data;

              if (data[index] == null) return;
              const mappedIndex = chartData.findIndex(item => item.value === data[index]);

              if (mappedIndex === -1) return;
              const point = chartData[mappedIndex];

              let responseId = point.response_id
              let rcaId = point.rca_id
              let capaId = point.gap_analysis_id

              handleOpenRCAandCAPAModel(responseId, rcaId, capaId);
            }
          },
        },
      };

      chartRef.current = new Chart(canvasRef.current, options);
    }) ();
  }, [ dataSeries, categories, ucl, lcl ]);

  return (
    <div ref={divRef}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}