'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef ,useState} from "react";
import DataTable from "@/components/DataTable";
import { useAppLayoutContext } from "@/components/appLayout";
import Link from "next/link";
import AppIcon from "@/components/icon";
import SelectPicker from "@/components/form/SelectPicker";
import TextField from "@/components/form/TextField";
import { HttpClient } from "@/helper/http";

export default function DelegateListPage() {

  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const { event_id, activity_id } = useParams();
  const router = useRouter();
  const tableRef = useRef(null);

  const { setPageTitle, toggleProgressBar } = useAppLayoutContext();
  const [delegateList, setDelegateList] = useState([]);

  const columns = [
    { column: "regn_no", label: "Reg No" },
    { column: "name", label: "Name" },
    { column: "phone_number", label: "Phone" },
    { column: "email", label: "Email" },
  ];

  useEffect(() => {
    setPageTitle("Delegate List");
    toggleProgressBar(false);
    getActivityData();
  }, []);

  const DownloadEventRegistrationDataCSV = () => {
    if (!event_id || !activity_id) return;
    const url = `/api/v1/event_user/export_event_registration?event_id=${event_id}&activity_id=${activity_id}&status=${statusFilter}&date=${selectedDate}`;
    window.open(url, "_blank"); // better UX
  };

  const getActivityData = async () => {
    toggleProgressBar(true);
    const url = `/event_user/delegate_list?event_id=${event_id}&activity_id=${activity_id}&status=${statusFilter}&date=${selectedDate}`;

    const res = await HttpClient({
      url: url,
      method: "GET",
    });

    if (res?.success)
      // console.log("Delegate List: ", res.data);
      setDelegateList(res.data);

    toggleProgressBar(false);
  };
  console.log(delegateList);
  
return (
    <>
      <div className="row mb-3">
        <div className="col-12">
          <div className="card">
            {/* <div className="card-body">
              <div className=" p-3 ">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

                  <Link
                    href={`/event_user/activity/${event_id}`}
                    className="btn btn-secondary"
                  >
                    <AppIcon ic="arrow-left" /> Back
                  </Link>

                  <div className="d-flex align-items-center gap-3 flex-wrap">

                    <div style={{ minWidth: "200px" }}>
                      <SelectPicker
                        value={statusFilter}
                        onChange={(val) => setStatusFilter(val)}
                        options={[
                          { value: "all", label: "All" },
                          { value: "registered", label: "Registered" },
                          { value: "not_registered", label: "Not Registered" },
                        ]}
                      />
                      <TextField
                        type="date"
                        value={selectedDate}
                        onChange={(val) => setSelectedDate(val)}
                      />
                    </div>

                    <button className="btn btn-info px-4" onClick={() => {tableRef.current?.refreshTable();}}>
                      <AppIcon ic="filter" /> Filter
                    </button>

                    <button
                      onClick={DownloadEventRegistrationDataCSV}
                      className="btn btn-success px-4"
                    >
                      <AppIcon ic="download" /> Export
                    </button>

                    <Link
                      href={`/event_user/scan?event_id=${event_id}&activity_id=${activity_id}`}
                      className="btn btn-warning px-4"
                    >
                      <AppIcon ic="qrcode" /> Scan
                    </Link>

                  </div>
                </div>
              </div>
            </div> */}
            <div className="card-body">
  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

    {/* LEFT SECTION */}
    <div className="d-flex align-items-center gap-3 flex-wrap">

      <Link
        href={`/event_user/activity/${event_id}`}
        className="btn btn-secondary"
      >
        <AppIcon ic="arrow-left" /> Back
      </Link>

      {/* Activity Info */}
      {/* <div>
        <div className="fw-bold">
          {activityDetails?.activity_name}
        </div>
        <small className="text-muted">
          {activityDetails?.start_date} - {activityDetails?.end_date}
        </small>
      </div> */}

    </div>

    {/* RIGHT SECTION */}
    <div className="d-flex align-items-center gap-2 flex-wrap">

      {/* Status Filter */}
      <div style={{ minWidth: "180px" }}>
        <SelectPicker
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          options={[
            { value: "all", label: "All" },
            { value: "registered", label: "Registered" },
            { value: "not_registered", label: "Not Registered" },
          ]}
        />
      </div>

      {/* Date Filter */}
      <div style={{ minWidth: "160px" }}>
        <TextField
          type="date"
          value={selectedDate}
          onChange={(val) => setSelectedDate(val)}
        />
      </div>

      {/* Filter Button */}
      <button
        className="btn btn-info px-3"
        onClick={() => tableRef.current?.refreshTable()}
      >
        <AppIcon ic="filter" /> Filter
      </button>

      {/* Clear Button */}
      <button
        className="btn btn-outline-secondary px-3"
        onClick={() => {
          setStatusFilter("all");
          setSelectedDate(new Date().toISOString().split("T")[0]);
          setTimeout(() => {
            tableRef.current?.refreshTable();
          }, 0);
        }}
      >
        <AppIcon ic="refresh" /> Clear
      </button>

      {/* Export */}
      <button
        onClick={DownloadEventRegistrationDataCSV}
        className="btn btn-success px-3"
      >
        <AppIcon ic="download" /> Export
      </button>

      {/* Scan */}
      <Link
        href={`/event_user/scan?event_id=${event_id}&activity_id=${activity_id}`}
        className="btn btn-warning px-3"
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
                  // apiPath={`/event_user/delegate_list?event_id=${event_id}&activity_id=${activity_id}`}
                  // apiPath={`/event_user/delegate_list?event_id=${event_id}&activity_id=${activity_id}&status=${statusFilter}`}
                  apiPath={`/event_user/delegate_list?event_id=${event_id}&activity_id=${activity_id}&status=${statusFilter}&date=${selectedDate}`}
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
