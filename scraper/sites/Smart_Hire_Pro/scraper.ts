import type { JobItem } from "@/scraper/shared/types";
import { scrapeStatic } from "../../shared/scrapeStatic";
import { parseSmartHirePro } from "./parser";


export async function scrapeSmartHirePro(): Promise<JobItem[]> {
    const url = "https://smarthirepro.com/company/gurzu-inc/";
    const $ = await scrapeStatic(url);
    const jobs = parseSmartHirePro($);
    return jobs;
}
