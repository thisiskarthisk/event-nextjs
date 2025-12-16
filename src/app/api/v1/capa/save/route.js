import { DB_Insert, DB_Fetch, DB_Init, DB_Commit, DB_Rollback } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";
import Validation from "@/helper/validation";
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await DB_Init();
    const data = await req.json();
    const capa_actions = data.capa_actions || [];

    const errors = [];

    if (capa_actions.length > 0) {
      capa_actions.forEach((capa_action, index) => {
        const MFErrors = Validation(capa_action, {
          date: "required",
          reason_for_deviation: "required",
        });

        const CFErrors = Validation(capa_action.corrective || {}, {
          counter_measure: "required",
          description: "required",
          target_date: "required",
          status: "required",
          responsibility: "required",
        });

        const PFErrors = Validation(capa_action.preventive || {}, {
          counter_measure: "required",
          description: "required",
          target_date: "required",
          status: "required",
          responsibility: "required",
        });

        const formErrors = {};

        if (MFErrors && Object.keys(MFErrors).length > 0) {
          formErrors.main = MFErrors;
        }
        if (CFErrors && Object.keys(CFErrors).length > 0) {
          formErrors.corrective = CFErrors;
        }
        if (PFErrors && Object.keys(PFErrors).length > 0) {
          formErrors.preventive = PFErrors;
        }

        if (Object.keys(formErrors).length > 0) {
          errors.push({
            index,
            errors: formErrors,
          });
        }
      });
    }

    if (errors.length > 0) {
      return JsonResponse.error(
        "There are some invalid inputs found. Please correct them all to continue",
        422,
        { errors }
      );
    }

    const CAPAID = data.id ? Number(data.id) : null;

    if (CAPAID) {
      // UPDATE branch
      if (capa_actions.length > 0) {
        for (const capa_action of capa_actions) {
          if (capa_action.isExist && capa_action.cpa_id) {
            await DB_Insert(sql`
              UPDATE cp_actions SET 
                reason = ${capa_action.reason_for_deviation || null},
                date = ${capa_action.date || null},
                cor_action_desc = ${capa_action.corrective?.description || null},
                cor_counter_measure = ${capa_action.corrective?.counter_measure || null},
                cor_action_target_date = ${capa_action.corrective?.target_date || null},
                cor_action_status = ${capa_action.corrective?.status || null},
                cor_action_responsibility = ${capa_action.corrective?.responsibility || null},
                prev_action_desc = ${capa_action.preventive?.description || null},
                prev_counter_measure = ${capa_action.preventive?.counter_measure || null},
                prev_action_target_date = ${capa_action.preventive?.target_date || null},
                prev_action_status = ${capa_action.preventive?.status || null},
                prev_action_responsibility = ${capa_action.preventive?.responsibility || null}
              WHERE id = ${capa_action.cpa_id}
            `);
          } else {
            await DB_Insert(sql`
              INSERT INTO cp_actions (
                gap_analysis_id,
                date,
                reason,
                cor_action_desc,
                cor_counter_measure,
                cor_action_target_date,
                cor_action_status,
                cor_action_responsibility,
                prev_action_desc,
                prev_counter_measure,
                prev_action_target_date,
                prev_action_status,
                prev_action_responsibility
              )
              VALUES (
                ${CAPAID},
                ${capa_action.date || null},
                ${capa_action.reason_for_deviation || null},
                ${capa_action.corrective?.description || null},
                ${capa_action.corrective?.counter_measure || null},
                ${capa_action.corrective?.target_date || null},
                ${capa_action.corrective?.status || null},
                ${capa_action.corrective?.responsibility || null},
                ${capa_action.preventive?.description || null},
                ${capa_action.preventive?.counter_measure || null},
                ${capa_action.preventive?.target_date || null},
                ${capa_action.preventive?.status || null},
                ${capa_action.preventive?.responsibility || null}
              )
            `);
          }
        }
      }

      return JsonResponse.success(
        { gap_analysis_id: CAPAID },
        "The CAPA record has been updated successfully."
      );
    }

    // INSERT branch
    let gap_analysis_id = 1;

    const lastRecord = await DB_Fetch(`
      SELECT id
      FROM gap_analysis
      ORDER BY id DESC
      LIMIT 1
    `);

    if (lastRecord.length > 0) {
      gap_analysis_id = Number(lastRecord[0].id) + 1;
    }
    const Setting = await DB_Fetch(sql`
                SELECT * FROM settings WHERE setting_group = 'general' AND field_name = 'capa_id'
            `);
    const settingValue = Setting?.[0]?.value || "";  
    const [prefix, digits] = settingValue.split(',');

    if (!prefix || !digits) {
        return NextResponse.json({
            success: false,
            message: "CAPA ID is not configured. Please set CAPA ID in Settings page."
        }, { status: 400 });
    }
    const paddedId = String(gap_analysis_id).padStart(digits, '0');
    const capa_no = `${prefix}${paddedId}`;
    

    const insertedGap = await DB_Insert(sql`
      INSERT INTO gap_analysis (capa_no)
      VALUES (${capa_no})
    `);

    const newGapId = insertedGap[0]?.id || gap_analysis_id;

    if (capa_actions.length > 0) {
      for (const capa_action of capa_actions) {
        await DB_Insert(sql`
          INSERT INTO cp_actions (
            gap_analysis_id,
            date,
            reason,
            cor_action_desc,
            cor_counter_measure,
            cor_action_target_date,
            cor_action_status,
            cor_action_responsibility,
            prev_action_desc,
            prev_counter_measure,
            prev_action_target_date,
            prev_action_status,
            prev_action_responsibility
          )
          VALUES (
            ${newGapId},
            ${capa_action.date || null},
            ${capa_action.reason_for_deviation || null},
            ${capa_action.corrective?.description || null},
            ${capa_action.corrective?.counter_measure || null},
            ${capa_action.corrective?.target_date || null},
            ${capa_action.corrective?.status || null},
            ${capa_action.corrective?.responsibility || null},
            ${capa_action.preventive?.description || null},
            ${capa_action.preventive?.counter_measure || null},
            ${capa_action.preventive?.target_date || null},
            ${capa_action.preventive?.status || null},
            ${capa_action.preventive?.responsibility || null}
          )
        `);
      }
    }
   
    await DB_Commit();
    return JsonResponse.success(
      {
        gap_analysis_id: newGapId,
        capa_no,
      },
      "The CAPA record has been created successfully."
    );
  } catch (error) {
    await DB_Rollback();
    console.error("[api/capa/save] Error:", error);
    return JsonResponse.error(
      "Error occurred when trying to save CAPA data.",
      500,
      {}
    );
  }
}
