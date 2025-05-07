import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Notion Database model
export const notionDatabases = pgTable("notion_databases", {
  id: text("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  title: text("title").notNull(),
  lastSynced: timestamp("lastSynced").notNull(),
  schema: jsonb("schema").notNull()
});

export const insertNotionDatabaseSchema = createInsertSchema(notionDatabases);
export type InsertNotionDatabase = z.infer<typeof insertNotionDatabaseSchema>;
export type NotionDatabase = typeof notionDatabases.$inferSelect;

// Notion Database Item model
export const notionDatabaseItems = pgTable("notion_database_items", {
  id: text("id").primaryKey(),
  notionPageId: text("notionPageId").notNull(),
  databaseId: text("databaseId").references(() => notionDatabases.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status"),
  priority: text("priority"),
  date: timestamp("date"),
  assignedTo: text("assignedTo"),
  category: text("category"),
  url: text("url"),
  lastUpdated: timestamp("lastUpdated").notNull(),
  properties: jsonb("properties").notNull()
});

export const insertNotionDatabaseItemSchema = createInsertSchema(notionDatabaseItems);
export type InsertNotionDatabaseItem = z.infer<typeof insertNotionDatabaseItemSchema>;
export type NotionDatabaseItem = typeof notionDatabaseItems.$inferSelect & {
  attachments?: Array<{ name: string, url: string }>,
  images?: Array<{ name: string, url: string }>,
  boxIds?: string[],
  boxNames?: string[],  // Added to store box names
  roomName?: string,
  notionId?: string // Notion's internal ID value (e.g., "92")
};

// Notion Credentials model for specific users
export const notionCredentials = pgTable("notion_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id).notNull(),
  integrationToken: text("integrationToken").notNull(),
  databaseId: text("databaseId").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow()
});

export const insertNotionCredentialsSchema = createInsertSchema(notionCredentials).pick({
  userId: true,
  integrationToken: true,
  databaseId: true
});

export type InsertNotionCredentials = z.infer<typeof insertNotionCredentialsSchema>;
export type NotionCredentials = typeof notionCredentials.$inferSelect;

// Notion Sync Settings
export const notionSyncSettings = pgTable("notion_sync_settings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id).notNull(),
  databaseId: text("databaseId").references(() => notionDatabases.id).notNull(),
  autoSync: boolean("autoSync").notNull().default(true),
  syncInterval: integer("syncInterval").notNull().default(300), // seconds
  lastSynced: timestamp("lastSynced")
});

export const insertNotionSyncSettingsSchema = createInsertSchema(notionSyncSettings).pick({
  userId: true,
  databaseId: true,
  autoSync: true,
  syncInterval: true
});

export type InsertNotionSyncSettings = z.infer<typeof insertNotionSyncSettingsSchema>;
export type NotionSyncSettings = typeof notionSyncSettings.$inferSelect;
