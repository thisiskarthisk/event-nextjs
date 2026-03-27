import { DB_Fetch, Tables } from "@/db";
import ExcelJS from "exceljs";

export async function GET(req) {
  try {
    const event_id = Number(req.nextUrl.searchParams.get("event_id"));
    const activity_id = Number(req.nextUrl.searchParams.get("activity_id"));
    const status = req.nextUrl.searchParams.get("status") || "all";
    const selected_date =
      req.nextUrl.searchParams.get("date") ||
      new Date().toISOString().split("T")[0];

    if (!event_id || !activity_id) {
      return new Response("Missing parameters", { status: 400 });
    }

    // ✅ Status condition
    let statusCondition = "";

    if (status === "registered") {
      statusCondition = "AND eda.delegate_activity_id IS NOT NULL";
    }

    if (status === "not_registered") {
      statusCondition = "AND eda.delegate_activity_id IS NULL";
    }

    const delegates = await DB_Fetch(`
      SELECT 
        d.*,
        CASE 
          WHEN eda.delegate_activity_id IS NOT NULL THEN TRUE
          ELSE FALSE
        END AS registered
      FROM ${Tables.TBL_EVENT_DELEGATES} d
      LEFT JOIN ${Tables.TBL_EVENT_DELEGATE_ACTIVITIES} eda
        ON eda.fkdelegates_id = d.delegate_id
        AND eda.fkactivity_id = ${activity_id}
        AND eda.fkevent_id = ${event_id}
        AND eda.active = TRUE
        AND DATE(eda.recorded_date_time) = '${selected_date}'
      WHERE d.fkevent_id = ${event_id}
      ${statusCondition}
      ORDER BY d.delegate_id DESC
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Delegates");

    worksheet.columns = [
      { header: "Reg No", key: "regn_no", width: 15 },
      { header: "Name", key: "name", width: 20 },
      { header: "Phone", key: "phone_number", width: 15 },
      { header: "Email", key: "email", width: 25 },
      { header: "Status", key: "status", width: 20 },
    ];

    delegates.forEach((d) => {
      const row = worksheet.addRow({
        regn_no: d.regn_no,
        name: d.name,
        phone_number: d.phone_number,
        email: d.email,
        status: d.registered ? "Registered" : "Not Registered",
      });

      const statusCell = row.getCell("status");

      if (d.registered) {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF32CD32" },
        };
      } else {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF4C4C" },
        };
      }

      statusCell.font = { bold: true };
      statusCell.alignment = { horizontal: "center" };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          `attachment; filename=delegates_${selected_date}.xlsx`,
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Export failed", { status: 500 });
  }
}