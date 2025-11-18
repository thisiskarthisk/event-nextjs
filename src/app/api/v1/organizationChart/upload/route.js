export const runtime = "nodejs";

import { DB_Fetch, Tables } from "@/db"; // Assuming Tables is imported here
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";
import csv from "csv-parser";
import { Readable } from "stream";

/** Parse uploaded CSV into array of objects */
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
      return JsonResponse.error("No file uploaded", 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const rows = await parseCSV(buffer);

    if (!rows.length) {
      return JsonResponse.error("Empty CSV file", 422);
    }

    // Validate header
    const headerKeys = Object.keys(rows[0] || {}).map(k => k.toLowerCase());
    if (!headerKeys.includes("name")) {
      return JsonResponse.error("Invalid CSV format — missing 'name' column", 422);
    }

    // Normalize rows
    const parsedRows = [];
    const userSet = new Set();
    const csvRoleNames = new Set(); // To check for duplicates within the CSV itself

    rows.forEach((raw, idx) => {
      const rowNumber = idx + 2;
      const name = (raw.name || "").toString().trim();
      if (!name) return;

      const reporting_to = raw.reporting_to ? String(raw.reporting_to).trim() : "";
      const usersArr = raw.users
        ? raw.users.toString().split(",").map(u => u.trim()).filter(Boolean)
        : [];

      parsedRows.push({
        rowNumber,
        name,
        reporting_to,
        users: usersArr,
      });

      csvRoleNames.add(name.toLowerCase()); // Add role name for validation checks
      usersArr.forEach(u => userSet.add(u));
    });

    // RULE 1: Role not assigned (Keep existing rule)
    const roleNotAssigned = parsedRows
      .filter(r => !r.users.length)
      .map(r => ({ row: r.rowNumber, role: r.name }));

    // ⭐️ RULE 2: Duplicate Role Check (Active Roles Only)
    const duplicateRoles = [];
    if (csvRoleNames.size > 0) {
      const roleNamesArray = Array.from(csvRoleNames);

      // Fetch all ACTIVE roles from DB that match any name in the CSV
      const whereClause = roleNamesArray
        .map(n => sql`LOWER(name) = LOWER(${n})`)
        .reduce((a, b) => sql`${a} OR ${b}`);

      const existingActiveRoles = await DB_Fetch(sql`
        SELECT name FROM ${sql.raw(Tables.TBL_ROLES)}
        WHERE active = TRUE AND (${whereClause})
      `);

      const activeRoleSet = new Set(existingActiveRoles.map(r => r.name.toLowerCase()));

      // Identify roles in the CSV that are duplicates of active roles in the DB
      parsedRows.forEach(r => {
        if (activeRoleSet.has(r.name.toLowerCase())) {
          // Check for *new* duplicates. If a role in the CSV is active in DB,
          // it's a conflict unless it's only in the CSV once.
          // For simplicity and to match the 'row-base' requirement,
          // we treat its presence in the CSV as a potential insertion/update conflict.
          // Since the instruction is to "show error row base Duplicate Role",
          // we flag all rows that contain a conflicting active role.
          duplicateRoles.push({ row: r.rowNumber, role: r.name, reason: "Active role already exists in database" });
        }
      });
      // OPTIONAL: Add check for duplicates *within* the CSV file itself (e.g., same role name in multiple rows)
      const csvInternalDupes = {};
      parsedRows.forEach(r => {
        const lowerName = r.name.toLowerCase();
        csvInternalDupes[lowerName] ??= [];
        csvInternalDupes[lowerName].push(r.rowNumber);
      });
      Object.entries(csvInternalDupes)
          .filter(([_, rows]) => rows.length > 1)
          .forEach(([name, rows]) => {
              rows.forEach(row => {
                  duplicateRoles.push({ row, role: name, reason: "Duplicate role name within CSV file" });
              });
          });
    }

    // --- (Original User/Role Assignment Checks Follow) ---

    // RULE 3: Missing Users Check (Keep existing rule)
    const missingUsers = [];
    if (userSet.size > 0) {
      const namesArray = Array.from(userSet);
      const whereClause = namesArray
        .map(n => sql`LOWER(first_name) = LOWER(${n})`)
        .reduce((a, b) => sql`${a} OR ${b}`);

      const usersQuery = await DB_Fetch(sql`
        SELECT id, first_name FROM ${sql.raw(Tables.TBL_USERS)}
        WHERE active = TRUE AND (${whereClause})
      `);

      const existingSet = new Set(usersQuery.map(u => u.first_name.toLowerCase()));

      parsedRows.forEach(r => {
        r.users.forEach(u => {
          if (!existingSet.has(u.toLowerCase())) {
            missingUsers.push({ row: r.rowNumber, user: u });
          }
        });
      });
    }

    // RULE 4: Duplicate users across roles (Keep existing rule)
    const userMap = {};
    parsedRows.forEach(r => {
      r.users.forEach(uname => {
        const key = uname.toLowerCase();
        userMap[key] ??= [];
        userMap[key].push({ row: r.rowNumber, role: r.name, user: uname });
      });
    });

    const duplicateUsers = Object.entries(userMap)
      .filter(([_, arr]) => arr.length > 1)
      .map(([_, arr]) => ({
        row: arr[0].row,
        user: arr[0].user,
        roles: arr.map(e => e.role),
      }));

    // Return validation errors
    if (roleNotAssigned.length || duplicateRoles.length || missingUsers.length || duplicateUsers.length) {
      return JsonResponse.error("Validation errors in CSV", 422, {
        type: "validation_errors",
        errors: { 
            roleNotAssigned, 
            duplicateRoles, // ⭐️ Add new error type
            missingUsers, 
            duplicateUsers 
        },
      });
    }


  // INSERT NEW ROLES ONLY 
  // (Deactivate old records first – never reuse old ones)
  // -----------------------------
    // const roleNames = new Set();
    // parsedRows.forEach(r => {
    //   roleNames.add(r.name);
    //   if (r.reporting_to) roleNames.add(r.reporting_to);
    // });

    // const roleMap = {};

    // for (const roleName of roleNames) {

    //   // 1️⃣ Deactivate all old roles with same name
    //   await DB_Fetch(sql`
    //     UPDATE ${sql.raw(Tables.TBL_ROLES)}
    //     SET active = FALSE, updated_at = NOW()
    //     WHERE LOWER(name) = LOWER(${roleName})
    //   `);

    //   // 2️⃣ Insert new role
    //   const inserted = await DB_Fetch(sql`
    //     INSERT INTO ${sql.raw(Tables.TBL_ROLES)} (name, active, created_at)
    //     VALUES (${roleName}, TRUE, NOW())
    //     RETURNING id
    //   `);

    //   roleMap[roleName] = inserted[0].id;
    // }

    // -----------------------------
    // INSERT NEW ROLES ONLY (Do NOT reactivate old roles)
    // -----------------------------
    const roleNames = new Set();
    parsedRows.forEach(r => {
      roleNames.add(r.name);
      if (r.reporting_to) roleNames.add(r.reporting_to);
    });

    const roleMap = {};

    for (const roleName of roleNames) {
      // Always insert NEW entry
      const inserted = await DB_Fetch(sql`
        INSERT INTO ${sql.raw(Tables.TBL_ROLES)} (name, active)
        VALUES (${roleName}, TRUE)
        RETURNING id
      `);

      roleMap[roleName] = inserted[0].id;
    }

    // Update reporting_to
    for (const r of parsedRows) {
      const parent = roleMap[r.reporting_to];
      const child = roleMap[r.name];

      if (parent && child) {
        await DB_Fetch(sql`
          UPDATE ${sql.raw(Tables.TBL_ROLES)} SET reporting_to = ${parent} WHERE id = ${child}
        `);
      }
    }

    // -----------------------------
    // ASSIGN USERS TO ROLES (Use TBL_USERS and TBL_ROLE_USERS)
    // -----------------------------
    const allUserNames = Array.from(userSet);

    const usersData = allUserNames.length
      ? await DB_Fetch(sql`
          SELECT id, first_name FROM ${sql.raw(Tables.TBL_USERS)}
          WHERE ${allUserNames.map(n => sql`LOWER(first_name) = LOWER(${n})`).reduce((a, b) => sql`${a} OR ${b}`)}
        `)
      : [];

    const nameMap = {};
    usersData.forEach(u => {
      nameMap[u.first_name.toLowerCase()] = u.id;
    });

    for (const r of parsedRows) {
      const roleId = roleMap[r.name];

      for (const uname of r.users) {
        const uid = nameMap[uname.toLowerCase()];
        if (!uid) continue;

        const existingMap = await DB_Fetch(sql`
          SELECT id, active FROM ${sql.raw(Tables.TBL_ROLE_USERS)}
          WHERE role_id = ${roleId} AND user_id = ${uid}
          LIMIT 1
        `);

        if (existingMap.length > 0) {
          if (!existingMap[0].active) {
            await DB_Fetch(sql`
              UPDATE ${sql.raw(Tables.TBL_ROLE_USERS)} SET active = TRUE, updated_at = NOW()
              WHERE id = ${existingMap[0].id}
            `);
          }
        } else {
          await DB_Fetch(sql`
            INSERT INTO ${sql.raw(Tables.TBL_ROLE_USERS)} (role_id, user_id, active)
            VALUES (${roleId}, ${uid}, TRUE)
          `);
        }
      }
    }

    return JsonResponse.success(
      {},
      "CSV uploaded successfully — roles & users updated."
    );

  } catch (err) {
    console.error("CSV UPLOAD ERROR:", err);
    // Use Tables in catch error log if possible, but keep original for simplicity
    return JsonResponse.error("Server error: " + err.message, 500);
  }
}