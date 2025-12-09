'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { useEffect, useState , useRef} from "react";
import Papa from "papaparse";
import AppIcon from "../../components/icon";
import { useRouter } from "next/navigation";
import DataTable from "@/components/DataTable";
import { HttpClient } from "@/helper/http";
import Link from "next/link";

export default function Rca() {
    const { setPageTitle, modal, toast, closeModal, toggleProgressBar, confirm, setAppBarMenuItems } = useAppLayoutContext();
    const { t, locale } = useI18n();
    const [data, setData] = useState([]);
    const router = useRouter();
    const tableRef = useRef(null);

    const columns = [
        { 'column': 'rca_no', 'label': 'RCA No' },
        { 'column': 'department', 'label': 'Department' },
        { 'column': 'date_of_report', 'label': 'Date of Report' },
    ];

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

    
    useEffect(() => {
        setPageTitle(t('RCA'));
        toggleProgressBar(false);
        setAppBarMenuItems([
            { icon: "upload", tooltip: "Upload RCA", className: "text-primary", onClick: handleOpenCsvModal }
        ]);
    }, [locale]);

    // --------------------------------------------------------------------------------------------------
    // ⬇️ CSV UPLOAD MODAL (UPDATED WITH ERROR BOX)
    // --------------------------------------------------------------------------------------------------

    const uploadedFiles = () => {
        return(
            <div>
                <button 
                  type="button"
                  onClick={() => window._tempDownloadFn && window._tempDownloadFn()}
                  className="btn btn-outline-secondary mt-2 w-100"
                >
                  Download Sample Template
                </button>

                <div className="mb-3 mt-3">
                  <label className="form-label">Select CSV File</label>
                  <input type="file" id="csvFileInput" accept=".csv" className="form-control" />
                </div>

                <div id="csvErrorBox"></div>
            </div>
        )
    }
    const handleOpenCsvModal = () => {
        window._tempDownloadFn = () => handleDownloadTemplate();

        modal({
            title: "Upload RCA (CSV)",
            body: uploadedFiles(),
            okBtn: {
                label: "Upload",
                onClick: async () => {
                    const fileInput = document.getElementById("csvFileInput");
                    if (!fileInput || !fileInput.files.length) {
                        showModalError("Select a CSV file first");
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

                            if (current && current.rca_whys.length > 0) grouped.push(current);

                            if (grouped.length === 0) {
                                showModalError("CSV file is empty or invalid.");
                                return;
                            }

                            // Duplicate question check
                            const allQuestions = grouped.flatMap(group =>
                                group.rca_whys.map(q => q.question?.trim().toLowerCase()).filter(Boolean)
                            );

                            const duplicates = [...new Set(allQuestions.filter((q, i) => allQuestions.indexOf(q) !== i))];

                            if (duplicates.length > 0) {
                                showModalError(
                                    `Duplicate questions found:<br>${duplicates.join("<br>")}<br><br>Please remove duplicates and try again.`
                                );
                                return;
                            }

                            // Uploading group by group
                            for (const group of grouped) {
                                try {
                                    const response = await fetch("/api/v1/rca/import", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(group),
                                    });

                                    const result = await response.json();

                                    if (!result.success) {
                                        showModalError(result.message || "Upload failed.");
                                        return;
                                    }

                                    // Success
                                    closeModal();
                                    toast("success", "RCA data uploaded successfully!");
                                    tableRef.current?.refreshTable();
                                    delete window._tempDownloadFn;

                                } catch (err) {
                                    console.error("Upload error:", err);
                                    showModalError("Server error while uploading CSV.");
                                }
                            }
                        },
                    });
                },
            },
            cancelBtn: {
                label: "Cancel",
                onClick: () => delete window._tempDownloadFn
            },
        });
    };

    // SHOW ERROR INSIDE MODAL
    const showModalError = (msg) => {
        const box = document.getElementById("csvErrorBox");
        if (box) {
            box.innerHTML = `
                <div class="alert alert-danger mt-3">
                    <strong>Error:</strong>&nbsp;${msg}
                </div>
            `;
        }
    };

    // --------------------------------------------------------------------------------------------------
    // CSV TEMPLATE DOWNLOAD
    // --------------------------------------------------------------------------------------------------
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

        const sample = [{
            Department: "Production",
            "Reported By": "Karthi",
            "Date of Report": "22/05/25",
            "Date of Occurrence": "30/10/25",
            Impact: "Production",
            "Problem Description": "Production 100 need it ..but 50",
            "Immediate Action Taken": "Produced 50 items extra",
            Question: "Why only 50 produced?",
            Answer: "Machine breakdown",
        }];

        const csv = Papa.unparse(sample, { columns: headers });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "RCA_Template.csv";
        a.click();

        URL.revokeObjectURL(url);
    };

    // --------------------------------------------------------------------------------------------------
    // DELETE FUNCTION
    // --------------------------------------------------------------------------------------------------
    const handleDelete = (id) => {
        confirm({
            title: "Delete RCA",
            message: "Are you sure you want to Delete the RCA?",
            positiveBtnOnClick: () => {
                toggleProgressBar(true);

                HttpClient({
                    url: `/rca/delete/${id}`,
                    method: "POST",
                    data: { id },
                }).then(res => {
                    toast('success', res.message || 'RCA record deleted successfully.');
                    closeModal();
                    toggleProgressBar(false);
                    tableRef.current?.refreshTable();
                }).catch(err => {
                    closeModal();
                    toast('error', err.response?.data?.message || "Delete failed.");
                    toggleProgressBar(false);
                });
            },
        });
    };

    return (
        <AuthenticatedPage>
            <div className="row mb-3">
                <div className="col-12 text-right">
                    <Link href="/rca/new" className="btn btn-primary">
                        <AppIcon ic="plus" /> Add RCA
                    </Link>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <DataTable
                                title="RCA List"
                                ref={tableRef}
                                apiPath="/rca/list"
                                dataKeyFromResponse="root_cause_analysis"
                                columns={columns}
                                paginationType="client"
                                actionColumnFn={renderActions}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedPage>
    );
}
