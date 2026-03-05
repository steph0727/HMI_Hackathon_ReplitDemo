import { pgTable, text, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  medicalHistory: text("medical_history").notNull(),
  familyHistory: text("family_history").notNull(),
  rawInput: text("raw_input").notNull(), 
  extractedSymptoms: text("extracted_symptoms").array().notNull(),
  urgencyScore: integer("urgency_score").notNull(),
  status: varchar("status", { length: 20 }).notNull().default('waiting'),
  explanation: text("explanation").notNull(),
  detectedLanguage: text("detected_language"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPatientSchema = createInsertSchema(patients).omit({ 
  id: true, createdAt: true 
});

export const triageInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(0, "Age must be valid"),
  medicalHistory: z.string(),
  familyHistory: z.string(),
  symptomsInput: z.string().min(1, "Symptoms are required"),
  isAudio: z.boolean().default(false),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type TriageInput = z.infer<typeof triageInputSchema>;
