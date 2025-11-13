'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import AppIcon from "../../components/icon";
import { useRouter } from "next/navigation";
import DataTable from "@/components/DataTable";

export default function Rca() {
    const { setPageTitle, modal, toast, closeModal, toggleProgressBar } = useAppLayoutContext();
    const { t, locale } = useI18n();
    const [data, setData] = useState([]);
    const router = useRouter();

    const columns = [
        { 'column': 'rca_no', 'label': 'RCA No' },
        { 'column': 'department', 'label': 'Department' },
        { 'column': 'date_of_report', 'label': 'Date of Report' },
    ];

    /** Add New RCA */
    const handleAddNewCAPA = () => {
        router.push(`/rca/new`);
    };

    /** Edit RCA */
    const handleEdit = (id) => {
        router.push(`/rca/edit/${id}`);
    };

    const renderActions = (rowData) => (
        <>
            <button className="btn btn-md me-2" onClick={() => handleEdit(rowData.id)}>
                <AppIcon ic="pencil" className="text-primary" />
            </button>
            <button className="btn btn-md" onClick={() => handleDelete(rowData.id)}>
                <AppIcon ic="delete" className="text-danger" />
            </button>
        </>
    );

    const fetchRCAList = () => {
        fetch("/api/v1/rca/list")
            .then((res) => res.json())
            .then((json) => {
                if (json.success) {
                    setData(json.data.root_cause_analysis || []);
                } else {
                    console.error("Error fetching data:", json.message);
                }
            })
            .catch((err) => console.error("API Error:", err));
    }

    useEffect(() => {
        setPageTitle(t('RCA'));

        toggleProgressBar(false);

        fetchRCAList();
    }, [locale]);

    const handleOpenCsvModal = () => {
        /** Store reference to download function */
        const downloadFn = () => {
            handleDownloadTemplate();
        };

        /** Make it globally accessible */
        window._tempDownloadFn = downloadFn;

        modal({
            title: "Upload RCA (CSV)",
            body: `
            <button 
              type="button"
              onclick="window._tempDownloadFn && window._tempDownloadFn(); return false;"
              class="btn btn-outline-secondary mt-2 w-100"
            >
              Download Sample Template
            </button>
    
    
            <div class="mb-3 mt-3">
              <label class="form-label">Select CSV File</label>
              <input type="file" id="csvFileInput" accept=".csv" class="form-control" />
            </div>
          `,
            okBtn: {
                label: "Upload",
                onClick: async () => {
                    const fileInput = document.getElementById("csvFileInput");
                    if (!fileInput || !fileInput.files.length) {
                        toast("error", "Select a CSV file first");
                        return false;
                    }
                    const file = fileInput.files[0];
                    Papa.parse(file, {
                        header: true,
                        skipEmptyLines: false,
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
                                        if (!result.success) throw new Error(result.message || "Upload failed");

                                        closeModal();
                                        toast("success", "RCA data uploaded successfully!");
                                        fetchRCAList();

                                        // Cleanup
                                        delete window._tempDownloadFn;

                                    } catch (err) {
                                        console.error("Upload error:", err);
                                        toast("error", "Failed to upload KPI CSV");
                                    }
                                }
                            }
                        },
                    });
                },
            },
            cancelBtn: {
                label: "Cancel",
                onClick: () => {
                    // Cleanup on cancel
                    delete window._tempDownloadFn;
                }
            },
        });
    };

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

    const handleDelete = async (id) => {
        modal({
            title: "Are you sure?",
            body: "<p>This action will permanently delete the RCA.</p>",
            okBtn: {
                label: "Yes, Delete",
                onClick: async () => {
                    try {
                        const res = await fetch(`/api/v1/rca/delete/${id}`, {
                            method: "DELETE",
                        });

                        const data = await res.json();
                        if (!data.success) throw new Error(data.message || "Failed to delete");

                        // Update UI after successful delete
                        setData((prev) =>
                            prev.filter((obj) => obj.id !== id)
                        );

                        closeModal();
                        toast('success', data.message || 'RCA deleted successfully!');
                    } catch (err) {
                        console.error("Delete error:", err);
                        toast('error', 'Error deleting role sheet');
                    }
                },
            },
            cancelBtn: {
                label: "Cancel",
                onClick: () => {
                    console.log("Delete canceled");
                },
            },
            closeOnEsc: true,
        });
    };

    return (
        <AuthenticatedPage>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">RCA</h5>
                                <button className="btn btn-primary ms-auto me-2" onClick={handleAddNewCAPA}>
                                    <AppIcon ic="plus" className="text-info" /> Add New RCA
                                </button>
                                <button className="btn btn-outline-success " onClick={handleOpenCsvModal}>
                                    <AppIcon ic="upload" className="text-success" /> Upload RCA File (CSV)
                                </button>
                            </div>
                            <DataTable
                                apiPath="/rca/list"
                                dataKeyFromResponse="root_cause_analysis"
                                columns={columns}
                                actionColumnFn={renderActions}
                                paginationType="client" />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedPage>
    );
}
