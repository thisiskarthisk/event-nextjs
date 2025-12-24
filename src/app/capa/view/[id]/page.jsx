'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { HttpClient } from "@/helper/http";
import { decodeURLParam, encodeURLParam } from "@/helper/utils";

export default function CapaAnalysis({ params }) {
    const { setPageTitle, toggleProgressBar } = useAppLayoutContext();
    const { t, locale } = useI18n();
    const { id } = use(params);
    const [data, setData] = useState([]);
    const router = useRouter();

    useEffect(() => {
        setPageTitle(t('MP/CP GAP Analysis'));

        toggleProgressBar(false);
        HttpClient({
            url: `/capa/${decodeURLParam(id)}`,
            method:"GET"
        })
        .then(async(response) => {
            if (response.success) {
                const data = response.data.gap_analysis;
                if (data.length > 0) {
                    setData(data);
                } else {
                    setData([]);
                }
            } else {
                console.error("Error fetching data:", response.message);
            }
        })
        .catch((err) => console.error("API Error:", err));
    }, [locale, id]);

    const handleDownloadPdf = () => {
        try {
            if (data.length > 0) {
                const doc = new jsPDF({
                    orientation: "landscape",
                    unit: "pt",
                    format: "A4",
                });

                const pageWidth = doc.internal.pageSize.getWidth();
                const tableSideMargin = 40;

                doc.setFontSize(16);
                doc.text("MP/CP GAP Analysis", pageWidth / 2, 35, { align: "center" });
                doc.setFontSize(11);
                doc.text(`CAPA No: ${data?.[0]?.capa_no ?? "—"}`, pageWidth - tableSideMargin, 35, {
                    align: "right",
                });

                const table_width = 760;
                const startX = (pageWidth - table_width) / 2;

                const tableRows = (data || []).map((a) => [
                    a.date || "—",
                    a.reason || "—",
                    a.cor_action_desc || "—",
                    a.cor_action_target_date || "—",
                    a.cor_action_status || "—",
                    a.cor_action_responsibility || "—",
                    a.prev_action_desc || "—",
                    a.prev_action_target_date || "—",
                    a.prev_action_status || "—",
                    a.prev_action_responsibility || "—",
                ]);

                autoTable(doc, {
                    startY: 60,
                    head: [
                        [
                            { content: "Date", rowSpan: 3 },
                            { content: "Reason for Deviation", rowSpan: 3 },
                            { content: "# Counter Measure", colSpan: 8, styles: { halign: "center" } },
                        ],
                        [
                            { content: "Corrective", colSpan: 4, styles: { halign: "center" } },
                            { content: "Preventive", colSpan: 4, styles: { halign: "center" } },
                        ],
                        [
                            "Description",
                            "Target Date",
                            "Status",
                            "Responsibility",
                            "Description",
                            "Target Date",
                            "Status",
                            "Responsibility",
                        ],
                    ],
                    body: tableRows,
                    theme: "grid",
                    styles: {
                        fontSize: 9,
                        cellPadding: 4,
                        valign: "middle",
                        halign: "center",
                        lineWidth: 0.5,
                        lineColor: [0, 0, 0],
                        minCellHeight: 20,
                    },
                    headStyles: {
                        fillColor: [255, 255, 255],
                        textColor: 0,
                        fontStyle: "bold",
                        lineWidth: 0.5,
                        lineColor: [0, 0, 0],
                    },
                    columnStyles: {
                        0: { cellWidth: 50 },
                        1: { cellWidth: 110 },
                        2: { cellWidth: 85, halign: 'left' },
                        3: { cellWidth: 65 },
                        4: { cellWidth: 55 },
                        5: { cellWidth: 85 },
                        6: { cellWidth: 85, halign: 'left' },
                        7: { cellWidth: 65 },
                        8: { cellWidth: 55 },
                        9: { cellWidth: 105 },
                    },
                    margin: { left: startX, right: tableSideMargin },
                    didDrawPage: (data) => {
                        doc.setFontSize(10);
                        doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - tableSideMargin, 25, {
                            align: "right",
                        });
                    },
                });
                const safeFileName = (data?.[0]?.capa_no || "CAPA_Report").replace(/[^a-z0-9]/gi, "_");
                doc.save(`${safeFileName}.pdf`);
            } else {
                alert("Data not found");
            }
        } catch (err) {
            console.error("Error:", err);
            alert("Something went wrong.", err);
        }
    };

    const handleDownloadExcel = () => {
        try {
            if (!data || data.length === 0) {
                alert("Data not found");
                return;
            }

            // Define the header structure similar to your PDF
            const headers = [
                "Date",
                "Reason for Deviation",
                "Corrective - Description",
                "Corrective - Target Date",
                "Corrective - Status",
                "Corrective - Responsibility",
                "Preventive - Description",
                "Preventive - Target Date",
                "Preventive - Status",
                "Preventive - Responsibility",
            ];

            // Convert your data into rows
            const rows = data.map((a) => [
                a.date || "—",
                a.reason || "—",
                a.cor_action_desc || "—",
                a.cor_action_target_date || "—",
                a.cor_action_status || "—",
                a.cor_action_responsibility || "—",
                a.prev_action_desc || "—",
                a.prev_action_target_date || "—",
                a.prev_action_status || "—",
                a.prev_action_responsibility || "—",
            ]);

            // Combine headers + data
            const worksheetData = [
                ["MP/CP GAP Analysis"],
                [`CAPA No: ${data?.[0]?.capa_no ?? "—"}`],
                [],
                headers,
                ...rows,
            ];

            // Create worksheet
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

            // Auto width adjustment
            const columnWidths = headers.map((h) => ({ wch: h.length + 5 }));
            worksheet["!cols"] = columnWidths;

            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "CAPA Report");

            // Safe filename
            const safeFileName = (data?.[0]?.capa_no || "CAPA_Report").replace(/[^a-z0-9]/gi, "_");

            // Export file
            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
            saveAs(blob, `${safeFileName}.xlsx`);
        } catch (err) {
            console.error("Error:", err);
            alert("Something went wrong.");
        }
    };

    return (
        <AuthenticatedPage>
            <div className="row">
                <div className="text-end" style={{ minWidth: "300px" }}>
                    <button
                        className="btn btn-outline-danger me-2"
                        onClick={handleDownloadPdf}
                    >
                        <i className="bi bi-file-earmark-pdf me-1"></i> PDF
                    </button>
                    <button
                        className="btn btn-outline-success me-2"
                        onClick={handleDownloadExcel}
                    >
                        <i className="bi bi-file-earmark-excel me-1"></i> Excel
                    </button>
                    <button className="btn btn-secondary" onClick={() => router.push("/capa")}>
                        Back
                    </button>
                </div>
            </div>

            {data &&
                <div className="card p-3 mt-3">
                    <h6 className="mb-3 text-end">
                        CAPA No: {data?.[0]?.capa_no ?? "—"}
                    </h6>

                    <style>{`
                        .fixed-table {
                            table-layout: fixed;
                            width: 100%;                        
                        }
                        .description-cell {
                            word-wrap: break-word; /* Standard property */
                            word-break: break-all; /* For long, unbroken strings */
                            max-width: 100px; /* Example: set a width for the column */
                        }
                        /* You might want to define specific column widths for the fixed layout */
                        .col-date { width: 8%; }
                        .col-reason { width: 15%; }
                        /* These are the description columns, ensure their width is set */
                        .col-desc { width: 15%; } 
                        .col-target { width: 10%; }
                        .col-status { width: 7%; }
                        .col-resp { width: 15%; }
                    `}
                    </style>

                    <table className="table table-bordered text-center align-middle fixed-table" style={{ background: "#fff" }}>
                        <thead>
                            <tr>
                                <th rowSpan="3" className="col-date" style={{ verticalAlign: "middle" }}>Date</th>
                                <th rowSpan="3" className="col-reason" style={{ verticalAlign: "middle" }}>Reason for Deviation</th>
                                <th colSpan="8"># Counter Measure</th>
                            </tr>
                            <tr>
                                <th colSpan="4">Corrective</th>
                                <th colSpan="4">Preventive</th>
                            </tr>
                            <tr>
                                <th className="col-desc">Description</th>
                                <th className="col-target">Target Date</th>
                                <th className="col-status">Status</th>
                                <th className="col-resp">Responsibility</th>
                                <th className="col-desc">Description</th>
                                <th className="col-target">Target Date</th>
                                <th className="col-status">Status</th>
                                <th className="col-resp">Responsibility</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.length > 0 ? (
                                data.map((a, i) => (
                                    <tr key={i}>
                                        <td className="col-date">{a.date ?? "—"}</td>
                                        <td className="col-reason">{a.reason ?? "—"}</td>
                                        <td className="col-desc description-cell">{a.cor_action_desc ?? "—"}</td>
                                        <td className="col-target">{a.cor_action_target_date ?? "—"}</td>
                                        <td className="col-status">{a.cor_action_status ?? "—"}</td>
                                        <td className="col-resp">{a.cor_action_responsibility ?? "—"}</td>
                                        <td className="col-desc description-cell">{a.prev_action_desc ?? "—"}</td>
                                        <td className="col-target">{a.prev_action_target_date ?? "—"}</td>
                                        <td className="col-status">{a.prev_action_status ?? "—"}</td>
                                        <td className="col-resp">{a.prev_action_responsibility ?? "—"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10">No CAPA actions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            }
        </AuthenticatedPage >
    );
}
