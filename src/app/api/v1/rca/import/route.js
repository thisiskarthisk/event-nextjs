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


        // TODO: Generate RCA No In Settings Table
        const Setting = await DB_Fetch(sql`
            SELECT * FROM settings WHERE setting_group = 'general' AND field_name = 'rca_id'
        `);

        // Example: value = "RCA,4"
        const settingValue = Setting?.[0]?.value || "";  

        // Split by comma
        const [prefix, digits] = settingValue.split(',');

        // Now you have:
        console.log("Prefix:", prefix);  // RCA
        console.log("Digits:", digits);  // 4

        const paddedId = String(rca_id).padStart(digits, '0');
        const rca_no = `${prefix}${paddedId}`;
        console.log('IMPORT: Generated RCA No:', rca_no);


        // const prefix = "RCA";
        // const currentYear = new Date().getFullYear();
        // const rca_no = `${prefix}/${currentYear}/${rca_id}`;

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