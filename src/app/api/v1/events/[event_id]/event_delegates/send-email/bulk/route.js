export const runtime = "nodejs";

import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { DB_Fetch, Tables } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { decodeURLParam } from "@/helper/utils";

export async function POST(req, context) {
  try {

    /* --------------------------
       DECODE EVENT ID
    ---------------------------*/
    const { event_id } = await context.params;
    const decoded = decodeURLParam(event_id);
    const eventId = Number(decoded);

    if (!eventId) {
      return NextResponse.json({
        success: false,
        message: "Invalid Event ID",
      });
    }

    /* --------------------------
       FETCH ALL DELEGATES
    ---------------------------*/
    const delegates = await DB_Fetch(sql`
      SELECT delegate_id, regn_no, name, phone_number, email
      FROM ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
      WHERE fkevent_id = ${eventId}
        AND active = TRUE
    `);

    if (!delegates.length) {
      return NextResponse.json({
        success: false,
        message: "No delegates found",
      });
    }

    /* --------------------------
       FETCH SMTP SETTINGS
    ---------------------------*/
    const rowSettings = await DB_Fetch(sql`
      SELECT field_name, value
      FROM ${sql.identifier(Tables.TBL_SETTINGS)}
      WHERE setting_group = 'general'
    `);

    const settings = {};
    rowSettings.forEach(r => {
      settings[r.field_name] = r.value;
    });

    if (
      !settings.SMTP_HOST ||
      !settings.SMTP_PORT ||
      !settings.SMTP_USER ||
      !settings.SMTP_PASS
    ) {
      return NextResponse.json({
        success: false,
        message: "SMTP not configured",
      });
    }

    /* --------------------------
       CREATE MAIL TRANSPORTER
    ---------------------------*/
    const transporter = nodemailer.createTransport({
      host: settings.SMTP_HOST,
      port: Number(settings.SMTP_PORT),
      secure: Number(settings.SMTP_PORT) === 465,
      auth: {
        user: settings.SMTP_USER,
        pass: settings.SMTP_PASS,
      },
    });

    /* --------------------------
       SEND EMAILS ONE BY ONE
    ---------------------------*/
    let successCount = 0;
    // let firstSuccessMessage = "";

    for (const d of delegates) {

      if (!d.email) continue;

      const qrText =
        `REGNO:${d.regn_no || ""}\n` +
        `NAME:${d.name || ""}\n` +
        `PHONE:${d.phone_number || ""}\n` +
        `EMAIL:${d.email || ""}`;

      const qrBuffer = await QRCode.toBuffer(qrText);

      await transporter.sendMail({
        from: `"Event Team" <${settings.SMTP_USER}>`,
        to: d.email,
        subject: "Your Event QR Code",
        html: `
          <h3>Hello ${d.name},</h3>
          <p>Your event QR code is attached.</p>
        `,
        attachments: [
          {
            filename: `${d.regn_no || "delegate_qr"}.png`,
            content: qrBuffer,
          },
        ],
      });

      successCount++;

    //   if (!firstSuccessMessage) {
    //     firstSuccessMessage =
    //       `${d.name} (${d.email}) QR sent successfully`;
    //   }
    }

    return NextResponse.json({
      success: true,
      message:
        successCount === 0
          ? "No emails sent"
          : "Emails sent successfully. Total sent: " + successCount,
    });

  } catch (err) {
    console.error("BULK EMAIL ERROR:", err);

    return NextResponse.json({
      success: false,
      message: "Bulk email sending failed",
    }, { status: 500 });
  }
}
