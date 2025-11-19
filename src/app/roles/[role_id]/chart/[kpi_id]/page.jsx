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

export default function KPIResponseChart({ params }) {
  const { data: session, status } = useSession();
  const { role_id, kpi_id, user_id } = use(params);
  
  console.log("User Id", user_id)
  
  const { setPageTitle, setPageType, toggleProgressBar, toast } = useAppLayoutContext();
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
  }

  const fetchKPIDetails = async () => {
    toggleProgressBar(true);
    try {
      const res = await fetch(`/api/v1/roles/${role_id}/responses/${kpi_id}`);
      const json = await res.json();

      if (json.data.kpi_details?.length > 0) {
        
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, "0");

        json.data.kpi_details.forEach((data) => {
          switch (data.frequency) {
            case "daily":
              setFilterData(`${year}-${month}`)
              setFrequency(data.frequency)
              break; 
            case "monthly":
              setFilterData(`${year}`)
              setFrequency(data.frequency)
              break;
            case "weekly":
              const weeksCount = noOfWeeksInMonth(year, month);
              setWeeks([...Array(weeksCount)].map((_, i) => i + 1));
              setFilterData(`${year}-${month}-${selectedWeek}W`)
              setFrequency(data.frequency)
              break;
            default:
              return null
          }
        });
      }
    } catch (error) {
      toast("error", "Something went wrong while fetching KPI responses.");
    } finally {
      toggleProgressBar(false);
    }
  }

  const fetchKPIResponses = async () => {
    toggleProgressBar(true);
    try {
      const res = await fetch(`/api/v1/roles/${role_id}/responses/${kpi_id}/${user_id}/chart?filterData=${filterData || ''}`);
      const json = await res.json();
      setData(json.data.kpi_chart_responses);
    } catch (error) {
      toast("error", "Something went wrong while fetching KPI responses.");
    } finally {
      toggleProgressBar(false);
    }
  };

  useEffect(() => {
    if (frequency === "weekly" && filterData) {
      const base = filterData.slice(0, 7);

      if (selectedWeek) {
        setFilterData(`${base}-${selectedWeek}W`);
      }
    }
  }, [selectedWeek]);

  const handleFormOnchange = (event) => {
    let value = event.target.value;

    if (frequency === "weekly" && !value) {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = today.getFullYear();
      value = `${year}-${month}`;
      const week = selectedWeek | 1;
      setFilterData(`${year}-${month}-${week}W`);
    }

    setFilterData(value);

    if (frequency !== "weekly") {
      setWeeks([]);
      return;
    }

    const [y, m] = value.split("-").map(Number);
    const weeksCount = noOfWeeksInMonth(y, m);
    const weeksArray = [...Array(weeksCount)].map((_, i) => i + 1);

    setWeeks(weeksArray);

  };

  useEffect(() => {
    if (status === 'authenticated') {
      setPageType("dashboard");
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
          <div className="col-12 text-right" style={{ textAlign: 'right' }}>
            <Link href={`/roles/${role_id}/responses/${user_id ? user_id : ''}`} className="btn btn-secondary">
              <AppIcon ic="arrow-left" />&nbsp;Back
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="row">
              {
                frequency === 'daily' &&
                <div className="col-lg-4  md-6 col-sm-12">
                  <label className="form-label">Select Month</label>
                  <input className="form-control" type="month" value={filterData || ''} onChange={handleFormOnchange}></input>
                </div>
              }
              {
                frequency === 'monthly' &&
                <div className="col-lg-4  md-6 col-sm-12">
                  <label className="form-label">Enter Year</label>
                  <input type="number" id="monthlyYear" className="form-control" min="1900" max="2100"  value={filterData ? filterData.slice(0, 4) : new Date().getFullYear()} onChange={handleFormOnchange}/>
                </div>
              }
              {
                frequency === "weekly" && (
                <>
                  <div className="col-lg-4 md-6 col-sm-12">
                    <label className="form-label">Select Month</label>
                    <input
                      type="month"
                      className="form-control"
                      value={filterData ? filterData.slice(0, 7) : ''}
                      onChange={handleFormOnchange}
                    />
                  </div>
                  {(
                    <div className="col-lg-4 md-6 col-sm-12">
                      <label className="form-label">Select Week</label>
                      <select
                        className="form-control"
                        value={selectedWeek}
                        onChange={e => setSelectedWeek(e.target.value)}
                      >
                        {weeks.map(w => (
                          <option key={w} value={w}>Week {w}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {
          data && data.map((response, i) => {
            console.log('response:', response);

            const categories = generateCategoriesForChart(response.frequency, filterData);

            const data = categories.map((c, cI) => {
              let value = null;

              for (let r of response.chart_data) {
                if (r.label == c) {
                  value = r.value || null;
                  break;
                }
              }

              return value;
            });

            return (
              <div className="card shadow-sm p-4 mt-4" key={`bar-chart-${i}`}>
                {
                  response.chart_type == 'bar' &&
                  <BarChart
                    dataSeries={[{
                      label: 'Points',
                      data: data,
                    }]}
                    categories={categories} />
                }
                {
                  response.chart_type == 'line' &&
                  <LineChart
                    dataSeries={[{
                      label: 'Points',
                      data: data,
                    }]}
                    categories={categories} />
                }
                {
                  response.chart_type == 'pie' &&
                  <PieChart
                    dataSeries={[{
                      label: 'Points',
                      data: data,
                    }]}
                    categories={categories} />
                }
                {
                  response.chart_type == 'trend' &&
                  <LineChart
                    dataSeries={[{
                      label: 'Points',
                      data: data,
                      chart_data: response.chart_data
                    }]}
                    ucl={response.ucl || ''}
                    lcl={response.lcl || ''}
                    categories={categories} />
                }
                {
                  response.chart_type == 'control' &&
                  <LineChart
                    dataSeries={[{
                      label: 'Points',
                      data: data,
                      chart_data: response.chart_data
                    }]}
                    ucl={response.ucl || ''}
                    lcl={response.lcl || ''}
                    categories={categories} />
                }
              </div>
            );
          })
        }
      </div>
    </AuthenticatedPage>
  );
}
