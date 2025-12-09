'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import DataTable from "@/components/DataTable";
import TextField from "@/components/form/TextField";
import AppIcon from "@/components/icon";
import { HttpClient } from "@/helper/http";
import { encodeURLParam } from "@/helper/utils";
import Link from "next/link";
import { use, useEffect , useState , useRef} from "react";

export default function UsersListPage() {
  const columns = [
    { 'column': 'employee_id', 'label': 'Employee ID' },
    { 'column': 'first_name', 'label': 'First Name' },
    { 'column': 'last_name', 'label': 'Last Name' },
    { 'column': 'email', 'label': 'Email Address' },
    { 'column': 'mobile_no', 'label': 'Mobile No' },
  ];

  const { setPageTitle, toggleProgressBar, confirm, toast ,closeModal ,modal, setAppBarMenuItems } = useAppLayoutContext();
  const tableRef = useRef(null);

  useEffect(() => {
    setPageTitle('Users');
    toggleProgressBar(false);
    setAppBarMenuItems([{ icon: "upload", tooltip: "Upload Users", className: "text-primary", onClick: showUploadDialog }]);
  }, []);
  
  const onDeleteUserClicked = (e, id) => {
    e.preventDefault();
    if (document.activeElement) document.activeElement.blur();
    confirm({
      title: "Delete User",
      message: "Are you sure you want to Delete the User?",
      positiveBtnOnClick: () => {
        toggleProgressBar(true);
        try {
          HttpClient({
            url: '/users/delete',
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


  useEffect(() => {
    setPageTitle('Users');
    toggleProgressBar(false);
  }, []);


function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));
}

function formatUploadErrors(data) {
  if (!data || !data.errors) return "";

  const { missingFields = [], csvDuplicates = [], dbDuplicates = [] } = data.errors;
  let html = "";

  // Helper to group by row
  const groupByRow = (arr, fieldKey = "row") => {
    const result = {};
    arr.forEach(item => {
      const rowNum = item[fieldKey];
      if (!result[rowNum]) result[rowNum] = [];
      result[rowNum].push(item);
    });
    return result;
  };

  // Duplicate within CSV
  const groupedCsvDupes = groupByRow(csvDuplicates);
  if (Object.keys(groupedCsvDupes).length) {
    html += `<h6 style="margin-top:15px;font-weight:600;color:#e74c3c;">Duplicate within CSV:</h6>`;
    Object.entries(groupedCsvDupes).forEach(([row, fields]) => {
      html += `<dt style="margin-top:8px;font-weight:600;">Row: ${row}</dt>`;
      fields.forEach(e => {
        html += `<dd style="margin-left:18px;">${e.field} : '${e.value}' is duplicated in CSV</dd>`;
      });
    });
    html += `<br>`;
  }

  // Missing required fields
  if (missingFields.length) {
    html += `<h6 style="margin-top:15px;font-weight:600;color:#e74c3c;">Missing required fields:</h6>`;
    missingFields.forEach(e => {
      html += `<dt style="margin-top:8px;font-weight:600;">Row: ${e.row}</dt>`;
      html += `<dd style="margin-left:18px;">Missing: ${e.missing.join(" (&) ")}</dd>`;
    });
    html += `<br>`;
  }

  // Already exists in Users Table
  const groupedDbDupes = groupByRow(dbDuplicates);
  if (Object.keys(groupedDbDupes).length) {
    html += `<h6 style="margin-top:15px;font-weight:600;color:#e74c3c;">Already exists:</h6>`;
    Object.entries(groupedDbDupes).forEach(([row, fields]) => {
      html += `<dt style="margin-top:8px;font-weight:600;">Row: ${row}</dt>`;
      fields.forEach(e => {
        html += `<dd style="margin-left:18px;">${e.field} : '${e.value}' already exists</dd>`;
      });
    });
    html += `<br>`;
  }

  return html;
}

/* -------------------- Upload Widget -------------------- */
function UploadUsers({ onChange, errorMessage }) {
  return (
    <div className="row mt-3 text-left">
      <div className="col-12">
        <form>
          <div className="mb-3 flex-column align-items-start">
            <label className="form-label">Users Template</label>
            <a
              href="/templates/users_template.csv"
              className="btn btn-link p-0"
              download
            >
              <AppIcon ic="download" /> Click here to download
            </a>
          </div>
          <div>
            <TextField
              label="Select a CSV File"
              type="file"
              name="file"
              className="form-control mb-3"
              accept=".csv"
              autoFocus
              onChange={onChange}
            />
            {errorMessage && (
              <div
                className="alert alert-danger mt-3"
                role="alert"
                style={{ whiteSpace: "pre-wrap" }}
              >
                <strong className="mt-3">Upload Error:</strong>
                <br />
                <dl dangerouslySetInnerHTML={{ __html: errorMessage }}></dl>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------- page with showUploadDialog -------------------- */
  const showUploadDialog = () => {
    let selectedFile = null;
    let errorMessage = "";

    const openDialog = () => {
      modal({
        title: "Upload User Data",
        body: (
          <UploadUsers
            errorMessage={errorMessage}
            onChange={(files) => {
              try {
                // const file = e.target.files?.[0];
                const file = files?.[0];

                if (!file) {
                  toast("error", "Please select a file.");
                  return;
                }
                if (!file.name.toLowerCase().endsWith(".csv")) {
                  toast("error", "Please select a valid CSV file (.csv)");
                  return;
                }
                selectedFile = file;
              } catch (err) {
                console.error("File selection error:", err);
                toast(
                  "error",
                  "Something went wrong while selecting the file."
                );
              }
            }}
          />
        ),
        okBtn: {
          label: "Upload",
          onClick: async () => {
            try {
              if (!selectedFile) {
                toast("error", "Please select a CSV file first.");
                return;
              }

              const formData = new FormData();
              formData.append("file", selectedFile);

              toggleProgressBar(true);

              // ✅ Use HttpClient instead of fetch
              const res = await HttpClient({
                url: "/users/upload",
                method: "POST",
                data: formData,
                headers: {
                  "Content-Type": "multipart/form-data"
                }
              });

              toggleProgressBar(false);

              const result = res || {};
              const validationWrapper = result?.errors || result?.data || null;

              // ❌ Validation errors (CSV issues)
              if (validationWrapper?.type === "validation_errors") {
                errorMessage = formatUploadErrors(validationWrapper);
                openDialog();
                toast("error", "Validation errors found in CSV. See modal.");
                return;
              }

              // ❌ General upload failure
              if (!result.success) {
                const msg = result?.message || "Upload failed.";
                errorMessage = escapeHtml(msg).replace(/\n/g, "<br>");
                openDialog();
                toast("error", msg);
                return;
              }

              // ✅ Success
              toast("success", result.message || "Upload successful.");
              closeModal();
              tableRef.current?.refreshTable();

            } catch (err) {
              toggleProgressBar(false);

              console.error("Upload exception:", err);

              let msg =
                err?.response?.message ||
                err?.response?.data?.message ||
                "Server error while uploading file.";

              toast("error", msg);
            }
          }
        },
        cancelBtn: { label: "Close" },
      });
    };

    openDialog();
  };

  const DownloadUserDataCSV = () => {
    window.location.href = "/api/v1/users/export";
  };

  return (
    <AuthenticatedPage>
      <div className="row mb-3">
        <div className="col-12 text-right">
          <Link href="#" onClick={DownloadUserDataCSV} className="btn btn-success">
            <AppIcon ic="download" />&nbsp;Export
          </Link>
          &nbsp;&nbsp;
          <Link href="/admin/users/add" className="btn btn-primary">
            <AppIcon ic="plus" />&nbsp;Add User
          </Link>
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <DataTable
                  ref={tableRef}
                  apiPath="/users/list"
                  dataKeyFromResponse="users"
                  columns={columns}
                  paginationType="client"
                  actionColumnFn={(rowData) => {
                    return (
                      <>
                        <Link href={"/admin/users/edit/" + encodeURLParam(rowData.id)} className="text-primary">
                          <AppIcon ic="pencil" />
                        </Link>
                        &nbsp;|&nbsp;
                        <a href="#" className="text-danger" onClick={(e) => onDeleteUserClicked(e, rowData.id)}>
                          <AppIcon ic="delete" />
                        </a>
                      </>
                    );
                  }} />

            </div>
          </div>
        </div>
      </div>
    </AuthenticatedPage>
  );
}
