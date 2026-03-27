export const runtime = "nodejs";

import { DB_Fetch, Tables } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { decodeURLParam } from "@/helper/utils";

export async function POST(req, context) {
  try {

    /* ---------------------------
       DECODE EVENT ID
    ----------------------------*/
 
    const { event_id, delegate_id } = await context.params;
    
    const decoded = decodeURLParam(event_id);
    const eventId = Number(decoded);
    const delegateId = Number(delegate_id);

    if (!eventId || !delegateId) {
      return NextResponse.json({
        success: false,
        message: "Invalid IDs",
      });
    }

    /* ---------------------------
       FETCH DELEGATE
    ----------------------------*/
    const rows = await DB_Fetch(sql`
      SELECT name, phone_number
      FROM ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
      WHERE delegate_id = ${delegateId}
        AND fkevent_id = ${eventId}
    `);

    if (!rows.length) {
      return NextResponse.json({
        success: false,
        message: "Delegate not found",
      });
    }

    const delegate = rows[0];

    if (!delegate.phone_number) {
      return NextResponse.json({
        success: false,
        message: "Phone number not available",
      });
    }

    /* ---------------------------
       FETCH WHATSAPP SETTINGS
    ----------------------------*/
    const settingRows = await DB_Fetch(sql`
      SELECT field_name, value
      FROM ${sql.identifier(Tables.TBL_SETTINGS)}
      WHERE setting_group = 'general'
    `);

    const settings = {};
    settingRows.forEach(r => {
      settings[r.field_name] = r.value;
    });

    if (
      !settings.whatsapp_phone_id ||
      !settings.whatsapp_token ||
      !settings.whatsapp_template
    ) {
      return NextResponse.json({
        success: false,
        message: "WhatsApp not configured",
      });
    }

    /* ---------------------------
       PREPARE PAYLOAD
    ----------------------------*/

    // const toNumber = delegate.phone_number.replace(/\D/g, "");

    // const bodyPayload = {
    //   messaging_product: "whatsapp",
    //   to: toNumber,
    //   type: "template",
    //   template: {
    //     name: settings.whatsapp_template, // must match EXACTLY
    //     language: {
    //       code: "en_US",
    //     },
    //   },
    // };
    // const bodyPayload = {
    //   messaging_product: "whatsapp",
    //   preview_url: false,
    //   recipient_type: "individual",
    //   to: toNumber,
    //   type: "template",
    //   // template: {
    //   //   name: settings.whatsapp_template, // must match EXACTLY
    //   //   language: {
    //   //     code: "en_US",
    //   //   },
    //   // },
    // };
    // const bodyPayload = {
    //   messaging_product: "whatsapp",
    //   preview_url: false,
    //   recipient_type: "individual",
    //   to: toNumber,
    //   type: "text",
    //   text: {
    //     body: `Hello ${delegate.name}, your QR code is ready!`,
    //     preview_url: true,
    //     },
    // };

    //  const bodyPayload = {
    //   messaging_product: "whatsapp",
    //   // recipient_type: "individual",
    //   to: toNumber,
    //   // type: "text",
    //   text: {
    //     // Body Qr Code
    //     body: `Hello ${delegate.name}, your QR code is ready!`,
    //     preview_url: true,
    //     },
    // };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    return NextResponse.json({
      success: false,
      message: "Base URL not configured",
    });
  }

  const toNumber = delegate.phone_number.replace(/\D/g, "");
  const qrUrl = `${baseUrl}/api/v1/events/${event_id}/event_delegates/qr/${delegateId}/single`;
  console.log("QR URL: ", qrUrl);

  const URL =`${baseUrl}/public/uploads/events/14/1769972993780-Screenshotfrom2026-01-2817-09-38.png`;
  console.log("URL: ", URL);

  const bodyPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toNumber,
    type: "image", // Change type to 'image'
    image: {
      // link: "https://images.pexels.com/photos/1315655/pexels-photo-1315655.jpeg",
      // link: "https://proflujo.com/images/pro_logo.png",
      link: "https://events.proflujo.com/admin/uploads/event/8/qrcodes/admin/event/index.php",
    },
  };

    /* ---------------------------
       SEND REQUEST
    ----------------------------*/
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${settings.whatsapp_phone_id}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.whatsapp_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("WhatsApp Error:", result);
      return NextResponse.json({
        success: false,
        message: result?.error?.message || "WhatsApp sending failed",
      });
    }

    return NextResponse.json({
      success: true,
      message: `WhatsApp sent to ${delegate.name}`,
    });

  } catch (err) {
    console.error("WHATSAPP ERROR:", err);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}


// export const runtime = "nodejs";

// import { DB_Fetch, Tables } from "@/db";
// import { sql } from "drizzle-orm";
// import { NextResponse } from "next/server";
// import { decodeURLParam } from "@/helper/utils";

// export async function POST(req, context) {
//   try {

//     /* ---------------------------
//        DECODE EVENT ID
//     ----------------------------*/
//     const { event_id, delegate_id } = await context.params;
    
//     const decoded = decodeURLParam(event_id);
//     const eventId = Number(decoded);
//     const delegateId = Number(delegate_id);

//     if (!eventId || !delegateId) {
//       return NextResponse.json({
//         success: false,
//         message: "Invalid IDs",
//       });
//     }

//     /* ---------------- FETCH DELEGATE ---------------- */
//     const rows = await DB_Fetch(sql`
//       SELECT name, phone_number
//       FROM ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
//       WHERE delegate_id = ${delegateId}
//         AND fkevent_id = ${eventId}
//     `);

//     if (!rows.length) {
//       return NextResponse.json({
//         success: false,
//         message: "Delegate not found",
//       });
//     }

//     const delegate = rows[0];

//     if (!delegate.phone_number) {
//       return NextResponse.json({
//         success: false,
//         message: "Phone number not available",
//       });
//     }

//     /* ---------------- FETCH SETTINGS ---------------- */
//     const settingRows = await DB_Fetch(sql`
//       SELECT field_name, value
//       FROM ${sql.identifier(Tables.TBL_SETTINGS)}
//       WHERE setting_group = 'general'
//     `);

//     const settings = {};
//     settingRows.forEach(r => {
//       settings[r.field_name] = r.value;
//     });

//     if (
//       !settings.whatsapp_phone_id ||
//       !settings.whatsapp_template ||
//       !settings.whatsapp_token
//     ) {
//       return NextResponse.json({
//         success: false,
//         message: "WhatsApp not configured",
//       });
//     }


//     const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

//     if (!baseUrl) {
//       return NextResponse.json({
//         success: false,
//         message: "Base URL not configured",
//       });
//     }

//     const toNumber = delegate.phone_number.replace(/\D/g, "");

//     // This MUST be publicly accessible
//     const qrUrl = `${baseUrl}/api/v1/events/${event_id}/event_delegates/qr/${delegateId}/single`;
//     console.log("Phone ID:", settings.whatsapp_phone_id);
//     console.log("Token:", settings.whatsapp_token);
//     console.log("To:", toNumber);


//     /* ---------------- PAYLOAD ---------------- */
//     // const bodyPayload = {
//     //   messaging_product: "whatsapp",
//     //   to: toNumber,
//     //   type: "template",
//     //   template: {
//     //     name: settings.whatsapp_template, // should be "ifcr_rotary"
//     //     language: {
//     //       code: "en",
//     //     },
//     //     components: [
//     //       {
//     //         type: "header",
//     //         parameters: [
//     //           {
//     //             type: "image",
//     //             image: {
//     //               link: qrUrl,
//     //             },
//     //           },
//     //         ],
//     //       },
//     //       {
//     //         type: "body",
//     //         parameters: [
//     //           {
//     //             type: "text",
//     //             text: delegate.name, // ONLY 1 param
//     //           },
//     //         ],
//     //       },
//     //     ],
//     //   },
//     // };
//     const bodyPayload = {
//   messaging_product: "whatsapp",
//   to: toNumber,
//   type: "template",
//   template: {
//     name: "event_sample",
//     language: {
//       code: "en",
//     },
//     components: [
//       {
//         type: "header",
//         parameters: [
//           {
//             type: "image",
//             image: {
//               link: qrUrl,
//             },
//           },
//         ],
//       },
//       {
//         type: "body",
//         parameters: [
//           {
//             type: "text",
//             text: delegate.name,
//           },
//         ],
//       },
//     ],
//   },
// };




//     /* ---------------- SEND ---------------- */
//     const response = await fetch(
//       `https://graph.facebook.com/v22.0/${settings.whatsapp_phone_id}/messages`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${settings.whatsapp_token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(bodyPayload),
//       }
//     );

//     const result = await response.json();

//     if (!response.ok) {
//       console.error("WhatsApp Error:", result);
//       return NextResponse.json({
//         success: false,
//         message: result?.error?.message || "WhatsApp sending failed",
//       });
//     }

//     return NextResponse.json({
//       success: true,
//       message: `WhatsApp sent to ${delegate.name}`,
//     });

//   } catch (err) {
//     console.error("WHATSAPP ERROR:", err);
//     return NextResponse.json({
//       success: false,
//       message: "Server error",
//     });
//   }
// }
