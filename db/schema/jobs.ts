import { pgTable, integer, text, varchar, timestamp, date, boolean } from "drizzle-orm/pg-core";
import { companiesTable } from "./companies";


export const jobsTable = pgTable("jobs", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer().notNull().references(() => companiesTable.id),
    title: varchar({ length: 255 }).notNull(),
    jobUrl: text(),
    salaryRange: varchar({ length: 100 }),
    employmentType: varchar({ length: 100 }),
    description: text(),
    postedDate: date().notNull(),        // required field  // "YYYY-MM-DD"
    deadline: date(),                    // nullable        // "YYYY-MM-DD"
    isEstimated: boolean().default(false), // true if chrono-node failed or missing info
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
});