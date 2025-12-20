import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await DB_Fetch(sql`
      SELECT field_name, value
      FROM ${sql.identifier(Tables.TBL_SETTINGS)}
      WHERE setting_group = 'chart'
    `);

    const settings = {};
    rows.forEach(r => {
      settings[r.field_name] = r.value;
    });

    return JsonResponse.success({
      ucl_line_color: settings.ucl_line_color,
      ucl_line_style:settings.ucl_line_style,

      lcl_line_color: settings.lcl_line_color,
      lcl_line_style:settings.lcl_line_style,

      outlier_dot_color: settings.outlier_dot_color,

      responses_line_color: settings.responses_line_color,
      responses_line_curve_style: settings.responses_line_curve_style,
      
      target_line_color: settings.target_line_color,
      target_line_style:settings.target_line_style,

    });

  } catch (err) {
    console.error("[chart-styles]", err);
    return JsonResponse.error("Failed to load chart settings", 500);
  }
}
