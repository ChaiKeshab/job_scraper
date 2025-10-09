import { pgTable, integer, text, varchar, timestamp, date } from "drizzle-orm/pg-core";
import { applicationsTable } from "./applications";

export const notesTable = pgTable("notes", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    applicationId: integer().notNull().references(() => applicationsTable.id),
    date: date().defaultNow(),
    type: varchar({ length: 100 }), // e.g. "Follow-up", "Interview"
    message: text(),
});
