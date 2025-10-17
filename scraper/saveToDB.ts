import { eq, inArray, sql, and, or } from "drizzle-orm";
import { db } from "@/db";
import { companiesTable } from "@/db/schema/companies";
import { jobsTable, type DbJobsType } from "@/db/schema/jobs";
import { tagsTable, jobTagsTable } from "@/db/schema/tags";
import type { JobItem } from "./shared/types";
import dayjs from "dayjs";
import { formattedDate } from "./shared/utils";

export async function saveJobsToDB(jobs: JobItem[]) {
    if (jobs.length === 0) return;

    await db.transaction(async (tx) => {
        // === STEP 1: PREPARE TAGS FOR THE WHOLE BATCH ===
        const uniqueTags = new Set<string>();
        for (const job of jobs) {
            if (job.tags.level) uniqueTags.add(job.tags.level.trim().toLowerCase());
            for (const role of job.tags.roles) uniqueTags.add(role.trim().toLowerCase());
        }
        const allTagsArray = Array.from(uniqueTags);
        const tagMap = new Map<string, number>();

        if (allTagsArray.length > 0) {
            const existingTags = await tx
                .select({ id: tagsTable.id, name: tagsTable.name })
                .from(tagsTable)
                .where(inArray(tagsTable.name, allTagsArray));

            const existingTagNames = new Set<string>();
            for (const tag of existingTags) {
                tagMap.set(tag.name, tag.id);
                existingTagNames.add(tag.name);
            }

            const missingTags = allTagsArray
                .filter((t) => !existingTagNames.has(t))
                .map((name) => ({ name }));

            if (missingTags.length > 0) {
                const newTags = await tx
                    .insert(tagsTable)
                    .values(missingTags)
                    .returning({ id: tagsTable.id, name: tagsTable.name });
                newTags.forEach((tag) => tagMap.set(tag.name, tag.id));
            }
        }

        // === STEP 2: BATCH UPSERT COMPANIES ===
        const uniqueCompanies = Array.from(
            new Map(
                jobs.map((j) => [
                    j.company.trim(),
                    {
                        name: j.company.trim(),
                        website: j.website || null,
                        location: j.location || null,
                        industry: j.industry || null,
                    },
                ])
            ).values()
        );

        const existingCompanies = await tx
            .select({ id: companiesTable.id, name: companiesTable.name })
            .from(companiesTable)
            .where(inArray(companiesTable.name, uniqueCompanies.map((c) => c.name)));

        const nameToCompanyId = new Map(existingCompanies.map((c) => [c.name, c.id]));
        const missingCompanies = uniqueCompanies.filter((c) => !nameToCompanyId.has(c.name));

        if (missingCompanies.length > 0) {
            const inserted = await tx
                .insert(companiesTable)
                .values(missingCompanies)
                .onConflictDoUpdate({
                    target: companiesTable.name,
                    set: {
                        website: sql`
							CASE 
								WHEN ${companiesTable.website} IS DISTINCT FROM excluded.website 
									AND excluded.website IS NOT NULL 
								THEN excluded.website 
								ELSE ${companiesTable.website} 
							END
						`,
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
                .returning({ id: companiesTable.id, name: companiesTable.name });

            inserted.forEach((c) => nameToCompanyId.set(c.name, c.id));
        }

        // === STEP 3: BATCH FETCH EXISTING JOBS ===
        const jobCandidates = jobs.map((j) => ({
            companyId: nameToCompanyId.get(j.company.trim())!,
            title: j.title.trim(),
        }));

        // Build dynamic OR for (companyId, title)
        const existingJobs = await tx
            .select({
                id: jobsTable.id,
                companyId: jobsTable.companyId,
                title: jobsTable.title,
            })
            .from(jobsTable)
            .where(
                or(
                    ...jobCandidates.map((j) =>
                        and(eq(jobsTable.companyId, j.companyId), eq(jobsTable.title, j.title))
                    )
                )
            );

        const existingJobMap = new Map<string, number>();
        for (const j of existingJobs) {
            existingJobMap.set(`${j.companyId}-${j.title}`, j.id);
        }

        // === STEP 4: BATCH INSERT NEW JOBS ===
        const today = formattedDate(dayjs().toISOString())!;
        const newJobsToInsert: DbJobsType[] = [];
        for (const job of jobs) {
            const companyId = nameToCompanyId.get(job.company.trim())!;
            const key = `${companyId}-${job.title.trim()}`;
            if (existingJobMap.has(key)) continue;

            const formattedPostDate = formattedDate(job.postedDate);
            newJobsToInsert.push({
                companyId,
                title: job.title.trim(),
                jobUrl: job.link,
                employmentType: job.type,
                description: `${job.deadline || ""} | Level: ${job.tags.level} | Roles: ${job.tags.roles.join(", ")}`,
                salaryRange: null,
                postedDate: formattedPostDate ?? today,
                deadline: job.deadline ?? null,
                isEstimated: !formattedPostDate,
                experience: job.experience,
                updatedAt: new Date(),
            });
        }

        let insertedJobs: { id: number; companyId: number; title: string }[] = [];
        if (newJobsToInsert.length > 0) {
            insertedJobs = await tx
                .insert(jobsTable)
                .values(newJobsToInsert)
                .returning({ id: jobsTable.id, companyId: jobsTable.companyId, title: jobsTable.title });
        }

        // Combine both sets
        const allJobs = [
            ...existingJobs.map((j) => ({ id: j.id, companyId: j.companyId, title: j.title })),
            ...insertedJobs,
        ];

        // === STEP 5: JOB-TAG LINKS (UNCHANGED, STILL BATCHED) ===
        const jobIdToTagsMap = new Map<number, string[]>();
        for (const job of jobs) {
            const companyId = nameToCompanyId.get(job.company.trim())!;
            const key = `${companyId}-${job.title.trim()}`;
            const jobId = existingJobMap.get(key) || insertedJobs.find((j) => j.title === job.title && j.companyId === companyId)?.id;
            if (jobId)
                jobIdToTagsMap.set(
                    jobId,
                    [job.tags.level, ...job.tags.roles]
                        .map((t) => t.trim().toLowerCase())
                        .filter(Boolean)
                );
        }

        const existingJobLinks = await tx
            .select({ jobId: jobTagsTable.jobId, tagId: jobTagsTable.tagId })
            .from(jobTagsTable)
            .where(inArray(jobTagsTable.jobId, Array.from(jobIdToTagsMap.keys())));

        const jobIdToExistingTagIds = new Map<number, Set<number>>();
        for (const link of existingJobLinks) {
            if (!jobIdToExistingTagIds.has(link.jobId))
                jobIdToExistingTagIds.set(link.jobId, new Set());
            jobIdToExistingTagIds.get(link.jobId)!.add(link.tagId);
        }

        const linksToInsert: { jobId: number; tagId: number }[] = [];
        for (const [jobId, tagNames] of jobIdToTagsMap.entries()) {
            const existingTagIds = jobIdToExistingTagIds.get(jobId) || new Set<number>();
            for (const tagName of tagNames) {
                const tagId = tagMap.get(tagName);
                if (tagId && !existingTagIds.has(tagId)) {
                    linksToInsert.push({ jobId, tagId });
                }
            }
        }

        if (linksToInsert.length > 0) {
            await tx.insert(jobTagsTable).values(linksToInsert);
        }
    });

    console.log("✅ All jobs processed and synced (fully transactional, batched companies & jobs)!");
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