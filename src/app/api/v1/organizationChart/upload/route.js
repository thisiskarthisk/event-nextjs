export const runtime = "nodejs";

import { DB_Fetch } from "@/db";
import { JsonResponse } from "@/helper/api"; // optional, not relied on for validation return
import { sql } from "drizzle-orm";
import csv from "csv-parser";
import { Readable } from "stream";

/** Helper: Parse CSV buffer -> array of rows (csv-parser outputs an array of objects) */
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

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify({ success: false, message: "No file uploaded" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const rows = await parseCSV(buffer);

    if (!rows.length) {
      return new Response(JSON.stringify({ success: false, message: "Empty CSV file" }), { status: 422, headers: { "Content-Type": "application/json" } });
    }

    // require 'name' column
    const headerKeys = Object.keys(rows[0] || {}).map((k) => (k || "").toLowerCase());
    if (!headerKeys.includes("name")) {
      return new Response(JSON.stringify({ success: false, message: "Invalid CSV format — must include 'name' column" }), { status: 422, headers: { "Content-Type": "application/json" } });
    }

    // Normalize rows and preserve CSV row number (data row 2 = first data line)
    const parsedRows = []; // { rowNumber, name, reporting_to, users: [] }
    const userSet = new Set();

    rows.forEach((raw, idx) => {
      const rowNumber = idx + 2;
      const name = (raw.name || "").toString().trim();
      // If role name blank, treat as skip but still can report user-related errors? we skip empty rows
      if (!name) return;

      const reporting_to = raw.reporting_to ? String(raw.reporting_to).trim() : "";
      const usersArr = raw.users
        ? raw.users
            .toString()
            .split(",")
            .map((u) => String(u).trim())
            .filter(Boolean)
        : [];

      parsedRows.push({
        rowNumber,
        name,
        reporting_to,
        users: usersArr,
      });

      usersArr.forEach((u) => userSet.add(u));
    });

    // RULE 1: Role Not Assigned (users empty)
    const roleNotAssigned = parsedRows
      .filter((r) => !r.users || r.users.length === 0)
      .map((r) => ({ row: r.rowNumber, role: r.name }));

    // RULE 3: Duplicate in CSV (same username appears in multiple rows -> multiple roles)
    // Build map: lowerUser -> array of { row, role, originalUser }
    const userMap = {};
    for (const r of parsedRows) {
      for (const uname of r.users) {
        const key = (uname || "").toLowerCase();
        if (!key) continue;
        userMap[key] ??= [];
        userMap[key].push({ row: r.rowNumber, role: r.name, user: uname });
      }
    }

    const duplicateUsers = Object.entries(userMap)
      .filter(([_, arr]) => arr.length > 1)
      .map(([key, arr]) => ({
        // choose first occurrence row to display the row number
        row: arr[0].row,
        user: arr[0].user,
        roles: arr.map((e) => e.role),
      }));

    // RULE 2: User exists check — find missing users
    const missingUsers = [];
    if (userSet.size > 0) {
      const namesArray = Array.from(userSet);
      // Build where clause safely via drizzle sql fragments
      const whereClause = namesArray
        .map((n) => sql`LOWER(first_name) = LOWER(${n})`)
        .reduce((a, b) => sql`${a} OR ${b}`);

      const usersQuery = await DB_Fetch(sql`
        SELECT id, first_name
        FROM users
        WHERE active = TRUE
        AND ( ${whereClause} )
      `);

      const existingLowerSet = new Set((usersQuery || []).map((u) => (u.first_name || "").toLowerCase()));

      // for each parsed row, for each user check existence
      for (const r of parsedRows) {
        for (const uname of r.users) {
          if (!existingLowerSet.has((uname || "").toLowerCase())) {
            missingUsers.push({ row: r.rowNumber, user: uname });
          }
        }
      }
    }

    // If any validation errors found, return them together
    if (roleNotAssigned.length || missingUsers.length || duplicateUsers.length) {
      const payload = {
        type: "validation_errors",
        errors: {
          roleNotAssigned,   // [{row, role}, ...]
          missingUsers,      // [{row, user}, ...]
          duplicateUsers,    // [{row, user, roles: [...]}, ...]
        },
      };
      return new Response(JSON.stringify({ success: false, message: "Validation errors in CSV", data: payload }), { status: 422, headers: { "Content-Type": "application/json" } });
    }

    // No validation errors — proceed with DB work (insert/update roles + assign users)
    // -- Insert roles if missing, update reporting_to, assign users (your existing logic)
    const roleNames = new Set();
    parsedRows.forEach((r) => {
      roleNames.add(r.name);
      if (r.reporting_to) roleNames.add(r.reporting_to);
    });

    const roleMap = {};
    for (const roleName of Array.from(roleNames)) {
      const existingRole = await DB_Fetch(sql`
        SELECT id FROM roles WHERE LOWER(name) = LOWER(${roleName}) LIMIT 1
      `);
      if (existingRole.length > 0) {
        roleMap[roleName] = existingRole[0].id;
      } else {
        const inserted = await DB_Fetch(sql`
          INSERT INTO roles (name, active)
          VALUES (${roleName}, TRUE)
          RETURNING id
        `);
        roleMap[roleName] = inserted[0].id;
      }
    }

    for (const r of parsedRows) {
      const parentId = roleMap[r.reporting_to];
      const thisId = roleMap[r.name];
      if (parentId && thisId) {
        await DB_Fetch(sql`
          UPDATE roles SET reporting_to = ${parentId} WHERE id = ${thisId}
        `);
      }
    }

    // Assign users to roles (users are guaranteed to exist now)
    const allUserNames = Array.from(userSet);
    const usersData = allUserNames.length
      ? await DB_Fetch(sql`
          SELECT id, first_name FROM users
          WHERE ${allUserNames.map((n) => sql`LOWER(first_name) = LOWER(${n})`).reduce((a, b) => sql`${a} OR ${b}`)}
        `)
      : [];

    const nameToId = {};
    for (const u of usersData) {
      nameToId[(u.first_name || "").toLowerCase()] = u.id;
    }

    for (const r of parsedRows) {
      const roleId = roleMap[r.name];
      if (!roleId) continue;
      for (const uname of r.users) {
        const uid = nameToId[(uname || "").toLowerCase()];
        if (!uid) continue;

        const existingMap = await DB_Fetch(sql`
          SELECT id, active FROM role_users
          WHERE role_id = ${roleId} AND user_id = ${uid}
          LIMIT 1
        `);

        if (existingMap.length > 0) {
          if (!existingMap[0].active) {
            await DB_Fetch(sql`
              UPDATE role_users SET active = TRUE, updated_at = NOW() WHERE id = ${existingMap[0].id}
            `);
          }
        } else {
          await DB_Fetch(sql`
            INSERT INTO role_users (role_id, user_id, active)
            VALUES (${roleId}, ${uid}, TRUE)
          `);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, message: "CSV uploaded successfully — roles and user assignments created." }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[api/v1/organizationChart/upload] Error:", err);
    return new Response(JSON.stringify({ success: false, message: "Error processing CSV upload: " + (err?.message || String(err)) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
