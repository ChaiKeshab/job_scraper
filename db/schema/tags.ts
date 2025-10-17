import { pgTable, integer, varchar } from "drizzle-orm/pg-core";
import { jobsTable } from "./jobs";

export const tagsTable = pgTable("tags", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 100 }).notNull(),
});

export const jobTagsTable = pgTable("job_tags", {
    jobId: integer().notNull().references(() => jobsTable.id),
    tagId: integer().notNull().references(() => tagsTable.id),
});