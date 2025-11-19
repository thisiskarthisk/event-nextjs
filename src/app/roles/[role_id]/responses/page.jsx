'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import AppIcon from "@/components/icon";
import Papa from "papaparse";
import Link from "next/link";

export default function KPIResponses({ params }) {
  const { data: session, status } = useSession();
  const { role_id, user_id } = use(params);

  const { setPageTitle, toggleProgressBar, toast, modal} = useAppLayoutContext();
  const { t, locale } = useI18n();
  const [data, setData] = useState([]);

  const sampleChartTemplate = {
    "bar-chart": "LABEL,VALUE\n1,10\n2,20",
    "line-chart": "LABEL,VALUE\n1,15\n2,30",
    "pie-chart": "LABEL,VALUE\nJan,15\nFeb,30",
    "trend-chart": "UCL,LCL\n60,40\nLABEL,VALUE\nMonday,50\nTuesday,70\nWednesday,80",
    "control-chart": "UCL,LCL\n40,10\nLABEL,VALUE\n1,10\n2,27\n3,35\n4,50",
  };

  const grouped = data.reduce((acc, item) => {
    const key = item.objective || "Unspecified Objective";
    (acc[key] ||= []).push(item);
    return acc;
  }, {});

  const fetchKPIResponses = () => {
    toggleProgressBar(true);
    try {
      fetch(`/api/v1/roles/${role_id}/responses`).then((res)=> res.json()).then((data)=> {
        setData(data.data.kpi_responses)
      });
    } catch (error) {
      toast("error", "Something went wrong while fetching KPI responses.");
    } finally {
      toggleProgressBar(false);
    }
  };
  
  const saveChartData = async (user_id, kpi_role_id, chartType, chartData, kpi_record_id, ucl, lcl, periodDate) => {
    toggleProgressBar(true);
    try {
      const payload = {
        user_id,
        kpi_role_id,
        chartType,
        ...(ucl !== undefined && lcl !== undefined ? { ucl, lcl } : {}),
        kpi_record_id,
        chartData,
        periodDate
      };

      const res = await fetch(`/api/v1/roles/${kpi_role_id}/responses/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save chart data");

      const result = await res.json();
      fetchKPIResponses();
      toast("success", result.message);
    } catch (error) {
      toast("error", "Something went wrong while saving chart data.");
    } finally {
      toggleProgressBar(false);
    }
  };

  const handleFileDownload = (chartType, role_id) => {
    const template = sampleChartTemplate[chartType];

    if(!template){
      return alert("No template for this chart type.");
    }
    
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${role_id}_${chartType}_template.csv`;
    link.click();
  };

  const noOfWeeksInMonth = (year, month) => {
    const lastOfMonth = new Date(year, month, 0);
    let weeks = 0;

    for (let d = 0; d < lastOfMonth.getDate(); d++) {
      const date = new Date(year, month - 1, d + 1);

      if (date.getDay() === 1) weeks++;
    }

    return weeks;
  }

  const handleFileUpload = (user_id, file, chartType, role_id, record_id, existingChartData, periodDate) => {
    if (!file) return;

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        const rows = results.data;
        const chartData = [];
        const errors = [];
        let ucl = null, lcl = null;
        let isLabelSection = false;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i].map(cell => (cell ?? '').toString().trim());
          const lower = row[0]?.toLowerCase();

          if (lower === "ucl") {
            const next = rows[i + 1];
            if (!next || next.length < 2) {
              errors.push(`Line ${i + 2}: Missing UCL/LCL values`);
            } else {
              ucl = Number(next[0]);
              lcl = Number(next[1]);

              if (isNaN(ucl) || ucl <= 0)
                errors.push(`Line ${i + 2}, Invalid UCL value empty or incorrect value`);
              if (isNaN(lcl) || lcl <= 0)
                errors.push(`Line ${i + 2}, Invalid LCL value empty or incorrect value`);
            }
            i++;
            continue;
          }

          if (lower === "label") {
            isLabelSection = true;
            continue;
          }

          if (isLabelSection) {
            const label = row[0];
            const value = Number(row[1]);

            if (!label) {
              errors.push(`Line ${i + 1}, Label is empty!`);
            }
            if (isNaN(value) || value <= 0) {
              errors.push(`Line ${i + 1}, Value is empty or incorrect value!`);
            }

            const matched = existingChartData?.find(
              (x) => x.label?.trim().toLowerCase() === label.toLowerCase()
            );

            chartData.push({
              response_id: matched?.response_id || null,
              label,
              value: isNaN(value) ? 0 : value,
            });
          } else {
            if (row.some(cell => cell === "")) {
              errors.push(`Line ${i + 1}: Contains empty cell(s) before 'label' section`);
            }
          }
        }

        if (errors.length > 0) {
          const header = `Validation Errors Found (${new Date().toLocaleString()}):\n\n`;
          const blob = new Blob([header + errors.join("\n")], { type: "text/plain" });
          const link = document.createElement("a");
          
          link.href = URL.createObjectURL(blob);
          link.download = `validation_error_list.txt`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast("error", "Errors found in uploaded file. Check validation_error_list.txt.");
          return;
        }

        saveChartData(user_id, role_id, chartType, chartData, record_id, ucl, lcl, periodDate);
      },
    });
  };

  const handleModalFileUpload = (frequency, user_id, chartType, role_id, record_id, existingChartData) => {
    let frequencyField = "";
    let periodDate = "";

    if (frequency === "daily")
      frequencyField = `
        <div class="mb-3">
          <label class="form-label">Select Month</label>
          <input type="month" id="dailyMonth" class="form-control" />
        </div>
      `;

    if (frequency === "monthly")
      frequencyField = `
        <div class="mb-3">
          <label class="form-label">Enter Year</label>
          <input type="number" id="monthlyYear" class="form-control" placeholder="YYYY" min="1900" max="2100" />
        </div>
      `;

    if (frequency === "weekly")
      frequencyField = `
        <div class="mb-3">
          <label class="form-label">Select Month</label>
          <input type="month" id="weeklyMonth" class="form-control"/>
          <div id="weeklyMonthError" class="text-danger small mt-1"></div>
        </div>
        <div class="mb-3" id="weekDropdownContainer"></div>
      `;

    modal({
      title: "Upload KPI Response",
      body: `
        <span class="badge bg-success text-white mb-3">Uploading new data will overwrite existing data.</span>
        ${frequencyField}
        <div class="mb-3 mt-3">
          <label class="form-label">Choose File</label>
          <input type="file" id="responseFile" accept=".csv" class="form-control" />
        </div>
      `,
      okBtn: {
        label: "Upload",
        onClick: async () => {
          if (frequency === "daily")
            periodDate =  `${document.getElementById("dailyMonth")?.value}-01`;

          if (frequency === "monthly")
            periodDate = document.getElementById("monthlyYear")?.value;

          if (frequency === "weekly")
            periodDate = `${document.getElementById("weeklyMonth")?.value}-${document.getElementById("weekSelect")?.value}W`;
            

          const fileInput = document.getElementById("responseFile")
          if (!fileInput?.files?.length) return
          const file = fileInput.files[0]
          handleFileUpload(user_id, file, chartType, role_id, record_id, existingChartData, periodDate)
        }
      },
      cancelBtn: { label: "Cancel" }
    })

    setTimeout(() => {
      const monthInput = document.getElementById("weeklyMonth")
      if (!monthInput) return

      monthInput.addEventListener("change", e => {
        const value = e.target.value
        if (!value) return

        const [year, month] = value.split("-").map(Number)
        const weeks = noOfWeeksInMonth(year, month)

        let options = ""
        for (let i = 1; i <= weeks; i++) options += `<option value="${i}">Week ${i}</option>`

        document.getElementById("weekDropdownContainer").innerHTML = `
          <label class="form-label">Select Week</label>
          <select id="weekSelect" class="form-control" required>${options}</select>
        `
      })
    }, 200)
  }


  useEffect(() => {
    if(status === 'authenticated'){
      setPageTitle(t('KPI Responses - Role: '+ role_id));

      fetchKPIResponses();
      toggleProgressBar(false);
    }
  }, []);

  return (
    <AuthenticatedPage>
      <div className="row">
        <div className="col-12 mt-4">
          {data.length ? (
            Object.entries(grouped).map(([objective, items], idx) => (
              <div key={idx} className="card mb-4 shadow-sm">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    Objective {idx + 1}: {objective}
                  </h5>
                </div>

                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "20%" }}>Role</th>
                          <th style={{ width: "40%" }}>KPI Details</th>
                          <th style={{ width: "15%" }}>VCS</th>
                          <th style={{ width: "25%" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => (
                          <tr key={`item-${idx}-${i}`}>
                            <td
                            className="pl-5"
                              style={{
                                color: "rgb(59, 59, 59)", 
                                fontWeight: "bold",
                                verticalAlign: "middle",
                                backgroundColor: "#f8f9fa",
                              }}
                            >
                              {item.role}
                            </td>
                            <td>
                              <p className="text-sm fw-bold mb-2"><span>{item.kpi}</span></p>
                              <p className="text-sm p-0 mb-2" style={{fontSize: "0.9em"}}>
                                <span style={{ color: "rgb(59, 59, 59)", fontWeight: "bold"}}>Measure: </span> 
                                {item.measurement}
                              </p>
                              <p className="text-sm p-0 mb-2" style={{fontSize: "0.9em"}}>
                                <span style={{ color: "rgb(59, 59, 59)", fontWeight: "bold"}}>Frequency:</span> 
                                {item.frequency}
                              </p>
                              <p className="text-sm p-0 mb-2" style={{fontSize: "0.9em"}}>
                                <span style={{ color: "rgb(59, 59, 59)", fontWeight: "bold"}}>Operational Definition:</span> 
                                {item.op_definition}
                              </p>
                            </td>
                            <td>
                              {item.chart_type ? (
                                <>
                                  {`${item.chart_type[0].toUpperCase()}${item.chart_type.slice(1)} Chart `}
                                  {item.chart_data && item.chart_data.length > 0 && (
                                    <>
                                      <AppIcon ic="check-circle" className="text-success p-1" />
                                        <Link href={{  pathname: `/roles/${role_id}/chart/${item.kpis_id}/${user_id ? '/' + user_id: ''}`}}>
                                        <span className="badge btn bg-warning rounded-pill text-black" style={{ height: "23px", fontWeight: "500", cursor: "pointer" }}>
                                          <AppIcon ic="chart-bar" className="text-black" /> View Chart
                                        </span>
                                      </Link>
                                    </>
                                  )}
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              <label className="btn btn-info rounded-pill btn-sm m-2 icon-hover-btn" 
                                onClick={() => handleModalFileUpload(item.frequency, user_id, item.chart_type, role_id, item.kpis_id, item.chart_data)}>
                                <AppIcon ic="tray-arrow-up" className="text-black" /> Upload Responses
                              </label>
                              {item.chart_type ? (
                                <button
                                  className="btn btn-success rounded-pill btn-sm me-2 icon-hover-btn"
                                  onClick={() => handleFileDownload(item.chart_type + "-chart", role_id)}>
                                  <AppIcon ic="tray-arrow-down" className="text-white p-1" />
                                  Download Template
                                </button>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 mt-4 text-center">
              No KPI data found for this role.
            </p>
          )}
        </div>
      </div>
      <style jsx>{`
        .icon-hover-btn:hover svg {
          color: white !important;
          fill: white !important;
          stroke: white !important;
        }
      `}
      </style>
    </AuthenticatedPage>
  );
}
