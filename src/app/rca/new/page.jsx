'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { useEffect, useState ,use } from "react";
import { useRouter } from "next/navigation";
import TextField from "@/components/form/TextField";
import SelectPicker from "@/components/form/SelectPicker";
import TextArea from "@/components/form/TextArea";
import { HttpClient } from "@/helper/http";
import Link from "next/link";
import AppIcon from "@/components/icon";

export default function RcaForm({ params }) {
    const { setPageTitle, modal, closeModal, toast, toggleProgressBar , confirm } = useAppLayoutContext();
    const { t, locale } = useI18n();
    const router = useRouter();
    // const id = params?.id;
    const { id } = use(params);


    const initialForm = {
        id: null,
        rca_no: "",
        gap_analysis_id: "",
        department: "",
        date_of_report: "",
        reported_by: "", // ✅ Default numeric user ID
        date_of_occurrence: "",
        impact: "",
        problem_description: "",
        immediate_action_taken: "",
        rca_whys: [{ id: null, question: "", response: "", isExist: false }],
    };

    const [form, setForm] = useState(initialForm);
    const [capaList, setCapaList] = useState([]);
    const [cpActionsList, setCpActionsList] = useState([]);
    const [selectedCapa, setSelectedCapa] = useState([]);
    const [errors, setErrors] = useState({});
    const [rcaWhyErrors, setRcaWhyErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [rcaId, setRCAID] = useState(false);


    const getCapaDetails = async () => {
        try {
            HttpClient({
                url: "/rca/new",
                method: "GET",
            }).then(res => {
                if (res.success) {
                    setCapaList(res.data.gap_analysis_list || []);
                    setCpActionsList(res.data.cp_actions || []);
                }
            }).catch(err => console.error("getCapaDetails error:", err));
        } catch (err) {
            console.error("getCapaDetails error:", err);
        }
    };


     const loadRcaData = async (rcaId) => {
        try {
            HttpClient({
                url: `/rca/${rcaId}`,
                method: "GET",
            }).then(res => {
                if (res.success) {
                    const root_cause_analysis = res.data.root_cause_analysis;
                    const rca_whys = res.data.rca_whys || [];

                    const rca_whys_data = rca_whys.map(a => ({
                        id: a.id,
                        question: a.question || '',
                        response: a.answer || '',
                        isExist: true
                    }));

                    setForm({
                        ...initialForm,
                        id: root_cause_analysis.id,
                        rca_no: root_cause_analysis.rca_no || '',
                        gap_analysis_id: root_cause_analysis.gap_analysis_id || '',
                        // gap_analysis_id: String(res.gap_analysis_id || ""),
                        department: root_cause_analysis.department || '',
                        date_of_report: root_cause_analysis.date_of_report || '',
                        reported_by: root_cause_analysis.reported_by || "1",
                        date_of_occurrence: root_cause_analysis.date_of_occurrence || '',
                        impact: root_cause_analysis.impact || '',
                        problem_description: root_cause_analysis.problem_desc || '',
                        immediate_action_taken: root_cause_analysis.immediate_action_taken || '',
                        rca_whys: rca_whys_data.length > 0 ? rca_whys_data : [initialForm.rca_whys[0]]
                    });
                }
            }).catch(err => console.error("loadRcaData error:", err));
        } catch (err) {
            console.error("loadRcaData error:", err);
        }
    };
            

    useEffect(() => {
        setPageTitle(id ? t("RCA Details") : t("RCA New"));
        toggleProgressBar(false);

        if (id) {
            setRCAID(id);
            loadRcaData(id);
        } 
        getCapaDetails();
    }, [id, locale]);



    const handleChange = (value, fieldName) => {
        setForm(prev => ({
            ...prev,
            [fieldName]: typeof value === "object" ? value.target?.value : value
        }));
        if (errors[fieldName]) {
            setErrors(prev => ({ ...prev, [fieldName]: '' }));
        }
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
            rca_whys: [...prev.rca_whys, { id: null, question: "", response: "", isExist: false }],
        }));
    };


    const removeWhy = (id, why_id) => {
        console.log("RCA Question removeWhy called with ID: " + why_id);

        if (document.activeElement) document.activeElement.blur();
   
        console.log("RCA Question removeWhy called with ID: " + why_id);

        confirm({
            title: "Delete RCA Question",
            message: "Are you sure you want to Delete the RCA Question?",
            positiveBtnOnClick: () => {
                toggleProgressBar(true);
                try {
                    HttpClient({
                        url: `/rca/delete/rca_whys/${why_id}`, // Assuming a new specific endpoint for 'rca_whys'
                        method: "POST", // Changed from 'POST'
                        // No need to send 'data: { id }' in the body for a DELETE with ID in URL
                    }).then(res => {
                        // console.log(res);
                        // *** CORRECTION 3: The success message should indicate a 'why' question was deleted.
                        toast('success', res.message || 'The RCA Question has been deleted successfully.');
                        closeModal();
                        toggleProgressBar(false);

                        if(rcaId){                            
                            loadRcaData(id);
                        }
                    }).catch(err => {
                        closeModal();
                        let message = 'Error occurred when trying to delete the RCA Question.';
                        if (err.response?.data?.message) {
                            message = err.response.data.message;
                        }
                        toast('error', message);
                        toggleProgressBar(false);
                    });
                } catch (error) {
                    toast('error', 'Error occurred when trying to delete the RCA Question data.');
                }
            },
        });
    };



    const handleCapaSelect = (value) => {
        setForm({ ...form, gap_analysis_id: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setRcaWhyErrors({});
        setLoading(true);

        try {
            HttpClient({
                url: "/rca/save",
                method: "POST",
                data: form,
            }).then(res => {
                if (res.success) {
                    toast('success', res.message || 'RCA saved successfully!');
                    router.push("/rca");
                } else {
                    toast('error', res.message || "Failed to save RCA");
                }
            }).catch(err => {
                console.error("Submit Error:", err);
                toast('error', 'Network error. Please try again.');
            }).finally(() => {
                setLoading(false);
            });
        } catch (err) {
            console.error("Submit Error:", err);
            toast('error', 'Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (form.gap_analysis_id) {
            const found = cpActionsList.filter((c) => String(c.ga_id) === String(form.gap_analysis_id));
            setSelectedCapa(found);
        } else {
            setSelectedCapa([]);
        }
    }, [form.gap_analysis_id, cpActionsList]);


    return (
        <AuthenticatedPage>
            <div className="row">
                <div className="col-12">
                    <form className="p-3" onSubmit={handleSubmit}>
                        <div className="card border-success shadow">
                            <div className="card-header bg-success text-white">
                                <h5>Root Cause Analysis (RCA)</h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    {id && (
                                        <div className="col-md-4 mb-3">
                                            <TextField
                                                label="RCA No"
                                                name="rca_no"
                                                value={form.rca_no || ''}
                                                disabled
                                                style={{ backgroundColor: "lightgray" }}
                                            />
                                        </div>
                                    )}
                                    <div className="col-md-4 mb-3">
                                        <TextField
                                            label="Department *"
                                            className={`form-control ${errors.department ? "is-invalid" : ""}`}
                                            name="department"
                                            value={form.department || ''}
                                            onChange={(e) => handleChange(e, "department")}
                                        />
                                        {errors.department && <div className="invalid-feedback">{errors.department}</div>}
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <TextField
                                            label="Reported By *"
                                            className={`form-control ${errors.reported_by ? "is-invalid" : ""}`}
                                            name="reported_by"
                                            value={form.reported_by || ''}
                                            onChange={(e) => handleChange(e, "reported_by")}
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <TextField
                                            label="Date of Report *"
                                            type="date"
                                            className={`form-control ${errors.date_of_report ? "is-invalid" : ""}`}
                                            name="date_of_report"
                                            value={form.date_of_report || ''}
                                            onChange={(e) => handleChange(e, "date_of_report")}
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <TextField
                                            label="Date of Occurrence *"
                                            type="date"
                                            className={`form-control ${errors.date_of_occurrence ? "is-invalid" : ""}`}
                                            name="date_of_occurrence"
                                            value={form.date_of_occurrence || ''}
                                            onChange={(e) => handleChange(e, "date_of_occurrence")}
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <TextArea
                                        label="Impact *"
                                        name="impact"
                                        value={form.impact || ''}
                                        onChange={(e) => handleChange(e, "impact")}
                                        className={`form-control ${errors.impact ? "is-invalid" : ""}`}
                                        rows="2"
                                    />
                                </div>

                                <div className="mb-3">
                                    <TextArea
                                        label="Problem Description *"
                                        name="problem_description"
                                        value={form.problem_description || ''}
                                        onChange={(e) => handleChange(e, "problem_description")}
                                        className={`form-control ${errors.problem_description ? "is-invalid" : ""}`}
                                        rows="3"
                                    />
                                </div>

                                <div className="mb-3">
                                    <TextArea
                                        label="Immediate Action Taken *"
                                        name="immediate_action_taken"
                                        value={form.immediate_action_taken || ''}
                                        onChange={(e) => handleChange(e, "immediate_action_taken")}
                                        className={`form-control ${errors.immediate_action_taken ? "is-invalid" : ""}`}
                                        rows="3"
                                    />
                                </div>

                                {/* RCA 5 Whys */}
                                <div className="mt-4">
                                    <h5 className="text-primary mb-3 border-bottom pb-2">RCA 5 Whys</h5>
                                    {form.rca_whys.map((why, idx) => (
                                        console.log(why),
                                        <div key={idx} className="card mb-3 border-info">
                                            <div className="card-header bg-light d-flex justify-content-between">
                                                <span className="fw-bold text-info">Why {idx + 1}</span>
                                                {form.rca_whys.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => removeWhy(idx, why.id)}
                                                        style={{ marginLeft: "auto" }}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                            <div className="card-body">
                                                <TextArea
                                                    label="Question"
                                                    name="question"
                                                    value={why.question || ''}
                                                    onChange={(e) => handleWhyChange(e, idx)}
                                                    className="form-control mb-3"
                                                    rows="2"
                                                />
                                                <TextArea
                                                    label="Response"
                                                    name="response"
                                                    value={why.response || ''}
                                                    onChange={(e) => handleWhyChange(e, idx)}
                                                    className="form-control mb-3"
                                                    rows="2"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" className="btn btn-info mt-2" onClick={addWhy}>
                                        + Add New Why
                                    </button>
                                </div>

                                {/* Linked CAPA */}
                                <div className="mt-5">
                                    <h5 className="text-primary mb-3 border-bottom pb-2">Linked CAPA</h5>
                                    <div className="col-md-4 mb-3">
                                         <SelectPicker
                                            label="Select CAPA"
                                            name="gap_analysis_id"
                                            value={form.gap_analysis_id || ''}
                                            onChange={handleCapaSelect}
                                            options={capaList.map((capa, idx) => ({ 
                                                key: idx, 
                                                value: capa.id, 
                                                label: capa.capa_no 
                                            }))}
                                        /> 
                                    </div>
                                    {selectedCapa.length > 0 && (
                                        <div className="card p-3 border-info">
                                            <h6>CAPA No: {selectedCapa[0].capa_no || "—"}</h6>
                                            <div className="table-responsive">
                                                <table className="table table-bordered text-center">
                                                    <thead>
                                                        <tr>
                                                            <th>Date</th><th>Reason</th>
                                                            <th colSpan="4">Corrective</th>
                                                            <th colSpan="4">Preventive</th>
                                                        </tr>
                                                        <tr>
                                                            <th></th><th></th>
                                                            <th>Desc</th><th>Target</th><th>Status</th><th>Resp</th>
                                                            <th>Desc</th><th>Target</th><th>Status</th><th>Resp</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedCapa.map((a, i) => (
                                                            <tr key={i}>
                                                                <td>{a.date || "—"}</td>
                                                                <td>{a.reason || "—"}</td>
                                                                <td>{a.cor_action_desc || "—"}</td>
                                                                <td>{a.cor_action_target_date || "—"}</td>
                                                                <td>{a.cor_action_status || "—"}</td>
                                                                <td>{a.cor_action_responsibility || "—"}</td>
                                                                <td>{a.prev_action_desc || "—"}</td>
                                                                <td>{a.prev_action_target_date || "—"}</td>
                                                                <td>{a.prev_action_status || "—"}</td>
                                                                <td>{a.prev_action_responsibility || "—"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Buttons */}
                               {/* <div className="mt-4 text-end">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary me-2" 
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </button>

                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                    >
                                        {id ? 'Update RCA' : 'Save RCA'}
                                    </button>
                                </div> */}
                            </div>
                        </div>
                        <div className="row mt-3">
                            <div className="col-12 flex-space-between">
                            <Link href="/rca" className="btn btn-secondary">
                                Cancel
                            </Link>

                            <button className="btn btn-primary" type="submit">
                                <AppIcon ic="check" /> {id ? "Update" : "Save"} RCA
                            </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedPage>
    );
}
