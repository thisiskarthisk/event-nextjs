'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { use, useEffect } from "react";
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";

import AppIcon from "@/components/icon";
import Papa from "papaparse";
import Link from "next/link";
import TextField from "@/components/form/TextField";
import SelectPicker from "@/components/form/SelectPicker";
import { decodeURLParam, encodeURLParam } from "@/helper/utils";
import DatePicker from "@/components/form/DatePicker";
import { HttpClient } from "@/helper/http";

const initialUploadFormData = {
  periodDate: '',
  file: null,
};

function UploadResponseForm({ frequency, onChange }) {
  const [formData, setFormData] = useState({ ...initialUploadFormData });
  const [weeksList, setWeeksList] = useState([]);

  const onPeriodFieldChanged = (value, name) => {
    let newValue = value;

    if (name === 'file' && value?.target?.files) {
      newValue = value.target.files[0] || null;
    }

    if (frequency === 'weekly' && name === 'month') {
      const [year, month] = newValue.split('-').map(Number);
      setWeeksList(noOfWeeksInMonth(year, month));
    }

    setFormData(prev => {
      const value = name === 'month' ? `${newValue}-01` : newValue;

      if (name === 'file') {
        return { ...prev, file: newValue };
      }

      if (frequency === 'daily') {
        if (name === 'month') {
          return {
            ...prev,
            periodDate: value
          };
        }
      }

      if (frequency === 'weekly') {
        if (name === 'month') {
          return { 
            ...prev, 
            periodDate: { ...prev.periodDate, month: newValue } 
          };
        }
        if (name === 'week') {
          return { 
            ...prev, 
            periodDate: { ...prev.periodDate, week: newValue } 
          };
        }
      }

      return { 
        ...prev, 
        periodDate: newValue 
      };
    });
  };

  const noOfWeeksInMonth = (year, month) => {
    const lastOfMonth = new Date(year, month, 0);
    let weeks = 0;
    for (let d = 0; d < lastOfMonth.getDate(); d++) {
      const date = new Date(year, month - 1, d + 1);
      if (date.getDay() === 1) weeks++;
    }
    return Array.from({ length: weeks }, (_, i) => ({
      label: `Week ${i + 1}`,
      value: i + 1
    }));
  };

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  return (
    <>
      <span className="badge bg-success text-white mb-3">Uploading new data will overwrite existing data.</span>

      {(frequency === 'daily' || frequency === 'weekly') && (
        <div className="mb-3">
          <DatePicker
            type="month"
            name="month"
            label="Select Month"
            format="Y-m"
            id="month"
            value={frequency === 'weekly' ? formData.periodDate?.month : formData.periodDate}
            onChange={(v) => onPeriodFieldChanged(v, 'month')}
            isRequired
          />
        </div>
      )}

      {frequency === 'monthly' && (
        <div className="mb-3">
          <DatePicker
            type="number"
            label="Enter Year"
            id="year"
            name="year"
            format="Y"
            value={formData.periodDate}
            onChange={(v) => onPeriodFieldChanged(v, 'year')}
            isRequired
          />
        </div>
      )}

      {frequency === 'weekly' && (
        <div className="mb-3">
          <SelectPicker
            label="Select Week"
            name="week"
            options={weeksList}
            value={formData.periodDate?.week}
            isRequired
            onChange={(v) => onPeriodFieldChanged(v, 'week')}
          />
        </div>
      )}

      <div className="mb-3 mt-3">
        <TextField
          type="file"
          label="Choose File"
          name="file"
          onChange={(v) => onPeriodFieldChanged(v, 'file')}
          isRequired
        />
      </div>
    </>
  );
}


export default function KPIResponses({ params }) {
  const { data: session, status } = useSession();
  const { role_id, user_id } = use(params);

  const { setPageTitle, toggleProgressBar, toast, modal, closeModal, setAppBarMenuItems} = useAppLayoutContext();
  const { t, locale } = useI18n();
  const [data, setData] = useState([]);

  const initialUploadFormDataParent = { file: null, periodDate: null }; 
  const [ uploadFormData, setUploadFormData ] = useState({ ...initialUploadFormDataParent });
  const latestUploadFormData = useRef(uploadFormData);

  useEffect(() => {
    latestUploadFormData.current = uploadFormData;
  }, [uploadFormData]);

  const sampleChartTemplate = {
    "bar-chart-daily": "LABEL,VALUE\n1,10\n2,20",
    "bar-chart-monthly": "LABEL,VALUE\nJan,10\nFeb,20",
    "bar-chart-weekly": "LABEL,VALUE\nMonday,10\nTuesday,20",
    "line-chart-daily": "LABEL,VALUE\n1,15\n2,30",
    "line-chart-monthly": "LABEL,VALUE\nJan,15\nFeb,30",
    "line-chart-weekly": "LABEL,VALUE\nMonday,15\nTuesday,30",
    "pie-chart-daily": "\
                          LABEL,VALUE\n\
                          1,10\n\
                          2,27\n\
                          3,35\n\
                          4,50",
    "pie-chart-monthly": "\
                          LABEL,VALUE\n\
                          Jan,10\n\
                          Feb,27\n\
                          Mar,35\n\
                          Apr,50",
    "pie-chart-weekly": "\
                          LABEL,VALUE\n\
                          Sunday,10\n\
                          Monday,27\n\
                          Tuesday,35\n\
                          Wednesday,50",
    "trend-chart-daily": "\
                          UCL,LCL\n\
                          40,10\n\
                          LABEL,VALUE,TARGET\n\
                          1,10,15\n\
                          2,27,30\n\
                          3,35,35\n\
                          4,50,40",
    "trend-chart-monthly": "\
                          UCL,LCL\n\
                          40,10\n\
                          LABEL,VALUE,TARGET\n\
                          Jan,10,15\n\
                          Feb,27,30\n\
                          Mar,35,35\n\
                          Apr,50,40",
    "trend-chart-weekly": "\
                          UCL,LCL\n\
                          40,10\n\
                          LABEL,VALUE,TARGET\n\
                          Monday,10,15\n\
                          Tuesday,27,30\n\
                          Wednesday,35,35\n\
                          Thursday,50,40",
    "control-chart-daily": "\
                          UCL,LCL\n\
                          40,10\n\
                          LABEL,VALUE,TARGET\n\
                          1,10,15\n\
                          2,27,30\n\
                          3,35,35\n\
                          4,50,40",
    "control-chart-monthly": "\
                          UCL,LCL\n\
                          40,10\n\
                          LABEL,VALUE,TARGET\n\
                          Jan,10,15\n\
                          Feb,27,30\n\
                          Mar,35,35\n\
                          Apr,50,40",
    "control-chart-weekly": "\
                          UCL,LCL\n\
                          40,10\n\
                          LABEL,VALUE,TARGET\n\
                          Monday,10,15\n\
                          Tuesday,27,30\n\
                          Wednesday,35,35\n\
                          Thursday,50,40",
  };

  const grouped = data.reduce((acc, item) => {
    const key = item.objective || "Unspecified Objective";
    (acc[key] ||= []).push(item);
    return acc;
  }, {});

  const fetchKPIResponses = () => {
    toggleProgressBar(true);
    try {
      HttpClient({
        url: `/roles/${decodeURLParam(role_id)}/responses`,
        method: 'GET',
        params: { user_id: decodeURLParam(user_id) }
      }).then(res => {
        if (res.success) {
          setData(res.data?.kpi_responses);
        } else {
          toast('error', res.message || "Failed to save role sheet");
        }
      }).catch(err => {
        toast('error', 'Network error. Please try again.');
      }).finally(() => {
        toggleProgressBar(false);
      });
    } catch (error) {
      toast("error", "Something went wrong while fetching KPI responses.");
    } finally {
      toggleProgressBar(false);
    }
  };
  
  const saveChartData = async (user_id, kpi_role_id, chartType, chartData, kpi_record_id, ucl, lcl, periodDate, frequency) => {
    toggleProgressBar(true);
    
    try {
      const payload = {
        user_id: decodeURLParam(user_id),
        kpi_role_id: decodeURLParam(kpi_role_id),
        chartType,
        ...(ucl !== undefined && lcl !== undefined ? { ucl, lcl } : {}),
        kpi_record_id,
        chartData,
        periodDate,
        frequency
      };

      HttpClient({
          url: `/roles/${kpi_role_id}/responses/save`,
          method: "POST",
          data: JSON.stringify(payload),
      }).then(res => {
          toggleProgressBar(false);
          fetchKPIResponses()
          closeModal();
          toast('success', res.message || 'The KPI Responses Saved successfully.');
      }).catch(err => {
          closeModal();
          toggleProgressBar(false);
          toast("error", "Something went wrong while saving chart data.");
      });

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

  const handleFileUpload = (user_id, file, chartType, role_id, record_id, existingChartData, periodDate, frequency) => {
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
            const target = Number(row[2]);

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
              target,
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
        saveChartData(user_id, role_id, chartType, chartData, record_id, ucl, lcl, periodDate, frequency);
      },
    });
  };

  const onUploadFormSubmitted = (frequency, user_id, chartType, role_id, record_id, existingChartData) => {
    const currentData = latestUploadFormData.current;
    handleFileUpload(user_id, currentData.file[0], chartType, role_id, record_id, existingChartData, currentData.periodDate, frequency);
  };

  const handleModalFileUpload = (frequency, user_id, chartType, role_id, record_id, existingChartData) => {
    
    setUploadFormData({ ...initialUploadFormDataParent });
    
    modal({
      title: 'Upload KPI Response',
      body: (
        <UploadResponseForm
          frequency={frequency}
          onChange={newData => {
            setUploadFormData(prevData => ({
              ...prevData,
              ...newData,
            }));
          }} />
      ),
      okBtn: {
        label: 'Upload',
        onClick: async () => {
          onUploadFormSubmitted(frequency, user_id, chartType, role_id, record_id, existingChartData);
        },
      },
      cancelBtn: {
        label: 'Cancel',
      },
    });

    return;
  }

  useEffect(() => {
    if(status === 'authenticated'){
      setPageTitle(t('KPI Responses - Role: '+ decodeURLParam(role_id)));
      setAppBarMenuItems([]);
      fetchKPIResponses();
      toggleProgressBar(false);
    }
  }, [status]);

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
                                        <Link href={{ pathname: `/roles/${role_id}/chart/${encodeURLParam(item.kpis_id)}${user_id ? `/${user_id}` : '' }`}}>
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
                                  onClick={() => handleFileDownload(item.chart_type + "-chart-"+item.frequency, role_id)}>
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
    </AuthenticatedPage>
  );
}