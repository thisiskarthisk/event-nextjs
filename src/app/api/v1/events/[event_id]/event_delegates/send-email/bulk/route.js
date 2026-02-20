export const runtime = "nodejs";

import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { DB_Fetch, Tables } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { decodeURLParam } from "@/helper/utils";
import fs from "fs";
import path from "path";

export async function POST(req, context) {
  try {
    const { event_id } = await context.params;
    const eventId = Number(decodeURLParam(event_id));

    // 1. Fetch All Active Delegates
    const delegates = await DB_Fetch(sql`
      SELECT delegate_id, regn_no, name, email
      FROM ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
      WHERE fkevent_id = ${eventId} AND active = TRUE
    `);

    if (!delegates.length) return NextResponse.json({ success: false, message: "No delegates found" });

    // 2. Folder Setup
    const publicDir = path.join(process.cwd(), "public", "qr", String(eventId));
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    // 3. SMTP Settings
    const rowSettings = await DB_Fetch(sql`SELECT field_name, value FROM ${sql.identifier(Tables.TBL_SETTINGS)} WHERE fkevent_id = ${eventId} AND setting_group = 'general'`);
    const dbSettings = Object.fromEntries(rowSettings.map(r => [r.field_name, r.value]));

    const SMTP_HOST = dbSettings.SMTP_HOST || process.env.SMTP_HOST;
    const SMTP_PORT = dbSettings.SMTP_PORT || process.env.SMTP_PORT;
    const SMTP_USER = dbSettings.SMTP_USER || process.env.SMTP_USER;
    const SMTP_PASS = dbSettings.SMTP_PASS || process.env.SMTP_PASS;


    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      return NextResponse.json(
        {
          success: false,
          message: "Email configuration missing. Please configure SMTP settings."
        },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure:  Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    // 4. Bulk Process
    let count = 0;
    for (const d of delegates) {
      if (!d.email) continue;
      const filePath = path.join(publicDir, `${d.delegate_id}.png`);
      await QRCode.toFile(filePath, `REGNO:${d.regn_no || d.delegate_id}`);

      await transporter.sendMail({
        from: `"Proflujo Event Team" <${SMTP_PASS}>`,
        to: d.email,
        subject: "Your Event Entry QR Code",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Dear <strong>${d.name}</strong>,</p>
            
            <p>You are invited to our event.</p>
            
            <p>Please scan the QR code attached below.</p>
            
            <p style="color: #d9534f; font-weight: bold;">
              Do not share this QR as it is meant only for you 🙏
            </p>
            
            <br />
            <p>Best Regards,<br />
            Proflujo Event Management Team</p>
          </div>
        `,
        attachments: [
          {
            filename: `${d.regn_no || "entry_pass"}.png`,
            path: filePath, // This uses the folder-based path you created earlier
          },
        ],
      });
      count++;
    }

    return NextResponse.json({ success: true, message: `Bulk emails sent: ${count}` });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}