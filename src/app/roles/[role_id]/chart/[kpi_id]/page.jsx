"use client";

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { generateCategoriesForChart } from "@/helper/chart";

import BarChart from "@/components/charts/barChart";
import LineChart from "@/components/charts/lineChart";
import PieChart from "@/components/charts/pieChart";

import Link from "next/link";
import AppIcon from "@/components/icon";
import { decodeURLParam } from "@/helper/utils";
import { HttpClient } from "@/helper/http";

export default function KPIResponseChart({ params }) {
  const { data: session, status } = useSession();
  const { role_id, kpi_id, user_id } = use(params);

  const { setPageTitle, toggleProgressBar, toast } = useAppLayoutContext();
  const { t } = useI18n();

  const [data, setData] = useState([]);
  const [filterData, setFilterData] = useState(null);
  const [frequency, setFrequency] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(1);

  const noOfWeeksInMonth = (year, month) => {
    const lastOfMonth = new Date(year, month, 0);
    let weeks = 0;
    for (let d = 0; d < lastOfMonth.getDate(); d++) {
      const date = new Date(year, month - 1, d + 1);
      if (date.getDay() === 1) weeks++;
    }
    return weeks;
  };

  const fetchKPIDetails = async () => {
    toggleProgressBar(true);
    try {
      HttpClient({
        url: `/roles/${decodeURLParam(role_id)}/responses/${decodeURLParam(kpi_id)}`,
        method: "GET"
      })
        .then(res => {
          if (res.success) {
            if (res.data.kpi_details?.length > 0) {
              const year = new Date().getFullYear();
              const month = String(new Date().getMonth() + 1).padStart(2, "0");

              res.data.kpi_details.forEach(data => {
                switch (data.frequency) {
                  case "daily":
                    setFilterData(`${year}-${month}`);
                    setFrequency("daily");
                    break;
                  case "monthly":
                    setFilterData(`${year}`);
                    setFrequency("monthly");
                    break;
                  case "weekly":
                    const weeksCount = noOfWeeksInMonth(year, month);
                    setWeeks([...Array(weeksCount)].map((_, i) => i + 1));
                    setFilterData(`${year}-${month}-${selectedWeek}W`);
                    setFrequency("weekly");
                    break;
                }
              });
            }
          } else {
            toast("error", res.message || "Failed to save role sheet");
          }
        })
        .catch(() => {
          toast("error", "Network error. Please try again.");
        })
        .finally(() => {
          toggleProgressBar(false);
        });
    } catch {
      toast("error", "Something went wrong while fetching KPI responses.");
      toggleProgressBar(false);
    }
  };

  const fetchKPIResponses = async () => {
    if (!filterData) return;
    toggleProgressBar(true);
    try {
      HttpClient({
        url: `/roles/${decodeURLParam(role_id)}/responses/${decodeURLParam(kpi_id)}/${decodeURLParam(user_id)}/chart`,
        method: "GET",
        params: { filterData: filterData || "" }
      })
        .then(res => {
          if (res.success) {
            setData(res.data?.kpi_chart_responses);
          } else {
            toast("error", res.message || "Failed to save role sheet");
          }
        })
        .catch(() => {
          toast("error", "Network error. Please try again.");
        })
        .finally(() => {
          toggleProgressBar(false);
        });
    } catch {
      toast("error", "Something went wrong while fetching KPI responses.");
      toggleProgressBar(false);
    }
  };

  useEffect(() => {
    if (frequency === "weekly" && filterData) {
      const base = filterData.slice(0, 7);
      setFilterData(`${base}-${selectedWeek}W`);
    }
  }, [selectedWeek]);

  const handleFormOnchange = event => {
    let value = event.target.value;

    if (frequency === "weekly" && !value) {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = today.getFullYear();
      value = `${year}-${month}`;
      const week = selectedWeek | 1;
      setFilterData(`${year}-${month}-${week}W`);
    } else {
      if (frequency === "weekly"){
        const date = new Date(value);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const week = selectedWeek | 1;
        setFilterData(`${year}-${month}-${week}W`);
      }else{
        setFilterData(value);
      }
    }

    if (frequency !== "weekly") {
      setWeeks([]);
      return;
    }

    const [y, m] = value.split("-").map(Number);
    const weeksCount = noOfWeeksInMonth(y, m);
    setWeeks([...Array(weeksCount)].map((_, i) => i + 1));
  };

  useEffect(() => {
    if (status === "authenticated") {
      setPageTitle(`${t(" KPI Chart Responses ")}`);
      fetchKPIDetails();
    }
  }, [status]);

  useEffect(() => {
    fetchKPIResponses();
  }, [filterData]);

  if (!data) return <p>Loading...</p>;

  return (
    <AuthenticatedPage>
      <div className="container mt-4 mb-2">
        <div className="row mb-2">
          <div className="col-12 text-right" style={{ textAlign: "right" }}>
            <Link href={`/roles/${role_id}/responses/${user_id ? user_id : ""}`} className="btn btn-secondary">
              <AppIcon ic="arrow-left" />
              &nbsp;Back
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="row">
              {frequency === "daily" && (
                <div className="col-lg-4 md-6 col-sm-12">
                  <label className="form-label">Select Month</label>
                  <input className="form-control" type="month" value={filterData || ""} onChange={handleFormOnchange} />
                </div>
              )}

              {frequency === "monthly" && (
                <div className="col-lg-4 md-6 col-sm-12">
                  <label className="form-label">Enter Year</label>
                  <input
                    type="number"
                    id="monthlyYear"
                    className="form-control"
                    min="1900"
                    max="2100"
                    value={filterData ? filterData.slice(0, 4) : new Date().getFullYear()}
                    onChange={handleFormOnchange}
                  />
                </div>
              )}

              {frequency === "weekly" && (
                <>
                  <div className="col-lg-4 md-6 col-sm-12">
                    <label className="form-label">Select Month</label>
                    <input
                      type="month"
                      className="form-control"
                      value={filterData ? filterData.slice(0, 7) : ""}
                      onChange={handleFormOnchange}
                    />
                  </div>

                  <div className="col-lg-4 md-6 col-sm-12">
                    <label className="form-label">Select Week</label>
                    <select className="form-control" value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)}>
                      {weeks.map(w => (
                        <option key={w} value={w}>
                          Week {w}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {Array.isArray(data) && data.length > 0 ? (
          data.map((response, i) => {
            const categories = generateCategoriesForChart(
              response.frequency,
              filterData
            );

            const values = categories.map(c => {
              const found = response.chart_data?.find(r => r.label === c);
              return found ? found.value : null;
            });

            return (
              <div className="card shadow-sm p-4 mt-4" key={`chart-${i}`}>
                {response.chart_type === "bar" && (
                  <BarChart
                    dataSeries={[{ label: "Points", data: values }]}
                    categories={categories}
                  />
                )}

                {response.chart_type === "line" && (
                  <LineChart
                    dataSeries={[{ label: "Points", data: values }]}
                    categories={categories}
                  />
                )}

                {response.chart_type === "pie" && (
                  <PieChart
                    dataSeries={[{ label: "Points", data: values }]}
                    categories={categories}
                  />
                )}

                {(response.chart_type === "trend" ||
                  response.chart_type === "control") && (
                  <LineChart
                    dataSeries={[
                      {
                        label: "Points",
                        data: values,
                        chart_data: response.chart_data
                      }
                    ]}
                    ucl={response.ucl || ""}
                    lcl={response.lcl || ""}
                    categories={categories}
                  />
                )}
              </div>
            );
          })
        ) : (
          <div className="card shadow-sm p-4 mt-4 text-center">
            <h5 className="mb-1">No data available</h5>
            <p className="text-muted mb-0">
              Try changing filters or selecting a different period.
            </p>
          </div>
        )}
      </div>
    </AuthenticatedPage>
  );
}