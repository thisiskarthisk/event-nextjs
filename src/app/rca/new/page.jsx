'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RcaForm({ params }) {
    const { setPageTitle, setPageType, toggleProgressBar } = useAppLayoutContext();
    const { t, locale } = useI18n();
    const router = useRouter();
    const { id } = use(params);

    const initialForm = {
        id: null,
        rca_no: "",
        gap_analysis_id: "",
        department: "",
        date_of_report: "",
        reported_by: "",
        date_of_occurrence: "",
        impact: "",
        problem_description: "",
        immediate_action_taken: "",
        rca_whys: [{ id: null, question: "", response: "", isExist: false }],
    };

    const [form, setForm] = useState(initialForm);
    const [capaList, setCapaList] = useState([]);
    const [cpActionsList, setCpActionsList] = useState([]);
    const [selectedCapa, setSelectedCapa] = useState(null);

    const getCapaDetails = () => {
        fetch("/api/v1/rca/new")
            .then((res) => res.json())
            .then((json) => {
                if (json.success) {
                    setCapaList(json.data.gap_analysis_list || []);
                    setCpActionsList(json.data.cp_actions || []);
                } else {
                    console.error("Error fetching data:", json.message);
                }
            })
            .catch((err) => console.error("API Error:", err));
    }

    useEffect(() => {
        setPageType('dashboard');

        setPageTitle(id ? t('RCA Details') : t('RCA New'));

        toggleProgressBar(false);

        getCapaDetails();

        fetch(`/api/v1/rca/${id}`)
            .then((res) => res.json())
            .then((response) => {
                if (response.success) {
                    const root_cause_analysis = response.data.root_cause_analysis;
                    const rca_whys = response.data.rca_whys;

                    const rca_whys_data = rca_whys.map(a => ({
                        id: a.id,
                        question: a.question || '',
                        response: a.answer || '',
                        isExist: true
                    }));

                    setForm({
                        ...initialForm,
                        id: root_cause_analysis.id || '',
                        rca_no: root_cause_analysis.rca_no || '',
                        gap_analysis_id: root_cause_analysis.gap_analysis_id || '',
                        department: root_cause_analysis.department || '',
                        date_of_report: root_cause_analysis.date_of_report || '',
                        reported_by: root_cause_analysis.reported_by || '',
                        date_of_occurrence: root_cause_analysis.date_of_occurrence || '',
                        impact: root_cause_analysis.impact || '',
                        problem_description: root_cause_analysis.problem_desc || '',
                        immediate_action_taken: root_cause_analysis.immediate_action_taken || '',
                        rca_whys: rca_whys_data || []
                    });

                } else {
                    console.error("Error fetching data:", response.message);
                }
            })
            .catch((err) => console.error("API Error:", err));

    }, [locale, id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleWhyChange = (e, index) => {
        const { name, value } = e.target;
        const newWhys = [...form.rca_whys];
        newWhys[index][name] = value;
        setForm({ ...form, rca_whys: newWhys });
    };

    const addWhy = () => {
        setForm((prev) => ({
            ...prev,
            rca_whys: [...prev.rca_whys, { question: "", response: "" }],
        }));
    };

    const removeWhy = async (index, rca_why_id) => {
        if (!window.confirm("Are you sure want to delete this record?")) return;
        if (rca_why_id) {
            try {
                const response = await fetch(`/api/v1/rca/${rca_why_id}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: {},
                });

                const result = await response.json();
                console.log(result);

                if (result.success) {
                    alert(result.message || "Deleted successfully!");

                    const newWhys = form.rca_whys.filter((_, i) => i !== index);
                    setForm({ ...form, rca_whys: newWhys });
                } else {
                    alert(result.message || "Failed to delete RCA");
                }
            } catch (err) {
                console.error("Error:", err);
                alert("Something went wrong.");
            }
        } else {
            const newWhys = form.rca_whys.filter((_, i) => i !== index);
            setForm({ ...form, rca_whys: newWhys });
        }
    };

    const handleCapaSelect = (e) => {
        const value = e.target.value;
        setForm({ ...form, gap_analysis_id: value });
    };

    const [errors, setErrors] = useState({});
    const [rcaWhyErrors, setRcaWhyErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("/api/v1/rca/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const result = await response.json();
            console.log(result);

            if (result.success) {
                alert(result.message || 'Saved successfully!');
                router.push("/rca");
            } else {
                alert(result.message || "Failed to save RCA");

                if (result.data.errors) {
                    const rcaWhyErrorMap = [];
                    const formErrors = result.data.errors;

                    if (Object.keys(formErrors).length > 0) {
                        setErrors(formErrors);

                        if (formErrors.rca_whys && formErrors.rca_whys.length > 0) {
                            formErrors.rca_whys.forEach((err) => {
                                rcaWhyErrorMap[err.index] = err;
                            })
                            setRcaWhyErrors(rcaWhyErrorMap);
                        } else {
                            setRcaWhyErrors({});
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Error:", err);
            alert("Something went wrong.");
        }
    };

    useEffect(() => {
        if (form.gap_analysis_id) {
            const found = cpActionsList.filter(
                (c) => String(c.ga_id) === String(form.gap_analysis_id)
            );
            setSelectedCapa(found || []);
        } else {
            setSelectedCapa([]);
        }

    }, [form.gap_analysis_id, cpActionsList]);

    const handleCancel = () => router.push("/rca");

    return (
        <AuthenticatedPage>
            <div className="row">
                <div className="col-12">
                    <form className="p-3" onSubmit={handleSubmit}>
                        <div className="card border-success shadow">
                            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                                <h5 className="my-1">Root Cause Analysis (RCA)</h5>
                            </div>

                            <div className="card-body">
                                {/* RCA Info */}
                                <div className="row">
                                    {id && <div className="col-md-4 mb-3">
                                        <label className="form-label">RCA No</label>
                                        <input
                                            className="form-control"
                                            name="rca_no"
                                            value={form.rca_no}
                                            readOnly
                                            style={{
                                                cursor: "not-allowed",
                                                color: "black",
                                                backgroundColor: "lightgray",
                                            }}
                                        />
                                    </div>}

                                    <div className="col-md-4 mb-3">
                                        <label className="form-label fw-bold">Department</label>
                                        <input
                                            className={`form-control ${errors?.department ? "is-invalid" : ""}`}
                                            name="department"
                                            value={form.department}
                                            onChange={handleChange}
                                        />
                                        {errors?.department && (
                                            <span id="departmentInputError" className="error invalid-feedback">{errors?.department}</span>
                                        )}
                                    </div>

                                    <div className="col-md-4 mb-3">
                                        <label className="form-label fw-bold">Reported By</label>
                                        <input
                                            className={`form-control ${errors?.reported_by ? "is-invalid" : ""}`}
                                            name="reported_by"
                                            value={form.reported_by}
                                            onChange={handleChange}
                                        />
                                        {errors?.reported_by && (
                                            <span id="reportedByInputError" className="error invalid-feedback">{errors?.reported_by}</span>
                                        )}
                                    </div>

                                    <div className="col-md-4 mb-3">
                                        <label className="form-label fw-bold">Date of Report</label>
                                        <input
                                            type="date"
                                            className={`form-control ${errors?.date_of_report ? "is-invalid" : ""}`}
                                            name="date_of_report"
                                            value={form.date_of_report}
                                            onChange={handleChange}
                                        />
                                        {errors?.date_of_report && (
                                            <span id="dateOfReportInputError" className="error invalid-feedback">{errors?.date_of_report}</span>
                                        )}
                                    </div>


                                    <div className="col-md-4 mb-3">
                                        <label className="form-label fw-bold">Date of Occurrence</label>
                                        <input
                                            type="date"
                                            className={`form-control ${errors?.date_of_occurrence ? "is-invalid" : ""}`}
                                            name="date_of_occurrence"
                                            value={form.date_of_occurrence}
                                            onChange={handleChange}
                                        />
                                        {errors?.date_of_occurrence && (
                                            <span id="dateOfOccurrenceInputError" className="error invalid-feedback">{errors?.date_of_occurrence}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Text Areas */}
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Impact</label>
                                    <textarea
                                        className={`form-control ${errors?.impact ? "is-invalid" : ""}`}
                                        rows="2"
                                        name="impact"
                                        value={form.impact}
                                        onChange={handleChange}
                                    />
                                    {errors?.impact && (
                                        <span id="impactInputError" className="error invalid-feedback">{errors?.impact}</span>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Problem Description</label>
                                    <textarea
                                        className={`form-control ${errors?.problem_description ? "is-invalid" : ""}`}
                                        rows="3"
                                        name="problem_description"
                                        value={form.problem_description}
                                        onChange={handleChange}
                                    />
                                    {errors?.problem_description && (
                                        <span id="problemDescriptionInputError" className="error invalid-feedback">{errors?.problem_description}</span>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Immediate Action Taken</label>
                                    <textarea
                                        className={`form-control ${errors?.immediate_action_taken ? "is-invalid" : ""}`}
                                        rows="3"
                                        name="immediate_action_taken"
                                        value={form.immediate_action_taken}
                                        onChange={handleChange}
                                    />
                                    {errors?.immediate_action_taken && (
                                        <span id="immediateActionTakenInputError" className="error invalid-feedback">{errors?.immediate_action_taken}</span>
                                    )}
                                </div>

                                {/* RCA 5 Whys */}
                                <div className="mt-4">
                                    <h5 className="text-primary mb-3 border-bottom pb-2">RCA 5 Whys</h5>
                                    {form.rca_whys.map((why, idx) => (
                                        <div key={idx} className="card mb-3 border-info">
                                            <div className="card-header bg-light d-flex justify-content-between">
                                                <span className="fw-bold text-info">Why {idx + 1}</span>
                                                {form.rca_whys.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => removeWhy(idx, why.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                            <div className="card-body">
                                                <label className="form-label fw-bold">Question</label>
                                                <textarea
                                                    className={`form-control mb-3 ${rcaWhyErrors[idx]?.errors?.question ? "is-invalid" : ""}`}
                                                    rows="2"
                                                    name="question"
                                                    value={why.question}
                                                    onChange={(e) => handleWhyChange(e, idx)}
                                                />
                                                {rcaWhyErrors[idx]?.errors?.question && (
                                                    <span id="questionInputError" className="error invalid-feedback">{rcaWhyErrors[idx]?.errors?.question}</span>
                                                )}

                                                <label className="form-label fw-bold">Response</label>
                                                <textarea
                                                    className={`form-control ${rcaWhyErrors[idx]?.errors?.response ? "is-invalid" : ""}`}
                                                    rows="2"
                                                    name="response"
                                                    value={why.response}
                                                    onChange={(e) => handleWhyChange(e, idx)}
                                                />
                                                {rcaWhyErrors[idx]?.errors?.response && (
                                                    <span id="responseInputError" className="error invalid-feedback">{rcaWhyErrors[idx]?.errors?.response}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn btn-info mt-2"
                                        onClick={addWhy}
                                    >
                                        + Add New Why
                                    </button>
                                </div>

                                {/* Linked CAPA Section */}
                                <div className="mt-5">
                                    <h5 className="text-primary mb-3 border-bottom pb-2">Linked CAPA</h5>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label fw-bold">Select CAPA No</label>
                                        <select
                                            className={`form-select ${errors?.gap_analysis_id ? "is-invalid" : ""}`}
                                            name="gap_analysis_id"
                                            value={form.gap_analysis_id}
                                            onChange={handleCapaSelect}
                                        >
                                            <option value="">Select CAPA</option>
                                            {capaList.map((capa, idx) => (
                                                <option key={idx} value={capa.id}>
                                                    {capa.capa_no}
                                                </option>
                                            ))}
                                        </select>
                                        {errors?.gap_analysis_id && (
                                            <span id="dateInputError" className="error invalid-feedback">{errors?.gap_analysis_id}</span>
                                        )}
                                    </div>

                                    {/* View-only CAPA Table */}
                                    {selectedCapa && selectedCapa.length > 0 && (
                                        <div className="card p-3 border-info">
                                            <h6 className="mb-3 text-end">
                                                CAPA No: {selectedCapa[0].capa_no || "—"}
                                            </h6>
                                            <style>{`
                                            .fixed-table {
                                                table-layout: fixed;
                                                width: 100%;
                                            }
                                            .description-cell {
                                                word-wrap: break-word;
                                                word-break: break-all;
                                                max-width: 120px;
                                            }
                                            .col-date { width: 8%; }
                                            .col-reason { width: 15%; }
                                            .col-desc { width: 15%; }
                                            .col-target { width: 10%; }
                                            .col-status { width: 7%; }
                                            .col-resp { width: 15%; }
                                            `}
                                            </style>

                                            <table className="table table-bordered text-center align-middle fixed-table">
                                                <thead>
                                                    <tr>
                                                        <th rowSpan="3" className="col-date" style={{ verticalAlign: "middle" }}>
                                                            Date
                                                        </th>
                                                        <th rowSpan="3" className="col-reason" style={{ verticalAlign: "middle" }}>
                                                            Reason for Deviation
                                                        </th>
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
                                                    {selectedCapa?.length > 0 ? (
                                                        selectedCapa.map((a, i) => (
                                                            <tr key={i}>
                                                                <td className="col-date">{a.date || "—"}</td>
                                                                <td className="col-reason">{a.reason || "—"}</td>
                                                                <td className="col-desc description-cell">
                                                                    {a.cor_action_desc || "—"}
                                                                </td>
                                                                <td className="col-target">{a.cor_action_target_date || "—"}</td>
                                                                <td className="col-status">{a.cor_action_status || "—"}</td>
                                                                <td className="col-resp">{a.cor_action_responsibility || "—"}</td>
                                                                <td className="col-desc description-cell">
                                                                    {a.prev_action_desc || "—"}
                                                                </td>
                                                                <td className="col-target">{a.prev_action_target_date || "—"}</td>
                                                                <td className="col-status">{a.prev_action_status || "—"}</td>
                                                                <td className="col-resp">{a.prev_action_responsibility || "—"}</td>
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
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="mt-4 text-end">
                                    <button
                                        type="button"
                                        className="btn btn-secondary me-2"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {id ? 'Update RCA' : 'Save RCA'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedPage>
    );
}
