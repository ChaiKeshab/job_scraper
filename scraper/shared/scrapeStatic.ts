import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeStatic(url: string): Promise<cheerio.CheerioAPI> {
    const { data } = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; JobScraper/1.0)" },
    });
    return cheerio.load(data);
}
