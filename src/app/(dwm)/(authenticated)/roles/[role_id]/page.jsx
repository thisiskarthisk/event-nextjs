'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import { useI18n } from "@/components/i18nProvider";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { decodeURLParam, encodeURLParam } from "@/helper/utils";
import { HttpClient } from "@/helper/http";

import Papa from "papaparse";
import AppIcon from "@/components/icon";
import DataTable from "@/components/DataTable";
import Link from "next/link";

export default function RoleSheet() {
  const { toggleProgressBar, toast, modal, setPageTitle, setRHSAppBarMenuItems, closeModal } = useAppLayoutContext();
  const { data: session, status } = useSession();

  const { locale } = useI18n();
  const { role_id } = useParams();
  const router = useRouter();

  useEffect(() => {
    setPageTitle('Role Sheet');
    toggleProgressBar(false);
    setRHSAppBarMenuItems([{ icon: "upload", tooltip: "Upload Role Sheet", className: "text-primary", onClick: handleOpenCsvModal }]);
  }, [locale, role_id]);

  
  /** View Role Sheet */
   const handleView = (id) => {
    router.push(`/roles/${role_id}/rs/${encodeURLParam(id)}/view`);
  };

  /** Edit Role Sheet */
  const handleEdit = (id) => {
    router.push(`/roles/${role_id}/rs/${encodeURLParam(id)}/edit`);
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
            HttpClient({
              url : `/roles/${decodeURLParam(role_id)}/rs/${id}/delete`,
              method : 'DELETE', 
              params: {},
            }).then(res => {
              if (res.success) {
                toast('success', 'Role sheet deleted successfully!');
                closeModal();
              } else {
                toast('error', res.message || "Failed to save role sheet");
              }
            }).catch(err => {
              toast('error', 'Network error. Please try again.');
            }).finally(() => {
              setLoading(false);
            });
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
                HttpClient({
                  url : `/roles/${decodeURLParam(role_id)}/rs/upload`,
                  method : 'POST', 
                  data: JSON.stringify(finalData),
                }).then(res => {
                  if (res.success) {
                    toast("success", "KPI data uploaded successfully!");
                    closeModal();
                    delete window._tempDownloadFn;
                  } else {
                    toast("error", "Failed to upload KPI CSV");
                  }
                }).catch(err => {
                  toast('error', err.message || 'Network error. Please try again.');
                }).finally(() => {
                  setLoading(false);
                });
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
    <>
        <div className="row mb-3">
          <div className="col-12 text-right">
            <Link href={`/roles/${role_id}/rs/add`} className="btn btn-primary ms-auto me-2">
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
                        'role_id': decodeURLParam(role_id),
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
    </>
  );
}
