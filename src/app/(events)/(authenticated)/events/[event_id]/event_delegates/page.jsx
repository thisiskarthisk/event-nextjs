'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import DataTable from "@/components/DataTable";
import AppIcon from "@/components/icon";
import { HttpClient } from "@/helper/http";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";

export default function EventActivitiesPage() {
  const params = useParams();
  // Ensure this matches your folder name: [event_id]
  const event_id = params?.event_id; 
  
  const { setPageTitle, toggleProgressBar, confirm, toast, closeModal } = useAppLayoutContext();
  const tableRef = useRef(null);

  const columns = [
    { column: 'regn_no', label: 'Regn No' },
    { column: 'name', label: 'Name' },
    { column: 'callname', label: 'Call Name' },
    { column: 'phone_number', label: 'Phone Number' },
    { column: 'email', label: 'Email' },
    { column: 'club_name', label: 'Club Name' },
  ];

  useEffect(() => {
    setPageTitle('Event Delegates');
    toggleProgressBar(false);
  }, []);

  const onDeleteDelegateClicked = (e, id) => {
    e.preventDefault();
    if (!event_id) return toast('error', 'Event ID missing');

    confirm({
      title: "Delete Event Delegate",
      message: "Are you sure you want to Delete the Event Delegate?",
      positiveBtnOnClick: () => {
        toggleProgressBar(true);
        HttpClient({
          // Use the string event_id directly to avoid NaN
          url: `/events/${event_id}/event_delegates/delete`,
          method: "POST",
          data: { id },
        }).then(res => {
          toast('success', res.message || 'Deleted successfully.');
          toggleProgressBar(false);
          closeModal();
          tableRef.current?.refreshTable();
        }).catch(err => {
          closeModal();
          toggleProgressBar(false);
          toast('error', err.response?.data?.message || 'Error deleting record.');
        });
      },
    });
  };

  return (
    <>
      <div className="row mb-3">
        <div className="col-12 text-right">
          <Link href={`/events/${event_id}/event_delegates/add`} className="btn btn-primary">
            <AppIcon ic="plus" />&nbsp;Add Event Delegate
          </Link>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <DataTable
            ref={tableRef}
            // Use event_id string here
            apiPath={`/events/${event_id}/event_delegates/list`}
            dataKeyFromResponse="event_delegates"
            columns={columns}
            paginationType="client"
            actionColumnFn={(rowData) => (
              console.log("Row Data in Action Column:", rowData),
              <>
                <Link href={`/events/${event_id}/event_delegates/edit/${rowData.delegate_id}`} className="text-primary">
                  <AppIcon ic="pencil" />
                </Link>
                &nbsp;|&nbsp;
                {/* Changed rowData.event_delegate_id to rowData.delegate_id to match DB */}
                <a href="#" className="text-danger" onClick={(e) => onDeleteDelegateClicked(e, rowData.delegate_id)}>
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