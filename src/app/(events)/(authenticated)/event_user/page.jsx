// 'use client';

// import { useAppLayoutContext } from "@/components/appLayout";
// import { useEffect, useState } from "react";
// import { HttpClient } from "@/helper/http";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import AppIcon from "@/components/icon";

// export default function EventUserPage() {
//   const { setPageTitle, toggleProgressBar } = useAppLayoutContext();
//   const router = useRouter();

//   const [events, setEvents] = useState([]);
//   const [selectedEvent, setSelectedEvent] = useState(null);

//   useEffect(() => {
//     setPageTitle("Event User");
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

//   return (
//     <>
//       {selectedEvent && (
//         <div className="row mb-3">
//           <div className="col-12">
//             <div className="card">
//               <div className="card-body">
//                 <div className="row">
//                   <div className="col-6">
//                     <h4 className="fw-bold">Event: {selectedEvent.event_name}</h4>
//                   </div>
//                   <div className="col-6 text-end">
//                     <Link href="#" className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>
//                       <AppIcon ic="arrow-left" />&nbsp;Back
//                     </Link>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="row">
//         <div className="col-12">
//           <div className="card">
//             <div className="card-body">
//               {!selectedEvent && (
//                 <div className="row g-4">
//                   {events.map(event => (
//                     <div key={event.event_id} className="col-md-4 col-sm-6">
//                       <div
//                         className="card h-100 border-0 shadow-sm"
//                         style={{
//                           borderRadius: "15px",
//                           transition: "all 0.3s ease",
//                           overflow: "hidden",
//                           cursor: "pointer",
//                           boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
//                         }}
//                       >
//                         {/* Event Logo */}
//                         {event.event_logo ? (
//                           <img
//                             src={event.event_logo}
//                             alt={event.event_name}
//                             style={{
//                               height: "180px",
//                               objectFit: "cover",
//                               width: "100%",
//                             }}
//                           />
//                         ) : (
//                           <div
//                             style={{
//                               height: "180px",
//                               background: "#f8f9fa",
//                               display: "flex",
//                               alignItems: "center",
//                               justifyContent: "center",
//                               fontSize: "14px",
//                               color: "#999",
//                             }}
//                           >
//                             No Logo Available
//                           </div>
//                         )}

//                         <div className="card-body d-flex flex-column">
//                           <h5 className="fw-semibold mb-3">
//                             {event.event_name}
//                           </h5>

//                           {/* Attachment */}
//                           {event.attachment && (
//                             <a
//                               href={event.attachment}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="btn btn-outline-secondary btn-sm mb-2"
//                             >
//                               View Attachment
//                             </a>
//                           )}

//                           <button
//                             className="btn btn-primary btn-sm mt-auto"
//                             onClick={() => setSelectedEvent(event)}
//                           >
//                             Select Event
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {selectedEvent && (
//                 <div className="row g-4">
//                   {/* If No Activities */}
//                   {(!selectedEvent.activities ||
//                     selectedEvent.activities.length === 0) && (
//                     <div className="col-12 d-flex justify-content-center mt-4">
//                       <div
//                         className="text-center p-4 shadow-sm"
//                         style={{
//                           borderRadius: "15px",
//                           background: "#f8f9fa",
//                           maxWidth: "400px",
//                           width: "100%",
//                         }}
//                       >
//                         <div style={{ fontSize: "40px" }}><AppIcon ic="information" /></div>
//                         <h6 className="mt-3 fw-semibold">
//                           No Activities Available
//                         </h6>
//                         <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
//                           This event currently has no activities assigned.
//                         </p>
//                       </div>
//                     </div>
//                   )}

//                   {/* If Activities Exist */}
//                   {selectedEvent.activities &&
//                     selectedEvent.activities.length > 0 &&
//                     selectedEvent.activities.map(activity => (
//                       console.log(activity),
//                       <div key={activity.event_activity_id} className="col-md-4 col-sm-6">
//                         <div className="card h-100 shadow-sm border-0"
//                           style={{
//                             borderRadius: "18px",
//                             padding: "20px",
//                             transition: "all 0.3s ease",
//                           }}>
                            
//                           {/* Activity Name */}
//                           <h6 className="fw-semibold mb-3">
//                             {activity.activity_name}
//                           </h6>

//                           {/* Start Date */}
//                           <p className="mb-1 text-muted" style={{ fontSize: "14px" }}>
//                             <strong>Start Date:</strong>{" "}
//                             {activity.start_date}
//                           </p>

//                           {/* End Date */}
//                           <p className="mb-3 text-muted" style={{ fontSize: "14px" }}>
//                             <strong>End Date:</strong>{" "}
//                             {activity.end_date}
//                           </p>

//                           {/* Button */}
//                           <button className="btn btn-success btn-sm mt-auto"
//                             onClick={() => router.push(`/event_user/delegates/${selectedEvent.event_id}/${activity.event_activity_id}`)}>
//                             Select Activity
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
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

  useEffect(() => {
    setPageTitle("Event User");
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
    <>
      <div className="row mb-3">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <h4 className="fw-bold">EventS</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              
              {/* Important: Add row here */}
              <div className="row g-4">
                {events.map(event => (
                  <div key={event.event_id} className="col-md-4 col-sm-6">
                    <div
                      className="card h-100 border-0 shadow-sm"
                      style={{
                        borderRadius: "18px",
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {/* Event Logo */}
                      {event.event_logo ? (
                        <img
                          src={event.event_logo}
                          alt={event.event_name}
                          style={{
                            height: "200px",
                            objectFit: "cover",
                            width: "100%",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: "200px",
                            background: "#f8f9fa",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#999",
                          }}
                        >
                          No Logo Available
                        </div>
                      )}

                      <div className="card-body d-flex flex-column">
                        <h5 className="fw-semibold mb-3">
                          {event.event_name}
                        </h5>

                        <button
                          className="btn btn-primary btn-sm mt-auto"
                          onClick={() =>
                            router.push(`/event_user/activity/${event.event_id}`)
                          }
                        >
                          Select Event
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
