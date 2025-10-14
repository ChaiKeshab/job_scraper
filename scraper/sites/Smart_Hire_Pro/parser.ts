import type { JobItem } from "@/scraper/shared/types";
import { detectTags } from "@/scraper/shared/utils";
import type { CheerioAPI } from "cheerio";
import * as chrono from "chrono-node";
import dayjs from "dayjs";

interface ParseSmartHireProType {
    $: CheerioAPI;
    website: string;
}

export function parseSmartHirePro({ $, website }: ParseSmartHireProType): JobItem[] {
    const jobs: JobItem[] = [];

    $("a.block-link").each((_, el) => {
        const link = "https://smarthirepro.com" + ($(el).attr("href")?.trim() || "");
        const job = $(el).find(".job-listing");

        const title = job.find(".job__title").text().trim();
        const company = job.find(".job__company span").first().text().trim();
        const type = job.find(".job__company span").last().text().trim();
        const logo = job.find(".job-company__logo img").attr("src") || "";
        const tags = detectTags(title);

        const deadline = job.find(".job__deadline").text().trim();
        const postedRaw = job.find(".job__postdate").text().trim();


        /**
         * 
         * couldn't handle "x days remaining"
         * 
         */
        // --- Step 1: Try chrono parse
        let parsedPosted = chrono.parseDate(postedRaw);
        let isEstimated = false;

        if (!parsedPosted) {
            // --- Step 2: Fallback to dayjs direct parse
            const parsed = dayjs(postedRaw);
            if (parsed.isValid()) {
                parsedPosted = parsed.toDate();
            } else {
                // --- Step 3: No valid date, mark as estimated
                parsedPosted = new Date(); // fallback: use current scrape date
                isEstimated = true;
            }
        }

        // --- Normalize to YYYY-MM-DD
        const postedDate = dayjs(parsedPosted).format("YYYY-MM-DD");

        jobs.push({
            title,
            company,
            type,
            deadline,
            logo,
            link,
            tags,
            website,
            postedDate,
            isEstimated,
        });
    });

    return jobs;
}
