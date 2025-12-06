'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { exists } from "drizzle-orm";
import TextField from "@/components/form/TextField";
import TextArea from "@/components/form/TextArea";
import SelectPicker from "@/components/form/SelectPicker";

export default function CAPAForm({ params }) {
    const { setPageTitle, toast, toggleProgressBar } = useAppLayoutContext();
    const { t, locale } = useI18n();
    const router = useRouter();
    const { id } = use(params);

    const initialForm = {
        id: null,
        capa_no: "",
        capa_actions: [
            {
                date: "",
                reason_for_deviation: "",
                corrective: {
                    counter_measure: "",
                    description: "",
                    target_date: "",
                    status: "",
                    responsibility: "", // ✅ Corrective Responsibility
                },
                preventive: {
                    counter_measure: "",
                    description: "",
                    target_date: "",
                    status: "",
                    responsibility: "", // ✅ Preventive Responsibility
                },
            },
        ],
    };
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});


    useEffect(() => {
        setPageTitle(id ? t("CAPA Details") : t("CAPA New"));
        toggleProgressBar(false);

        if (!id) return; // no call when creating new

        fetch(`/api/v1/capa/${id}`)
            .then(async (res) => {
            if (!res.ok) {
                // optional: log status/text for debugging
                const text = await res.text();
                console.error("CAPA GET failed:", res.status, text);
                return null;
            }

            // handle empty body safely
            const text = await res.text();
            if (!text) return null;

            try {
                return JSON.parse(text);
            } catch (e) {
                console.error("Invalid JSON from /api/v1/capa/:id", e, text);
                return null;
            }
            })
            .then((response) => {
            if (!response || !response.success) return;

            const data = response.data?.gap_analysis || [];

            if (data.length > 0) {
                const fixedActions = data.map((a) => ({
                date: a.date || "",
                reason_for_deviation: a.reason || "",
                corrective: {
                    counter_measure: a.cor_counter_measure || "",
                    description: a.cor_action_desc || "",
                    target_date: a.cor_action_target_date || "",
                    status: a.cor_action_status || "",
                    responsibility: a.cor_action_responsibility || "",
                },
                preventive: {
                    counter_measure: a.prev_counter_measure || "",
                    description: a.prev_action_desc || "",
                    target_date: a.prev_action_target_date || "",
                    status: a.prev_action_status || "",
                    responsibility: a.prev_action_responsibility || "",
                },
                isExist: true,
                cpa_id: a.cpa_id,
                }));

                setForm({
                ...initialForm,
                id: data[0].ga_id || "",
                capa_no: data[0].capa_no || "",
                capa_actions:
                    fixedActions.length > 0 ? fixedActions : initialForm.capa_actions,
                });
            }
            })
            .catch((err) => console.error("API Error:", err));
        }, [locale, id]);


    const handleActionChange = (e, index, section, field) => {
        let name = field;
        let value;

        // Case 1: it is a normal HTML event
        if (e && e.target) {
            name = e.target.name;
            value = e.target.value;
        }
        // Case 2: Select or custom inputs send only the value
        else {
            value = e;
        }

        const newActions = [...form.capa_actions];

        if (section === "main") {
            newActions[index][name] = value;
        } else {
            newActions[index][section][name] = value;
        }

        setForm({ ...form, capa_actions: newActions });
    };

    const addAction = () => {
        setForm((prev) => ({
            ...prev,
            capa_actions: [
                ...prev.capa_actions,
                {
                    id: null,
                    date: "",
                    reason_for_deviation: "",
                    corrective: {
                        counter_measure: "",
                        description: "",
                        target_date: "",
                        status: "",
                        responsibility: "",
                    },
                    preventive: {
                        counter_measure: "",
                        description: "",
                        target_date: "",
                        status: "",
                        responsibility: "",
                    },
                    isExist: false,
                    cpa_id: null,
                },
            ],
        }));
    };

    const removeAction = async (index, capa_action_id) => {
        if (!window.confirm("Are you sure want to delete this record?")) return;
        if (capa_action_id) {
            try {
                const response = await fetch(`/api/v1/capa/${capa_action_id}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: {},
                });

                const result = await response.json();

                if (result.success) {
                    toast("success", result.message || "Deleted successfully!");

                    const newActions = form.capa_actions.filter((_, i) => i !== index);
                    setForm({ ...form, capa_actions: newActions });
                } else {
                    toast("error", result.message || "Failed to delete CAPA");
                }
            } catch (err) {
                console.error("Error:", err);
                toast("error","Something went wrong.");
            }
        } else {
            const newActions = form.capa_actions.filter((_, i) => i !== index);
            setForm({ ...form, capa_actions: newActions });
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("/api/v1/capa/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form), // ✔ FIXED
            });

            const result = await res.json();

            if (result.success) {
                toast( "success", result.message || "Saved successfully!" )
                router.push("/capa");
            } else {
                toast( "error", result.message || "Failed to save CAPA" )

                const formErrors = result.data?.errors || [];
                if (Array.isArray(formErrors) && formErrors.length > 0) {
                    const errorMap = [];
                    formErrors.forEach((err) => {
                        errorMap[err.index] = err;
                    });
                    setErrors(errorMap);
                } else {
                    setErrors([]);
                }
            }
        } catch (err) {
            console.error("Error:", err);
            toast( "error", "Something went wrong." );
        }
    };



    const handleCancel = () => router.push("/capa");

    return (
        <AuthenticatedPage>
            <div className="row">
                <div className="col-12">
                    <form className="p-3" onSubmit={handleSubmit}>
                        <div className="card border-success shadow">
                            <div className="card-header bg-success text-white">
                                <h5 className="my-1">Corrective and Preventive Action (CAPA)</h5>
                            </div>

                            <div className="card-body">
                                {/* CAPA No */}
                                {id && <div className="row mb-3">
                                    <div className="col-md-4">
                                        <TextField
                                            label="CAPA No"
                                            name="capa_no"
                                            value={form.capa_no}
                                            disabled
                                            style={{ backgroundColor: "lightgray" }}
                                        />
                                    </div>
                                </div>}

                                {form.capa_actions.map((action, idx) => (
                                    <div key={idx} className="card mb-4 border-info">
                                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                            <span className="fw-bold text-info">Record {idx + 1}</span>
                                            {form.capa_actions.length > 1 && (
                                                <button
                                                    style={({ marginLeft: "auto" })}
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => removeAction(idx, action.cpa_id)}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>

                                        <div className="card-body">
                                            {/* Row 1: Date / Reason / Responsibility */}
                                            <div className="row mb-3">
                                                <div className="col-md-6">
                                                    <TextField
                                                        label="Date"
                                                        name="date"
                                                        value={action.date}
                                                        onChange={(value) => handleActionChange(value, idx, "main", "date")}
                                                        type="date"
                                                        className={`form-control ${errors[idx]?.errors?.main?.date ? "is-invalid" : ""}`}
                                                    />
                                                    {errors[idx]?.errors?.main?.date && (
                                                        <span id="dateInputError" className="error invalid-feedback">{errors[idx]?.errors?.main?.date}</span>
                                                    )}
                                                </div>
                                                <div className="col-md-6">
                                                    <TextField
                                                        label="Reason for Deviation"
                                                        name="reason_for_deviation"
                                                        value={action.reason_for_deviation}
                                                        onChange={(e) => handleActionChange(e, idx, "main", "reason_for_deviation")}
                                                        className={`form-control ${errors[idx]?.errors?.main?.reason_for_deviation ? "is-invalid" : ""}`}
                                                    />
                                                    {errors[idx]?.errors?.main?.reason_for_deviation && (
                                                        <span id="reasonForDeviationInputError" className="error invalid-feedback">{errors[idx]?.errors?.main?.reason_for_deviation}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Corrective & Preventive Columns */}
                                            <div className="row border-top pt-3">
                                                <div className="col-md-6">
                                                    <h6 className="text-success fw-bold mb-2 text-center">Corrective</h6>

                                                    <div className="mb-2">
                                                        <TextField
                                                            label="Counter Measure"
                                                            name="counter_measure"
                                                            value={action.corrective.counter_measure}
                                                            onChange={(e) => handleActionChange(e, idx, "corrective", "counter_measure")}
                                                            className={`form-control ${errors[idx]?.errors?.corrective?.counter_measure ? "is-invalid" : ""}`}
                                                        />
                                                        {errors[idx]?.errors?.corrective?.counter_measure && (
                                                            <span id="counterMeasureInputError" className="error invalid-feedback">{errors[idx]?.errors?.corrective?.counter_measure}</span>
                                                        )}
                                                    </div>

                                                    <div className="mb-2">
                                                        <TextArea
                                                            label="Description"
                                                            rows="2"
                                                            name="description"
                                                            value={action.corrective.description}
                                                            onChange={(e) => handleActionChange(e, idx, "corrective", "description")}
                                                            className={`form-control ${errors[idx]?.errors?.corrective?.description ? "is-invalid" : ""}`}
                                                        />
                                                        {errors[idx]?.errors?.corrective?.description && (
                                                            <span id="descriptionInputError" className="error invalid-feedback">{errors[idx]?.errors?.corrective?.description}</span>
                                                        )}
                                                    </div>

                                                    <div className="row">
                                                        <div className="col-md-4">
                                                            <TextField
                                                                label="Target Date"
                                                                type="date"
                                                                name="target_date"
                                                                value={action.corrective.target_date}
                                                                onChange={(e) => handleActionChange(e, idx, "corrective", "target_date")}
                                                                className={`form-control ${errors[idx]?.errors?.corrective?.target_date ? "is-invalid" : ""}`}
                                                            />
                                                            {errors[idx]?.errors?.corrective?.target_date && (
                                                                <span id="targetDateInputError" className="error invalid-feedback">{errors[idx]?.errors?.corrective?.target_date}</span>
                                                            )}
                                                        </div>
                                                        <div className="col-md-4">
                                                            <SelectPicker
                                                                label="Select Status"
                                                                options={[
                                                                    { value: "planned", label: "Planned"},
                                                                    { value: "in-progress", label:"In-Progress" },
                                                                    { value: "implemented", label: "Implemented"}
                                                                ]}
                                                                value={action.corrective.status}
                                                                onChange={(e) => handleActionChange(e, idx, "corrective", "status")}
                                                                className={`form-control ${errors[idx]?.errors?.corrective?.status ? "is-invalid" : ""}`}
                                                            />
                                                            {errors[idx]?.errors?.corrective?.status && (
                                                                <span id="statusSelectInputError" className="error invalid-feedback">{errors[idx]?.errors?.corrective?.status}</span>
                                                            )}
                                                        </div>
                                                        <div className="col-md-4">
                                                            <TextField
                                                                label="Responsibility"
                                                                name="responsibility"
                                                                value={action.corrective.responsibility}
                                                                onChange={(e) => {
                                                                    console.log(e);
                                                                    handleActionChange(e, idx, "corrective", "responsibility");
                                                                }}

                                                                className={`form-control ${errors[idx]?.errors?.corrective?.responsibility ? "is-invalid" : ""}`}
                                                            />
                                                            {errors[idx]?.errors?.corrective?.responsibility && (
                                                                <span id="statusSelectInputError" className="error invalid-feedback">{errors[idx]?.errors?.corrective?.responsibility}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Preventive column */}
                                                <div className="col-md-6 border-start">
                                                    <h6 className="text-primary fw-bold mb-2 text-center">
                                                        Preventive
                                                    </h6>

                                                    <div className="mb-2">
                                                        <TextField
                                                            label="Counter Measure"
                                                            name="counter_measure"
                                                            value={action.preventive.counter_measure}
                                                            onChange={(e) => handleActionChange(e, idx, "preventive", "counter_measure")}
                                                            className={`form-control ${errors[idx]?.errors?.preventive?.counter_measure ? "is-invalid" : ""}`}
                                                        />
                                                        {errors[idx]?.errors?.preventive?.counter_measure && (
                                                            <span id="counterMeasureInputError" className="error invalid-feedback">{errors[idx]?.errors?.preventive?.counter_measure}</span>
                                                        )}
                                                    </div>

                                                    <div className="mb-2">
                                                        <TextArea
                                                            label="Description"
                                                            name="description"
                                                            rows="2"
                                                            value={action.preventive.description}
                                                            onChange={(e) => handleActionChange(e, idx, "preventive", "description")}
                                                            className={`form-control ${errors[idx]?.errors?.preventive?.description ? "is-invalid" : ""}`}
                                                        />
                                                        {errors[idx]?.errors?.preventive?.description && (
                                                            <span id="descriptionInputError" className="error invalid-feedback">{errors[idx]?.errors?.preventive?.description}</span>
                                                        )}
                                                    </div>

                                                    <div className="row">
                                                        <div className="col-md-4">
                                                            <TextField
                                                                label="Target Date"
                                                                name="target_date"
                                                                type="date"
                                                                value={action.preventive.target_date}
                                                                onChange={(e) => handleActionChange(e, idx, "preventive", "target_date")}
                                                                className={`form-control ${errors[idx]?.errors?.preventive?.target_date ? "is-invalid" : ""}`}
                                                            />
                                                            {errors[idx]?.errors?.preventive?.target_date && (
                                                                <span id="targetDateInputError" className="error invalid-feedback">{errors[idx]?.errors?.preventive?.target_date}</span>
                                                            )}
                                                        </div>
                                                        <div className="col-md-4">
                                                            <SelectPicker
                                                                label="Status"
                                                                name="status"
                                                                options={[
                                                                    { value: "planned", label: "Planned" },
                                                                    { value: "in-progress", label: "In-Progress" },
                                                                    { value: "implemented", label: "Implemented" }
                                                                ]}
                                                                value={action.preventive.status}
                                                                onChange={(e) => handleActionChange(e, idx, "preventive", "status")}
                                                                className={`form-control ${errors[idx]?.errors?.preventive?.status ? "is-invalid" : ""}`}
                                                            />
                                                            {/* <SelectPicker
                                                                value={action.corrective.responsibility}
                                                                onChange={(value) => handleActionChange(value, idx, "corrective", "responsibility")}
                                                            /> */}

                                                            {errors[idx]?.errors?.preventive?.status && (
                                                                <span id="statusSelectInputError" className="error invalid-feedback">{errors[idx]?.errors?.preventive?.status}</span>
                                                            )}
                                                        </div>
                                                        <div className="col-md-4">
                                                            <TextField
                                                                label="Responsibility"
                                                                name="responsibility"
                                                                value={action.preventive.responsibility}
                                                                onChange={(e) => handleActionChange(e, idx, "preventive", "responsibility")}
                                                                className={`form-control ${errors[idx]?.errors?.preventive?.responsibility ? "is-invalid" : ""}`}
                                                            />
                                                            {errors[idx]?.errors?.preventive?.responsibility && (
                                                                <span id="responsibilityInputError" className="error invalid-feedback">{errors[idx]?.errors?.preventive?.responsibility}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    className="btn btn-info mt-2"
                                    onClick={addAction}
                                >
                                    + Add New Record
                                </button>

                                <div className="mt-4 text-end">
                                    <button
                                        type="button"
                                        className="btn btn-secondary me-2"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {id ? 'Update CAPA' : 'Save CAPA'}
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
