'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import AppIcon from "@/components/icon";
import DataTable from "@/components/DataTable";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

import { decodeURLParam, encodeURLParam } from "@/helper/utils";

export default function RoleSheet() {
  const { toggleProgressBar, toast, modal, setPageTitle } = useAppLayoutContext();
  
  const { locale } = useI18n();
  const { role_id } = useParams();
  const router = useRouter();

  useEffect(() => {
    setPageTitle('Role Sheet');
    toggleProgressBar(false);
  }, [locale, role_id]);


  /** Add New Role Sheet */
  const handleAddNewRole = () => {
    router.push(`/roles/${role_id}/rs/add`);
  };

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
            const res = await fetch(`/api/v1/roles/${decodeURLParam(role_id)}/rs/${decodeURLParam(id)}/delete`, {
              method: "DELETE",
            });
  
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
                const res = await fetch(`/api/v1/roles/${decodeURLParam(role_id)}/rs/upload`, {
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
      <div className="app-content">
        <div className="container-fluid">
          <div className="card mt-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Role Sheet</h5>
              <button className="btn btn-primary ms-auto me-2" onClick={handleAddNewRole}>
                <AppIcon ic="plus" className="text-info"/> Add New Role
              </button>
              <button className="btn btn-outline-success " onClick={handleOpenCsvModal}>
                <AppIcon ic="upload" className="text-success" /> Upload Role File (CSV)
              </button>
            </div>
            <div className="card-body">
              <DataTable
                apiPath={`/roles/${decodeURLParam(role_id)}`}
                dataKeyFromResponse="roles"
                columns={[
                  { column: "name", label: "Objective" },
                ]}
                paginationType="client"
                actionColumnFn={renderActions}
              />

            </div>
          </div>
        </div>
      </div>
    </AuthenticatedPage>
  );
}
