import { pgTable, integer, text, varchar, timestamp, date, boolean } from "drizzle-orm/pg-core";
import { companiesTable } from "./companies";
import type { InferInsertModel } from "drizzle-orm";


export const jobsTable = pgTable("jobs", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer().notNull().references(() => companiesTable.id),
    title: varchar({ length: 255 }).notNull(),
    jobUrl: text(),
    salaryRange: varchar({ length: 100 }),
    employmentType: varchar({ length: 100 }),
    experience: varchar({ length: 100 }),
    description: text(),
    postedDate: date().notNull(),          // required field  // "YYYY-MM-DD"
    deadline: date(),                      // nullable        // "YYYY-MM-DD"
    isEstimated: boolean().default(false), // true if missing actual postedDate | a default scraped date is used in postedDate if missing on scraping
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
});

export type DbJobsType = InferInsertModel<typeof jobsTable>;