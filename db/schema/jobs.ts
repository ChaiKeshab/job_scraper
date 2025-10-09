import { pgTable, integer, text, varchar, timestamp, date } from "drizzle-orm/pg-core";
import { companiesTable } from "./companies";

export const jobsTable = pgTable("jobs", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer().notNull().references(() => companiesTable.id),
    title: varchar({ length: 255 }).notNull(),
    jobUrl: text(),
    salaryRange: varchar({ length: 100 }),
    employmentType: varchar({ length: 100 }),
    description: text(),
});
