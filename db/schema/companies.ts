import { integer, pgTable, varchar, text } from "drizzle-orm/pg-core";

export const companiesTable = pgTable("companies", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    website: text(),
    location: varchar({ length: 255 }),
    industry: varchar({ length: 255 }),
});