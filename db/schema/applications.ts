import { pgTable, integer, text, varchar, timestamp, date } from "drizzle-orm/pg-core";
import { jobsTable } from "./jobs";
import { filesTable } from "./files";


export const applicationsTable = pgTable("applications", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    jobId: integer().notNull().references(() => jobsTable.id),
    resumeId: integer().references(() => filesTable.id),
    coverLetterId: integer().references(() => filesTable.id),
    appliedDate: date().defaultNow(),
    status: varchar({ length: 100 }).default("Applied"),
    lastUpdated: timestamp({ withTimezone: true }).defaultNow(),
    via: varchar({ length: 255 }), // e.g. LinkedIn, Company Site
    feedback: text(),
});