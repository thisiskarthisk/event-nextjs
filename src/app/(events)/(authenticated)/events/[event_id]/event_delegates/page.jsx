'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import DataTable from "@/components/DataTable";
import AppIcon from "@/components/icon";
import { HttpClient } from "@/helper/http";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Checkbox from "@/components/form/Checkbox";
import Link from "next/link";

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


  // State to track selected checkboxes
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setPageTitle("Event Delegates");
    toggleProgressBar(false);
  }, []);

  /* ================= SELECTION LOGIC ================= */

  function toggleSelect(id) {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  }

  /* ================= DOWNLOAD QR (ZIP) ================= */
  function handleDownload() {
    const isSelected = selectedIds.length > 0;
    
    // Show a small loading state if needed, though window.open is usually instant
    toggleProgressBar(true);

    let downloadUrl;
    if (isSelected) {
      const ids = selectedIds.join(",");
      downloadUrl = `/api/v1/events/${event_id}/event_delegates/qr/select?ids=${ids}`;
    } else {
      downloadUrl = `/api/v1/events/${event_id}/event_delegates/qr/bulk`;
    }

    // Trigger download
    window.open(downloadUrl, "_blank");
    
    // Close progress bar after a short delay
    setTimeout(() => toggleProgressBar(false), 1000);
  }

  /* ================= SEND EMAIL ================= */
  const handleSendEmail = (e) => {
    if (e) e.preventDefault();
    if (document.activeElement) document.activeElement.blur();

    const isSelected = selectedIds.length > 0;
    const count = isSelected ? selectedIds.length : "ALL";

    confirm({
      title: "Send QR Emails",
      message: `Are you sure you want to send QR emails to ${count} delegate(s)?`,
      positiveBtnOnClick: () => {
        toggleProgressBar(true);
        
        const url = isSelected 
          ? `/events/${event_id}/event_delegates/send-email/select` 
          : `/events/${event_id}/event_delegates/send-email/bulk`;

        HttpClient({
          url,
          method: "POST",
          data: isSelected ? { ids: selectedIds } : {},
        }).then(res => {
          toggleProgressBar(false);
          closeModal();
          if (res.success) {
            toast('success', res.message || 'Emails sent successfully.');
            setSelectedIds([]); // Clear selection
          } else {
            toast('error', res.message || 'Failed to send emails.');
          }
        }).catch(err => {
          toggleProgressBar(false);
          closeModal();
          toast('error', err.response?.data?.message || 'Error occurred when trying to send emails.');
        });
      },
    });
  };

  /* ================= DELETE ================= */
  const onDeleteDelegateClicked = (e, id) => {
    e.preventDefault();
    if (document.activeElement) document.activeElement.blur();
    confirm({
      title: "Delete Delegate",
      message: "Are you sure you want to Delete the Delegate?",
      positiveBtnOnClick: () => {
        toggleProgressBar(true);
        HttpClient({
          url: `/events/${event_id}/event_delegates/delete`,
          method: "POST",
          data: { id },
        }).then(res => {
          toast('success', res.message || 'The Delegate record has been deleted successfully.');
          toggleProgressBar(false);
          closeModal();
          tableRef.current?.refreshTable();
        }).catch(err => {
          closeModal();
          toggleProgressBar(false);
          let message = 'Error occurred when trying to delete the Delegate.';
          if (err.response?.data?.message) message = err.response.data.message;
          toast('error', message);
        });
      },
    });
  };
  

  /* ================= COLUMNS ================= */
  const columns = [
    { column: "regn_no", label: "Regn No" },
    { column: "name", label: "Name" },
    { column: "phone_number", label: "Phone" },
    { column: "email", label: "Email" },
    { column: "club_name", label: "Club" },
  ];

  return (
    <>
      {/* ACTION BUTTONS HEADER */}
      <div className="d-flex justify-content-end gap-2 mb-3">
        
        {/* DOWNLOAD BUTTON */}
        <button 
          className="btn btn-warning d-flex align-items-center gap-2" 
          onClick={handleDownload}
        >
          <AppIcon ic="qrcode" /> 
          {selectedIds.length > 0 ? `Download (${selectedIds.length}) QR` : "Download All QR"}
        </button>

        {/* EMAIL BUTTON */}
        <button 
          className="btn btn-danger d-flex align-items-center gap-2" 
          onClick={handleSendEmail}
        >
          <AppIcon ic="gmail" /> 
          {selectedIds.length > 0 ? `Email (${selectedIds.length}) QR` : "Email All QR"}
        </button>

        <Link href={`/events/${event_id}/event_delegates/add`} className="btn btn-primary">
          <AppIcon ic="plus" /> Add Delegate
        </Link>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <DataTable
            ref={tableRef}
            apiPath={`/events/${event_id}/event_delegates/list`}
            dataKeyFromResponse="event_delegates"
            columns={columns}
            paginationType="client"
            actionColumnFn={(row) => (
              <div className="d-flex justify-content-center">
                <Checkbox
                  checked={selectedIds.includes(row.delegate_id)}
                  onChange={() => toggleSelect(row.delegate_id)}
                />
                &nbsp;|&nbsp;
                <Link href={`/events/${event_id}/event_delegates/edit/${row.delegate_id}`} className="text-primary">
                  <AppIcon ic="pencil" size="large" />
                </Link>
                &nbsp;|&nbsp;
                <Link href="#" className="text-danger" onClick={(e) => onDeleteDelegateClicked(e, row.delegate_id)}>
                  <AppIcon ic="delete" size="large" />
                </Link>

              </div>
            )}
          />
        </div>
      </div>
    </>
  );
}