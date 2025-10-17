ALTER TABLE "companies" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "updatedAt" timestamp DEFAULT now();