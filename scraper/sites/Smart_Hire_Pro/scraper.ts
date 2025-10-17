import type { JobItem } from "@/scraper/shared/types";
import { scrapeStatic } from "../../shared/scrapeStatic";
import { parseSmartHirePro } from "./parser";
import { parseSmartHireProDetail } from "./parser";


/**
 * Note: Errors from network requests (scrapeStatic) or parsing (parseSmartHirePro / parseSmartHireProDetail)
 * are not caught here. They will propagate to the runScraper.ts;
 * This allows the runner to handle failures centrally (e.g., logging, retries, or skipping failed scrapers)
 */


export async function scrapeSmartHirePro(): Promise<JobItem[]> {
    const url = "https://smarthirepro.com/company/gurzu-inc/";
    const $ = await scrapeStatic(url);
    const jobs = parseSmartHirePro({ $, website: url });
    return jobs;
}


export async function scrapeSmartHireProDetail(url: string) {
    const $ = await scrapeStatic(url);
    return parseSmartHireProDetail($);
}
