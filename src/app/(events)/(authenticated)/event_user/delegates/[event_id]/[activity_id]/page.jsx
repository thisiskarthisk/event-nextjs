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
              <div className="row">
                <div className="col-6">
                  <Link href="#" className="btn btn-secondary" onClick={() => router.back()}>
                    <AppIcon ic="arrow-left" />&nbsp;Back
                  </Link>
                </div>
                <div className="col-6 text-end">
                  <Link href={`/event_user/scan?event_id=${event_id}&activity_id=${activity_id}`} className="btn btn-warning">
                    <AppIcon ic="qrcode" />&nbsp;Scan
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
                  }}>
                    {row.registered ? "Registered" : "Not Registered"}
                  </span>
                )} 
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
