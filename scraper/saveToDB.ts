import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { companiesTable } from "@/db/schema/companies";
import { type DbJobsType, jobsTable } from "@/db/schema/jobs";
import { tagsTable, jobTagsTable } from "@/db/schema/tags";
import type { JobItem } from "./shared/types";
import dayjs from "dayjs";
import { formattedDate } from "./shared/utils";

export async function saveJobsToDB(jobs: JobItem[]) {
    for (const job of jobs) {
        try {
            // Find or insert company
            // let [company] = await db
            //     .select()
            //     .from(companiesTable)
            //     .where(eq(companiesTable.name, job.company))
            //     .limit(1);

            // if (!company) {
            //     const inserted = await db
            //         .insert(companiesTable)
            //         .values({
            //             name: job.company,
            //             website: job.website || null,
            //             location: job.location || null,
            //             industry: job.industry || null,
            //         })
            //         .returning();
            //     company = inserted[0];
            // }

            const [company] = await db
                .insert(companiesTable)
                .values({
                    name: job.company,
                    website: job.website || null,
                    location: job.location || null,
                    industry: job.industry || null,
                })
                .onConflictDoUpdate({
                    target: companiesTable.name,
                    set: {
                        // Only update website if it's non-null AND different from existing
                        website: sql`
                            CASE 
                                WHEN ${companiesTable.website} IS DISTINCT FROM excluded.website 
                                     AND excluded.website IS NOT NULL 
                                THEN excluded.website 
                                ELSE ${companiesTable.website} 
                            END
                        `,
                        // Only update updatedAt when website actually changed
                        updatedAt: sql`
                            CASE 
                                WHEN ${companiesTable.website} IS DISTINCT FROM excluded.website 
                                     AND excluded.website IS NOT NULL 
                                THEN NOW() 
                                ELSE ${companiesTable.updatedAt} 
                            END
                        `,
                    },
                })
                .returning();


            // Check if job already exists
            const [existingJob] = await db
                .select()
                .from(jobsTable)
                .where(
                    and(
                        eq(jobsTable.companyId, company.id),
                        eq(jobsTable.title, job.title)
                    )
                )
                .limit(1);

            const formattedPostDate = formattedDate(job.postedDate);
            const today = formattedDate(dayjs().toISOString())!;

            const jobValues: DbJobsType = {
                companyId: company.id,
                title: job.title,
                jobUrl: job.link,
                employmentType: job.type,
                description: `${job.deadline || ""} | Level: ${job.tags.level} | Roles: ${job.tags.roles.join(", ")}`, // update/remove later
                salaryRange: null,
                postedDate: formattedPostDate ?? today,
                deadline: job.deadline ?? null,
                isEstimated: !formattedPostDate,
                experience: job.experience,
                updatedAt: new Date(),
            };

            let jobId: number;

            // Insert or update job
            if (existingJob) {
                await db
                    .update(jobsTable)
                    .set(jobValues)
                    .where(eq(jobsTable.id, existingJob.id));
                jobId = existingJob.id;
                // console.log(`Updated: ${job.title}`);
            } else {
                const inserted = await db.insert(jobsTable).values(jobValues).returning();
                jobId = inserted[0].id;
                // console.log(`Inserted: ${job.title}`);
            }

            // Handle Tags (Batch Optimized)
            const allTags = [job.tags.level, ...job.tags.roles]
                .map(t => t.trim().toLowerCase())
                .filter(Boolean);

            if (allTags.length > 0) {
                // Step 1: Fetch existing tags in one query
                const existingTags = await db
                    .select()
                    .from(tagsTable)
                    .where(inArray(tagsTable.name, allTags));

                const existingTagNames = existingTags.map(t => t.name);
                const missingTags = allTags.filter(t => !existingTagNames.includes(t));

                //  Step 2: Insert missing tags in one go
                let newTags: { id: number; name: string }[] = [];
                if (missingTags.length > 0) {
                    newTags = await db
                        .insert(tagsTable)
                        .values(missingTags.map(name => ({ name })))
                        .returning();
                }

                // Step 3: Combine both existing + new tags
                const finalTags = [...existingTags, ...newTags];

                // Step 4: Get existing links to avoid duplicates
                const existingLinks = await db
                    .select()
                    .from(jobTagsTable)
                    .where(eq(jobTagsTable.jobId, jobId));

                const existingTagIds = new Set(existingLinks.map(l => l.tagId));

                // Step 5: Insert only new links
                const newLinks = finalTags
                    .filter(tag => !existingTagIds.has(tag.id))
                    .map(tag => ({ jobId, tagId: tag.id }));

                if (newLinks.length > 0) {
                    await db.insert(jobTagsTable).values(newLinks);
                }
            }
        } catch (err) {
            console.error(`❌ Error saving job: ${job.title}`, err);
        }
    }

    console.log("✅ All jobs processed and synced (batch tags handled)!");
}



/**
 * Things to handle
 * 
 * Each time we fetch, we checking if that job exists or not and updating only if that job exists which is wrong.
 * It should be updated everytime the scraping is done.
 * 
 * Actually, both for the Company and job table, each data needs to be seen if update has occoured and save those updates.
 * 
 * Storing stale data is pointless. expired job had no point for us. for that;
 * A deadline column added in jobsTable. 
 * using chrono-node library to convert dates like 3 days remaining to iso string formats;
 * 
 * is it possible to set an expiry date for the data according to deadline of the job.
 * not all job mentions the deadline. if the deadline is missing, we gotta handle for that too.
 * 
 * A new column in jobsTable called date posted; required field
 * we default exipire the job after 1 month of deadline cuz that means there's no hope to get hired in that one;
 * 
 * Edge cases; if scraper is unable to get the posted date too or if chrono-node is unable to parse the date,
 * we set a flag. new column flag in jobsTable. if that flag is true, we assume it's posted date is also empty. in that
 * case, we use the day it was scraped as the published date but with the flag true which we gonna use in fe to tell 
 * user that no published date available but it was scraped on that date and plz check the website for detail. we are not 
 * 100% accurate on scraping all data so you too gotta put some effort. 
 * to get published/deadline date
 * 
 */