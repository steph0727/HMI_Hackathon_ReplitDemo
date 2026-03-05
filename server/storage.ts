import { patients, type Patient, type InsertPatient } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getPatient(id: number): Promise<Patient | undefined>;
  getPatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatientStatus(id: number, status: string): Promise<Patient>;
}

export class DatabaseStorage implements IStorage {
  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async getPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(desc(patients.urgencyScore));
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db.insert(patients).values(insertPatient).returning();
    return patient;
  }

  async updatePatientStatus(id: number, status: string): Promise<Patient> {
    const [patient] = await db.update(patients)
      .set({ status })
      .where(eq(patients.id, id))
      .returning();
    return patient;
  }
}

export const storage = new DatabaseStorage();
