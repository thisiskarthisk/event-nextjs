// 'use client';

// import { useAppLayoutContext } from "@/components/appLayout";
// import DataTable from "@/components/DataTable";
// import TextField from "@/components/form/TextField";
// import AppIcon from "@/components/icon";
// import { HttpClient } from "@/helper/http";
// import { encodeURLParam } from "@/helper/utils";
// import Link from "next/link";
// import { use, useEffect , useState , useRef} from "react";
// import { useParams } from "next/navigation";

// export default function UsersListPage() {
//   const columns = [
//     { 'column': 'event_name', 'label': 'Event Name' },
//     { 'column': 'activity_name', 'label': 'Activity Name' },
//     { 'column': 'start_date', 'label': 'Start Date/Time' },
//     { 'column': 'end_date', 'label': 'End Date/Time' },
//     { 'column': 'meal_type', 'label': 'Meal Type' },
//     { 'column': 'activity_category', 'label': 'Activity Category' },
//   ];

//   const { event_id } = useParams();
//   // console.log("Event ID from URL:", event_id); // Debug log to check event_id
//   const { setPageTitle, toggleProgressBar, confirm, toast ,closeModal } = useAppLayoutContext();
//   const tableRef = useRef(null);

//   useEffect(() => {
//     setPageTitle('Activities');
//     toggleProgressBar(false);
//   }, []);
  
//   const onDeleteActivityClicked = (e, id) => {
//     e.preventDefault();
//     if (document.activeElement) document.activeElement.blur();
//     confirm({
//       title: "Delete Activity",
//       message: "Are you sure you want to Delete the Activity?",
//       positiveBtnOnClick: () => {
//         toggleProgressBar(true);
//         try {
//           HttpClient({
//             url: '/event_activities/delete',
//             method: "POST",
//             data: { id: id },
//           }).then(res => {
//             toast('success', res.message || 'The Activity record has been deleted successfully.');
//             toggleProgressBar(false);
//             closeModal();
//             tableRef.current?.refreshTable();
//           }).catch(err => {
//             closeModal();
//             toggleProgressBar(false);
//             let message = 'Error occurred when trying to delete the Activity.';
//             if (err.response && err.response.data && err.response.data.message) {
//               message = err.response.data.message;
//             }
//             toast('error', message);
//           });
//         } catch (error) {
//           toast('error', 'Error occurred when trying to save the Activity data.');
//         }
//       },
//     });
//   };


//   useEffect(() => {
//     setPageTitle('Users');
//     toggleProgressBar(false);
//   }, []);


//   return (
//     <>
//       <div className="row mb-3">
//         <div className="col-12 text-right">
//           <Link href={`/events/${event_id}/event-activities/add`} className="btn btn-primary">
//             <AppIcon ic="plus" />&nbsp;Add Activity
//           </Link>
//         </div>
//       </div>
//       <div className="row">
//         <div className="col-12">
//           <div className="card">
//             <div className="card-body">
//               <DataTable
//                   ref={tableRef}
//                   apiPath="/event_activities/list"
//                   dataKeyFromResponse="event_activities"
//                   columns={columns}
//                   paginationType="client"
//                   actionColumnFn={(rowData) => {
//                     // console.log("Row Data for Action Column:", rowData); // Debug log to check row data
//                     return (
//                       <>
//                         <Link href={`/events/${event_id}/event-activities/edit/${rowData.event_activity_id}`} className="text-primary">
//                           <AppIcon ic="pencil" />
//                         </Link>
//                         &nbsp;|&nbsp;
//                         <a href="#" className="text-danger" onClick={(e) => onDeleteActivityClicked(e, rowData.event_activity_id)}>
//                           <AppIcon ic="delete" />
//                         </a>
//                       </>
//                     );
//                   }} />

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

export default function EventActivitiesPage() {
  const columns = [
    { column: 'event_name', label: 'Event Name' },
    { column: 'activity_name', label: 'Activity Name' },
    { column: 'start_date', label: 'Start Date/Time' },
    { column: 'end_date', label: 'End Date/Time' },
    { column: 'meal_type', label: 'Meal Type' },
    { column: 'activity_category', label: 'Activity Category' },
  ];

  const { event_id } = useParams();
  const eventId = Number(event_id); // Safe conversion, no decoding needed
  const { setPageTitle, toggleProgressBar, confirm, toast, closeModal } = useAppLayoutContext();
  const tableRef = useRef(null);

  useEffect(() => {
    setPageTitle('Event Activities');
    toggleProgressBar(false);
  }, []);

  const onDeleteActivityClicked = (e, id) => {
    e.preventDefault();
    if (document.activeElement) document.activeElement.blur();
    confirm({
      title: "Delete Activity",
      message: "Are you sure you want to Delete the Activity?",
      positiveBtnOnClick: () => {
        toggleProgressBar(true);
        HttpClient({
          url: `/events/${eventId}/event_activities/delete`,
          method: "POST",
          data: { id },
        }).then(res => {
          toast('success', res.message || 'The Activity record has been deleted successfully.');
          toggleProgressBar(false);
          closeModal();
          tableRef.current?.refreshTable();
        }).catch(err => {
          closeModal();
          toggleProgressBar(false);
          let message = 'Error occurred when trying to delete the Activity.';
          if (err.response?.data?.message) message = err.response.data.message;
          toast('error', message);
        });
      },
    });
  };

  return (
    <>
      <div className="row mb-3">
        <div className="col-12 text-right">
          <Link href={`/events/${event_id}/event-activities/add`} className="btn btn-primary">
            <AppIcon ic="plus" />&nbsp;Add Activity
          </Link>
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <DataTable
                ref={tableRef}
                apiPath={`/events/${eventId}/event_activities/list`}
                dataKeyFromResponse="event_activities"
                columns={columns}
                paginationType="client"
                actionColumnFn={(rowData) => (
                  <>
                    <Link href={`/events/${event_id}/event-activities/edit/${rowData.event_activity_id}`} className="text-primary">
                      <AppIcon ic="pencil" />
                    </Link>
                    &nbsp;|&nbsp;
                    <a href="#" className="text-danger" onClick={(e) => onDeleteActivityClicked(e, rowData.event_activity_id)}>
                      <AppIcon ic="delete" />
                    </a>
                  </>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
