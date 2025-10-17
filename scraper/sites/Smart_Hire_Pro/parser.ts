import type { JobItem } from "@/scraper/shared/types";
import { chronoDate, detectTags } from "@/scraper/shared/utils";
import type { CheerioAPI } from "cheerio";
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
        const parsedDeadline = chronoDate(deadline);

        /**
         * proper posted date and deadline present in deatil page.
         */

        jobs.push({
            title,
            company,
            type,
            deadline: parsedDeadline,
            logo,
            link,
            tags,
            website,
            postedDate: null,
            isEstimated: true,
        });
    });

    return jobs;
}



export function parseSmartHireProDetail($: CheerioAPI): Partial<JobItem> {
    let postedDate: string | null = null;
    let type: string | null = null;
    let experience: string | null = null;
    let deadline: string | null = null;

    $(".list-unstyled li").each((_, el) => {
        const label = $(el).find("strong").text().trim().replace(/:$/, "");
        const value = $(el).find("span").text().trim();

        switch (label) {
            case "Date Posted":
                postedDate = value || null;
                break;
            case "Employment Type":
                type = value || null;
                break;
            case "Experience":
                experience = value || null;
                break;
            case "Deadline":
                deadline = value || null;
                break;
        }
    });

    return ({
        postedDate,
        type,
        experience,
        deadline,
    });
}
