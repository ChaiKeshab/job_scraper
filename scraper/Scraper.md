pnpm tsx scraper/runScraper.ts

TRUNCATE TABLE applications, companies, files, job_tags, jobs, notes, tags RESTART IDENTITY CASCADE;

DROP TABLE IF EXISTS applications, companies, files, jobs, notes, job_tags, tags CASCADE;
