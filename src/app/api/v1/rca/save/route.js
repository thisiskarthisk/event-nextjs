import { DB_Insert, DB_Fetch } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";
import Validation from "@/helper/validation";

export async function POST(req) {
    try {
        const data = await req.json();
        console.log(data);

        let errors = {};

        // ✅ Validate main form fields
        const rcaErrors = Validation(data, {
            'gap_analysis_id': 'required',
            'department': 'required',
            'date_of_report': 'required',
            'reported_by': 'required',
            'date_of_occurrence': 'required',
            'impact': 'required',
            'problem_description': 'required',
            'immediate_action_taken': 'required',
        });

        if (rcaErrors && Object.keys(rcaErrors).length > 0) {
            errors = { ...errors, ...rcaErrors };
        }

        // ✅ Validate RCA Whys
        let rcaWhysErrors = [];

        if (data.rca_whys?.length > 0) {
            data.rca_whys.forEach((rca_why, index) => {
                const rcaWhysError = Validation(rca_why, {
                    'question': 'required',
                    'response': 'required'
                });

                if (rcaWhysError && Object.keys(rcaWhysError).length > 0) {
                    rcaWhysErrors.push({
                        index: index,
                        errors: rcaWhysError
                    });
                }
            });
        }

        if (rcaWhysErrors.length > 0) {
            errors.rca_whys = rcaWhysErrors;
        }

        if (Object.keys(errors).length > 0) {
            return JsonResponse.error(
                'There are some invalid inputs found. Please correct them all to continue.',
                422,
                { errors }
            );
        }

        const RCAId = data.id ? Number(data.id) : null;

        if (RCAId) {
            await DB_Insert(sql`
            UPDATE root_cause_analysis SET 
                reported_by = ${data.reported_by || null},
                department = ${data.department || null},
                date_of_report = ${data.date_of_report || null},
                date_of_occurrence = ${data.date_of_occurrence || null},
                impact = ${data.impact || null},
                problem_desc = ${data.problem_description || null},
                immediate_action_taken = ${data.immediate_action_taken || null},
                gap_analysis_id = ${Number(data.gap_analysis_id) || null}
            WHERE id = ${RCAId}
        `);

            const rca_whys = data.rca_whys;
            if (rca_whys.length > 0) {
                for (const rca_why of rca_whys) {
                    if (rca_why.id && rca_why.isExist) {
                        await DB_Insert(sql`
                        UPDATE rca_whys SET 
                            question = ${rca_why.question || null},
                            answer = ${rca_why.response || null}
                        WHERE id = ${Number(rca_why.id)}
                    `);
                    } else {
                        await DB_Insert(sql`
                        INSERT INTO rca_whys (
                            rca_id,
                            question,
                            answer
                        )
                        VALUES (
                            ${RCAId},
                            ${rca_why.question || null},
                            ${rca_why.response || null}
                        )
                    `);
                    }
                }
            }

            return JsonResponse.success(
                { rca_id: RCAId },
                "The RCA record has been updated successfully."
            );

        } else {

            // Generate next CAPA number
            let rca_id = 1;

            const lastRecord = await DB_Fetch(`
            SELECT id
            FROM root_cause_analysis
            ORDER BY id DESC
            LIMIT 1
        `);

            if (lastRecord.length > 0) {
                rca_id = Number(lastRecord[0].id) + 1;
            }

            const prefix = "RCA";
            const currentYear = new Date().getFullYear();
            const rca_no = `${prefix}/${currentYear}/${rca_id}`;

            console.log("Generated RCA No:", rca_no);

            const insertedRCA = await DB_Insert(sql`
            INSERT INTO root_cause_analysis (
                rca_no,
                reported_by,
                department,
                date_of_report,
                date_of_occurrence,
                impact,
                problem_desc,
                immediate_action_taken,
                gap_analysis_id
            )
            VALUES (
                ${rca_no},
                1,
                ${data.department || null},
                ${data.date_of_report || null},
                ${data.date_of_occurrence || null},
                ${data.impact || null},
                ${data.problem_description || null},
                ${data.immediate_action_taken || null},
                ${Number(data.gap_analysis_id) || null}
            )
        `);

            const newRCAId = insertedRCA[0]?.id || rca_id;

            var rca_whys = data.rca_whys || [];

            if (rca_whys.length > 0) {
                for (const rca_why of data.rca_whys) {
                    await DB_Insert(sql`
                    INSERT INTO rca_whys (
                        rca_id,
                        question,
                        answer
                    )
                    VALUES (
                        ${newRCAId},
                        ${rca_why.question || null},
                        ${rca_why.response || null}
                    )
                `);
                }
            }

            return JsonResponse.success(
                {
                    rca_id: newRCAId,
                    rca_no,
                },
                "The RCA record has been created successfully."
            );
        }

    } catch (error) {
        console.error("[api/rca/save] Error:", error);
        let message = 'Error occurred when trying to save RCA data.';

        if (error.cause && error.cause.constraint) {
            if (error.cause.constraint.includes('unique_question')) {
                message = 'Duplicate questions are not allowed.';
            }
        }

        return JsonResponse.error(message);
    }
}