'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { useEffect, useState } from "react";
import AppIcon from "../../../components/icon";
import DataTable from "@/components/DataTable";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { HttpClient } from "@/helper/http";

export default function AbnormalitiesReport(){
    const { toggleProgressBar, toast, modal, setPageTitle } = useAppLayoutContext();
    const { data: session, status } = useSession();
    const { locale } = useI18n();
    const router = useRouter();
    const [selectedKpi, setSelectedKpi] = useState("");
    const [kpiList, setKpiList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filterData, setFilterData] = useState({
        kpi:"",
        startDate:"",
        endDate:""
    })

    

    const fetchData = async () => {
        try {
          if (status === "authenticated" || session?.user?.id) {
            const data = await HttpClient({ url : `/reports/abnormalities-report`, params: { user_id: session.user.id}});
            
            if (data.success && Array.isArray(data.data?.kpiList)) {
                setKpiList(data.data.kpiList);
            } 
          }
        } catch (err) {
          console.error("Error loading KPI List:", err);
        }
    };
    useEffect(() => {
        if (status == 'authenticated') {
            setPageTitle('Abnormalities/Outliers Report');
            toggleProgressBar(false);
            fetchData();
        }
    }, [status]);
    const columns = [
        { 'column': 'label', 'label': 'Date' },
        { 'column': 'value', 'label': 'Value' },
        { 'column': 'limit', 'label': 'Limit Exceeded' },
        { 'column': 'type', 'label': 'Type' },
    ];

    const applyFilter = async ()=>{
        setFilterData({
            kpi:selectedKpi,
            startDate:startDate,
            endDate:endDate
        });

        console.log(filterData);
        DataTable.refreshTable;
    }

    const handleFilter = (e) => {
        e.preventDefault();
    };
    return(
        <AuthenticatedPage>
            <div className="app-content">
                <div className="card p-3 mb-4 shadow-sm">
                    <form onSubmit={handleFilter}>
                        <div className="row g-3 align-items-end">
                            
                            {/* KPI Dropdown */}
                            <div className="col-md-4 col-lg-3">
                                <label className="form-label fw-bold" htmlFor="kpiSelect">KPI</label>
                                <select
                                    className="form-select"
                                    id="kpiSelect"
                                    value={selectedKpi}
                                    onChange={(e) => setSelectedKpi(e.target.value)}
                                >
                                    <option value="">-- All KPIs --</option>
                                    {/* Dynamically populated KPI list */}
                                    {kpiList.map(kpi => (
                                        <option key={kpi.name} value={kpi.id}>{kpi.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Start Date */}
                            <div className="col-md-4 col-lg-3">
                                <label className="form-label fw-bold" htmlFor="startDate">Start Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    id="startDate"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>

                            {/* End Date */}
                            <div className="col-md-4 col-lg-3">
                                <label className="form-label fw-bold" htmlFor="endDate">End Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    id="endDate"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>

                            {/* Apply Filters Button */}
                            <div className="col-12 col-lg-3 d-grid">
                                <button type="submit" className="btn btn-primary" onClick={applyFilter}>
                                    <i className="bi bi-filter me-2"></i> Apply Filters
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="card p-3 mb-4 shadow-sm">
                    <DataTable
                        apiPath = "/reports/abnormalities-report"
                        dataKeyFromResponse="data"
                        columns = {columns}
                        additionalRequestParams = {filterData}
                        paginationType="server"
                    />
                </div>
            </div>
        </AuthenticatedPage>
        
    );
}