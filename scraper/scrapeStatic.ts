import axios from "axios";
import * as cheerio from "cheerio";
import { detectTags } from "./utils";
import type { JobItem } from "./shared/types";


export async function scrapeStatic(url: string): Promise<JobItem[]> {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const jobs: JobItem[] = [];

    $("a.block-link").each((_, el) => {
        const link = $(el).attr("href")?.trim() || "";
        const job = $(el).find(".job-listing");

        const title = job.find(".job__title").text().trim();
        const company = job.find(".job__company span").first().text().trim();
        const type = job.find(".job__company span").last().text().trim();
        const deadline = job.find(".job__deadline").text().trim();
        const logo = job.find(".job-company__logo img").attr("src") || "";

        const tags = detectTags(title);

        jobs.push({
            title,
            company,
            type,
            deadline,
            logo,
            link,
            tags
        });
    });

    return jobs;
}
