"use client";

import Events from "./events/page";
import EventsUser from "./event_user/page";
import { useSession } from "next-auth/react";

export default function EventsPage() {
    const { data: session } = useSession();
    const userType = session?.user?.user_type;

    if (!userType) return null;

    return (
        <>
        {(userType === "event_admin" || userType === "site_admin") && <Events />}
        {userType === "event_user" && <EventsUser />}
        </>
    );
}




// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useSession } from "next-auth/react";
// import { HttpClient } from "@/helper/http";

// export default function EventsPage() {

//   const { data: session } = useSession();
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!session?.user) return;

//     const { id, user_type } = session.user;

//     // // ✅ site_admin → show events page
//     // if (user_type === "site_admin") {
//     //   setLoading(false);
//     //   return;
//     // }

//     // ✅ event_admin or event_user → fetch assigned event
//     if (user_type === "event_admin" || user_type === "event_user") {
//       fetchAssignedEvent(id, user_type);
//     }

//   }, [session]);


// const fetchAssignedEvent = async (userId, userType) => {
//   try {
//     const res = await HttpClient({
//       url: `/user-event/${userId}`,
//       method: "GET",
//     });

//     console.log("API Response:", res);

//     if (!res?.success) {
//     //   toast("error", "Failed to load users");
//       return;
//     }
//     // console.log("API Response:", res);
//     // const data = res.data || {};
//     // console.log("API Response Data:", data);
//     // if (!data?.event_id) {
//     //   router.replace("/no-event");
//     //   return;
//     // }
//     // setEventAdminList(res.data?.eventAdmin || []);
//     // setEventUserList(res.data?.eventUser || []);
//     const data = res.data || {};
//     if (userType === "event_user") {
//         router.replace(`/events/${data.event_id}/event_user`);
//       }

//       if (userType === "event_admin") {
//         router.replace(`/events/${data.event_id}`);
//       }
//   } catch (err) {
//     console.error(err);
//     // toast("error", "Error loading users");
//   }
// };


//   if (loading) return null;

//   return null;
// }

