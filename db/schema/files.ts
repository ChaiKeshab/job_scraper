import { pgTable, integer, text, varchar, timestamp, date } from "drizzle-orm/pg-core";

export const filesTable = pgTable("files", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    type: varchar({ length: 50 }).notNull(), // 'resume' or 'cover_letter'
    name: varchar({ length: 255 }).notNull(),
    path: text().notNull(), // relative file path
    createdDate: date().defaultNow(),
});
