'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import DataTable from "@/components/DataTable";
import { useAppLayoutContext } from "@/components/appLayout";
import Link from "next/link";
import AppIcon from "@/components/icon";

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
    <>
      <div className="row mb-3">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                {/* Left Side - Back */}
                <Link href={`/event_user/activity/${event_id}`} className="btn btn-secondary">
                  <AppIcon ic="arrow-left" /> Back
                </Link>

                {/* Right Side - Export & Scan */}
                <div className="d-flex gap-2">
                  <Link
                    href={`/event_user/delegates/${event_id}/${activity_id}/export`}
                    className="btn btn-info"
                  >
                    <AppIcon ic="download" /> Export
                  </Link>

                  <Link
                    href={`/event_user/scan?event_id=${event_id}&activity_id=${activity_id}`}
                    className="btn btn-warning"
                  >
                    <AppIcon ic="qrcode" /> Scan
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
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
                        fontSize: "12px",
                        whiteSpace: "nowrap",
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
        </div>
      </div>
    </>
  );
}
