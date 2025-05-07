import { 
  users, type User, type InsertUser,
  notionDatabases, type NotionDatabase, type InsertNotionDatabase,
  notionDatabaseItems, type NotionDatabaseItem, type InsertNotionDatabaseItem,
  notionCredentials, type NotionCredentials, type InsertNotionCredentials,
  notionSyncSettings, type NotionSyncSettings, type InsertNotionSyncSettings
} from "@shared/schema";

// Storage interface definition
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Notion database methods
  getNotionDatabase(id: string): Promise<NotionDatabase | undefined>;
  getNotionDatabasesByUserId(userId: number): Promise<NotionDatabase[]>;
  createNotionDatabase(database: InsertNotionDatabase): Promise<NotionDatabase>;
  updateNotionDatabase(id: string, database: Partial<NotionDatabase>): Promise<NotionDatabase | undefined>;
  
  // Notion database items methods
  getNotionDatabaseItem(id: string): Promise<NotionDatabaseItem | undefined>;
  getNotionDatabaseItems(databaseId: string): Promise<NotionDatabaseItem[]>;
  createNotionDatabaseItem(item: InsertNotionDatabaseItem): Promise<NotionDatabaseItem>;
  updateNotionDatabaseItem(id: string, item: Partial<NotionDatabaseItem>): Promise<NotionDatabaseItem | undefined>;
  
  // Notion credentials methods
  getNotionCredentialsByUserId(userId: number): Promise<NotionCredentials | undefined>;
  createNotionCredentials(credentials: InsertNotionCredentials): Promise<NotionCredentials>;
  updateNotionCredentials(id: number, credentials: Partial<NotionCredentials>): Promise<NotionCredentials | undefined>;
  
  // Notion sync settings methods
  getNotionSyncSettingsByUserAndDatabase(userId: number, databaseId: string): Promise<NotionSyncSettings | undefined>;
  createNotionSyncSettings(settings: InsertNotionSyncSettings): Promise<NotionSyncSettings>;
  updateNotionSyncSettings(id: number, settings: Partial<NotionSyncSettings>): Promise<NotionSyncSettings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private notionDatabases: Map<string, NotionDatabase>;
  private notionDatabaseItems: Map<string, NotionDatabaseItem>;
  private notionCredentials: Map<number, NotionCredentials>;
  private notionSyncSettings: Map<number, NotionSyncSettings>;
  private userId: number;
  private credentialId: number;
  private syncSettingsId: number;

  constructor() {
    this.users = new Map();
    this.notionDatabases = new Map();
    this.notionDatabaseItems = new Map();
    this.notionCredentials = new Map();
    this.notionSyncSettings = new Map();
    this.userId = 1;
    this.credentialId = 1;
    this.syncSettingsId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Notion database methods
  async getNotionDatabase(id: string): Promise<NotionDatabase | undefined> {
    return this.notionDatabases.get(id);
  }
  
  async getNotionDatabasesByUserId(userId: number): Promise<NotionDatabase[]> {
    return Array.from(this.notionDatabases.values()).filter(
      (db) => db.userId === userId
    );
  }
  
  async createNotionDatabase(database: InsertNotionDatabase): Promise<NotionDatabase> {
    const notionDatabase: NotionDatabase = { ...database };
    this.notionDatabases.set(database.id, notionDatabase);
    return notionDatabase;
  }
  
  async updateNotionDatabase(id: string, database: Partial<NotionDatabase>): Promise<NotionDatabase | undefined> {
    const existingDatabase = await this.getNotionDatabase(id);
    if (!existingDatabase) return undefined;
    
    const updatedDatabase = { ...existingDatabase, ...database };
    this.notionDatabases.set(id, updatedDatabase);
    return updatedDatabase;
  }
  
  // Notion database items methods
  async getNotionDatabaseItem(id: string): Promise<NotionDatabaseItem | undefined> {
    return this.notionDatabaseItems.get(id);
  }
  
  async getNotionDatabaseItems(databaseId: string): Promise<NotionDatabaseItem[]> {
    return Array.from(this.notionDatabaseItems.values()).filter(
      (item) => item.databaseId === databaseId
    );
  }
  
  async createNotionDatabaseItem(item: InsertNotionDatabaseItem): Promise<NotionDatabaseItem> {
    const notionDatabaseItem: NotionDatabaseItem = { ...item };
    this.notionDatabaseItems.set(item.id, notionDatabaseItem);
    return notionDatabaseItem;
  }
  
  async updateNotionDatabaseItem(id: string, item: Partial<NotionDatabaseItem>): Promise<NotionDatabaseItem | undefined> {
    const existingItem = await this.getNotionDatabaseItem(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...item };
    this.notionDatabaseItems.set(id, updatedItem);
    return updatedItem;
  }
  
  // Notion credentials methods
  async getNotionCredentialsByUserId(userId: number): Promise<NotionCredentials | undefined> {
    return Array.from(this.notionCredentials.values()).find(
      (cred) => cred.userId === userId
    );
  }
  
  async createNotionCredentials(credentials: InsertNotionCredentials): Promise<NotionCredentials> {
    const id = this.credentialId++;
    const createdAt = new Date();
    const notionCredential: NotionCredentials = { ...credentials, id, createdAt };
    this.notionCredentials.set(id, notionCredential);
    return notionCredential;
  }
  
  async updateNotionCredentials(id: number, credentials: Partial<NotionCredentials>): Promise<NotionCredentials | undefined> {
    const existingCredentials = this.notionCredentials.get(id);
    if (!existingCredentials) return undefined;
    
    const updatedCredentials = { ...existingCredentials, ...credentials };
    this.notionCredentials.set(id, updatedCredentials);
    return updatedCredentials;
  }
  
  // Notion sync settings methods
  async getNotionSyncSettingsByUserAndDatabase(userId: number, databaseId: string): Promise<NotionSyncSettings | undefined> {
    return Array.from(this.notionSyncSettings.values()).find(
      (settings) => settings.userId === userId && settings.databaseId === databaseId
    );
  }
  
  async createNotionSyncSettings(settings: InsertNotionSyncSettings): Promise<NotionSyncSettings> {
    const id = this.syncSettingsId++;
    const lastSynced = new Date();
    const notionSyncSetting: NotionSyncSettings = { ...settings, id, lastSynced };
    this.notionSyncSettings.set(id, notionSyncSetting);
    return notionSyncSetting;
  }
  
  async updateNotionSyncSettings(id: number, settings: Partial<NotionSyncSettings>): Promise<NotionSyncSettings | undefined> {
    const existingSettings = this.notionSyncSettings.get(id);
    if (!existingSettings) return undefined;
    
    const updatedSettings = { ...existingSettings, ...settings };
    this.notionSyncSettings.set(id, updatedSettings);
    return updatedSettings;
  }
}

export const storage = new MemStorage();
