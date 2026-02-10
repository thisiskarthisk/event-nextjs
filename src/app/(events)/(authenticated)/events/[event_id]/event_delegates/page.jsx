// 'use client';

// import { useParams } from "next/navigation";
// import { useEffect, useRef } from "react";
// import Link from "next/link";

// import { useAppLayoutContext } from "@/components/appLayout";
// import DataTable from "@/components/DataTable";
// import AppIcon from "@/components/icon";
// import { HttpClient } from "@/helper/http";

// export default function EventDelegatesPage() {

//   const { event_id } = useParams();

//   const { setPageTitle, toggleProgressBar, confirm, toast, closeModal ,modal } =
//     useAppLayoutContext();

//   const tableRef = useRef(null);

//   useEffect(() => {
//     setPageTitle("Event Delegates");
//     toggleProgressBar(false);
//   }, []);

//   const columns = [
//     { column: "regn_no", label: "Regn No" },
//     { column: "name", label: "Name" },
//     { column: "callname", label: "Call Name" },
//     { column: "phone_number", label: "Phone Number" },
//     { column: "email", label: "Email" },
//     { column: "club_name", label: "Club Name" },
//   ];

//   const onDeleteDelegateClicked = (e, id) => {
//     e.preventDefault();
//     if (document.activeElement) document.activeElement.blur();
//     confirm({
//       title: "Delete Delegate",
//       message: "Are you sure you want to Delete the Delegate?",
//       positiveBtnOnClick: () => {
//         toggleProgressBar(true);
//         HttpClient({
//           url: `/events/${event_id}/event_delegates/delete`,
//           method: "POST",
//           data: { id },
//         }).then(res => {
//           toast('success', res.message || 'The Delegate record has been deleted successfully.');
//           toggleProgressBar(false);
//           closeModal();
//           tableRef.current?.refreshTable();
//         }).catch(err => {
//           closeModal();
//           toggleProgressBar(false);
//           let message = 'Error occurred when trying to delete the Delegate.';
//           if (err.response?.data?.message) message = err.response.data.message;
//           toast('error', message);
//         });
//       },
//     });
//   };

//   return (
//     <>
//       <div className="row mb-3">
//         <div className="col-12 text-right">
//           {/* import */}
//           <Link href={`/events/${event_id}/event_delegates/import`} className="btn btn-secondary mr-2">
//             <AppIcon ic="file-upload" />&nbsp;Upload Delegates
//           </Link>
//           &nbsp;&nbsp;

//           {/* add new */}
//           <Link href={`/events/${event_id}/event_delegates/add`} className="btn btn-primary">
//             <AppIcon ic="plus" />&nbsp;Add Delegate
//           </Link>
//         </div>
//       </div>
//       <div className="row">
//         <div className="col-12">
//           <div className="card">
//             <div className="card-body">
//               <DataTable
//                 ref={tableRef}
//                 apiPath={`/events/${event_id}/event_delegates/list`}
//                 dataKeyFromResponse="event_delegates"
//                 columns={columns}
//                 paginationType="client"
//                 actionColumnFn={(rowData) => (
//                   <>
//                     <Link href={`/events/${event_id}/event_delegates/edit/${rowData.delegate_id}`} className="text-primary">
//                       <AppIcon ic="pencil" />
//                     </Link>
//                     &nbsp;|&nbsp;
//                     <a href="#" className="text-danger" onClick={(e) => onDeleteDelegateClicked(e, rowData.delegate_id)}>
//                       <AppIcon ic="delete" />
//                     </a>
//                   </>
//                 )}
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }




'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import DataTable from "@/components/DataTable";
import AppIcon from "@/components/icon";
import { HttpClient } from "@/helper/http";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";

/* ---------------------------------------------
   CSV UPLOAD UI HELPERS
--------------------------------------------- */
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));
}

// --------------------------------------------------
// format upload errors into grouped HTML for display
// --------------------------------------------------
function formatUploadErrors(data) {
  if (!data || !data.errors) return "";

  const { missingFields = [], csvDuplicates = [], dbDuplicates = [] } = data.errors;

  let html = "";

  const groupByRow = (arr) => {
    const map = {};
    arr.forEach(e => {
      map[e.row] ??= [];
      map[e.row].push(e);
    });
    return map;
  };

  const groupedMissing = groupByRow(missingFields);
  const groupedCsv = groupByRow(csvDuplicates);
  const groupedDb = groupByRow(dbDuplicates);

  if (Object.keys(groupedMissing).length) {
    html += `<h6>Missing required fields:</h6>`;
    Object.entries(groupedMissing).forEach(([row, items]) => {
      html += `<dt>Row ${row}</dt>`;
      items.forEach(i =>
        html += `<dd>${i.missing.join(", ")}</dd>`
      );
    });
  }

  if (Object.keys(groupedCsv).length) {
    html += `<h6>Duplicate in CSV:</h6>`;
    Object.entries(groupedCsv).forEach(([row, items]) => {
      html += `<dt>Row ${row}</dt>`;
      items.forEach(i =>
        html += `<dd>${i.field} : ${i.value}</dd>`
      );
    });
  }

  if (Object.keys(groupedDb).length) {
    html += `<h6>Already in database:</h6>`;
    Object.entries(groupedDb).forEach(([row, items]) => {
      html += `<dt>Row ${row}</dt>`;
      items.forEach(i =>
        html += `<dd>${i.field} : ${i.value}</dd>`
      );
    });
  }

  return html;
}

/* ---------------------------------------------
   Upload Modal Component
--------------------------------------------- */

function UploadDelegates({ onChange, errorMessage }) {
  return (
    <div className="row mt-3 text-left">
      <div className="col-12">

        <div className="mb-2">
          <label className="form-label">Template</label>
          <a
              href="/templates/event_delegates_template.csv"
              className="btn btn-link p-0"
              download
            >
              <AppIcon ic="download" /> Click here to download
            </a>
        </div>

        <input
          type="file"
          accept=".csv"
          className="form-control"
          onChange={e => onChange(e.target.files)}
        />

        {errorMessage && (
          <div
            className="alert alert-danger mt-3"
            style={{ whiteSpace: "pre-wrap" }}
          >
            <strong>Upload Errors:</strong>
            <dl dangerouslySetInnerHTML={{ __html: errorMessage }} />
          </div>
        )}

      </div>
    </div>
  );
}

/* ---------------------------------------------
   MAIN PAGE
--------------------------------------------- */

export default function EventDelegatesPage() {

  const { event_id } = useParams();

  const tableRef = useRef(null);

  const {
    setPageTitle,
    toggleProgressBar,
    toast,
    confirm,
    closeModal,
    modal,
    setRHSAppBarMenuItems,
  } = useAppLayoutContext();

  /* --------------------------------- */

  useEffect(() => {

    setPageTitle("Event Delegates");

    toggleProgressBar(false);

    setRHSAppBarMenuItems([
      {
        icon: "upload",
        tooltip: "Upload Delegates",
        className: "text-primary",
        onClick: showUploadDialog,
      },
    ]);

    return () => setRHSAppBarMenuItems([]);

  }, []);

  /* --------------------------------- */

  const showUploadDialog = () => {

    let selectedFile = null;
    let errorMessage = "";

    const openDialog = () => {
      modal({
        title: "Upload Delegates CSV",
        body: (
          <UploadDelegates
            errorMessage={errorMessage}
            onChange={files => {
              const file = files?.[0];

              if (!file) return;

              if (!file.name.endsWith(".csv")) {
                toast("error", "Please select CSV file");
                return;
              }

              selectedFile = file;
            }}
          />
        ),

        okBtn: {
          label: "Upload",
          onClick: async () => {

            if (!selectedFile) {
              toast("error", "Select CSV first");
              return;
            }

            const fd = new FormData();
            fd.append("file", selectedFile);

            try {

              toggleProgressBar(true);

              const res = await HttpClient({
                url: `/events/${event_id}/event_delegates/upload`,
                method: "POST",
                data: fd,
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              });

              toggleProgressBar(false);

              const validation =
                res?.errors || res?.data || null;

              if (validation?.type === "validation_errors") {
                errorMessage = formatUploadErrors(validation);
                openDialog();
                toast("error", "Fix CSV errors.");
                return;
              }

              if (!res.success) {
                errorMessage = escapeHtml(res.message);
                openDialog();
                toast("error", res.message);
                return;
              }

              toast("success", res.message);

              closeModal();

              tableRef.current?.refreshTable();

            } catch (err) {

              toggleProgressBar(false);

              toast(
                "error",
                err?.response?.data?.message ||
                  "Upload failed."
              );
            }
          },
        },

        cancelBtn: { label: "Close" },
      });
    };

    openDialog();
  };

  /* --------------------------------- */
  // DELEGATES TABLE
  /* --------------------------------- */

  const columns = [
    { column: "regn_no", label: "Regn No" },
    { column: "name", label: "Name" },
    { column: "callname", label: "Call Name" },
    { column: "phone_number", label: "Phone" },
    { column: "email", label: "Email" },
    { column: "club_name", label: "Club" },
  ];

  /* --------------------------------- */
  /* DELETE DELEGATE */
  /* --------------------------------- */

  function onDeleteDelegateClicked(e, id) {
    e.preventDefault();

    confirm({
      title: "Delete Delegate",
      message: "Are you sure?",
      positiveBtnOnClick: async () => {
        try {

          toggleProgressBar(true);

          await HttpClient({
            url: `/events/${event_id}/event_delegates/delete`,
            method: "POST",
            data: { id },
          });

          toggleProgressBar(false);

          toast("success", "Deleted");

          closeModal();

          tableRef.current?.refreshTable();

        } catch {
          toggleProgressBar(false);
          toast("error", "Delete failed");
        }
      },
    });
  }
  return (
    <>
      <div className="row mb-3">
        <div className="col-12 text-right">
          <Link
            href={`/events/${event_id}/event_delegates/add`}
            className="btn btn-primary"
          >
            <AppIcon ic="plus" /> Add Delegate
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <DataTable
            ref={tableRef}
            apiPath={`/events/${event_id}/event_delegates/list`}
            dataKeyFromResponse="event_delegates"
            columns={columns}
            paginationType="client"
            actionColumnFn={(row) => (
              <>
                <Link
                  href={`/events/${event_id}/event_delegates/edit/${row.delegate_id}`}
                  className="text-primary"
                >
                  <AppIcon ic="pencil" />
                </Link>

                &nbsp;|&nbsp;

                <a
                  href="#"
                  className="text-danger"
                  onClick={e =>
                    onDeleteDelegateClicked(e, row.delegate_id)
                  }
                >
                  <AppIcon ic="delete" />
                </a>
              </>
            )}
          />
        </div>
      </div>
    </>
  );
}
