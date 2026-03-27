'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { HttpClient } from "@/helper/http";
import Link from "next/link";
import AppIcon from "@/components/icon";
import { useAppLayoutContext } from "@/components/appLayout";

export default function ActivityPage() {
  const { event_id } = useParams();
  const router = useRouter();
  const { setPageTitle, toggleProgressBar } = useAppLayoutContext();

  const [eventDetails, setEventDetails] = useState(null);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    setPageTitle("Event Activities");
    if (event_id) fetchActivities();
  }, [event_id]);

  const fetchActivities = async () => {
    toggleProgressBar(true);

    const res = await HttpClient({
      url: "/event_user/event_list",
      method: "GET",
    });

    if (res?.success) {
      const events = res.data.events;

      const selected = events.find(
        (e) => e.event_id == event_id
      );

      if (selected) {
        setEventDetails(selected);
        setActivities(selected.activities || []);
      }
    }

    toggleProgressBar(false);
  };

  return (
    <>

      {/* Event Header */}
      {eventDetails && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="row">
                  <div className="col-6">
                    <h4 className="fw-bold">Event: {eventDetails.event_name}</h4>
                  </div>
                  <div className="col-6 text-end">
                    <Link href="/" className="btn btn-secondary">
                      <AppIcon ic="arrow-left" />&nbsp;Back
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activities Card Wrapper */}
      <div className="card shadow-sm border-0">
        <div className="card-body">

          {/* Important: row wrapper */}
          <div className="row g-4">
            {activities.length === 0 ? (
              <div className="col-12 d-flex justify-content-center py-5">
                <div className="text-center p-4 shadow-sm" style={{ borderRadius: "15px", background: "#f8f9fa", maxWidth: "400px", width: "100%",}}>
                  <div style={{ fontSize: "40px" }}><AppIcon ic="information" /></div>
                  <h6 className="mt-3 fw-semibold">No Activities Available</h6>
                  <p className="text-muted mb-0" style={{ fontSize: "14px" }}>This event currently has no activities assigned.</p>
                </div>
              </div>
            ) : (
              activities.map(activity => (
                // <div key={activity.event_activity_id} className="col-lg-4 col-md-6 col-sm-12">
                //   <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: "18px", padding: "20px", transition: "all 0.3s ease",}}>
                //     <h6 className="fw-semibold mb-3"> {activity.activity_name}</h6>
                //     <p className="mb-1 text-muted small"><strong>Start Date:</strong> {activity.start_date}</p>
                //     <p className="mb-3 text-muted small"><strong>End Date:</strong> {activity.end_date}</p>
                //     <button className="btn btn-success btn-sm mt-auto" onClick={() => router.push(`/event_user/delegates/${event_id}/${activity.event_activity_id}`)}>
                //       Select Activity
                //     </button>
                //   </div>
                // </div>
                <div key={activity.event_activity_id} className="col-lg-4 col-md-6 col-sm-12 mb-4">
                  <div 
                    className="card h-100 border-0 shadow-sm hover-lift" 
                    style={{ 
                      borderRadius: "20px", 
                      padding: "24px", 
                      transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                      backgroundColor: "#ffffff"
                    }}
                  >
                    <div className="card-body d-flex flex-column p-0">
                      {/* Activity Title */}
                      <h5 className="fw-bold mb-3 text-dark" style={{ letterSpacing: "-0.5px" }}>
                        {activity.activity_name}
                      </h5>

                      {/* Date Information */}
                      <div className="mb-4">
                        <div className="d-flex align-items-center mb-2">
                          <span className="badge bg-light text-success me-2">Start</span>
                          <span className="text-muted small fw-medium">{activity.start_date}</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="badge bg-light text-secondary me-2">End&nbsp;&nbsp;</span>
                          <span className="text-muted small fw-medium">{activity.end_date}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button 
                        className="btn btn-success w-100 py-2 fw-semibold mt-auto shadow-sm"
                        style={{ borderRadius: "12px" }}
                        onClick={() => router.push(`/event_user/delegates/${event_id}/${activity.event_activity_id}`)}
                      >
                        Select Activity
                      </button>
                    </div>
                  </div>

                  {/* Optional: Add this style tag once in your component file */}
                  <style jsx>{`
                    .hover-lift:hover {
                      transform: translateY(-5px);
                      box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                      cursor: pointer;
                    }
                  `}</style>
                </div>
              ))
            )}

          </div>
        </div>
      </div>

    </>
  );
}
