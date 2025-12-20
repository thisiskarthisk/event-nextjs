'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { HttpClient } from "@/helper/http";
import AppIcon from "@/components/icon";
import SelectPicker from "@/components/form/SelectPicker";

export default function AbnormalitiesReport() {

    const { toggleProgressBar, toast, modal, setPageTitle } = useAppLayoutContext();
    const { data: session, status } = useSession();

    const [kpiList, setKpiList] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [yearsList, setYearsList] = useState([]);

    const [selectedUser, setSelectedUser] = useState("");
    const [selectedKpi, setSelectedKpi] = useState("");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const [tableRows, setTableRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [totals, setTotals] = useState([]);

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    /** -------------------------------------------------------
     *  Load Users + KPI on page open
    ---------------------------------------------------------*/
    useEffect(() => {
        if (status === "authenticated") {
            setPageTitle("Abnormalities / Outliers Report");
            toggleProgressBar(false);
            fetchInitialData();
        }
    }, [status]);

    const fetchInitialData = async () => {
        const users = await HttpClient({ url: "/reports/abnormalities-report/usersList", method: "GET" });
        if (users.success) setUsersList(users.data);

        /* const kpi = await HttpClient({ url: "/reports/abnormalities-report/kpiList", method: "GET" });
        if (kpi.success) setKpiList(kpi.data); */
    };

    /** -------------------------------------------------------
     *  When User changes → Load KPIs
    ---------------------------------------------------------*/
    const onUserChange = async (user_id) => {
        setSelectedUser(user_id);
        setSelectedKpi("");

        const kpi = await HttpClient({
            url: "/reports/abnormalities-report/kpiList",
            method: "GET",
            params: { user_id }
        });

        if (kpi.success)
            setKpiList(kpi.data);
    };

    /** -------------------------------------------------------
     *  When KPI changes → Load years for that KPI
    ---------------------------------------------------------*/
    const onKpiChange = async (user_id, kpi_id) => {
        setSelectedKpi(kpi_id);

        if (!user_id || !kpi_id) return;
    };

    /** -------------------------------------------------------
     *  Filter button → Load table data (normal table)
    ---------------------------------------------------------*/
    const applyFilter = async (e) => {
        e.preventDefault();
        if(selectedUser && selectedYear ){
            const response = await HttpClient({
                url: "/reports/abnormalities-report",
                method: "GET",
                params: {
                    user: selectedUser,
                    kpi: selectedKpi,
                    year: selectedYear
                }
            });
        

            if (!response.success) return;

            const rows = response.data?.row || [];
            let totals = [];
            rows.map(row =>{
                for (const [key, value] of Object.entries(row)) {
                    if(key != "kpi_name"){
                        totals[key] = (totals[key] ?? 0) + Number(value || 0);
                    }
                }
            })
            setTotals(totals);
            // Build table columns: KPI name + months
            setColumns([
                { column: "kpi_name", label: "KPI" },
                ...months.map(m => ({ column: m, label: m }))
            ]);

            setTableRows(rows); // backend must return { kpi_name, Jan, Feb, ... }
        }else{
            toast("warning", "Please select Year and User before applying the filter.");

        }
    };

    /** -------------------------------------------------------
     *  Reset Filters
    ---------------------------------------------------------*/
    const resetFilter = () => {
        setSelectedUser("");
        setSelectedKpi("");
        setSelectedYear(new Date().getFullYear());
        setYearsList([]);
        setTableRows([]);
    };

    /** -------------------------------------------------------
     *  Export CSV exactly as table visible
    ---------------------------------------------------------*/
    const exportCSV = () => {
        let csv = columns.map(col => col.label).join(",") + "\n";

        tableRows.forEach(row => {
            const line = columns.map(col => {
                let val = row[col.column] ?? "";
                val = String(val).replace(/"/g, '""');
                return `"${val}"`;
            }).join(",");

            csv += line + "\n";
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "abnormalities_report.csv";
        link.click();
    };

    return (
        <AuthenticatedPage>
            <div className="app-content">
                <style jsx>{`
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    table th.col-40,
                    table td.col-40 {
                        width: 40%;
                    }
                `}
                </style>

                {/* FILTER SECTION */}
                <div className="card p-3 mb-4 shadow-sm">
                    <form onSubmit={applyFilter}>
                        <div className="row g-3 align-items-end">

                             {/* YEAR DROPDOWN */}
                            <div className="col-md-2 required-field">
                                <label className="form-label fw-bold">Year</label>
                                <input type="number" className="form-control"
                                    value={selectedYear}
                                    onChange={(e) => {
                                        setSelectedYear(e.target.value);
                                        console.log("onchangeYear:", e.target.value);
                                    }}
                                />
                            </div>

                            {/* USER DROPDOWN */}
                            <div className="col-md-3 required-field">
                                {/*<label className="form-label fw-bold">User</label>
                                <select className="form-select"
                                    value={selectedUser}
                                    onChange={(e) => onUserChange(e.target.value)}
                                >
                                    <option value="">-- All Users --</option>
                                    {usersList.map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name}</option>
                                    ))}
                                </select> */}
                                <SelectPicker  
                                    label="User"
                                    options={[
                                        ...usersList
                                    ]}
                                    value={selectedUser} 
                                    onChange={(value) => onUserChange(value)}   // value is already the selected ID
                                    className={`form-control`} 
                                /> 
                            </div>

                            {/* KPI DROPDOWN */}
                            <div className="col-md-3">
                                {/* <label className="form-label fw-bold">KPI</label>
                                <select className="form-select"
                                    value={selectedKpi}
                                    onChange={(e) => onKpiChange(selectedUser, e.target.value)}
                                >
                                    <option value="">-- All KPIs --</option>
                                    {kpiList.map(k => (
                                        <option key={k.kpi_id} value={k.kpi_id}>{k.name}</option>
                                    ))}
                                </select> */}
                                <SelectPicker  
                                    label="KPI"
                                    options={[
                                        { value: 0, label: "-- All KPIs --" },
                                        ...kpiList
                                    ]} 
                                    value={selectedKpi} 
                                    onChange={(value) => onKpiChange(selectedUser,value)}   // value is already the selected ID
                                    className={`form-control`} 
                                /> 
                            </div>

                            {/* BUTTONS */}
                            <div className="col-md-4 d-flex gap-2">
                                <button className="btn btn-primary w-100" type="submit">
                                    <i className="bi bi-funnel"></i> Apply
                                </button>

                                <button className="btn btn-secondary w-100" type="button" onClick={resetFilter}>
                                    <i className="bi bi-filter-circle"></i> Reset
                                </button>

                                <button className="btn btn-success w-100" type="button" onClick={exportCSV}>
                                    <i className="bi bi-download"></i> Export
                                </button>
                            </div>

                        </div>
                    </form>
                </div>
                
                <div className="card p-3 shadow-sm">
                    <table className="table table-bordered table-hover text-center">
                        <thead className="table-dark">
                            <tr>
                                {columns.map(col => (
                                    <th className={col.column !== "kpi_name" ? "text-center" : "text-left col-40"} key={col.column}>{col.label}</th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {tableRows.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length}>
                                        No Data Available
                                    </td>
                                </tr>
                            )}

                            {tableRows.map((row, idx) => (
                                <tr key={idx}>
                                    {columns.map(col => (
                                        <td className={col.column !== "kpi_name" ? "text-center" : "text-left col-40"} key={col.column}>{row[col.column] ?? ""}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        {tableRows.length !== 0 && (
                            <tfoot>
                                <tr >
                                    <th className="text-left col-40">Total</th>
                                    {months.map((col, idx) => (
                                        <th key={`${col}-${idx}`}>
                                            <b>{totals[col] !== 0 ? totals[col] : '-'}</b>
                                        </th>
                                    ))}
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

            </div>
        </AuthenticatedPage>    
    );
}