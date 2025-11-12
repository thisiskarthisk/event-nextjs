export const runtime = "nodejs";

import { NextResponse } from "next/server";
import csv from "csv-parser";
import { Readable } from "stream";
import { DB_Insert, DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

/**
 * Helper: Parse CSV buffer → JSON
 */
async function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());
    stream
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

/**
 * POST /api/v1/organizationChart/upload
 * Upload CSV and insert roles + users
 */
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return JsonResponse.error("No file uploaded", 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const rows = await parseCSV(buffer);

    if (!rows.length || !rows[0]?.name) {
      return JsonResponse.error("Invalid CSV format — must include 'name' column", 422);
    }

    const roleMap = {}; // name → id

    /** 1️⃣ Insert all roles first */
    for (const row of rows) {
      const name = row.name?.trim();
      if (!name) continue;

      // insert without "active" (it has DEFAULT true)
      const insertedRole = await DB_Fetch(sql`
        INSERT INTO ${sql.identifier(Tables.TBL_ROLES)} (name)
        VALUES (${name})
        RETURNING id
      `);

      roleMap[name] = insertedRole[0].id;
    }

    /** 2️⃣ Update reporting_to hierarchy */
    for (const row of rows) {
      const name = row.name?.trim();
      const reportingTo = row.reporting_to?.trim();
      if (reportingTo && roleMap[reportingTo]) {
        await DB_Insert(sql`
          UPDATE ${sql.identifier(Tables.TBL_ROLES)}
          SET reporting_to = ${roleMap[reportingTo]}
          WHERE id = ${roleMap[name]}
        `);
      }
    }

    /** 3️⃣ Insert users and assign them to roles */
    for (const row of rows) {
      const roleName = row.name?.trim();
      const users = row.users?.split(",").map(u => u.trim()).filter(Boolean);
      const roleId = roleMap[roleName];
      if (!roleId || !users?.length) continue;

      for (const firstName of users) {
        if (!firstName) continue;

        // Check if user already exists
        const existing = await DB_Fetch(sql`
          SELECT id FROM ${sql.identifier(Tables.TBL_USERS)}
          WHERE LOWER(first_name) = LOWER(${firstName})
          LIMIT 1
        `);

        let userId;
        if (existing.length > 0) {
          userId = existing[0].id;
        } else {
          const newUser = await DB_Fetch(sql`
            INSERT INTO ${sql.identifier(Tables.TBL_USERS)}
              (user_type, first_name, email, password)
            VALUES
              ('employee', ${firstName}, ${firstName.toLowerCase()} || '@company.com', 'password123')
            RETURNING id
          `);
          userId = newUser[0].id;
        }

        // Link user to role
        await DB_Insert(sql`
          INSERT INTO ${sql.identifier(Tables.TBL_ROLE_USERS)} (role_id, user_id)
          VALUES (${roleId}, ${userId})
        `);
      }
    }

    return JsonResponse.success({}, "✅ CSV uploaded and organization chart data inserted successfully!");
  } catch (error) {
    console.error("[api/v1/organizationChart/upload] Error:", error);
    return JsonResponse.error("Error processing CSV upload: " + error.message, 500);
  }
}
