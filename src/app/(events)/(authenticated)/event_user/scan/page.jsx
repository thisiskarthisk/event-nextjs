"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSearchParams, useRouter } from "next/navigation";
import { HttpClient } from "@/helper/http";
import { useAppLayoutContext } from "@/components/appLayout";

export default function ScanPage() {
  const { toast , toggleProgressBar} = useAppLayoutContext();
  const router = useRouter();
  const params = useSearchParams();

  const event_id = params.get("event_id");
  const activity_id = params.get("activity_id");

  const [showScanner, setShowScanner] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [regnNo, setRegnNo] = useState("");
  const [delegateData, setDelegateData] = useState(null);

  /* ================= QR SCANNER ================= */

  useEffect(() => {
    toggleProgressBar(false);
    if (!showScanner) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(async (decodedText) => {
      scanner.clear();
      setShowScanner(false);

      const regn_no = decodedText
        .split("\n")
        .find((line) => line.startsWith("REGNO:"))
        ?.replace("REGNO:", "")
        .trim();

      if (!regn_no) return toast("error", "Invalid QR");

      fetchDelegate(regn_no);
    });

    return () => scanner.clear().catch(() => {});
  }, [showScanner]);

  /* ================= FETCH DELEGATE DETAILS ================= */

  const fetchDelegate = async (regn_no) => {
    const res = await HttpClient({
      url: "/event_user/delegate_details",
      method: "POST",
      data: { regn_no, event_id },
    });

    if (!res.success) {
      toast("error", "Delegate not found");
      return;
    }

    setDelegateData(res.data);
  };

  /* ================= CONFIRM REGISTER ================= */

  const confirmRegister = async () => {
    const res = await HttpClient({
      url: "/event_user/scan_delegate",
      method: "POST",
      data: {
        regn_no: delegateData.regn_no,
        event_id,
        activity_id,
      },
    });

    toast(res.data.type || "success", res.data.message);

    setDelegateData(null);
    setRegnNo("");
  };

  return (
    <div className="container py-5">

      <button
        className="btn btn-secondary mb-4"
        onClick={() => router.back()}
      >
        Back
      </button>

      <div className="d-flex gap-3 mb-4">
        <button
          className="btn btn-warning"
          onClick={() => setShowScanner(true)}
        >
          Scan QR
        </button>

        <button
          className="btn btn-info"
          onClick={() => setManualMode(!manualMode)}
        >
          Reg No Entry
        </button>
      </div>

      {showScanner && <div id="reader" />}

      {/* Manual Entry */}
      {manualMode && (
        <div className="mb-4">
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Enter Registration Number"
            value={regnNo}
            onChange={(e) => setRegnNo(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => fetchDelegate(regnNo)}
          >
            Register
          </button>
        </div>
      )}

      {/* Modal */}
      {delegateData && (
        <div
          className="modal show d-block"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content p-3">
              <h5>Confirm Registration</h5>
              <p><strong>Reg No:</strong> {delegateData.regn_no}</p>
              <p><strong>Name:</strong> {delegateData.name}</p>
              <p><strong>Phone:</strong> {delegateData.phone_number}</p>
              <p><strong>Email:</strong> {delegateData.email}</p>

              <div className="d-flex justify-content-end gap-2">
                <button
                  className="btn btn-success"
                  onClick={confirmRegister}
                >
                  OK Register
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => setDelegateData(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
