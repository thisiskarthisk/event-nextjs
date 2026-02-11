export const runtime = "nodejs";

import QRCode from "qrcode";
import archiver from "archiver";
import { PassThrough } from "stream";
import { DB_Fetch, Tables } from "@/db";
import { sql } from "drizzle-orm";
import { decodeURLParam } from "@/helper/utils";

/* Filename helper */
function sanitize(name) {
  return name
    ?.toString()
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
}

export async function POST(req, context) {

  const { event_id } = await context.params;
  const decoded = decodeURLParam(event_id);
  const eventId = Number(decoded);

  if (!eventId) {
    return new Response("Invalid Event ID", { status: 400 });
  }

  const { ids } = await req.json();

  if (!ids || !ids.length) {
    return new Response("No delegates selected", { status: 400 });
  }

  const delegates = await DB_Fetch(sql`
    SELECT delegate_id, regn_no, name, phone_number, email
    FROM ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
    WHERE fkevent_id = ${eventId}
      AND delegate_id = ANY(${ids})
    ORDER BY delegate_id ASC
  `);

  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = new PassThrough();

  archive.pipe(stream);

  const usedNames = new Set();

  for (const d of delegates) {

    const qrText =
      `REGNO:${d.regn_no || ""}\n` +
      `NAME:${d.name || ""}\n` +
      `PHONE:${d.phone_number || ""}\n` +
      `EMAIL:${d.email || ""}`;

    const buffer = await QRCode.toBuffer(qrText, {
      width: 600,
      margin: 2,
    });

    let fileName;

    if (d.regn_no) {
      fileName = sanitize(d.regn_no);
    } else if (d.name) {
      fileName = sanitize(d.name);
      if (usedNames.has(fileName) && d.phone_number) {
        fileName = `${fileName}_${d.phone_number}`;
      }
    } else {
      fileName = `delegate_${d.delegate_id}`;
    }

    usedNames.add(fileName);

    archive.append(buffer, {
      name: `${fileName}.png`,
    });
  }

  await archive.finalize();

  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition":
        `attachment; filename=selected-delegates-qr.zip`,
    },
  });
}
