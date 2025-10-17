import { saveJobsToDB } from "./saveToDB";
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