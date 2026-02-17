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

  // console.log(events);

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
              <div className="row g-4">
                {events.map((event) => (
                  <div key={event.event_id} className="col-lg-4 col-md-6 col-sm-12">
                    <div className="miled-card-horizontal"  onClick={() => router.push(`/event_user/activity/${event.event_id}`)} style={{ cursor: "pointer" }} role="button" tabIndex="0">
                      <div className="card-body d-flex align-items-center p-3">
                        
                        {/* Left Side: Round Logo */}
                        <div className="logo-section me-3">
                          <div className="round-logo-wrapper">
                            {event.event_logo ? (
                              <img src={event.event_logo} alt="logo" />
                            ) : (
                              <i className="bi bi-image text-muted fs-4"></i>
                            )}
                          </div>
                        </div>

                        {/* Right Side: Info & Action */}
                        <div className="info-section flex-grow-1 overflow-hidden">
                          <h6 className="event-name mb-1 text-truncate" title={event.event_name}>
                            {event.event_name}
                          </h6>
                          
                          <div className="date-text mb-2">
                            <i className="bi bi-calendar3 me-1"></i>
                            <span>{event.start_date} — {event.end_date}</span>
                          </div>

                          {/* <div className="d-flex justify-content-end">
                            <button 
                              className="btn-select-miled"
                              onClick={() => router.push(`/event_user/activity/${event.event_id}`)}
                            >
                              Select Event
                            </button>
                          </div> */}
                        </div>

                      </div>
                    </div>

                    <style jsx>{`
                      .miled-card-horizontal {
                        background: #ffffff;
                        border-radius: 22px;
                        border: 1px solid rgba(0,0,0,0.05);
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); /* Soft Shadow */
                        transition: all 0.3s ease-in-out;
                        position: relative;
                      }

                      .miled-card-horizontal:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 12px 25px rgba(0, 0, 0, 0.1); /* Deeper Shadow on Hover */
                        border-color: rgba(0,0,0,0.1);
                      }

                      .round-logo-wrapper {
                        width: 70px;
                        height: 70px;
                        border-radius: 50%;
                        background: #fdfdfd;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        border: 3px solid #fff;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.08);
                        flex-shrink: 0;
                      }

                      .round-logo-wrapper img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        padding: 10px;
                      }

                      .event-name {
                        font-weight: 700;
                        color: #1a1a1a;
                        font-size: 1.05rem;
                        letter-spacing: -0.3px;
                      }

                      .date-text {
                        font-size: 11px;
                        color: #888;
                        font-weight: 500;
                      }

                      .btn-select-miled {
                        background: #222; /* Miled Dark Gray */
                        color: #fff;
                        border: none;
                        padding: 6px 18px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                        transition: all 0.2s ease;
                      }

                      .btn-select-miled:hover {
                        background: #000;
                        transform: scale(1.05);
                      }

                      .text-truncate {
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                      }
                    `}</style>
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
