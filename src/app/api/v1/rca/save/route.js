import { NextResponse } from 'next/server';
import { DB_Insert, DB_Fetch } from "@/db";
import { sql } from "drizzle-orm";

export async function POST(req) {
    try {
        const data = await req.json();
        console.log('Received data:', data);

        const RCAId = data.id ? Number(data.id) : null;

        if (RCAId) {
            // ✅ UPDATE - Use DB_Fetch instead of DB_Insert for UPDATE
            console.log('Updating RCA:', RCAId);
            
            await DB_Fetch(sql`
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
            console.log('RCA updated successfully');

            // Handle RCA Whys
            const rca_whys = data.rca_whys || [];
            for (const rca_why of rca_whys) {
                if (rca_why.id && rca_why.isExist) {
                    // Update existing why - Use DB_Fetch
                    await DB_Fetch(sql`
                        UPDATE rca_whys SET 
                            question = ${rca_why.question || null},
                            answer = ${rca_why.response || null}
                        WHERE id = ${Number(rca_why.id)}
                    `);
                } else {
                    // Insert new why - Use DB_Insert
                    await DB_Insert(sql`
                        INSERT INTO rca_whys (rca_id, question, answer)
                        VALUES (${RCAId}, ${rca_why.question || null}, ${rca_why.response || null})
                    `);
                }
            }

            return NextResponse.json({
                success: true,
                message: "RCA updated successfully",
                data: { rca_id: RCAId }
            });

        } else {
            // INSERT new RCA
            console.log('Creating new RCA');
            
            let rca_id = 1;
            try {
                const lastRecord = await DB_Fetch(`SELECT id FROM root_cause_analysis ORDER BY id DESC LIMIT 1`);
                rca_id = lastRecord.length > 0 ? Number(lastRecord[0].id) + 1 : 1;
            } catch (lastErr) {
                console.error('Last record error:', lastErr);
            }

            // Use default numbering - skip problematic settings table
            const prefix = "RCA";
            const digits = 4;
            const paddedId = String(rca_id).padStart(digits, '0');
            const rca_no = `${prefix}${paddedId}`;
            console.log('Generated RCA No:', rca_no);

            // ✅ INSERT - Use DB_Insert
            const insertedRCA = await DB_Insert(sql`
                INSERT INTO root_cause_analysis (
                    rca_no, reported_by, department, date_of_report, 
                    date_of_occurrence, impact, problem_desc, 
                    immediate_action_taken, gap_analysis_id
                ) VALUES (
                    ${rca_no}, ${Number(data.reported_by) || 1}, 
                    ${data.department || null}, ${data.date_of_report || null},
                    ${data.date_of_occurrence || null}, ${data.impact || null},
                    ${data.problem_description || null}, ${data.immediate_action_taken || null},
                    ${Number(data.gap_analysis_id) || null}
                )
            `);

            const newRCAId = insertedRCA[0]?.id || rca_id;
            console.log('New RCA created with ID:', newRCAId);

            // Insert RCA Whys
            if (data.rca_whys?.length > 0) {
                for (const rca_why of data.rca_whys) {
                    await DB_Insert(sql`
                        INSERT INTO rca_whys (rca_id, question, answer)
                        VALUES (${newRCAId}, ${rca_why.question || null}, ${rca_why.response || null})
                    `);
                }
            }

            return NextResponse.json({
                success: true,
                message: "RCA created successfully",
                data: { rca_id: newRCAId, rca_no }
            });
        }

    } catch (error) {
        console.error("=== RCA SAVE ERROR ===", error);
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        return NextResponse.json({
            success: false,
            message: error.message || 'Save failed'
        }, { status: 500 });
    }
}