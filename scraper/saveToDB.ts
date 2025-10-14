import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { companiesTable } from "@/db/schema/companies";
import { jobsTable } from "@/db/schema/jobs";
import type { JobItem } from "./shared/types";
import dayjs from "dayjs";

export async function saveJobsToDB(jobs: JobItem[]) {
    for (const job of jobs) {
        try {
            // Find or insert company
            let [company] = await db
                .select()
                .from(companiesTable)
                .where(eq(companiesTable.name, job.company))
                .limit(1);

            if (!company) {
                const inserted = await db
                    .insert(companiesTable)
                    .values({
                        name: job.company,
                        website: job.website || null,
                        location: job.location || null,
                        industry: job.industry || null,
                    })
                    .returning();
                company = inserted[0];
            }

            // Check if job already exists (title + company)
            const [existingJob] = await db
                .select()
                .from(jobsTable)
                .where(
                    and(
                        eq(jobsTable.title, job.title),
                        eq(jobsTable.companyId, company.id)
                    )
                )
                .limit(1);

            const jobValues = {
                companyId: company.id,
                title: job.title,
                jobUrl: job.link,
                employmentType: job.type,
                description: `${job.deadline || ""} | Level: ${job.tags.level} | Roles: ${job.tags.roles.join(", ")}`,
                salaryRange: null,
                postedDate: job.postedDate ?? dayjs().format('YYYY-MM-DD'),
                deadline: job.deadline ?? null,
                isEstimated: job.isEstimated ?? false,
                updatedAt: new Date(),
            };

            // Insert or update
            if (existingJob) {
                await db
                    .update(jobsTable)
                    .set(jobValues)
                    .where(eq(jobsTable.id, existingJob.id));

                console.log(`Updated: ${job.title}`);
            } else {
                await db.insert(jobsTable).values(jobValues);
                console.log(`Inserted: ${job.title}`);
            }
        } catch (err) {
            console.error(`Error saving job: ${job.title}`, err);
        }
    }

    console.log("All jobs processed and synced!");
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