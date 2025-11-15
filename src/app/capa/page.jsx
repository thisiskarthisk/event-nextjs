'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { useEffect, useState } from "react";
import AppIcon from "../../components/icon";
import DataTable from "@/components/DataTable";
import { useRouter } from "next/navigation";

export default function Capa() {
    const { setPageTitle, modal, toast, closeModal, toggleProgressBar } = useAppLayoutContext();
    const { t, locale } = useI18n();
    const router = useRouter();
    const [data, setData] = useState([]);

    const columns = [
        { 'column': 'capa_no', 'label': 'CAPA No' },
    ];

    /** Add New CAPA */
    const handleAddNewCAPA = () => {
        router.push(`/capa/new`);
    };

    /** View CAPA */
    const handleView = (id) => {
        router.push(`/capa/view/${id}`);
    };

    /** Edit CAPA */
    const handleEdit = (id) => {
        router.push(`/capa/edit/${id}`);
    };

    const renderActions = (rowData) => (
        <>
            <button className="btn btn-md me-2" onClick={() => handleView(rowData.ga_id)}>
                <AppIcon ic="eye" className="text-info" />
            </button>
            <button className="btn btn-md me-2" onClick={() => handleEdit(rowData.ga_id)}>
                <AppIcon ic="pencil" className="text-primary" />
            </button>
            <button className="btn btn-md" onClick={() => handleDelete(rowData.ga_id)}>
                <AppIcon ic="delete" className="text-danger" />
            </button>
        </>
    );

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
        setPageTitle(t('CAPA'));

        toggleProgressBar(false);

        fetchCAPAList();
    }, [locale]);

    /** Delete CAPA */
    const handleDelete = async (id) => {
        modal({
            title: "Are you sure?",
            body: "<p>This action will permanently delete the CAPA.</p>",
            okBtn: {
                label: "Yes, Delete",
                onClick: async () => {
                    try {
                        const res = await fetch(`/api/v1/capa/delete/${id}`, {
                            method: "DELETE",
                        });

                        const data = await res.json();
                        if (!data.success) throw new Error(data.message || "Failed to delete");

                        // Update UI after successful delete
                        setData((prev) =>
                            prev.filter((obj) => obj.id !== id)
                        );

                        closeModal();
                        toast('success', data.message || 'CAPA deleted successfully!');
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
                                <h5 className="mb-0">CAPA</h5>
                                <button className="btn btn-primary ms-auto me-2" onClick={handleAddNewCAPA}>
                                    <AppIcon ic="plus" className="text-info" /> Add New CAPA
                                </button>
                            </div>
                            <DataTable
                                apiPath="/capa/list"
                                dataKeyFromResponse="gap_analysis"
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
