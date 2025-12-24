'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import { useI18n } from "@/components/i18nProvider";
import { useEffect, useRef } from "react";
import AppIcon from "../../../../components/icon";
import DataTable from "@/components/DataTable";
import { useRouter } from "next/navigation";
import { HttpClient } from "@/helper/http";
import { decodeURLParam, encodeURLParam } from "@/helper/utils";

export default function Capa() {

    const { setPageTitle, toast, toggleProgressBar, confirm ,closeModal} = useAppLayoutContext();
    const { t, locale } = useI18n();
    const router = useRouter();
    const tableRef = useRef(null);

    const columns = [
        { column: 'capa_no', label: 'CAPA No' },
    ];

    const handleAddNewCAPA = () => router.push(`/capa/new`);

    const handleView = (id) => router.push(`/capa/view/${encodeURLParam(id)}`);

    const handleEdit = (id) => router.push(`/capa/edit/${encodeURLParam(id)}`);

    const handleDelete = (id) => {
        console.log("handleDelete called with ID: " + id);
        if (document.activeElement) document.activeElement.blur();

        confirm({
            title: "Delete CAPA",
            message: "Are you sure you want to Delete the CAPA?",
            positiveBtnOnClick: () => {
                toggleProgressBar(true);
                try {
                    HttpClient({
                        url: `/capa/delete/${id}`,
                        method: "POST",
                        data: { id: id },
                    }).then(res => {
                        toast('success', res.message || 'The User record has been deleted successfully.');
                        toggleProgressBar(false);
                        closeModal();
                        tableRef.current?.refreshTable();
                    }).catch(err => {
                        closeModal();
                        toggleProgressBar(false);
                        let message = 'Error occurred when trying to delete the User.';
                        if (err.response && err.response.data && err.response.data.message) {
                        message = err.response.data.message;
                        }
                        toast('error', message);
                    });
                } catch (error) {
                    toast('error', 'Error occurred when trying to save the User data.');
                }
            },
        });
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

    
    if (sessionStorage.getItem("msg_success")) {
        let msg = sessionStorage.getItem("msg_success");
        toast("success", msg);
        sessionStorage.removeItem("msg_success");
    }


    useEffect(() => {
        setPageTitle(t('CAPA'));
        toggleProgressBar(false);
    }, [locale]);


    return (
        <>
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <button className="btn btn-primary ms-auto me-2" onClick={handleAddNewCAPA}>
                            <AppIcon ic="plus" className="text-info" /> Add New CAPA
                        </button>
                    </div>
                </div>
            </div>
            <div className="row mt-3">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <DataTable
                                apiPath="/capa/list"
                                ref = { tableRef }
                                dataKeyFromResponse="gap_analysis"
                                columns={columns}
                                actionColumnFn={renderActions}
                                paginationType="client"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
