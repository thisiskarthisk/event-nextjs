"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSearchParams, useRouter } from "next/navigation";
import { HttpClient } from "@/helper/http";
import { useAppLayoutContext } from "@/components/appLayout";
import Link from "next/link";
import AppIcon from "@/components/icon";

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

//   return (
//     <div className="container py-5">

//       <button
//         className="btn btn-secondary mb-4"
//         onClick={() => router.back()}
//       >
//         Back
//       </button>

//       <div className="d-flex gap-3 mb-4">
//         <button
//           className="btn btn-warning"
//           onClick={() => setShowScanner(true)}
//         >
//           Scan QR
//         </button>

//         <button
//           className="btn btn-info"
//           onClick={() => setManualMode(!manualMode)}
//         >
//           Reg No Entry
//         </button>
//       </div>

//       {showScanner && <div id="reader" />}

//       {/* Manual Entry */}
//       {manualMode && (
//         <div className="mb-4">
//           <input
//             type="text"
//             className="form-control mb-2"
//             placeholder="Enter Registration Number"
//             value={regnNo}
//             onChange={(e) => setRegnNo(e.target.value)}
//           />
//           <button
//             className="btn btn-primary"
//             onClick={() => fetchDelegate(regnNo)}
//           >
//             Register
//           </button>
//         </div>
//       )}

//       {/* Modal */}
//       {delegateData && (
//         <div
//           className="modal show d-block"
//           style={{ background: "rgba(0,0,0,0.5)" }}
//         >
//           <div className="modal-dialog">
//             <div className="modal-content p-3">
//               <h5>Confirm Registration</h5>
//               <p><strong>Reg No:</strong> {delegateData.regn_no}</p>
//               <p><strong>Name:</strong> {delegateData.name}</p>
//               <p><strong>Phone:</strong> {delegateData.phone_number}</p>
//               <p><strong>Email:</strong> {delegateData.email}</p>

//               <div className="d-flex justify-content-end gap-2">
//                 <button
//                   className="btn btn-success"
//                   onClick={confirmRegister}
//                 >
//                   OK Register
//                 </button>

//                 <button
//                   className="btn btn-danger"
//                   onClick={() => setDelegateData(null)}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

return (
  <>
    <div className="row mb-3">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            <div className="row">
              <div className="col-6">
                <h4 className="fw-bold mb-0">Scan Delegate</h4>
              </div>
              <div className="col-6 text-end">
                <Link href="#" className="btn btn-secondary" onClick={() => router.back()}>
                  <AppIcon ic="arrow-left" />&nbsp;Back
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Action Buttons */}
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body d-flex flex-wrap gap-3 justify-content-center">

        <button
          className="btn btn-warning px-4"
          onClick={() => {
            setShowScanner(true);
            setManualMode(false);
          }}
        >
          📷 Scan QR Code
        </button>

        <button
          className="btn btn-info px-4 text-white"
          onClick={() => {
            setManualMode(!manualMode);
            setShowScanner(false);
          }}
        >
          ✍ Manual Entry
        </button>

      </div>
    </div>

    {/* Scanner Section */}
    {showScanner && (
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body text-center">
          <h6 className="fw-semibold mb-3">QR Scanner</h6>
          <div id="reader" style={{ maxWidth: "400px", margin: "0 auto" }} />
        </div>
      </div>
    )}

    {/* Manual Entry */}
    {manualMode && (
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h6 className="fw-semibold mb-3">Enter Registration Number</h6>

          <div className="row g-2">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Enter Registration Number"
                value={regnNo}
                onChange={(e) => setRegnNo(e.target.value)}
              />
            </div>

            <div className="col-md-4 d-grid">
              <button
                className="btn btn-primary"
                onClick={() => fetchDelegate(regnNo)}
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Confirmation Modal */}
    {delegateData && (
      <div
        className="modal show d-flex align-items-center justify-content-center"
        style={{ background: "rgba(0,0,0,0.6)" }}
      >
        <div className="modal-dialog">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: "15px" }}
          >
            <div className="modal-header border-0">
              <h5 className="fw-bold">Confirm Registration</h5>
              <button
                className="btn-close"
                onClick={() => setDelegateData(null)}
              />
            </div>

            <div className="modal-body">
              <p><strong>Reg No:</strong> {delegateData.regn_no}</p>
              <p><strong>Name:</strong> {delegateData.name}</p>
              <p><strong>Phone:</strong> {delegateData.phone_number}</p>
              <p><strong>Email:</strong> {delegateData.email}</p>
            </div>

            <div className="modal-footer border-0">
              <button
                className="btn btn-success"
                onClick={confirmRegister}
              >
                ✅ Confirm
              </button>

              <button
                className="btn btn-outline-danger"
                onClick={() => setDelegateData(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

  </>
);

}