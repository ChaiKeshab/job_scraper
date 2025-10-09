# 🧠 Job Tracker Project Plan

A complete local-first setup to collect, manage, and visualize job listings scraped from the web.

---

## 🧱 Phase 1: Database Design & Setup

We started by identifying the core problem: storing scraped job data in a structured and reliable way. Instead of relying on temporary JSON files or CSV exports, we decided to use **PostgreSQL** locally.

To interact with it efficiently, we use **Drizzle ORM** — a lightweight and typesafe way to manage our database schema.

### ✅ Outcome

* Created normalized tables for:

  * Companies
  * Jobs
  * Contacts
  * Applications
  * Files (resumes, cover letters)
  * Notes
  * Tags (with many-to-many relation via job_tags)
* Our data storage is fully ready to handle relational queries.

This allows us to not only store raw scraped data but also link it to applications, notes, and used files — basically, a full job tracking system.

---

## 🕸️ Phase 2: Data Scraping System

Next step: getting actual data into our database.

We will build a scraping pipeline using **Next.js (API routes)** integrated with **Cheerio** and **Playwright**.

### Plan

1. **Cheerio** will handle static HTML scraping — perfect for parsing job boards or LinkedIn search pages.
2. **Playwright** will handle dynamic pages that require JavaScript rendering (e.g., sites that load listings via client-side JS).
3. Scraped data (company, job title, location, URL, etc.) will be sanitized and stored directly into our PostgreSQL tables using Drizzle ORM.
4. We'll include a lightweight logging mechanism to keep track of scrape sessions, errors, and duplicate checks.

### ✅ Outcome

* Automated scripts or API routes that can scrape, clean, and insert data into our DB.
* Flexibility to trigger scrapes manually or via a Next.js button later.

---

## 💾 Phase 3: File Management System

Since we are running locally, cloud storage (AWS, Supabase, etc.) isn't in use yet. We'll maintain all file references locally.

### Plan

* Store resumes and cover letters inside a `/public/files/` directory in the Next.js project.
* Each entry in the `files` table will store metadata such as filename, type (resume/cover_letter), and relative path.
* Future migration to cloud storage will be simple since file paths and metadata are already modeled.

### ✅ Outcome

* Simple and organized local file management tied to database records.

---

## 🧮 Phase 4: Data Visualization & Testing UI

Before going into automation or dashboard-level features, we’ll create a **basic UI** to test and view our data.

### Plan

1. Use a simple **Next.js page** that queries PostgreSQL through Drizzle.
2. Display the list of scraped jobs — including company name, title, and status.
3. Provide a minimal filtering and search feature for testing.
4. Eventually, we can build components for job detail view, file usage tracking, and application history.

### ✅ Outcome

* A minimal frontend confirming our backend setup works correctly.
* Foundation for future admin-like dashboard.

---

## 🚀 Phase 5: Migration & Automation Plan

Once we confirm local development stability:

1. Containerize PostgreSQL with Docker for portability.
2. Set up a job queue system (later) for periodic scrapes.
3. Optionally, migrate storage to Supabase or a remote PostgreSQL instance.

### ✅ Long-term Goal

A fully automated job tracking system with a personal dashboard showing:

* All scraped listings
* Companies contacted
* Files used
* Application progress
* Notes & follow-ups

---

## 🗂️ Final Project Folder Structure (No `/src` directory)

```
project-root/
├── app/
│   ├── page.tsx                      # Homepage or dashboard
│   ├── jobs/
│   │   ├── page.tsx                  # Display all scraped jobs
│   │   ├── [id]/page.tsx             # Job detail view
│   ├── api/
│   │   ├── scrape/
│   │   │   ├── route.ts              # API route for scraping trigger
│   │   ├── jobs/
│   │   │   ├── route.ts              # CRUD API for job records
│   │   ├── files/
│   │   │   ├── route.ts              # Upload/read local files
│   │   ├── companies/
│   │   │   ├── route.ts              # CRUD API for companies
│   │   ├── notes/
│   │   │   ├── route.ts              # Manage notes linked to jobs
│   └── components/
│       ├── JobCard.tsx               # Display job summary
│       ├── JobTable.tsx              # Table listing of jobs
│       ├── FileUploader.tsx          # Handle file links locally
│       ├── Layout.tsx
│
├── db/
│   ├── schema.ts                     # Drizzle ORM schemas
│   ├── drizzle.config.ts             # Drizzle configuration
│   ├── migrations/                   # Auto-generated migration files
│   └── index.ts                      # Drizzle client setup
│
├── scripts/
│   ├── scrapeStatic.ts               # Cheerio-based scraper
│   ├── scrapeDynamic.ts              # Playwright-based scraper
│   ├── seedData.ts                   # Seed JSON/local data into DB
│
├── public/
│   └── files/                        # Local resumes and cover letters
│
├── utils/
│   ├── dataFormatter.ts              # Cleans and formats scraped data
│   ├── dedupe.ts                     # Duplicate job check helper
│   ├── constants.ts
│
├── package.json
├── .env.local                        # Local DB connection string
└── README.md
```

---

## 🧩 Summary of Progress

| Phase | Description                                          | Status     |
| ----- | ---------------------------------------------------- | ---------- |
| 1     | Database schema design (PostgreSQL + Drizzle)        | ✅ Done     |
| 2     | Scraping system (Cheerio + Playwright + Next.js API) | 🔜 Next    |
| 3     | Local file management                                | 🔜 Next    |
| 4     | UI for viewing DB data                               | 🔜 Pending |
| 5     | Migration & Automation                               | 🕒 Later   |

---

This document will be updated as we move through each phase. The idea is to keep the setup minimal, local, and easy to migrate to cloud later.
