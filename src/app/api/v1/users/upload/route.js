export const runtime = "nodejs";

import { DB_Fetch, DB_Insert, Tables } from "@/db"; // Added DB_Insert for clarity
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

/**
 * Checks the settings table to see if the Employee ID auto-generation is configured.
 * @returns {Promise<{autoGenerate: boolean, prefix: string, digits: number}>} Status and configuration.
 */

async function getEmployeeIdAutoConfig() {
    const config = { autoGenerate: false, prefix: "", digits: 0 };
    
    const settingResults = await DB_Fetch(sql`
        SELECT value FROM ${sql.identifier(Tables.TBL_SETTINGS)}
        WHERE setting_group = 'general' AND field_name = 'employee_id'
    `);

    const settingValue = settingResults?.[0]?.value;

    if (settingValue) {
        const [prefix, digitsStr] = settingValue.split(',');
        const digits = parseInt(digitsStr, 10);
        
        if (prefix && !isNaN(digits) && digits > 0) {
            config.autoGenerate = true;
            config.prefix = prefix.trim();
            config.digits = digits;
        }
    }
    return config;
}

// ⚠️ WARNING: This function is for calculating the starting point of the sequence.
// It is NOT used inside the loop due to performance/race condition issues.
async function getNextSequentialId() {
    try {
        const lastRecord = await DB_Fetch(sql`
            SELECT id FROM ${sql.identifier(Tables.TBL_USERS)} ORDER BY id DESC LIMIT 1
        `);
        return lastRecord.length > 0 ? Number(lastRecord[0].id) + 1 : 1;
    } catch (err) {
        console.error("Error fetching last user ID:", err);
        return 1;
    }
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

    // 1. Check Auto-Generation Setting and get config
    const config = await getEmployeeIdAutoConfig();
    const autoGenerate = config.autoGenerate;
    
    // ---- Header check (case/trim insensitive)
    const headerKeys = Object.keys(rows[0] || {})
      .map((k) => k.trim().toLowerCase());
      
    const hasEmployeeIdColumn = headerKeys.includes("employee id");
    const hasEmail = headerKeys.includes("email") || headerKeys.includes("email address");
    const hasMobileNo = headerKeys.includes("mobile no");
    
    // Define required columns (Email and Mobile No are always required)
    let requiredColumns = ["Email", "Mobile No"];
    
    if (!autoGenerate) {
        requiredColumns.unshift("Employee Id");
    }

    // 2. Enforce Presence/Absence of Employee Id column based on setting
    if (autoGenerate && hasEmployeeIdColumn) {
        // SCENARIO: Auto-generation is ON, but the column is present (error case)
        return JsonResponse.error(
            "Please remove the **Employee Id** column from the CSV file, as Employee IDs are set to be auto-generated from the settings page.",
            422
        );
    }
    
    if (!autoGenerate && !hasEmployeeIdColumn) {
        // SCENARIO: Auto-generation is OFF, but the column is missing (error case)
        return JsonResponse.error(
            `Invalid CSV format — required columns: ${requiredColumns.join(", ")}`,
            422
        );
    }

    if (!hasEmail || !hasMobileNo) {
        // Always enforce Email and Mobile No
        return JsonResponse.error(
            `Invalid CSV format — required columns: ${requiredColumns.join(", ")}`,
            422
        );
    }

    // --- Core Parsing and Validation Logic ---
    const parsedRows = [];
    const empMap = {};
    const emailMap = {};
    const mobileMap = {};

    // ... (unchanged parsing logic, except employeeId map only filled if !autoGenerate)
    
    rows.forEach((raw, idx) => {
      const rowNumber = idx + 2;
      const employeeId = getVal(raw, "employee id"); 
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

      // Only track Employee ID for duplicate checks if manual input is expected
      if (!autoGenerate && employeeId) {
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


    // 3. Conditional Validation (Missing fields, CSV Duplicates, DB Duplicates)
    // ... (This section remains logically correct as provided in previous version)
    
    // ---- Rule 1: Missing required fields
    const missingFields = [];
    parsedRows.forEach((r) => {
      const missing = [];
      if (!autoGenerate && !r.employeeId) missing.push("Employee Id"); 
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
    if (!autoGenerate) {
        collectDuplicatesFromMap(empMap, "Employee Id");
    }
    collectDuplicatesFromMap(emailMap, "Email");
    collectDuplicatesFromMap(mobileMap, "Mobile No");

    // ---- Rule 3: Duplicate in DB
    const dbDuplicates = [];
    const empArr = autoGenerate ? [] : Object.keys(empMap).filter(Boolean);
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
        if (!autoGenerate && r.employeeId && existingEmp.has(r.employeeId.toLowerCase())) {
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

    // ---- If any errors, return error JSON
    if (missingFields.length || csvDuplicates.length || dbDuplicates.length) {
      return JsonResponse.error("Validation errors in CSV", 422, {
        type: "validation_errors",
        errors: { missingFields, csvDuplicates, dbDuplicates },
      });
    }

    // 4. Row Insert (Final step: Insertion with conditional auto-generation)

    const rowsToInsert = parsedRows.filter(
      (r) => r.email && r.mobile
    );
    
    let nextSequentialId = await getNextSequentialId();

    for (const r of rowsToInsert) {
      let finalEmployeeId = r.employeeId;

      if (autoGenerate) {
          // ⚠️ Bulk Auto-Generation Logic
          const paddedId = String(nextSequentialId).padStart(config.digits, '0');
          finalEmployeeId = `${config.prefix}${paddedId}`;
          nextSequentialId++; // Increment for the next row
      }
      
      const plainPassword = r.password || "password";
      const hash = await bcrypt.hash(plainPassword, 10);
      
      await DB_Fetch(sql`
        INSERT INTO ${sql.raw(Tables.TBL_USERS)}
          (employee_id, first_name, last_name, email, mobile_no, password, active)
        VALUES (${finalEmployeeId}, ${r.firstName}, ${r.lastName}, ${r.email}, ${r.mobile}, ${hash}, TRUE)
      `);
    }

    return JsonResponse.success({}, "CSV uploaded successfully — users inserted.");
  } catch (err) {
    console.error("USERS CSV UPLOAD ERROR:", err);
    return JsonResponse.error("Server error: " + err.message, 500);
  }
}