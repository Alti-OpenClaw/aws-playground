import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const architectures = sqliteTable("architectures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  nodesJson: text("nodes_json").notNull(),
  edgesJson: text("edges_json").notNull(),
  notesJson: text("notes_json"),
  connectionConfigsJson: text("connection_configs_json"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertArchitectureSchema = createInsertSchema(architectures).omit({ id: true });
export type InsertArchitecture = z.infer<typeof insertArchitectureSchema>;
export type Architecture = typeof architectures.$inferSelect;
