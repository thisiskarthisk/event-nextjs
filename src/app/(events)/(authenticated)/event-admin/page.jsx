'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import DataTable from "@/components/DataTable";
import AppIcon from "@/components/icon";
import { HttpClient } from "@/helper/http";
import { encodeURLParam } from "@/helper/utils";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";

/* ------------------------------------------------------------------
   SUB-COMPONENT: AssignmentManager (Refined)
------------------------------------------------------------------ */
const AssignmentManager = ({ users, initialSelected, onChange }) => {
  const [selected, setSelected] = useState(
    initialSelected ? initialSelected.map(id => String(id)) : []
  );

  const handleCheckboxChange = (userId, checked) => {
    const idStr = String(userId);
    const newSelected = checked 
      ? [...selected, idStr] 
      : selected.filter(id => id !== idStr);
    
    setSelected(newSelected);
    onChange(newSelected); // Send updates back to the parent
  };

  return (
    <div className="max-h-96 overflow-y-auto px-2" style={{ maxHeight: '300px' }}>
      {users.map((u) => (
        <div key={u.id} className="form-check mb-3 d-flex align-items-center">
          <input 
            className="form-check-input" 
            type="checkbox" 
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            checked={selected.includes(String(u.id))}
            onChange={(e) => handleCheckboxChange(u.id, e.target.checked)}
            id={`user-chk-${u.id}`}
          />
          <label className="form-check-label ms-3 mb-0" htmlFor={`user-chk-${u.id}`} style={{ cursor: 'pointer', fontSize: '1rem' }}>
            {u.first_name} {u.last_name}
          </label>
        </div>
      ))}
    </div>
  );
};


/* ------------------------------------------------------------------
   MAIN PAGE COMPONENT
------------------------------------------------------------------ */
export default function EventsAdminListPage() {

  const columns = [
    { column: "event_name", label: "Event Name" },
    { column: "event_name", label: "Event Organisation" },
    { column: "start_date", label: "Start Date" },
    { column: "end_date", label: "End Date" },
  ];

  const {
    setPageTitle,
    toggleProgressBar,
    confirm,
    toast,
    closeModal,
    modal,
  } = useAppLayoutContext();

  const { data: session } = useSession();
  console.log("Session data in EventsListPage:", session);

  const tableRef = useRef(null);
  const [eventUserList, setEventUserList] = useState([]);
  const [eventAdminList, setEventAdminList] = useState([]);

  useEffect(() => {
    setPageTitle("Events");
    toggleProgressBar(false);
    fetchUserLists();
  }, []);

  // --- LOAD USERS LOGIC ---
  const fetchUserLists = async () => {
    try {
      const res = await HttpClient({ url: "/events/assign/get", method: "GET" });
      if (res.data) {
        setEventAdminList(res.data.eventAdmin || []);
        setEventUserList(res.data.eventUser || []);
      }
    } catch (err) {
      toast("error", "Error loading users");
    }
  };

  // --- SAVE LOGIC ---
  const saveAssignments = (eventId, selectedIds, roleValue) => {
      toggleProgressBar(true);
      HttpClient({
        url: "/events/assign/save",
        method: "POST",
        data: {
          event_id: eventId,
          role: roleValue, // 0 for Admin, 1 for User
          users: selectedIds,
        },
      })
      .then((res) => {
        const successMessage = roleValue === 0 
        ? "Event Admin Assigned to Event successfully." 
        : "Event User Assigned to Event successfully.";

        toast("success", res.message || successMessage);
        closeModal();
        tableRef.current?.refreshTable();
      })
      .catch((err) => {
        toast("error", "Failed to save assignments");
      })
      .finally(() => toggleProgressBar(false));
  };

  // --- DELETE EVENT LOGIC ---
  const onDeleteEventClicked = (e, id) => {
    e.preventDefault();
    confirm({
      title: "Delete Event",
      message: "Are you sure you want to delete this event?",
      positiveBtnOnClick: () => {
        toggleProgressBar(true);
        HttpClient({ url: "/events/delete", method: "POST", data: { id } })
          .then((res) => {
            toast("success", res.message);
            tableRef.current?.refreshTable();
            closeModal();
          })
          .catch(() => toast("error", "Delete failed"))
          .finally(() => toggleProgressBar(false));
      },
    });
  };

  // --- MODAL TRIGGERS ---
  const openAssignModal = async (eventId, fullUserList, role, title) => {
    toggleProgressBar(true);
    
    let currentSelection = []; // Temporary variable to track selection

    try {
      const res = await HttpClient({
        url: "/events/assign/get-assigned-list",
        method: "POST",
        data: { event_id: eventId, role: role }
      });

      currentSelection = Array.isArray(res.data) ? res.data.map(id => String(id)) : [];

      modal({
        title: title,
        body: (
          <AssignmentManager 
            users={fullUserList} 
            initialSelected={currentSelection}
            onChange={(val) => { currentSelection = val; }} // Update the temp variable
          />
        ),
        // Standard modal buttons for correct alignment
        okBtn: {
          label: "Update Assignments",
          onClick: () => saveAssignments(eventId, currentSelection, role),
        },
        cancelBtn: { 
          label: "Cancel" 
        },
      });
    } catch (err) {
      toast("error", "Could not load current assignments.");
    } finally {
      toggleProgressBar(false);
    }
  };

  return (
    <>
      <div className="row mb-3">
        <div className="col-12 text-right">
          <Link href="/events/add" className="btn btn-primary">
            <AppIcon ic="plus" /> Add Event
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <DataTable
            ref={tableRef}
            apiPath="/events/list"
            dataKeyFromResponse="events"
            columns={columns}
            paginationType="client"
            actionColumnFn={(rowData) => (
              <>
                <button
                  onClick={() => openAssignModal(rowData.event_id, eventAdminList, 0, "Assign Event Admins")}
                  className="text-warning bg-transparent border-0"
                  title="Assign Admin"
                >
                  <AppIcon ic="calendar-text" />
                </button>
                &nbsp;|&nbsp;
                <button
                  onClick={() => openAssignModal(rowData.event_id, eventUserList, 1, "Assign Event Users")}
                  className="text-primary bg-transparent border-0"
                  title="Assign Users"
                >
                  <AppIcon ic="account-group-outline" />
                </button>
                &nbsp;|&nbsp;
                <Link
                  href={"/events/edit/" + encodeURLParam(rowData.event_id)}
                  className="text-primary"
                >
                  <AppIcon ic="pencil" />
                </Link>
                &nbsp;|&nbsp;
                <a
                  href="#"
                  className="text-danger"
                  onClick={(e) => onDeleteEventClicked(e, rowData.event_id)}
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
