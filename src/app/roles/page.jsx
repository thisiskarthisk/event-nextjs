'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import AppIcon from "@/components/icon";
import DataTable from "@/components/DataTable";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

import { useSession } from "next-auth/react";
import { HttpClient } from "@/helper/http";
import { decodeURLParam, encodeURLParam } from "@/helper/utils";
import Link from "next/link";

export default function RolesPage() {
  const { toggleProgressBar, toast, modal, setPageTitle , confirm , setRHSAppBarMenuItems ,  } = useAppLayoutContext();
  const { data: session, status } = useSession();
  const { locale } = useI18n();
  const { role_id } = useParams();
  const router = useRouter();

  const [roleId, setRoleId] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (status == 'authenticated') {
      setPageTitle('Role Sheet');
      toggleProgressBar(false);
      setRHSAppBarMenuItems([{ icon: "upload", tooltip: "Upload Role Sheet", className: "text-primary", onClick: handleOpenCsvModal }]);

      // fetch(`/api/v1/roles?user_id=${session.user.id}`).then((res) => res.json()).then((data) => {
      //   if (data.success && data.data.roles) {
      //     console.log('roles: ', data.data.roles);
      //   }
      // }).catch(console.error);
      fetchData();
    }
  }, [status]);
  
  const fetchData = async () => {
    // console.log('fetchData()');
    try {
      if (status === "authenticated" || session?.user?.id) {
        const data = await HttpClient({ url : `/roles`, params: { user_id: session.user.id}});
        
        if (data.success && Array.isArray(data.data?.role_user)) {
          const role = data.data.role_user[0];
          if (role?.id) {
            setRoleId(role.id);
          }
        } 
      }
    } catch (err) {
      console.error("Error loading role sheet:", err);
    }
  };


  /** Add New Role Sheet */
  const handleAddNewRole = () => {
    router.push(`/roles/${decodeURLParam(roleId)}/rs/add`);
  };

  /** View Role Sheet */
   const handleView = (id) => {
    router.push(`/roles/${decodeURLParam(roleId)}/rs/${decodeURLParam(id)}/view`);
  };

  /** Edit Role Sheet */
  const handleEdit = (id) => {
    router.push(`/roles/${decodeURLParam(roleId)}/rs/${decodeURLParam(id)}/edit`);
  };



  /** Delete Role Sheet */
  const handleDelete = async (id) => {
    modal({
      title: "Are you sure?",
      body: "<p>This action will permanently delete the role sheet and its KPIs.</p>",
      okBtn: {
        label: "Yes, Delete",
        onClick: async () => {
          try {

            const res = await HttpClient({url :`/roles/${roleId}/rs/${id}/delete`, method: 'DELETE', params : {}});

            const data = await res.json();
            if (!data.success) throw new Error(data.message || "Failed to delete");
  
            toast('success', 'Role sheet deleted successfully!');
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

  /** ===================== CSV Upload Logic ===================== */
  const handleDownloadTemplate = () => {
    const csvContent =
      "objective,role,kpi,measure,operation_definition,frequency_of_measurement,vcs\n" +
      "Sales Growth,Sales Manager,Increase quarterly sales,Percentage growth,Q2-Q4,Monthly,pie\n" +
      ",,Increase leads generated,Count per region,Quarterly,pie\n" +
      "Customer Service,Support Lead,Reduce response time,Average time (hrs),Monthly,bar\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "kpi_template.csv";
    link.click();
  };

  const handleOpenCsvModal = () => {
    /** Store reference to download function */
    const downloadFn = () => {
      handleDownloadTemplate();
    };
    
    /** Make it globally accessible */
    window._tempDownloadFn = downloadFn;
  
    modal({
      title: "Upload KPI Role Sheet (CSV)",
      body: `
        <button 
          type="button"
          onclick="window._tempDownloadFn && window._tempDownloadFn(); return false;"
          class="btn btn-outline-secondary mt-2 w-100"
        >
          Download Sample Template
        </button>


        <div class="mb-3 mt-3">
          <label class="form-label">Select CSV File</label>
          <input type="file" id="csvFileInput" accept=".csv" class="form-control" />
        </div>
      `,
      okBtn: {
        label: "Upload",
        onClick: async () => {
          const fileInput = document.getElementById("csvFileInput");
          if (!fileInput || !fileInput.files.length) {
            toast("error", "Select a CSV file first");
            return false;
          }
  
          const file = fileInput.files[0];
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
              const rawData = results.data;
              let groupedData = {};
              let currentObjective = "";
              let currentRole = "";
  
              const processed = rawData
                .map((row) => {
                  const obj = (row.objective || "").trim();
                  if (obj) currentObjective = obj;
                  else row.objective = currentObjective;
  
                  const r = (row.role || "").trim();
                  if (r) currentRole = r;
                  else row.role = currentRole;
  
                  return row;
                })
                .filter(
                  (row) =>
                    row.objective &&
                    row.role &&
                    row.kpi &&
                    row.measure &&
                    row.operation_definition
                );
  
              processed.forEach((row) => {
                const {
                  objective,
                  role,
                  kpi,
                  measure,
                  operation_definition,
                  frequency_of_measurement,
                  vcs,
                } = row;
  
                if (!groupedData[objective])
                  groupedData[objective] = { objective, roles: {} };
  
                if (!groupedData[objective].roles[role])
                  groupedData[objective].roles[role] = { role, kpis: [] };
  
                groupedData[objective].roles[role].kpis.push({
                  kpi,
                  measure,
                  operation_definition,
                  frequency_of_measurement,
                  vcs,
                });
              });
  
              const finalData = Object.values(groupedData).map((o) => ({
                objective: o.objective,
                roles: Object.values(o.roles),
              }));
  
              try {
                const res = await fetch(`/api/v1/roles/${encodeURLParam(roleId)}/rs/upload`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ data: finalData }),
                });
  
                const data = await res.json();
                if (!data.success) throw new Error(data.message || "Upload failed");
  
                toast("success", "KPI data uploaded successfully!");
                
                // Cleanup
                delete window._tempDownloadFn;
              } catch (err) {
                console.error("Upload error:", err);
                toast("error", "Failed to upload KPI CSV");
              }
            },
          });
        },
      },
      cancelBtn: { 
        label: "Cancel",
        onClick: () => {
          // Cleanup on cancel
          delete window._tempDownloadFn;
        }
      },
    });
  };

  const renderActions = (rowData) => (
    <>
      <button className="btn btn-md me-2" onClick={() => handleView(rowData.id)}>
        <AppIcon ic="eye" className="text-info" />
      </button>
      <button className="btn btn-md me-2" onClick={() => handleEdit(rowData.id)}>
        <AppIcon ic="pencil" className="text-primary" />
      </button>
      <button className="btn btn-md" onClick={() => handleDelete(rowData.id)}>
        <AppIcon ic="delete" className="text-danger" />
      </button>
    </>
  );
  
  
  return (
    <AuthenticatedPage>
        <div className="row mb-3">
            <div className="col-12 text-right">
                <Link href={`/roles/${decodeURLParam(role_id)}/rs/add`} className="btn btn-primary ms-auto me-2">
                    <AppIcon ic="plus" className="text-info" /> Add New Role
                </Link>
            </div>
        </div>
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-body">
                        {
                        status == 'authenticated' &&
                            <DataTable
                            apiPath={`/roles`}
                            additionalRequestParams={{
                                'user_id': session.user.id,
                            }}
                            dataKeyFromResponse="roles"
                            columns={[
                                { column: "name", label: "Objective" },
                            ]}
                            paginationType="client"
                            actionColumnFn={renderActions}
                            />
                        }
                    </div>
                </div>
            </div>
        </div>
    </AuthenticatedPage>
  );
}