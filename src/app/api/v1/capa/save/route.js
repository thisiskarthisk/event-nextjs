import { DB_Insert, DB_Fetch } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";
import Validation from "@/helper/validation";

export async function POST(req) {
    try {
        const data = await req.json();

        const capa_actions = data.capa_actions || [];

        let errors = [];

        if (capa_actions.length > 0) {
            capa_actions.forEach((capa_action, index) => {

                // Validate main fields
                const MFErrors = Validation(capa_action, {
                    'date': 'required',
                    'reason_for_deviation': 'required'
                });

                // Validate corrective fields
                const CFErrors = Validation(capa_action.corrective, {
                    'counter_measure': 'required',
                    'description': 'required',
                    'target_date': 'required',
                    'status': 'required',
                    'responsibility': 'required',
                });

                // Validate preventive fields
                const PFErrors = Validation(capa_action.preventive, {
                    'counter_measure': 'required',
                    'description': 'required',
                    'target_date': 'required',
                    'status': 'required',
                    'responsibility': 'required',
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
                        index: index,
                        errors: formErrors,
                    });
                }
            });
        }

        if (errors.length > 0) {
            return JsonResponse.error('There are some invalid inputs found. Please correct them all to continue', 422, {
                'errors': errors,
            })
        }

        const CAPAID = data.id ? Number(data.id) : null;

        if (CAPAID) {

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
                            ${capa_action.corrective.description || null},
                            ${capa_action.corrective.counter_measure || null},
                            ${capa_action.corrective.target_date || null},
                            ${capa_action.corrective.status || null},
                            ${capa_action.corrective.responsibility || null},
                            ${capa_action.preventive.description || null},
                            ${capa_action.preventive.counter_measure || null},
                            ${capa_action.preventive.target_date || null},
                            ${capa_action.preventive.status || null},
                            ${capa_action.preventive.responsibility || null}
                        )
                    `);
                    }
                }
            }

            return JsonResponse.success(
                { gap_analysis_id: CAPAID },
                "The CAPA record has been updated successfully."
            );

        } else {

            // Generate next CAPA number
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

            const prefix = "CAPA";
            const currentYear = new Date().getFullYear();
            const capa_no = `${prefix}/${currentYear}/${gap_analysis_id}`;

            const insertedGap = await DB_Insert(sql`
            INSERT INTO gap_analysis (capa_no)
            VALUES (${capa_no})
        `);

            const newGapId = insertedGap[0]?.id || gap_analysis_id;

            if (capa_actions.length > 0) {
                for (const capa_action of capa_actions) {
                    const cp_action = await DB_Insert(sql`
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
                        ${capa_action.corrective.description || null},
                        ${capa_action.corrective.counter_measure || null},
                        ${capa_action.corrective.target_date || null},
                        ${capa_action.corrective.status || null},
                        ${capa_action.corrective.responsibility || null},
                        ${capa_action.preventive.description || null},
                        ${capa_action.preventive.counter_measure || null},
                        ${capa_action.preventive.target_date || null},
                        ${capa_action.preventive.status || null},
                        ${capa_action.preventive.responsibility || null}
                    )
                `);
                }
            }

            return JsonResponse.success(
                {
                    gap_analysis_id: newGapId,
                    capa_no,
                },
                "The CAPA record has been created successfully."
            );
        }
    } catch (error) {
        console.error("[api/capa/save] Error:", error);
        return JsonResponse.error("Error occurred when trying to save CAPA data.");
    }
}
