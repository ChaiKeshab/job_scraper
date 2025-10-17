import dayjs from "dayjs";
import { saveJobsToDB } from "./saveToDB";
import { formattedDate } from "./shared/utils";
import { scrapeSmartHirePro, scrapeSmartHireProDetail } from "./sites/Smart_Hire_Pro/scraper";
import type { JobItem } from "./shared/types";

// interface ScraperDefinition {
//   name: string;
//   scraper: () => Promise<JobItem[]>;
// }

// const scrapers: ScraperDefinition[] = [
//   { name: "SmartHirePro", scraper: scrapeSmartHirePro },
//   // { name: "MeroJob", scraper: scrapeMeroJob },
// ];

/**
 * Some job listing sites, like SmartHirePro, host postings from multiple companies.
 * The "for" property lists the specific companies we are currently tracking on that site.
 * In the future, this property can be used by the scraper to generate URLs for each company.
 */

export const scrapers = {
  "smarthirepro": {
    for: ['gurzu-inc'],
    type: "static",
    scraper: scrapeSmartHirePro,
    detail: scrapeSmartHireProDetail
  },
};

(async () => {
  console.log("🚀 Starting all scrapers...\n");

  const results = await Promise.allSettled(
    Object.entries(scrapers).map(async ([name, config]) => {
      console.log(`🔍 Running ${name}...`);

      try {
        // Scrape job list
        let jobs: JobItem[] = await config.scraper();

        // detail page scraper
        if (config.detail) {
          const enrichedJobs: JobItem[] = await Promise.all(
            jobs.map(async (job) => {
              if (!job?.link) { return job };
              return ({
                ...job,
                ...(await config.detail(job.link)),
              })
            }
            )
          );
          jobs = enrichedJobs;
        }

        await saveJobsToDB(jobs);
        console.log(`✅ Finished ${name} (${jobs.length} jobs)\n`);
      } catch (err) {
        console.error(`❌ Error in ${name}:`, err);
        throw err;
      }
    })
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(`⚠️ ${failed.length} scraper(s) failed:`);
    failed.forEach((r, i) => console.error(` - ${Object.keys(scrapers)[i]}`));
  } else {
    console.log("🎉 All scrapers completed successfully!");
  }

  process.exit(0);
})();

/**
  "scripts": {
    "dev": "pnpm run build:resume && pnpm exec astro dev --host",
    "dev:fetch": "pnpm exec node scripts/fetch-readmes.js && pnpm run build:resume && pnpm exec astro dev --host",
    "prebuild": "node scripts/fetch-readmes.js",
    "build": "astro build",
    "build:resume": "typst compile resume/keshabChaiResume.typ public/keshabChaiResume.pdf",
    "preview": "astro preview",
    "astro": "astro"
  },
 */


/**
 * 
 * 
  Title: Senior Frontend Engineer,
  Company: Doscumo,
  link: https://jobs.lever.co/docsumo/7027c3cf-e252-4651-8335-b08891989fba
  cover letter: Docsumo’s product turning documents into usable data is exactly the kind of problem I like to build for. I’ve shipped production admin dashboards from scratch, integrated OpenAI for live voice agents, implemented real-time features with WebSocket, and improved apps by migrating them to TypeScript and securing payment flows with Stripe. I haven’t been a five-year manager, but I’ve taken full ownership of entire frontends, solved core technical issues that held back releases, and helped teammates through those builds. I move fast, learn fast, and focus on making the customer-facing webapp feel reliable and polished — the same priorities Docsumo has for its product. I hope you’ll give me a chance to show how I can help build and scale your React webapp.
  dateApplied: '10/9/2025'


 */

/**
 * 
 
Bad Reps:
name: esignature,
source: https://www.reddit.com/r/technepal/comments/1d8j3tf/esignature_pvt_ltd_ko_salary_ra_working/

 */