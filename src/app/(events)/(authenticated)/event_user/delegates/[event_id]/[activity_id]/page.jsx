// 'use client';

// import { useAppLayoutContext } from "@/components/appLayout";
// import DataTable from "@/components/DataTable";
// import { useParams, useRouter } from "next/navigation";
// import { useEffect, useRef } from "react";

// export default function DelegateListPage() {

//   const { event_id, activity_id } = useParams();
//   const router = useRouter();
//   const tableRef = useRef(null);

//   const { setPageTitle, toggleProgressBar } = useAppLayoutContext();

//   /* ================= COLUMNS ================= */

//   const columns = [
//     { column: "regn_no", label: "Reg No" },
//     { column: "name", label: "Name" },
//     { column: "phone_number", label: "Phone" },
//     { column: "email", label: "Email" },
//   ];

//   useEffect(() => {
//     setPageTitle("Delegate List");
//     toggleProgressBar(false);
//   }, []);

//   return (
//     <>
//       <div className="row mb-3">
//         <div className="col-12">

//           <button
//             className="btn btn-secondary"
//             onClick={() => router.back()}
//           >
//             Back
//           </button>

//           <button
//             className="btn btn-warning ms-2"
//             onClick={() =>
//               router.push(
//                 `/event_user/scan?event_id=${event_id}&activity_id=${activity_id}`
//               )
//             }
//           >
//             Scan / Register
//           </button>

//         </div>
//       </div>

//       <div className="row">
//         <div className="col-12">
//           <div className="card">
//             <div className="card-body">

//               <DataTable
//                 ref={tableRef}
//                 apiPath={`/event_user/delegate_list?event_id=${event_id}&activity_id=${activity_id}`}
//                 method="GET"
//                 extraParams={{
//                   event_id,
//                   activity_id,
//                 }}
//                 dataKeyFromResponse="delegates"
//                 columns={columns}
//                 paginationType="client"

//                 /* ===== STATUS COLUMN ===== */
//                 actionColumnLabel="Status"
//                 actionColumnFn={(rowData) => {
//                   return (
//                     <span
//                       style={{
//                         padding: "4px 10px",
//                         borderRadius: "12px",
//                         color: "#fff",
//                         fontSize: "12px",
//                         backgroundColor: rowData.registered
//                           ? "#28a745"
//                           : "#dc3545",
//                       }}
//                     >
//                       {rowData.registered
//                         ? "Registered"
//                         : "Not Registered"}
//                     </span>
//                   );
//                 }}
//               />

//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }



'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import DataTable from "@/components/DataTable";
import { useAppLayoutContext } from "@/components/appLayout";

export default function DelegateListPage() {

  const { event_id, activity_id } = useParams();
  const router = useRouter();
  const tableRef = useRef(null);

  const { setPageTitle, toggleProgressBar } = useAppLayoutContext();

  const columns = [
    { column: "regn_no", label: "Reg No" },
    { column: "name", label: "Name" },
    { column: "phone_number", label: "Phone" },
    { column: "email", label: "Email" },
  ];

  useEffect(() => {
    setPageTitle("Delegate List");
    toggleProgressBar(false);
  }, []);

  return (
    <div className="container py-4">

      <div className="mb-3">
        <button
          className="btn btn-secondary"
          onClick={() => router.back()}
        >
          Back
        </button>

        <button
          className="btn btn-warning ms-2"
          onClick={() =>
            router.push(
              `/event_user/scan?event_id=${event_id}&activity_id=${activity_id}`
            )
          }
        >
          Scan / Register
        </button>
      </div>

      <div className="card">
        <div className="card-body">

          {/* <DataTable
            ref={tableRef}
            apiPath="/event_user/delegate_list"
            method="POST"
            extraParams={{ event_id, activity_id }}
            dataKeyFromResponse="delegates"
            columns={columns}
            paginationType="client"
            actionColumnLabel="Status"
            actionColumnFn={(row) => (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                  backgroundColor: row.registered
                    ? "#28a745"
                    : "#dc3545",
                }}
              >
                {row.registered
                  ? "Registered"
                  : "Not Registered"}
              </span>
            )}
          /> */}
          <DataTable
            ref={tableRef}
            apiPath={`/event_user/delegate_list?event_id=${event_id}&activity_id=${activity_id}`}
            dataKeyFromResponse="delegates"
            columns={columns}
            paginationType="client"
            actionColumnLabel="Status"
            actionColumnFn={(row) => (
                <span
                style={{
                    padding: "4px 10px",
                    borderRadius: "12px",
                    color: "#fff",
                    backgroundColor: row.registered ? "#28a745" : "#dc3545",
                }}
                >
                {row.registered ? "Registered" : "Not Registered"}
                </span>
            )}
            />

        </div>
      </div>

    </div>
  );
}
