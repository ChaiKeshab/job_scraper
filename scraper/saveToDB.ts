import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companiesTable } from "@/db/schema/companies";
import { jobsTable } from "@/db/schema/jobs";
import type { JobItem } from "./shared/types";

export async function saveJobsToDB(jobs: JobItem[]) {
    for (const job of jobs) {
        // Check if company already exists
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
                    website: null,
                    location: null,
                    industry: null,
                })
                .returning();
            company = inserted[0];
        }

        // Check if job already exists by title + company
        const existingJob = await db
            .select()
            .from(jobsTable)
            .where(eq(jobsTable.title, job.title))
            .limit(1);

        if (existingJob.length > 0) {
            console.log(`Job already exists: ${job.title}`);
            continue;
        }

        // Insert job
        await db.insert(jobsTable).values({
            companyId: company.id,
            title: job.title,
            jobUrl: job.link,
            employmentType: job.type,
            description: `${job.deadline || ""} | Level: ${job.tags.level} | Roles: ${job.tags.roles.join(", ")}`,
            salaryRange: null,
        });

        console.log(`✅ Saved: ${job.title}`);
    }

    console.log("🎉 All jobs saved!");
}
