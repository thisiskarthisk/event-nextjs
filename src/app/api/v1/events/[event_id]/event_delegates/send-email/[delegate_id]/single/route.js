export const runtime = "nodejs";

import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { DB_Fetch, Tables } from "@/db";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { decodeURLParam } from "@/helper/utils";

export async function POST(req, context) {
  try {

    // const { event_id, delegate_id } = params;
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
    
    /* -------- FETCH DELEGATE -------- */

    const rows = await DB_Fetch(sql`
      SELECT regn_no, name, phone_number, email
      FROM ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
      WHERE delegate_id = ${delegateId}
        AND fkevent_id = ${eventId}
    `);

    if (!rows.length)
      return NextResponse.json({ success: false, message: "Delegate not found" });

    const d = rows[0];

    if (!d.email)
      return NextResponse.json({ success: false, message: "Email not available" });

    /* -------- GENERATE QR -------- */

    const qrText =
      `REGNO:${d.regn_no}\n` +
      `NAME:${d.name}\n` +
      `PHONE:${d.phone_number}\n` +
      `EMAIL:${d.email}`;

    const qrBuffer = await QRCode.toBuffer(qrText);

    /* -------- FETCH SMTP SETTINGS -------- */

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

    /* -------- SEND EMAIL -------- */

    const transporter = nodemailer.createTransport({
      host: settings.SMTP_HOST,
      port: Number(settings.SMTP_PORT),
      secure: Number(settings.SMTP_PORT) === 465,
      auth: {
        user: settings.SMTP_USER,
        pass: settings.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Event Team" <${settings.SMTP_USER}>`,
      to: d.email,
      subject: "Your Event QR Code",
      html: `
        <h3>Hello ${d.name},</h3>
        <p>Please find your event QR code attached.</p>
      `,
      attachments: [
        {
          filename: `${d.regn_no}.png`,
          content: qrBuffer,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "QR sent successfully",
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({
      success: false,
      message: "Email sending failed",
    });
  }
}
