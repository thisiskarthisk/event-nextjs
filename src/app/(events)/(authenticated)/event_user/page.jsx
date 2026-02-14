// "use client";

// import { useEffect, useState } from "react";
// import { useAppLayoutContext } from "@/components/appLayout";
// import { HttpClient } from "@/helper/http";
// // import { useParams } from "next/navigation";

// export default function EventUserPage() {

//   const { setPageTitle, toggleProgressBar } = useAppLayoutContext();
//   const [eventUsers, setEventUsers] = useState([]);

//   // const { event_id } = useParams();
//   useEffect(() => {
//     toggleProgressBar(false);
//     setPageTitle("Event Activities");
//     fetchEventUsers();
//   }, []);

//   const fetchEventUsers = async () => {
//     toggleProgressBar(true);

//     try {
//       const res = await HttpClient({
//         url: `/event_user/event_list`,   // 🔥 make sure this matches your API route
//         method: "GET",
//       });

//       console.log("API Response:", res);

//       if (!res?.success) return;

//       setEventUsers(res.data.events || []);

//     } catch (err) {
//       console.error(err);
//     } finally {
//       toggleProgressBar(false);
//     }
//   };

//   // console.log("eventUsers", eventUsers);

//   return (
//     <div className="row">
//       <div className="col-12">
//         <div className="card">
//           <div className="card-body">
//             <div className="container py-5">
//               {eventUsers.length === 0 ? (
                
//                 <div
//                   style={{
//                     padding: "40px",
//                     textAlign: "center",
//                     background: "#fff",
//                     borderRadius: "16px",
//                     boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
//                   }}
//                 >
//                   <h5 style={{ color: "#dc3545", marginBottom: "10px" }}>
//                     No Event Assigned
//                   </h5>
//                   <p style={{ color: "#6c757d", margin: 0 }}>
//                     This user is not assigned to any event.
//                     <br />
//                     Please contact administration.
//                   </p>
//                 </div>

//               ) : (
//                 <div className="row g-4">
//                   {eventUsers.map((event) => (
//                     <div key={event.event_id} className="col-12 col-sm-6 col-md-4 col-lg-3">
//                       <div
//                         style={{
//                           borderRadius: "16px",
//                           overflow: "hidden",
//                           boxShadow: "0 15px 35px rgba(0,0,0,0.12)",
//                           background: "#ffffff",
//                         }}>

//                         {/* Top Image Section */}
//                         <div
//                           style={{
//                             height: "10vw",
//                             // width: "100%",
//                             backgroundImage: `linear-gradient(135deg, rgba(34,193,195,0.6), rgba(253,187,45,0.6)), url(${event.event_logo})`,
//                             backgroundSize: "cover",
//                             backgroundPosition: "center",
//                             display: "flex",
//                             alignItems: "flex-end",
//                             padding: "20px",
//                             color: "#ffffff",
//                             objectFit:"contain"
//                           }}
//                         >
//                         </div>


//                         <div
//                           style={{
//                             padding: "15px 20px",
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                             background: "linear-gradient(135deg, #eecda3, #ef629f)"
//                           }}>

//                           <div style={{ fontSize: "14px", fontWeight: "600", color: "#000" , whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
//                             <div className="row mb-1">
//                               <div className="col-12">
//                                 <span style={{marginRight:"10px"}}>Event :  {event.event_name}</span>
//                               </div>
//                             </div>

//                             <div className="row">
//                               <div className="col-12">
//                                 <span style={{marginRight:"10px"}}>Start :  {event.start_date}</span>
//                               </div>
//                             </div>
//                             <div className="row">
//                               <div className="col-12">
//                                 <span style={{marginRight:"10px"}}>End :  {event.end_date}</span>
//                               </div>
//                             </div>

//                             <div className="row mt-3">
//                               <div className="col-12">
//                                 <button
//                                   style={{
//                                     background: "linear-gradient(135deg, #6a11cb, #2575fc)",
//                                     border: "none",
//                                     padding: "6px 18px",
//                                     borderRadius: "20px",
//                                     color: "#fff",
//                                     fontSize: "13px",
//                                     cursor: "pointer",
//                                     boxShadow: "0 5px 15px rgba(0,0,0,0.2)"
//                                   }}
//                                 >
//                                   Select Event
//                                 </button>
//                               </div>
//                             </div>
//                           </div>
                          
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



// "use client";

// import { useEffect, useState } from "react";
// import { useAppLayoutContext } from "@/components/appLayout";
// import { HttpClient } from "@/helper/http";

// export default function EventUserPage() {
//   const { setPageTitle, toggleProgressBar } = useAppLayoutContext();

//   const [eventUsers, setEventUsers] = useState([]);
//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [selectedActivity, setSelectedActivity] = useState(null);

//   useEffect(() => {
//     toggleProgressBar(false);
//     setPageTitle("Event Activities");
//     fetchEventUsers();
//   }, []);

//   const fetchEventUsers = async () => {
//     toggleProgressBar(true);

//     try {
//       const res = await HttpClient({
//         url: `/event_user/event_list`,
//         method: "GET",
//       });

//       if (!res?.success) return;

//       setEventUsers(res.data.events || []);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       toggleProgressBar(false);
//     }
//   };

//   return (
//     <div className="container py-5">

//       {/* ===================== 1️⃣ EVENT LIST ===================== */}
//       {!selectedEvent && (
//         <>
//           {eventUsers.length === 0 ? (
//             <div
//               style={{
//                 padding: "40px",
//                 textAlign: "center",
//                 background: "#fff",
//                 borderRadius: "16px",
//                 boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
//               }}
//             >
//               <h5 style={{ color: "#dc3545" }}>
//                 No Event Assigned
//               </h5>
//               <p style={{ color: "#6c757d" }}>
//                 Please contact administration.
//               </p>
//             </div>
//           ) : (
//             <div className="row g-4">
//               {eventUsers.map((event) => (
//                 <div
//                   key={event.event_id}
//                   className="col-12 col-sm-6 col-md-4 col-lg-3"
//                 >
//                   <div
//                     style={{
//                       borderRadius: "16px",
//                       overflow: "hidden",
//                       boxShadow: "0 15px 35px rgba(0,0,0,0.12)",
//                       background: "#fff",
//                     }}
//                   >
//                     {/* Image */}
//                     <div
//                       style={{
//                         height: "200px",
//                         backgroundImage: `url(${event.event_logo})`,
//                         backgroundSize: "cover",
//                         backgroundPosition: "center",
//                       }}
//                     />

//                     {/* Content */}
//                     <div
//                       style={{
//                         padding: "20px",
//                         background:
//                           "linear-gradient(135deg, #f6d365, #fda085)",
//                       }}
//                     >
//                       <h6 style={{ fontWeight: "700" }}>
//                         {event.event_name}
//                       </h6>

//                       <p style={{ fontSize: "13px", marginBottom: "5px" }}>
//                         <strong>Start:</strong> {event.start_date}
//                       </p>

//                       <p style={{ fontSize: "13px" }}>
//                         <strong>End:</strong> {event.end_date}
//                       </p>

//                       <button
//                         onClick={() => {
//                           setSelectedEvent(event);
//                           setSelectedActivity(null);
//                         }}
//                         className="btn btn-primary btn-sm mt-2"
//                       >
//                         Select Event
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </>
//       )}

//       {/* ===================== 2️⃣ ACTIVITY LIST ===================== */}
//       {selectedEvent && !selectedActivity && (
//         <>
//           <button
//             className="btn btn-secondary btn-sm mb-3"
//             onClick={() => setSelectedEvent(null)}
//           >
//             ← Back to Events
//           </button>

//           <div className="row g-4">
//             {selectedEvent.activities?.map((activity) => (
//               <div
//                 key={activity.event_activity_id}
//                 className="col-12 col-sm-6 col-md-4 col-lg-3"
//               >
//                 <div
//                   style={{
//                     borderRadius: "16px",
//                     boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
//                     padding: "20px",
//                     background: "#ffffff",
//                   }}
//                 >
//                   <h6 style={{ fontWeight: "600" }}>
//                     {activity.activity_name}
//                   </h6>

//                   <p style={{ fontSize: "13px", color: "#6c757d" }}>
//                     {activity.start_datetime}
//                   </p>

//                   <button
//                     onClick={() => setSelectedActivity(activity)}
//                     className="btn btn-success btn-sm mt-2"
//                   >
//                     View Delegates
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </>
//       )}

//       {/* ===================== 3️⃣ DELEGATE TABLE ===================== */}
//       {selectedActivity && (
//         <>
//           <button
//             className="btn btn-secondary btn-sm mb-3"
//             onClick={() => setSelectedActivity(null)}
//           >
//             ← Back to Activities
//           </button>

//           <div className="table-responsive">
//             <table className="table table-bordered table-striped">
//               <thead className="table-dark">
//                 <tr>
//                   <th>#</th>
//                   <th>Name</th>
//                   <th>Phone</th>
//                   <th>Email</th>
//                   <th>Club</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {selectedEvent.delegates?.map((delegate, index) => (
//                   <tr key={delegate.delegate_id}>
//                     <td>{index + 1}</td>
//                     <td>{delegate.name}</td>
//                     <td>{delegate.phone_number}</td>
//                     <td>{delegate.email}</td>
//                     <td>{delegate.club_name}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </>
//       )}

//     </div>
//   );
// }



// "use client";

// import { useEffect, useState } from "react";
// import { Html5QrcodeScanner } from "html5-qrcode";
// import { HttpClient } from "@/helper/http";
// import { useAppLayoutContext } from "@/components/appLayout";
// import { useRouter } from "next/navigation";
// import Link from "next/link";


// export default function EventUserPage() {
//   const { setPageTitle, toggleProgressBar , toast } = useAppLayoutContext();

//   const [events, setEvents] = useState([]);
//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [selectedActivity, setSelectedActivity] = useState(null);
//   const [showScanner, setShowScanner] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     setPageTitle("Event Activities");
//     fetchEvents();
//   }, []);

//   const fetchEvents = async () => {
//     toggleProgressBar(true);
//     const res = await HttpClient({
//       url: "/event_user/event_list",
//       method: "GET",
//     });
//     if (res?.success) setEvents(res.data.events);
//     toggleProgressBar(false);
//   };

//   /* ================= QR SCANNER ================= */

//   useEffect(() => {
//     if (!showScanner) return;

//     const scanner = new Html5QrcodeScanner(
//       "reader",
//       { fps: 10, qrbox: 250 },
//       false
//     );

//     scanner.render(
//       async (decodedText) => {
//         scanner.clear();
//         setShowScanner(false);

//         const regn_no = decodedText
//           .split("\n")
//           .find((line) => line.startsWith("REGNO:"))
//           ?.replace("REGNO:", "")
//           .trim();

//         if (!regn_no) return alert("Invalid QR");

//         const res = await HttpClient({
//           url: "/event_user/scan_delegate",
//           method: "POST",
//           data: {
//             regn_no,
//             event_id: selectedEvent.event_id,
//             activity_id: selectedActivity.event_activity_id,
//           },
//         });

//         // console.log("API Response:", res.data.type);
//         if (res.data.type === "warning") {
//           // alert(res.data.message);
//           toast("warning", res.data.message);
//           return;
//         }
//         // alert(res.data.message); 
//         fetchEvents();
//       }
//     );

//     return () => scanner.clear().catch(() => {});
//   }, [showScanner]);

//   return (
//     <div className="container py-5">

//       {/* EVENTS */}
//       {!selectedEvent && (
//         <div className="row g-4">
//           {events.map((event) => (
//             <div key={event.event_id} className="col-md-4">
//               <div className="card shadow-sm">
//                 <div
//                   style={{
//                     height: 200,
//                     backgroundImage: `url(${event.event_logo})`,
//                     backgroundSize: "cover",
//                     backgroundPosition: "center",
//                   }}
//                 />
//                 <div className="card-body">
//                   <h6>{event.event_name}</h6>
//                   <button
//                     className="btn btn-primary btn-sm"
//                     onClick={() => setSelectedEvent(event)}
//                   >
//                     Select Event
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* ACTIVITIES */}
//       {selectedEvent && !selectedActivity && (
//         <>
//           <button
//             className="btn btn-secondary mb-3"
//             onClick={() => setSelectedEvent(null)}
//           >
//             Back
//           </button>

//           <div className="row g-4">
//             {selectedEvent.activities.map((activity) => (
//               <div key={activity.event_activity_id} className="col-md-4">
//                 <div className="card shadow-sm p-3">
//                   <h6>{activity.activity_name}</h6>
//                   {/* <button
//                     className="btn btn-success btn-sm"
//                     onClick={() => setSelectedActivity(activity)}
//                   >
//                     View Delegates
//                   </button> */}
//                   <Link
//                     href={`/event_user/delegates/${selectedEvent.event_id}/${activity.event_activity_id}`}
//                     className="btn btn-success btn-sm"
//                   >
//                     View Delegates
//                   </Link>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </>
//       )}

//       {/* DELEGATES */}
//       {selectedActivity && (
//         <>
//           <button
//             className="btn btn-secondary mb-3"
//             onClick={() => setSelectedActivity(null)}
//           >
//             Back
//           </button>
//           <button
//             className="btn btn-warning mb-3"
//             onClick={() =>
//               router.push(
//                 `/event_user/scan?event_id=${selectedEvent.event_id}&activity_id=${selectedActivity.event_activity_id}`
//               )
//             }
//           >
//             Scan / Register Delegate
//           </button>


//           {showScanner && <div id="reader" />}

//           <table className="table table-bordered">
//             <thead className="table-dark">
//               <tr>
//                 <th>#</th>
//                 <th>Status</th>
//                 <th>Reg No</th>
//                 <th>Name</th>
//                 <th>Phone</th>
//               </tr>
//             </thead>
//             <tbody>
//               {selectedActivity.delegates.map((d, i) => (
//                 <tr key={d.delegate_id}>
//                   <td>{i + 1}</td>
//                   <td>
//                     <span
//                       style={{
//                         padding: "4px 10px",
//                         borderRadius: "12px",
//                         color: "#fff",
//                         backgroundColor: d.registered
//                           ? "#28a745"
//                           : "#dc3545",
//                       }}
//                     >
//                       {d.registered ? "Registered" : "Not Registered"}
//                     </span>
//                   </td>
//                   <td>{d.regn_no}</td>
//                   <td>{d.name}</td>
//                   <td>{d.phone_number}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </>
//       )}
//     </div>
//   );
// }



'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import { useEffect, useState } from "react";
import { HttpClient } from "@/helper/http";
import { useRouter } from "next/navigation";

export default function EventUserPage() {
  const { setPageTitle, toggleProgressBar } = useAppLayoutContext();
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    setPageTitle("Event Activities");
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    toggleProgressBar(true);
    const res = await HttpClient({
      url: "/event_user/event_list",
      method: "GET",
    });

    if (res?.success) setEvents(res.data.events);
    toggleProgressBar(false);
  };

  return (
    <div className="container py-4">

      {!selectedEvent && (
        <div className="row g-4">
          {events.map(event => (
            <div key={event.event_id} className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h6>{event.event_name}</h6>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedEvent(event)}
                  >
                    Select Event
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEvent && (
        <>
          <button
            className="btn btn-secondary mb-3"
            onClick={() => setSelectedEvent(null)}
          >
            Back
          </button>

          <div className="row g-4">
            {selectedEvent.activities.map(activity => (
              <div key={activity.event_activity_id} className="col-md-4">
                <div className="card shadow-sm p-3">
                  <h6>{activity.activity_name}</h6>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() =>
                      router.push(
                        `/event_user/delegates/${selectedEvent.event_id}/${activity.event_activity_id}`
                      )
                    }
                  >
                    View Delegates
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
