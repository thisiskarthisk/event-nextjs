'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import { useI18n } from "@/components/i18nProvider";
import AppIcon from "@/components/icon";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { decodeURLParam, encodeURLParam } from "@/helper/utils";

const vcsDisplayNames = {
  "bar-chart": "Bar Chart",
  "line-chart": "Line Chart",
  "pie-chart": "Pie Chart",
  "trend-chart": "Trend Chart",
  "control-chart": "Control Chart",
  "line": "Line Chart", // added to match your sample data
};

const countKpis = (role) => (role.kpis ? role.kpis.length : 0);
const countObjectiveKpis = (objective) =>
  (objective.roles || []).reduce((sum, r) => sum + countKpis(r), 0);

export default function RoleSheetView() {
  const { toggleProgressBar, setPageTitle } = useAppLayoutContext();
  const { locale } = useI18n();
  const { role_id, rs_id } = useParams();
  const router = useRouter();
  const [roleSheetData, setRoleSheetData] = useState([]);

  useEffect(() => {
    toggleProgressBar(false);

    if (!role_id || !rs_id) return;

    const fetchData = async () => {
      try {
        setPageTitle('Role Sheet View');
        
        const res = await fetch(`/api/v1/roles/${decodeURLParam(role_id)}/rs/${decodeURLParam(rs_id)}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.data?.roleSheet)) {
          setRoleSheetData(data.data.roleSheet);
        } else {
          setRoleSheetData([]);
        }
      } catch (err) {
        console.error("Error loading role sheet:", err);
        setRoleSheetData([]);
      }
    };

    fetchData();
  }, [locale, role_id, rs_id]);

  // ============================
  // 📄 PDF DOWNLOAD
  // ============================
  const handleDownloadPdf = () => {
    if (!roleSheetData.length) return;

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });
    doc.setFontSize(16);
    doc.text("Role Sheet Report", 40, 40);
    let startY = 60;

    roleSheetData.forEach((objectiveData, objIndex) => {
      const tableRows = [];
      const totalKpiRows = countObjectiveKpis(objectiveData);

      (objectiveData.roles || []).forEach((roleObj) => {
        const kpis = roleObj.kpis || [];
        const roleRowSpan = kpis.length;

        kpis.forEach((kpiObj, kpiIndex) => {
          const row = [];

          if (tableRows.length === 0) {
            row.push({
              content: objectiveData.objective,
              rowSpan: totalKpiRows,
              styles: { halign: "center", fontStyle: "bold" },
            });
          }

          if (kpiIndex === 0) {
            row.push({
              content: roleObj.role,
              rowSpan: roleRowSpan,
              styles: { halign: "left" },
            });
          }

          row.push(
            kpiObj.kpi,
            kpiObj.measure,
            kpiObj.operation_definition,
            kpiObj.frequency_of_measurement,
            vcsDisplayNames[kpiObj.vcs] || kpiObj.vcs || "-"
          );

          tableRows.push(row);
        });
      });

      autoTable(doc, {
        startY,
        head: [
          [
            "OBJECTIVE",
            "ROLE",
            "KPI",
            "MEASURE",
            "Operational Definition",
            "Frequency of Measurement",
            "VCS",
          ],
        ],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: "bold" },
        styles: { cellPadding: 4, fontSize: 9, valign: "middle" },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 100 },
          2: { cellWidth: 100 },
          3: { cellWidth: 90 },
          4: { cellWidth: 130 },
          5: { cellWidth: 120 },
          6: { cellWidth: 80 },
        },
      });

      startY = doc.lastAutoTable.finalY + 40;
    });

    doc.save("Role_Sheet_Report.pdf");
  };

  // ============================
  // 📊 CSV DOWNLOAD
  // ============================
  const handleDownloadExcel = () => {
    if (!roleSheetData.length) return;

    const csvRows = [];

    roleSheetData.forEach((objectiveData) => {
      (objectiveData.roles || []).forEach((roleObj) => {
        (roleObj.kpis || []).forEach((kpiObj) => {
          csvRows.push({
            Objective: objectiveData.objective,
            Role: roleObj.role,
            KPI: kpiObj.kpi,
            Measure: kpiObj.measure,
            "Operational Definition": kpiObj.operation_definition,
            "Frequency of Measurement": kpiObj.frequency_of_measurement,
            VCS: vcsDisplayNames[kpiObj.vcs] || kpiObj.vcs || "-",
          });
        });
      });
    });

    const csv = Papa.unparse(csvRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "Role_Sheet_Data.csv");
  };

  return (
    <>
      <div className="app-content">
        <div className="container-fluid">
          <div className="app-content-header d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Role Sheet View</h5>
            <div>
              <button className="btn btn-outline-danger me-2" onClick={handleDownloadPdf}>
                <AppIcon ic="file-earmark-pdf" className="me-1" /> PDF
              </button>
              <button className="btn btn-outline-success me-2" onClick={handleDownloadExcel}>
                <AppIcon ic="file-earmark-excel" className="me-1" /> Excel
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => router.push(`/roles/${role_id}`)}
              >
                <AppIcon ic="arrow-left" className="me-1" /> Back
              </button>
            </div>
          </div>

          {roleSheetData.length === 0 ? (
            <div className="alert alert-warning text-center">No Role Sheet Data Found</div>
          ) : (
            roleSheetData.map((objectiveData, objIndex) => (
              <div key={objIndex} className="card mb-4">
                <div className="card-body p-0">
                  <table
                    className="table table-bordered align-middle mb-0"
                    style={{ background: "#fff", minWidth: 1200 }}
                  >
                    <thead className="table-light text-center">
                      <tr>
                        <th>OBJECTIVE</th>
                        <th>ROLE</th>
                        <th>KPI</th>
                        <th>MEASURE</th>
                        <th>Operational Definition</th>
                        <th>Frequency of Measurement</th>
                        <th>VCS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(objectiveData.roles || []).map((roleObj, roleIndex) => {
                        const roleKpis = roleObj.kpis || [];
                        const totalRoleKpis = countKpis(roleObj);
                        const totalObjectiveKpis = countObjectiveKpis(objectiveData);

                        return roleKpis.map((kpiObj, kpiIndex) => {
                          const isFirstRoleRow = kpiIndex === 0;
                          const isFirstObjectiveRow =
                            roleIndex === 0 && kpiIndex === 0;

                          return (
                            <tr key={`${roleIndex}-${kpiIndex}`}>
                              {isFirstObjectiveRow && (
                                <td
                                  rowSpan={totalObjectiveKpis}
                                  className="fw-bold text-center"
                                  style={{
                                    verticalAlign: "top",
                                    fontWeight: "600",
                                    minWidth: 100,
                                  }}
                                >
                                  {objectiveData.objective}
                                </td>
                              )}

                              {isFirstRoleRow && (
                                <td
                                  rowSpan={totalRoleKpis}
                                  style={{
                                    verticalAlign: "middle",
                                    fontWeight: "500",
                                  }}
                                >
                                  {roleObj.role}
                                </td>
                              )}

                              <td>{kpiObj.kpi}</td>
                              <td className="text-center">{kpiObj.measure}</td>
                              <td>{kpiObj.operation_definition}</td>
                              <td>{kpiObj.frequency_of_measurement}</td>
                              <td className="fw-bold" style={{ minWidth: 150 }}>
                                {vcsDisplayNames[kpiObj.vcs] || kpiObj.vcs || "-"}
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
