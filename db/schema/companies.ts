import { integer, pgTable, varchar, timestamp, text, uniqueIndex } from "drizzle-orm/pg-core";

export const companiesTable = pgTable("companies", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    website: text(),
    location: varchar({ length: 255 }),
    industry: varchar({ length: 255 }),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
},
    (table) => [uniqueIndex("companies_name_unique").on(table.name)]
);