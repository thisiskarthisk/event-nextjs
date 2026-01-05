'use client';

import { useAppLayoutContext } from "@/components/appLayout";
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

function UploadResponseForm({ frequency, onChange, onDownload }) {
  const [formData, setFormData] = useState({ ...initialUploadFormData });
  const [weeksList, setWeeksList] = useState([]);

  const onPeriodFieldChanged = (value, name) => {
    let newValue = value;

    // Normalize file input: TextField may pass a FileList, an event, or a File
    if (name === 'file') {
      if (value?.target?.files) {
        newValue = value.target.files[0] || null;
      } else if (value instanceof FileList || (Array.isArray(value) && value.length)) {
        newValue = value[0] || null;
      } else {
        newValue = value || null;
      }
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
        /* if (name === 'week') {
          return { 
            ...prev, 
            periodDate: { ...prev.periodDate, week: newValue } 
          };
        } */
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
        <div className="mb-3 required-field">
          <label className="form-label">Enter Year</label>
          <input
            type="number"
            id="monthlyYear"
            className="form-control"
            min="1900"
            max="2100"
            value={formData.periodDate}
            placeholder="YYYY"
            maxLength={4}
            onChange={(e) => {
              const value = e.target.value;

              // allow only digits and max 4 chars
              if (/^\d{0,4}$/.test(value)) {
                onPeriodFieldChanged(value, "year");
              }
            }}
          />
        </div>
      )}

      {/* {frequency === 'weekly' && (
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
      )} */}

      <div className="mb-3 flex-column align-items-start">
        <label className="form-label">Template</label>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (typeof onDownload === 'function') onDownload(formData);
          }}
          className="btn btn-link p-0"
          download
        >
          <AppIcon ic="download" /> Click here to download
        </a>
      </div>

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

  const { setPageTitle, toggleProgressBar, toast, modal, closeModal, setRHSAppBarMenuItems} = useAppLayoutContext();
  const { t, locale } = useI18n();
  const [data, setData] = useState([]);

  const initialUploadFormDataParent = { file: null, periodDate: null }; 
  const [ uploadFormData, setUploadFormData ] = useState({ ...initialUploadFormDataParent });
  const latestUploadFormData = useRef(uploadFormData);

  useEffect(() => {
    latestUploadFormData.current = uploadFormData;
  }, [uploadFormData]);


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

  // Shared template generator (used by both download modal and upload modal)
  const generateTemplateGlobal = (chartMainType, freq, formPeriod) => {
    const isTrendOrControl = ['trend', 'control'].includes(chartMainType);
    const monthNamesShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    let csv = '';

    if (isTrendOrControl) {
      csv += 'UCL,LCL\n40,10\n';
    }

    if (freq === 'daily') {
      const pd = formPeriod ? new Date(formPeriod) : null;
      if (!pd || isNaN(pd.getTime())) return null;
      const year = pd.getFullYear();
      const month = pd.getMonth() + 1;
      const daysInMonth = new Date(year, month, 0).getDate();

      if (isTrendOrControl) csv += 'LABEL,VALUE,TARGET\n';
      else csv += 'LABEL,VALUE\n';

      for (let d = 1; d <= daysInMonth; d++) {
        if (isTrendOrControl) csv += `${d},,\n`;
        else csv += `${d},\n`;
      }
      return csv;
    }

    if (freq === 'monthly') {
      const year = formPeriod ? Number(formPeriod) : null;
      if (!year || isNaN(year)) return null;

      if (isTrendOrControl) csv += 'LABEL,VALUE,TARGET\n';
      else csv += 'LABEL,VALUE\n';

      for (let m = 0; m < 12; m++) {
        const label = monthNamesShort[m];
        if (isTrendOrControl) csv += `${label},,\n`;
        else csv += `${label},\n`;
      }
      return csv;
    }

    if (freq === 'weekly') {
      const monthStr = formPeriod?.month || formPeriod;
      if (!monthStr) return null;
      const [yStr, mStr] = String(monthStr).split('-');
      const year = Number(yStr);
      const month = Number(mStr);
      if (!year || !month) return null;

      const lastOfMonth = new Date(year, month, 0);
      let weeks = 0;
      for (let d = 0; d < lastOfMonth.getDate(); d++) {
        const date = new Date(year, month - 1, d + 1);
        if (date.getDay() === 1) weeks++;
      }
      if (weeks < 1) weeks = 4;

      if (isTrendOrControl) csv += 'LABEL,VALUE,TARGET\n';
      else csv += 'LABEL,VALUE\n';

      for (let w = 1; w <= weeks; w++) {
        const label = `Week ${w}`;
        if (isTrendOrControl) csv += `${label},,\n`;
        else csv += `${label},\n`;
      }
      return csv;
    }

    return null;
  };

  const performBlobDownload = (template, filename) => {
    if (!template) return false;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    return true;
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
              rowNumber: i + 1,  // Track the Excel row number for error reporting
            });
          } else {
            if (row.some(cell => cell === "")) {
              errors.push(`Line ${i + 1}: Contains empty cell(s) before 'label' section`);
            }
          }
        }

        // Frequency-specific validations (days/weeks/months) with row tracking
        try {
          if (frequency === 'daily') {
            const pd = new Date(periodDate);
            const year = pd.getFullYear();
            const month = pd.getMonth() + 1;
            const daysInMonth = new Date(year, month, 0).getDate();
            const monthName = pd.toLocaleString(undefined, { month: 'long' });

            const seenValid = new Map();
            const duplicatesValid = new Map();
            const seenInvalid = new Map();
            const duplicatesInvalid = new Map();

            chartData.forEach(c => {
              const n = Number(String(c.label).trim());
              const row = c.rowNumber;
              if (isNaN(n)) return;
              if (n > daysInMonth) {
                if (!seenInvalid.has(n)) seenInvalid.set(n, row);
                else {
                  if (!duplicatesInvalid.has(n)) duplicatesInvalid.set(n, []);
                  duplicatesInvalid.get(n).push(row);
                }
              } else {
                if (!seenValid.has(n)) seenValid.set(n, row);
                else {
                  if (!duplicatesValid.has(n)) duplicatesValid.set(n, []);
                  duplicatesValid.get(n).push(row);
                }
              }
            });

            // Report first invalid occurrence as invalid, later ones as duplicates
            seenInvalid.forEach((firstRow, day) => {
              errors.push(`Row ${firstRow}: "${monthName}" ${year} has ${daysInMonth} days, but invalid day: ${day}`);
            });
            duplicatesInvalid.forEach((rows, day) => {
              errors.push(`Row ${rows.join(', ')}: Duplicate invalid day ${day} found`);
            });

            // Report duplicates among valid days
            duplicatesValid.forEach((rows, day) => {
              errors.push(`Row ${rows.join(', ')}: Duplicate day ${day} found`);
            });
          }

          if (frequency === 'weekly') {
            const monthStr = periodDate?.month || periodDate;
            const [yStr, mStr] = String(monthStr || '').split('-');
            const year = Number(yStr);
            const month = Number(mStr);
            if (year && month) {
              const lastOfMonth = new Date(year, month, 0);
              let weeks = 0;
              for (let d = 0; d < lastOfMonth.getDate(); d++) {
                const date = new Date(year, month - 1, d + 1);
                if (date.getDay() === 1) weeks++;
              }
              if (weeks < 1) weeks = 4;

              const monthName = new Date(year, month - 1, 1).toLocaleString(undefined, { month: 'long' });
              
              // Check invalid and duplicate weeks, classifying first invalid as invalid and later ones as duplicates
              const seenValid = new Map();
              const duplicatesValid = new Map();
              const seenInvalid = new Map();
              const duplicatesInvalid = new Map();

              chartData.forEach(c => {
                const m = String(c.label).match(/(\d+)/);
                const n = m ? Number(m[1]) : NaN;
                const row = c.rowNumber;
                if (isNaN(n)) return;
                if (n > weeks) {
                  if (!seenInvalid.has(n)) seenInvalid.set(n, row);
                  else {
                    if (!duplicatesInvalid.has(n)) duplicatesInvalid.set(n, []);
                    duplicatesInvalid.get(n).push(row);
                  }
                } else {
                  if (!seenValid.has(n)) seenValid.set(n, row);
                  else {
                    if (!duplicatesValid.has(n)) duplicatesValid.set(n, []);
                    duplicatesValid.get(n).push(row);
                  }
                }
              });

              seenInvalid.forEach((firstRow, week) => {
                errors.push(`Row ${firstRow}: "${monthName}" ${year} has ${weeks} week(s), but invalid week: ${week}`);
              });
              duplicatesInvalid.forEach((rows, week) => {
                errors.push(`Row ${rows.join(', ')}: Duplicate invalid week ${week} found`);
              });

              duplicatesValid.forEach((rows, week) => {
                errors.push(`Row ${rows.join(', ')}: Duplicate week ${week} found`);
              });
            }
          }

          if (frequency === 'monthly') {
            const year = Number(periodDate);
            if (year) {
              const seen = new Map();
              chartData.forEach(c => {
                const label = String(c.label).trim();
                if (!label) return;
                const key = label.toLowerCase();
                if (!seen.has(key)) seen.set(key, []);
                seen.get(key).push(c.rowNumber);
              });
              seen.forEach((rows, label) => {
                if (rows.length > 1) {
                  errors.push(`Row ${rows.join(', ')}: Duplicate month "${label}" found`);
                }
              });
            }
          }
        } catch (vErr) {
          // swallow validation errors but keep parsing errors array empty if nothing else
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
    // `file` is stored as a File object in the form state — pass it directly
    handleFileUpload(user_id, currentData.file, chartType, role_id, record_id, existingChartData, currentData.periodDate, frequency);
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
          }}
          onDownload={(formData) => {
            const period = formData?.periodDate;
            const template = generateTemplateGlobal(chartType, frequency, period);
            if (!template) {
              toast('error', 'Please select day/Month/Year before downloading template.');
              return;
            }
            performBlobDownload(template, `${chartType}-chart-${frequency}_template.csv`);
          }}
        />
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
      setRHSAppBarMenuItems([]);
      fetchKPIResponses();
      toggleProgressBar(false);
    }
  }, [status]);

  return (
    <>
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
                                <></>
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
    </>
  );
}