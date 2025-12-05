export const runtime = "nodejs";

import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";
import csv from "csv-parser";
import { Readable } from "stream";
import bcrypt from "bcrypt";

// Robust column value extractor (case/trim insensitive)
function getVal(row, key) {
  for (const k in row) {
    if (k.trim().toLowerCase() === key.trim().toLowerCase()) {
      return (row[k] || "").toString().trim();
    }
  }
  return "";
}

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

    // ---- Header check (case/trim sensitive)
    const headerKeys = Object.keys(rows[0] || {})
      .map((k) => k.trim().toLowerCase());
    const hasEmployeeId = headerKeys.includes("employee id");
    const hasEmail = headerKeys.includes("email") || headerKeys.includes("email address");
    const hasMobileNo = headerKeys.includes("mobile no");

    if (!hasEmployeeId || !hasEmail || !hasMobileNo) {
      return JsonResponse.error(
        "Invalid CSV format — required columns: Employee Id, Email, Mobile No",
        422
      );
    }

    const parsedRows = [];
    const empMap = {};
    const emailMap = {};
    const mobileMap = {};

    // ---- Parse each row, extract values and build maps
    rows.forEach((raw, idx) => {
      const rowNumber = idx + 2;
      const employeeId = getVal(raw, "employee id");
      // Accept both "email" and "email address" for robustness
      const email = getVal(raw, "email") || getVal(raw, "email address");
      const mobile = getVal(raw, "mobile no");
      const firstName = getVal(raw, "first name");
      const lastName = getVal(raw, "last name");
      const password = getVal(raw, "password");

      if (
        !employeeId && !email && !mobile &&
        !firstName && !lastName && !password
      ) return;

      parsedRows.push({
        rowNumber,
        employeeId, email, mobile, firstName, lastName, password,
      });

      const empKey = employeeId.toLowerCase();
      const emailKey = email.toLowerCase();
      const mobileKey = mobile;

      if (employeeId) {
        if (!empMap[empKey]) empMap[empKey] = [];
        empMap[empKey].push(rowNumber);
      }
      if (email) {
        if (!emailMap[emailKey]) emailMap[emailKey] = [];
        emailMap[emailKey].push(rowNumber);
      }
      if (mobile) {
        if (!mobileMap[mobileKey]) mobileMap[mobileKey] = [];
        mobileMap[mobileKey].push(rowNumber);
      }
    });

    // ---- Rule 1: Missing fields
    const missingFields = [];
    parsedRows.forEach((r) => {
      const missing = [];
      if (!r.employeeId) missing.push("Employee Id");
      if (!r.email) missing.push("Email");
      if (!r.mobile) missing.push("Mobile No");
      if (missing.length) {
        missingFields.push({ row: r.rowNumber, missing });
      }
    });

    // ---- Rule 2: Duplicate in CSV
    const csvDuplicates = [];
    function collectDuplicatesFromMap(map, fieldName) {
      Object.entries(map)
        .filter(([val, rowsArr]) => val && rowsArr.length > 1)
        .forEach(([val, rowsArr]) => {
          rowsArr.forEach((rowNumber) => {
            csvDuplicates.push({ row: rowNumber, field: fieldName, value: val });
          });
        });
    }
    collectDuplicatesFromMap(empMap, "Employee Id");
    collectDuplicatesFromMap(emailMap, "Email");
    collectDuplicatesFromMap(mobileMap, "Mobile No");

    // ---- Rule 3: Duplicate in DB
    const dbDuplicates = [];
    const empArr = Object.keys(empMap).filter(Boolean);
    const emailArr = Object.keys(emailMap).filter(Boolean);
    const mobileArr = Object.keys(mobileMap).filter(Boolean);

    const whereClauses = [];
    if (empArr.length)
      whereClauses.push(
        empArr.map((e) => sql`LOWER(employee_id) = LOWER(${e})`).reduce((a, b) => sql`${a} OR ${b}`)
      );
    if (emailArr.length)
      whereClauses.push(
        emailArr.map((e) => sql`LOWER(email) = LOWER(${e})`).reduce((a, b) => sql`${a} OR ${b}`)
      );
    if (mobileArr.length)
      whereClauses.push(
        mobileArr.map((m) => sql`mobile_no = ${m}`).reduce((a, b) => sql`${a} OR ${b}`)
      );

    if (whereClauses.length) {
      const finalWhere =
        whereClauses.length === 1
          ? whereClauses[0]
          : whereClauses.slice(1).reduce((acc, clause) => sql`${acc} OR ${clause}`, whereClauses[0]);
      const existing = await DB_Fetch(sql`
        SELECT employee_id, email, mobile_no
        FROM ${sql.raw(Tables.TBL_USERS)}
        WHERE ${finalWhere}
      `);
      const existingEmp = new Set(existing.map((u) => (u.employee_id || "").toLowerCase()));
      const existingEmail = new Set(existing.map((u) => (u.email || "").toLowerCase()));
      const existingMobile = new Set(existing.map((u) => u.mobile_no || ""));
      parsedRows.forEach((r) => {
        if (r.employeeId && existingEmp.has(r.employeeId.toLowerCase())) {
          dbDuplicates.push({ row: r.rowNumber, field: "Employee Id", value: r.employeeId });
        }
        if (r.email && existingEmail.has(r.email.toLowerCase())) {
          dbDuplicates.push({ row: r.rowNumber, field: "Email", value: r.email });
        }
        if (r.mobile && existingMobile.has(r.mobile)) {
          dbDuplicates.push({ row: r.rowNumber, field: "Mobile No", value: r.mobile });
        }
      });
    }

    // ---- If any errors, return error JSON for frontend row display
    if (missingFields.length || csvDuplicates.length || dbDuplicates.length) {
      return JsonResponse.error("Validation errors in CSV", 422, {
        type: "validation_errors",
        errors: { missingFields, csvDuplicates, dbDuplicates },
      });
    }

    // ---- Row insert (actual bcrypt password hash)
    const rowsToInsert = parsedRows.filter(
      (r) => r.employeeId && r.email && r.mobile
    );
    for (const r of rowsToInsert) {
      const plainPassword = r.password || "letmein!";
      // const hash = await bcrypt.hash(plainPassword, 10); // bcryptjs async hash
      const hash = await bcrypt.hash(plainPassword, 10);
      await DB_Fetch(sql`
        INSERT INTO ${sql.raw(Tables.TBL_USERS)}
          (employee_id, first_name, last_name, email, mobile_no, password, active)
        VALUES (${r.employeeId}, ${r.firstName}, ${r.lastName}, ${r.email}, ${r.mobile}, ${hash}, TRUE)
      `);
    }

    return JsonResponse.success({}, "CSV uploaded successfully — users inserted.");
  } catch (err) {
    console.error("USERS CSV UPLOAD ERROR:", err);
    return JsonResponse.error("Server error: " + err.message, 500);
  }
}
