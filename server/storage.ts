import { type Architecture, type InsertArchitecture, architectures } from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  getArchitectures(): Promise<Architecture[]>;
  getArchitecture(id: number): Promise<Architecture | undefined>;
  createArchitecture(arch: InsertArchitecture): Promise<Architecture>;
  updateArchitecture(id: number, arch: InsertArchitecture): Promise<Architecture | undefined>;
  deleteArchitecture(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getArchitectures(): Promise<Architecture[]> {
    return db.select().from(architectures).all();
  }
  async getArchitecture(id: number): Promise<Architecture | undefined> {
    return db.select().from(architectures).where(eq(architectures.id, id)).get();
  }
  async createArchitecture(arch: InsertArchitecture): Promise<Architecture> {
    return db.insert(architectures).values(arch).returning().get();
  }
  async updateArchitecture(id: number, arch: InsertArchitecture): Promise<Architecture | undefined> {
    return db.update(architectures).set(arch).where(eq(architectures.id, id)).returning().get();
  }
  async deleteArchitecture(id: number): Promise<void> {
    db.delete(architectures).where(eq(architectures.id, id)).run();
  }
}

export const storage = new DatabaseStorage();
