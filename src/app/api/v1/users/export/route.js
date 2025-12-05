import { DB_Fetch, Tables } from "@/db";

/**
 * Helper function to enclose a string in double quotes and escape any internal quotes.
 * This ensures fields containing commas (,) or quotes (") do not break the CSV structure.
 * @param {string} value - The string value to escape.
 * @returns {string} The escaped and quoted string.
 */
const csvEscape = (value) => {
  if (value === null || value === undefined) {
    return '""';
  }
  let str = String(value);
  
  // 1. Escape double quotes inside the string by doubling them
  str = str.replace(/"/g, '""');
  
  // 2. Enclose the entire string in double quotes
  return `"${str}"`;
};

export async function GET() {
  try {
    // Fetch active user data (ensure DB_Fetch and Tables are correctly imported/defined)
    const users = await DB_Fetch(`
      SELECT employee_id, first_name, last_name, email, mobile_no 
      FROM ${Tables.TBL_USERS}
      WHERE active = TRUE
      ORDER BY employee_id
    `);

    // Define the CSV header
    const header = "Employee ID,First Name,Last Name,Email,Mobile No\n";
    
    // Map the data rows, applying csvEscape to every field
    const dataRows = users
      .map(u =>
        [
          csvEscape(u.employee_id),
          csvEscape(u.first_name),
          csvEscape(u.last_name),
          csvEscape(u.email),
          csvEscape(u.mobile_no)
        ].join(",")
      )
      .join("\n");
      
    const csvContent = header + dataRows;

    // Return the CSV file as a downloadable response
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=users_export.csv",
      },
    });
  } catch (err) {
    console.error("CSV Export Error:", err);
    return new Response("Server error occurred during export.", { status: 500 });
  }
}