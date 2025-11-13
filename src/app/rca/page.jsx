'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import AppIcon from "../../components/icon";
import { useRouter } from "next/navigation";

export default function Rca() {
    const { setPageTitle, setPageType, toggleProgressBar } = useAppLayoutContext();
    const { t, locale } = useI18n();
    const [data, setData] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const router = useRouter();

    const fetchRCAList = () => {
        fetch("/api/v1/rca/list")
            .then((res) => res.json())
            .then((json) => {
                if (json.success) {
                    setData(json.data.root_cause_analysis);
                } else {
                    console.error("Error fetching data:", json.message);
                }
            })
            .catch((err) => console.error("API Error:", err));
    }

    useEffect(() => {
        setPageType('dashboard');

        setPageTitle(t('RCA'));

        toggleProgressBar(false);

        fetchRCAList();
    }, [locale]);

    // ✅ Handle Download Template
    const handleDownloadTemplate = () => {
        const headers = [
            "Department",
            "Reported By",
            "Date of Report",
            "Date of Occurrence",
            "Impact",
            "Problem Description",
            "Immediate Action Taken",
            "Question",
            "Answer",
        ];

        const sample = [
            {
                Department: "Production",
                "Reported By": "Karthi",
                "Date of Report": "22/05/25",
                "Date of Occurrence": "30/10/25",
                Impact: "Production",
                "Problem Description": "Production 100 need it ..but 50",
                "Immediate Action Taken": "Production lane 2 produced extra 50 item",
                Question: "why only 50 produced in lane 1 ?",
                Answer: "machine repair",
            },
        ];

        const csv = Papa.unparse(sample, { columns: headers });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "RCA_Template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCsvUpload = async () => {
        if (!csvFile) return alert("Please select a CSV file first.");

        Papa.parse(csvFile, {
            header: true,
            skipEmptyLines: false, // detect blank rows
            complete: async (results) => {
                const rows = results.data;

                const grouped = [];
                let current = null;

                const clean = (v) => (v ? v.toString().trim() : "");

                const isEmptyRow = (row) =>
                    Object.values(row).every((v) => !v || clean(v) === "");

                rows.forEach((row) => {
                    if (isEmptyRow(row)) {
                        if (current) {
                            grouped.push(current);
                            current = null;
                        }
                        return;
                    }

                    const hasMainFields =
                        clean(row["Department"]) &&
                        clean(row["Reported By"]) &&
                        clean(row["Problem Description"]);

                    if (hasMainFields) {
                        if (current) grouped.push(current);
                        current = {
                            rca_no: "",
                            department: clean(row["Department"]),
                            reported_by: clean(row["Reported By"]),
                            date_of_report: clean(row["Date of Report"]),
                            date_of_occurrence: clean(row["Date of Occurrence"]),
                            impact: clean(row["Impact"]),
                            problem_description: clean(row["Problem Description"]),
                            immediate_action_taken: clean(row["Immediate Action Taken"]),
                            rca_whys: [],
                        };
                    }

                    if (current) {
                        current.rca_whys.push({
                            question: clean(row["Question"]),
                            response: clean(row["Answer"]),
                        });
                    }
                });

                // Push the last RCA group if any
                if (current && current.rca_whys.length > 0) grouped.push(current);

                if (grouped && grouped.length > 0) {
                    let lastIndex = 0;
                    let importFailed = false;

                    // ✅ Collect all questions from all groups
                    const allQuestions = grouped.flatMap(group =>
                        group.rca_whys.map(q => q.question?.trim().toLowerCase()).filter(Boolean)
                    );

                    // ✅ Find duplicates
                    const duplicates = allQuestions.filter((q, i) => allQuestions.indexOf(q) !== i);
                    const uniqueDuplicates = [...new Set(duplicates)];

                    // ✅ If duplicates exist, stop here
                    if (uniqueDuplicates.length > 0) {
                        alert(`⚠️ Duplicate questions found in CSV:\n\n${uniqueDuplicates.join("\n")}\n\nPlease remove duplicates and try again.`);
                        return;
                    }

                    for (const [index, group] of grouped.entries()) {
                        lastIndex = index;
                        try {
                            const response = await fetch("/api/v1/rca/import", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(group),
                            });

                            const result = await response.json();

                            if (result.success) {
                                console.log(`✅ Record ${index + 1} saved successfully`);
                            } else {
                                alert(result.message || `❌ Failed to save RCA record #${index + 1}`);
                                importFailed = true;
                                break;
                            }
                        } catch (err) {
                            console.error("Error:", err);
                            alert(`Something went wrong on record #${index + 1}`);
                            importFailed = true;
                            break;
                        }
                    }

                    if (!importFailed) {
                        alert(`✅ Successfully imported all ${grouped.length} RCA records.`);
                        setShowImportModal(false);
                        setCsvFile(null);
                        fetchRCAList();
                    } else {
                        alert(`⚠️ Import stopped at record #${lastIndex + 1} due to an error.`);
                    }
                }
            },
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure want to delete this record?")) return;

        try {
            const response = await fetch(`/api/v1/rca/delete/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: {},
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message || "Deleted successfully!");
                fetchRCAList();
            } else {
                alert(result.message || "Failed to delete RCA");
            }
        } catch (err) {
            console.error("Error:", err);
            alert("Something went wrong.");
        }
    };

    return (
        <AuthenticatedPage>
            <div className="card p-3">
                <div className="mr-auto">
                    <a className="btn btn-primary  me-2" href="/rca/new">
                        Add New RCA
                    </a>
                    <button
                        className="btn btn-warning"
                        onClick={() => setShowImportModal(true)}
                    >
                        <i className="bi bi-upload me-1"></i> Import RCA Data
                    </button>
                </div>

                <table className="mt-3">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 border text-center">RCA No</th>
                            <th className="px-4 py-2 border text-center">Department</th>
                            <th className="px-4 py-2 border text-center">Date of Report</th>
                            <th className="px-4 py-2 border text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.length > 0 ? (
                            data.map((row) => (
                                <tr key={row.id} className="text-center hover:bg-gray-50">
                                    <td className="px-4 py-2 border">{row.rca_no}</td>
                                    <td className="px-4 py-2 border">{row.department}</td>
                                    <td className="px-4 py-2 border">{row.date_of_report}</td>
                                    <td className="px-4 py-2 border">
                                        <a className="btn btn-sm btn-outline-primary" href={`/rca/edit/${row.id}`}>
                                            <AppIcon ic="square-edit-outline" className="nav-icon" />
                                        </a> &nbsp;
                                        <a className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(row.id)}>
                                            <AppIcon ic="trash-can-outline" className="nav-icon" />
                                        </a>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-4 py-2 text-center text-gray-500">
                                    No data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* ✅ Import Modal */}
                {showImportModal && (
                    <div
                        className="modal fade show"
                        style={{
                            display: "block",
                            backgroundColor: "rgba(0,0,0,0.5)",
                        }}
                    >
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                {/* Header */}
                                <div className="modal-header">
                                    <h5 className="modal-title">Import RCA Data</h5>
                                    <button
                                        className="btn btn-link text-decoration-none"
                                        onClick={handleDownloadTemplate}
                                    >
                                        <i className="bi bi-download me-1"></i> Download Template
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            setShowImportModal(false);
                                            setCsvFile(null);
                                        }}
                                    ></button>
                                </div>

                                {/* Body */}
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Select RCA CSV File</label>
                                        <input
                                            type="file"
                                            accept=".csv"
                                            className="form-control"
                                            onChange={(e) => setCsvFile(e.target.files[0])}
                                        />
                                        {csvFile && (
                                            <p className="text-muted mt-2">Selected: {csvFile.name}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="modal-footer">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowImportModal(false);
                                            setCsvFile(null);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleCsvUpload}
                                        disabled={!csvFile}
                                    >
                                        Upload
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AuthenticatedPage>
    );
}
