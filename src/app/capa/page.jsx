'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { useEffect, useState } from "react";
import AppIcon from "../../components/icon";

export default function Capa() {
    const { setPageTitle, setPageType, toggleProgressBar } = useAppLayoutContext();
    const { t, locale } = useI18n();
    const [data, setData] = useState([]);

    const fetchCAPAList = () => {
        fetch("/api/v1/capa/list")
            .then((res) => res.json())
            .then((json) => {
                if (json.success) {
                    setData(json.data.gap_analysis);
                } else {
                    console.error("Error fetching data:", json.message);
                }
            })
            .catch((err) => console.error("API Error:", err));
    }

    useEffect(() => {
        setPageType('dashboard');

        setPageTitle(t('CAPA'));

        toggleProgressBar(false);

        fetchCAPAList();
    }, [locale]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure want to delete this record?")) return;

        try {
            const response = await fetch(`/api/v1/capa/delete/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: {},
            });

            const result = await response.json();
            console.log(result);

            if (result.success) {
                alert(result.message || "Deleted successfully!");
                fetchCAPAList();
            } else {
                alert(result.message || "Failed to delete CAPA");
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
                    <a className="btn btn-primary" href="/capa/new">
                        Add New CAPA
                    </a>
                </div>

                <table className="mt-3">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 border text-center">CAPA No</th>
                            <th className="px-4 py-2 border text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.length > 0 ? (
                            data.map((row) => (
                                <tr key={row.ga_id} className="text-center hover:bg-gray-50">
                                    <td className="px-4 py-2 border">{row.capa_no}</td>
                                    <td className="px-4 py-2 border">
                                        <a className="btn btn-sm btn-outline-info" href={`/capa/view/${row.ga_id}`}>
                                            <AppIcon ic="eye-outline" className="nav-icon" />
                                        </a> &nbsp;
                                        <a className="btn btn-sm btn-outline-primary" href={`/capa/edit/${row.ga_id}`}>
                                            <AppIcon ic="square-edit-outline" className="nav-icon" />
                                        </a> &nbsp;
                                        <a className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(row.ga_id)}>
                                            <AppIcon ic="trash-can-outline" className="nav-icon" />
                                        </a>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="2" className="px-4 py-2 text-center text-gray-500">
                                    No data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

            </div>
        </AuthenticatedPage>
    );
}
