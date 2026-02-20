'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import DataTable from "@/components/DataTable";
import AppIcon from "@/components/icon";
import { HttpClient } from "@/helper/http";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";

export default function EventDelegatesPage() {

  const { event_id } = useParams();
  const tableRef = useRef(null);

  const {
    setPageTitle,
    toggleProgressBar,
    toast,
    confirm,
    closeModal,
  } = useAppLayoutContext();

  useEffect(() => {
    setPageTitle("Event Delegates");
    toggleProgressBar(false);
  }, []);

  /* ================= SEND QR EMAIL ================= */

  async function sendDelegateQR(delegateId) {
    try {

      toggleProgressBar(true);

      const res = await HttpClient({
        url: `/events/${event_id}/event_delegates/send-email/${delegateId}/single`,
        method: "POST",
      });

      toggleProgressBar(false);

      if (!res.success) {
        toast("error", res.message);
        return;
      }

      toast("success", res.message);

    } catch (err) {
      toggleProgressBar(false);
      toast("error", "Email sending failed");
    }
  }

  /* ================= BULK QR SEND EMAIL ================= */

  async function sendBulkDelegateQR() {
    try {

      toggleProgressBar(true);

      const res = await HttpClient({
        url: `/events/${event_id}/event_delegates/send-email/bulk`,
        method: "POST",
      });

      toggleProgressBar(false);

      if (!res.success) {
        toast("error", res.message);
        return;
      }

      toast("success", res.message);  

    } catch (err) {
      toggleProgressBar(false);
      toast("error", "Email sending failed");
    }
  }

  

  /* ================= DELETE ================= */

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

  const columns = [
    { column: "regn_no", label: "Regn No" },
    { column: "name", label: "Name" },
    { column: "callname", label: "Call Name" },
    { column: "phone_number", label: "Phone" },
    { column: "email", label: "Email" },
    { column: "club_name", label: "Club" },
  ];

  return (
    <>
      {/* Top Buttons */}
      <div className="d-flex justify-content-end gap-2 mb-3 flex-wrap">
        <Link href="#" className="btn btn-danger"  onClick={sendBulkDelegateQR}>
          <AppIcon ic="gmail" /> Send All QR Email
        </Link>
        {/* Whatsapp Send Bulk */}
        <Link href="#" className="btn btn-success" onClick={sendBulkDelegateQR}>
          <AppIcon ic="whatsapp" /> Send All QR Whatsapp
        </Link>

        <Link
          href={`/api/v1/events/${event_id}/event_delegates/qr/bulk`}
          className="btn btn-warning"
        >
          <AppIcon ic="qrcode" /> Download All QR
        </Link>

        <Link
          href={`/events/${event_id}/event_delegates/add`}
          className="btn btn-primary"
        >
          <AppIcon ic="plus" /> Add Delegate
        </Link>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">

          <DataTable
            ref={tableRef}
            apiPath={`/events/${event_id}/event_delegates/list`}
            dataKeyFromResponse="event_delegates"
            columns={columns}
            paginationType="client"
            actionColumnFn={(row) => (
              <>
                {/* Edit */}
                <Link
                  href={`/events/${event_id}/event_delegates/edit/${row.delegate_id}`}
                  className="text-primary"
                >
                  <AppIcon ic="pencil" size="large" />
                </Link>

                &nbsp;|&nbsp;

                {/* Delete */}
                <a
                  href="#"
                  className="text-danger"
                  onClick={(e) =>
                    onDeleteDelegateClicked(e, row.delegate_id)
                  }
                >
                  <AppIcon ic="delete" size="large" />
                </a>

                &nbsp;|&nbsp;

                {/* Download QR */}
                <a
                  // href={`/api/v1/events/${event_id}/event_delegates/qr/${row.delegate_id}`}
                  href={`/api/v1/events/${event_id}/event_delegates/qr/${row.delegate_id}/single`}
                  className="text-success"
                  target="_blank"
                >
                  <AppIcon ic="qrcode" size="large" />
                </a>

                &nbsp;|&nbsp;

                {/* Send Email */}
                <a
                  href="#"
                  className="text-danger"
                  onClick={(e) => {
                    e.preventDefault();
                    sendDelegateQR(row.delegate_id);
                  }}
                >
                  <AppIcon ic="gmail" size="large" />
                </a>

                {/* Whatsapp */}
                 &nbsp;|&nbsp;
                <a
                  href="#"
                  className="text-success"
                  onClick={async (e) => {
                    e.preventDefault();

                    toggleProgressBar(true);

                    const res = await HttpClient({
                      url: `/events/${event_id}/event_delegates/send-whatsapp/${row.delegate_id}/single`,
                      method: "POST",
                    });

                    console.log(res);

                    toggleProgressBar(false);

                    if (!res.success) {
                      toast("error", res.message);
                      return;
                    }

                    toast("success", res.message);
                  }}
                >
                  <AppIcon ic="whatsapp" size="large" />
                </a>

              </>
            )}
          />

        </div>
      </div>
    </>
  );
}



// 'use client';

// import { useAppLayoutContext } from "@/components/appLayout";
// import DataTable from "@/components/DataTable";
// import AppIcon from "@/components/icon";
// import { HttpClient } from "@/helper/http";
// import Link from "next/link";
// import { useEffect, useRef  ,useState } from "react";
// import { useParams } from "next/navigation";
// import Checkbox from "@/components/form/Checkbox";

// export default function EventDelegatesPage() {

//   const { event_id } = useParams();
//   const tableRef = useRef(null);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [selectAll, setSelectAll] = useState(false);

//   function toggleSelect(id) {
//     setSelectedIds(prev =>
//       prev.includes(id)
//         ? prev.filter(i => i !== id)
//         : [...prev, id]
//     );
//   }

//   function toggleSelectAll(rows) {
//     if (selectAll) {
//       setSelectedIds([]);
//       setSelectAll(false);
//     } else {
//       const allIds = rows.map(r => r.delegate_id);
//       setSelectedIds(allIds);
//       setSelectAll(true);
//     }
//   }


//   const {
//     setPageTitle,
//     toggleProgressBar,
//     toast,
//     confirm,
//     closeModal,
//   } = useAppLayoutContext();

//   useEffect(() => {
//     setPageTitle("Event Delegates");
//     toggleProgressBar(false);
//   }, []);

//   /* ================= SEND QR EMAIL ================= */

//   async function sendDelegateQR(delegateId) {
//     try {

//       toggleProgressBar(true);

//       const res = await HttpClient({
//         url: `/events/${event_id}/event_delegates/send-email/${delegateId}/single`,
//         method: "POST",
//       });

//       toggleProgressBar(false);

//       if (!res.success) {
//         toast("error", res.message);
//         return;
//       }

//       toast("success", res.message);

//     } catch (err) {
//       toggleProgressBar(false);
//       toast("error", "Email sending failed");
//     }
//   }

//   /* ================= BULK QR SEND EMAIL ================= */

//   async function sendBulkDelegateQR() {
//     try {

//       toggleProgressBar(true);

//       const res = await HttpClient({
//         url: `/events/${event_id}/event_delegates/send-email/bulk`,
//         method: "POST",
//       });

//       toggleProgressBar(false);

//       if (!res.success) {
//         toast("error", res.message);
//         return;
//       }

//       toast("success", res.message);  

//     } catch (err) {
//       toggleProgressBar(false);
//       toast("error", "Email sending failed");
//     }
//   }

  

//   /* ================= DELETE ================= */

//   function onDeleteDelegateClicked(e, id) {
//     e.preventDefault();

//     confirm({
//       title: "Delete Delegate",
//       message: "Are you sure?",
//       positiveBtnOnClick: async () => {
//         try {
//           toggleProgressBar(true);

//           await HttpClient({
//             url: `/events/${event_id}/event_delegates/delete`,
//             method: "POST",
//             data: { id },
//           });

//           toggleProgressBar(false);
//           toast("success", "Deleted");
//           closeModal();
//           tableRef.current?.refreshTable();

//         } catch {
//           toggleProgressBar(false);
//           toast("error", "Delete failed");
//         }
//       },
//     });
//   }

//   const columns = [
//     { column: "regn_no", label: "Regn No" },
//     { column: "name", label: "Name" },
//     { column: "callname", label: "Call Name" },
//     { column: "phone_number", label: "Phone" },
//     { column: "email", label: "Email" },
//     { column: "club_name", label: "Club" },

//   ];


//   return (
//     <>
//       {/* Top Buttons */}
//       <div className="d-flex justify-content-end gap-2 mb-3 flex-wrap">
//         <Link href="#" className="btn btn-danger"  onClick={sendBulkDelegateQR}>
//           <AppIcon ic="gmail" /> Send All QR Email
//         </Link>
//         {/* Whatsapp Send Bulk */}
//         <Link href="#" className="btn btn-success" onClick={sendBulkDelegateQR}>
//           <AppIcon ic="whatsapp" /> Send All QR Whatsapp
//         </Link>

//         <Link
//           href={`/api/v1/events/${event_id}/event_delegates/qr/bulk`}
//           className="btn btn-warning"
//         >
//           <AppIcon ic="qrcode" /> Download All QR
//         </Link>

//         <Link
//           href={`/events/${event_id}/event_delegates/add`}
//           className="btn btn-primary"
//         >
//           <AppIcon ic="plus" /> Add Delegate
//         </Link>
//       </div>

//       <div className="card shadow-sm">
//         <div className="card-body">
//           <DataTable
//             ref={tableRef}
//             apiPath={`/events/${event_id}/event_delegates/list`}
//             dataKeyFromResponse="event_delegates"
//             columns={columns}
//             paginationType="client"
//             actionColumnFn={(row) => (
//               <div className="d-flex justify-content-center align-items-center gap-3">
//                 <Link
//                   href={`/events/${event_id}/event_delegates/edit/${row.delegate_id}`}
//                   className="text-primary"
//                 >
//                   <AppIcon ic="pencil" size="large" />
//                 </Link>

//                 &nbsp;|&nbsp;

//                 <a
//                   href="#"
//                   className="text-danger"
//                   onClick={(e) =>
//                     onDeleteDelegateClicked(e, row.delegate_id)
//                   }
//                 >
//                   <AppIcon ic="delete" size="large" />
//                 </a>

//                 &nbsp;|&nbsp;

//                 <div className="d-flex align-items-center">
//                   <Checkbox
//                     checked={selectedIds.includes(row.delegate_id)}
//                     onChange={() => toggleSelect(row.delegate_id)}
//                   />
//                 </div>
//               </div>
//             )}
//           />

//         </div>
//       </div>
//     </>
//   );
// }



// 'use client';

// import { useAppLayoutContext } from "@/components/appLayout";
// import DataTable from "@/components/DataTable";
// import AppIcon from "@/components/icon";
// import { HttpClient } from "@/helper/http";
// import { useEffect, useRef, useState } from "react";
// import { useParams } from "next/navigation";
// import Checkbox from "@/components/form/Checkbox";

// export default function EventDelegatesPage() {

//   const { event_id } = useParams();
//   const tableRef = useRef(null);

//   const {
//     setPageTitle,
//     toggleProgressBar,
//     toast,
//   } = useAppLayoutContext();

//   const [selectedIds, setSelectedIds] = useState([]);

//   useEffect(() => {
//     setPageTitle("Event Delegates");
//     toggleProgressBar(false);
//   }, []);

//   /* ================= SELECT ================= */

//   function toggleSelect(id) {
//     setSelectedIds(prev =>
//       prev.includes(id)
//         ? prev.filter(i => i !== id)
//         : [...prev, id]
//     );
//   }

//   /* ================= DOWNLOAD ================= */

//   function handleDownload() {

//     // If selected rows exist → download selected
//     if (selectedIds.length > 0) {

//       const ids = selectedIds.join(",");

//       window.open(
//         `/api/v1/events/${event_id}/event_delegates/qr/select?ids=${ids}`,
//         "_blank"
//       );

//       return;
//     }

//     // Otherwise → download all
//     window.open(
//       `/api/v1/events/${event_id}/event_delegates/qr/bulk`,
//       "_blank"
//     );
//   }

//   /* ================= SEND EMAIL ================= */

//   async function handleSendEmail() {

//     try {

//       toggleProgressBar(true);

//       let url;
//       let data = {};

//       if (selectedIds.length > 0) {
//         // Send selected
//         url = `/events/${event_id}/event_delegates/send-email/select`;
//         data = { ids: selectedIds };
//       } else {
//         // Send all
//         url = `/events/${event_id}/event_delegates/send-email/bulk`;
//       }

//       const res = await HttpClient({
//         url,
//         method: "POST",
//         data,
//       });

//       toggleProgressBar(false);

//       if (!res.success) {
//         toast("error", res.message);
//         return;
//       }

//       toast("success", res.message);
//       setSelectedIds([]);

//     } catch {
//       toggleProgressBar(false);
//       toast("error", "Email sending failed");
//     }
//   }

//   /* ================= COLUMNS ================= */

//   const columns = [
//     { column: "regn_no", label: "Regn No" },
//     { column: "name", label: "Name" },
//     { column: "callname", label: "Call Name" },
//     { column: "phone_number", label: "Phone" },
//     { column: "email", label: "Email" },
//     { column: "club_name", label: "Club" },
//   ];

//   return (
//     <>
//       {/* ACTION BUTTONS */}
//       <div className="d-flex justify-content-end gap-2 mb-3">

//         <button
//           className="btn btn-warning"
//           onClick={handleDownload}
//         >
//           <AppIcon ic="qrcode" /> Download QR
//         </button>

//         <button
//           className="btn btn-danger"
//           onClick={handleSendEmail}
//         >
//           <AppIcon ic="gmail" /> Send QR Email
//         </button>

//       </div>

//       <div className="card shadow-sm">
//         <div className="card-body">

//           <DataTable
//             ref={tableRef}
//             apiPath={`/events/${event_id}/event_delegates/list`}
//             dataKeyFromResponse="event_delegates"
//             columns={columns}
//             paginationType="client"

//             /* Only checkbox in Action column */
//             actionColumnFn={(row) => (
//               <div className="d-flex justify-content-center">
//                 <Checkbox
//                   checked={selectedIds.includes(row.delegate_id)}
//                   onChange={() => toggleSelect(row.delegate_id)}
//                 />
//               </div>
//             )}
//           />

//         </div>
//       </div>
//     </>
//   );
// }
