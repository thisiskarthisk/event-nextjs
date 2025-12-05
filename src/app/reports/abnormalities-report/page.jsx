'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { useEffect, useState } from "react";
import AppIcon from "../../../components/icon";
import DataTable from "@/components/DataTable";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRef } from "react";
import { HttpClient } from "@/helper/http";
import Link from "next/link";
import { encodeURLParam } from "@/helper/utils";

export default function AbnormalitiesReport(){
    const { toggleProgressBar, toast, modal, setPageTitle } = useAppLayoutContext();
    const { data: session, status } = useSession();
    const tableRef = useRef(null);
    const [selectedKpi, setSelectedKpi] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [kpiList, setKpiList] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    
    const [filterData, setFilterData] = useState({
        kpi: "",
        startDate: "",
        endDate: "",
        userId: ""
    });

    const fetchData = async () => {
        
        try {
            if (status === "authenticated" || session?.user?.id) {
                const kpi = await HttpClient({ 
                    url : `/reports/abnormalities-report/kpiList`,
                    method:"GET"
                });
            
                if (kpi.success && Array.isArray(kpi?.data)) {
                    setKpiList(kpi.data);
                }

                const users = await HttpClient({
                    url : `/reports/abnormalities-report/usersList`,
                    method : "GET",
                    params : {}
                });

                if (users.success && Array.isArray(users?.data)) {
                    setUsersList(users.data);
                }

            }
        } catch (err) {
          console.error("Error loading KPI List:", err);
        }
    };

    const onUserChange = async (user_id) => {
        const kpi = await HttpClient({ 
            url : `/reports/abnormalities-report/kpiList`,
            method:"GET",
            params:{user_id:user_id}
        });
    
        if (kpi.success && Array.isArray(kpi?.data)) {
            setSelectedKpi('');
            setKpiList(kpi.data);
        }

    }
    useEffect(() => {
        if (status == 'authenticated') {
            setPageTitle('Abnormalities/Outliers Report');
            toggleProgressBar(false);
            fetchData();
        }
    }, [status]);
    const columns = [
        { 'column': 'period_date', 'label': 'Date' },
        { 'column': 'label', 'label': 'Label' },
        { 'column': 'value', 'label': 'Value' },
        { 'column': 'limit', 'label': 'Limit Exceeded' },
        { 'column': 'type', 'label': 'Type' },
    ];

    const onFilterChange = (name, value) => {
        switch(name){
            case "kpi":
                setSelectedKpi(value);
                break;
            case "startDate":
                setStartDate(value);
                break;
            case "endDate":
                setEndDate(value);
                break;
            case "user":
                setSelectedUser(value);
                onUserChange(value);
                break;
            default:
                console.log("Unknown Params");
        }
        setFilterData(prev => ({
            ...prev,
            [name]: value
        }));
        
    };
    useEffect(() => {
        tableRef.current?.refreshTable();
    }, [filterData]);

    const handleFilter = (e) => {
        e.preventDefault();
    };

    const resetFilter = () => {
        setSelectedKpi("");
        setStartDate("");
        setEndDate("");
        setSelectedUser("");
        setFilterData({
            kpi: "",
            startDate: "",
            endDate: "",
            userId: ""
        });
    }
    const exportFilter = async () => {
        const report = await HttpClient({ 
            url : `/reports/abnormalities-report`,
            method:"GET",
            params:{
                ...filterData,
                export:true
            }
        });

        if (report.data?.row){
            const rows = report.data.row;
            let csv = "";
            csv += Object.keys(rows[0]).join(",") + "\n";   // headers

            rows.forEach(row => {
                csv += Object.values(row)
                    .map(v => `"${String(v).replace(/"/g, '""')}"`)
                    .join(",") + "\n";
            });

            // Create file
            const blob = new Blob([csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);

            // Create hidden link and click it
            const link = document.createElement("a");
            link.href = url;
            link.download = "abnormalities_report.csv";
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.remove();
            window.URL.revokeObjectURL(url);
        }
    }
    return(
        <AuthenticatedPage>
            <div className="app-content">
                <div className="card p-3 mb-4 shadow-sm">
                    <form onSubmit={handleFilter}>
                        <div className="row g-3 align-items-end">

                            {/* Users Dropdown */}
                            <div className="col-md-3 col-lg-2">
                                <label className="form-label fw-bold" htmlFor="kpiSelect">User</label>
                                <select
                                    className="form-select"
                                    id="userSelect"
                                    value={selectedUser}
                                    onChange={(e) => onFilterChange("user", e.target.value)}
                                >
                                    <option value="">-- All Users --</option>
                                    {/* Dynamically populated Users list */}
                                    {usersList.map(user => (
                                        <option key={user.full_name} value={user.id}>{user.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* KPI Dropdown */}
                            <div className="col-md-3 col-lg-2">
                                <label className="form-label fw-bold" htmlFor="kpiSelect">KPI</label>
                                <select
                                    className="form-select"
                                    id="kpiSelect"
                                    value={selectedKpi}
                                    onChange={(e) => onFilterChange("kpi", e.target.value)}
                                >
                                    <option value="">-- All KPIs --</option>
                                    {/* Dynamically populated KPI list */}
                                    {kpiList.map(kpi => (
                                        <option key={kpi.name} value={kpi.kpi_id}>{kpi.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Start Date */}
                            <div className="col-md-3 col-lg-2">
                                <label className="form-label fw-bold" htmlFor="startDate">Start Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    id="startDate"
                                    value={startDate}
                                    onChange={(e) => onFilterChange("startDate", e.target.value)}
                                />
                            </div>

                            {/* End Date */}
                            <div className="col-md-3 col-lg-2">
                                <label className="form-label fw-bold" htmlFor="endDate">End Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    id="endDate"
                                    value={endDate}
                                    onChange={(e) => onFilterChange("endDate", e.target.value)}
                                />
                            </div>

                            {/* Apply Filters Button */}
                            <div className="col-md-3 col-lg-3 d-grid">
                                <div className="row">
                                    <div className="col-12">
                                        <button type="submit" className="btn btn-secondary" onClick={resetFilter}>
                                            <AppIcon className="nav-icon bi bi-journal-bookmark-fill mdi mdi-filter-off-outline"></AppIcon>
                                            <i className="bi bi-filter me-2"></i> Reset Filters
                                        </button>&nbsp;
                                        <button type="button" className="btn btn-success" onClick={exportFilter}>
                                            <AppIcon className="nav-icon bi bi-journal-bookmark-fill mdi mdi-cloud-download-outline"></AppIcon>
                                            <i className="bi bi-filter me-2"></i> Export
                                        </button>
                                    </div>
                                </div>
                            </div> 
                        </div>
                    </form>
                </div>
                <div className="card p-3 mb-4 shadow-sm">
                    <DataTable
                        ref={tableRef}
                        apiPath = "/reports/abnormalities-report"
                        dataKeyFromResponse="row"
                        columns = {columns}
                        additionalRequestParams = {{...filterData}}
                        actionColumnFn={(rowData) => {
                        return (
                            <>
                                <Link href={"/edit/" + encodeURLParam(rowData.kpi_id)} className="text-primary">
                                <AppIcon ic="eye" />
                                </Link>
                                
                            </>
                            );
                        }}
                    />
                </div>
            </div>
        </AuthenticatedPage>
        
    );
}