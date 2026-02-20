export const runtime = "nodejs";

import QRCode from "qrcode";
import { DB_Fetch, Tables } from "@/db";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { decodeURLParam } from "@/helper/utils";

/* --------------------------
   Sanitize filename helper
---------------------------*/
function sanitize(name) {
  return name
    ?.toString()
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
}

export async function GET(req, context) {
  try {

    const { event_id, delegate_id } = await context.params;

    const decoded = decodeURLParam(event_id);
    const eventId = Number(decoded);
    const delegateId = Number(delegate_id);

    if (!eventId || !delegateId) {
      return NextResponse.json(
        { success: false, message: "Invalid IDs" },
        { status: 400 }
      );
    }

    const rows = await DB_Fetch(sql`
      SELECT
        delegate_id,
        regn_no,
        name,
        phone_number,
        email
      FROM ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
      WHERE delegate_id = ${delegateId}
        AND fkevent_id = ${eventId}
    `);

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: "Delegate not found" },
        { status: 404 }
      );
    }

    const d = rows[0];

    /* --------------------------
       QR DATA
    ---------------------------*/
    const qrText =
      `REGNO:${d.regn_no || ""}\n` +
      `NAME:${d.name || ""}\n` +
      `PHONE:${d.phone_number || ""}\n` +
      `EMAIL:${d.email || ""}`;

    const buffer = await QRCode.toBuffer(qrText, {
      width: 600,
      margin: 2,
    });

    /* --------------------------
       FILE NAME LOGIC
    ---------------------------*/
    let finalName;

    // 1️⃣ Priority → REGN NO
    if (d.regn_no && d.regn_no.trim() !== "") {
      finalName = sanitize(d.regn_no);
    }
    else {
      // 2️⃣ Name fallback
      let baseName = sanitize(d.name);

      if (!baseName) {
        baseName = `delegate_${d.delegate_id}`;
      }

      finalName = baseName;

      // If duplicate name possibility (safe fallback)
      if (d.phone_number) {
        finalName = `${baseName}_${d.phone_number}`;
      }
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename=${finalName}.png`,
      },
    });

  } catch (err) {
    console.error("SINGLE QR ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}


// export const runtime = "nodejs";

// import QRCode from "qrcode";
// import nodemailer from "nodemailer";
// import { DB_Fetch, Tables } from "@/db";
// import { NextResponse } from "next/server";
// import { sql } from "drizzle-orm";
// import { decodeURLParam } from "@/helper/utils";

// export async function GET(req, context) {
//   try {

//     const { event_id, delegate_id } = context.params;

//     const decoded = decodeURLParam(event_id);
//     const eventId = Number(decoded);
//     const delegateId = Number(delegate_id);

//     if (!eventId || !delegateId) {
//       return NextResponse.json(
//         { success: false, message: "Invalid IDs" },
//         { status: 400 }
//       );
//     }

//     /* --------------------------
//        FETCH DELEGATE
//     ---------------------------*/
//     const rows = await DB_Fetch(sql`
//       SELECT
//         delegate_id,
//         regn_no,
//         name,
//         phone_number,
//         email
//       FROM ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
//       WHERE delegate_id = ${delegateId}
//         AND fkevent_id = ${eventId}
//     `);

//     if (!rows.length) {
//       return NextResponse.json(
//         { success: false, message: "Delegate not found" },
//         { status: 404 }
//       );
//     }

//     const d = rows[0];

//     if (!d.email) {
//       return NextResponse.json(
//         { success: false, message: "Email not available" },
//         { status: 400 }
//       );
//     }

//     /* --------------------------
//        GENERATE QR
//     ---------------------------*/
//     const qrText =
//       `REGNO:${d.regn_no || ""}\n` +
//       `NAME:${d.name || ""}\n` +
//       `PHONE:${d.phone_number || ""}\n` +
//       `EMAIL:${d.email || ""}`;

//     const qrBuffer = await QRCode.toBuffer(qrText, {
//       width: 600,
//       margin: 2,
//     });


//      // 🔥 fetch REGN setting
//     const rowSettings = await DB_Fetch(sql`
//       SELECT field_name, value
//       FROM ${sql.identifier(Tables.TBL_SETTINGS)}
//       WHERE setting_group = 'general'
//     `);

//     const settings = {};

//     rowSettings.forEach(r => {
//       settings[r.field_name] = r.value;
//     });

//     /* --------------------------
//        EMAIL CONFIG
//     ---------------------------*/

//     const transporter = nodemailer.createTransport({
//       host: settings.SMTP_HOST,      // e.g. smtp.gmail.com
//       port: settings.SMTP_PORT,      // 587
//       secure: false,
//       auth: {
//         user: settings.SMTP_USER,
//         pass: settings.SMTP_PASS,
//       },
//     });

//     await transporter.sendMail({
//       from: `"Event Team" <${settings.SMTP_USER}>`,
//       to: d.email,
//       subject: "Your Event QR Code",
//       html: `
//         <h3>Hello ${d.name},</h3>
//         <p>Please find your event QR code attached.</p>
//         <p>Thank you.</p>
//       `,
//       attachments: [
//         {
//           filename: `${d.regn_no || "delegate_qr"}.png`,
//           content: qrBuffer,
//         },
//       ],
//     });

//     return NextResponse.json({
//       success: true,
//       message: "QR sent successfully to delegate email",
//     });

//   } catch (err) {
//     console.error("EMAIL SEND ERROR:", err);
//     return NextResponse.json(
//       { success: false, message: "Email sending failed" },
//       { status: 500 }
//     );
//   }
// }