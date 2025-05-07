import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Client as NotionClient } from "@notionhq/client";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import compression from "compression";

// Validate Notion connection credentials
const notionConnectionSchema = z.object({
  integrationToken: z.string().min(1, "Integration token is required"),
  databaseId: z.string().min(1, "Database ID is required"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Add compression middleware for faster mobile loading
  app.use(compression());

  // API routes
  // Legacy endpoint that now returns a proper JSON response 
  // directing to use the database-info endpoint instead
  app.post('/api/notion/connect', async (req, res) => {
    try {
      // Use environment variables for Notion API credentials
      const integrationToken = process.env.NOTION_TOKEN;
      const databaseId = process.env.NOTION_DATABASE_ID;
      
      if (!integrationToken || !databaseId) {
        return res.status(500).json({ 
          success: false, 
          message: "Server configuration error: Notion credentials missing" 
        });
      }
      
      // Initialize Notion client
      const notion = new NotionClient({
        auth: integrationToken
      });
      
      // Retrieve database metadata
      const database = await notion.databases.retrieve({
        database_id: databaseId
      });
      
      res.json({
        success: true,
        database: {
          id: database.id,
          title: database.title?.[0]?.plain_text || "Notion Database",
          lastSynced: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error("Error in legacy connect endpoint:", err);
      
      // Handle Notion API errors
      const error = err as Error;
      const status = (err as any).status || 500;
      const message = error.message || "Failed to connect to Notion";
      
      res.status(status).json({ 
        success: false, 
        message
      });
    }
  });
  
  // Get database info
  app.get('/api/notion/database-info', async (req, res) => {
    try {
      // Use environment variables for Notion API credentials
      const integrationToken = process.env.NOTION_TOKEN;
      const databaseId = process.env.NOTION_DATABASE_ID;
      
      if (!integrationToken || !databaseId) {
        return res.status(500).json({ 
          success: false, 
          message: "Server configuration error: Notion credentials missing" 
        });
      }
      
      // Initialize Notion client
      const notion = new NotionClient({
        auth: integrationToken
      });
      
      // Retrieve database metadata
      const database = await notion.databases.retrieve({
        database_id: databaseId
      });
      
      res.json({
        success: true,
        connected: true,
        database: {
          id: database.id,
          title: database.title?.[0]?.plain_text || "Notion Database",
          lastSynced: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error("Error fetching Notion database info:", err);
      
      // Handle Notion API errors
      const error = err as Error;
      const status = (err as any).status || 500;
      const message = error.message || "Failed to connect to Notion";
      
      res.status(status).json({ 
        success: false,
        connected: false,
        message
      });
    }
  });

  // Get database items with optional filtering and searching
  app.get('/api/notion/database', async (req, res) => {
    try {
      // Get query parameters
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};
      const sort = req.query.sort ? JSON.parse(req.query.sort as string) : null;
      const search = req.query.search as string || '';
      
      // Use environment variables for Notion API credentials
      const integrationToken = process.env.NOTION_TOKEN;
      const databaseId = process.env.NOTION_DATABASE_ID;
      
      if (!integrationToken || !databaseId) {
        return res.status(500).json({ 
          success: false, 
          message: "Server configuration error: Notion credentials missing" 
        });
      }
      
      // Initialize Notion client
      const notion = new NotionClient({
        auth: integrationToken
      });
      
      // Build the Notion query
      const queryParams: any = {
        database_id: databaseId,
        page_size: 100,
      };
      
      // Add sorting if provided
      if (sort) {
        queryParams.sorts = [{
          property: sort.property,
          direction: sort.direction
        }];
      }
      
      // Add filters if provided
      if (Object.keys(filters).length > 0) {
        queryParams.filter = {
          and: Object.entries(filters)
            .filter(([_, value]) => value !== null)
            .map(([key, value]) => ({
              property: key,
              [typeof value === 'string' ? 'rich_text' : 'checkbox']: {
                equals: value
              }
            }))
        };
      }
      
      // Add search if provided
      if (search) {
        // Notion doesn't have a native search in query, so we'll filter results after
      }
      
      // Query the database
      const response = await notion.databases.query(queryParams);
      
      // Process the results to extract relevant data
      const items = response.results.map(page => {
        // Extract page properties according to your schema
        const properties = page.properties;
        const title = extractTitle(properties);
        const description = extractRichText(properties.Description);
        const status = extractSelect(properties.Status);
        const priority = extractSelect(properties.Priority);
        const date = extractDate(properties.Date);
        const assignedTo = extractPerson(properties.AssignedTo);
        const category = extractSelect(properties.Category);
        
        return {
          id: page.id,
          title,
          description,
          status,
          priority,
          date: date || new Date().toISOString(),
          assignedTo,
          category,
          url: page.url,
          lastUpdated: page.last_edited_time,
          properties: page.properties
        };
      });
      
      // Filter by search term if provided
      const filteredItems = search 
        ? items.filter(item => 
            item.title.toLowerCase().includes(search.toLowerCase()) || 
            (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
          )
        : items;
      
      res.json(filteredItems);
    } catch (err) {
      console.error("Error fetching database items:", err);
      
      // Handle Notion API errors
      const error = err as Error;
      const status = (err as any).status || 500;
      const message = error.message || "Failed to fetch database items";
      
      res.status(status).json({ 
        success: false, 
        message
      });
    }
  });

  // Get a specific database item
  app.get('/api/notion/database/:id', async (req, res) => {
    try {
      const pageId = req.params.id;
      
      // Use environment variables for Notion API credentials
      const integrationToken = process.env.NOTION_TOKEN;
      
      if (!integrationToken) {
        return res.status(500).json({ 
          success: false, 
          message: "Server configuration error: Notion token missing" 
        });
      }
      
      // Initialize Notion client
      const notion = new NotionClient({
        auth: integrationToken
      });
      
      // Retrieve the page
      const page = await notion.pages.retrieve({
        page_id: pageId
      });
      
      // Get page blocks (content)
      const blocks = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100
      });
      
      // Extract properties
      const properties = page.properties;
      const title = extractTitle(properties);
      const description = extractRichText(properties.Description);
      const status = extractSelect(properties.Status);
      const priority = extractSelect(properties.Priority);
      const date = extractDate(properties.Date);
      const assignedTo = extractPerson(properties.AssignedTo);
      const category = extractSelect(properties.Category);
      
      // Get attachments if any
      const attachments = extractAttachments(properties.Attachments);
      
      // Process blocks to get full description if needed
      let fullDescription = description || '';
      blocks.results.forEach(block => {
        if (block.type === 'paragraph') {
          const paragraphText = block.paragraph?.rich_text?.map(text => text.plain_text).join('') || '';
          if (paragraphText) {
            fullDescription += fullDescription ? '\n\n' + paragraphText : paragraphText;
          }
        }
      });
      
      const item = {
        id: page.id,
        title,
        description: fullDescription,
        status,
        priority,
        date: date || new Date().toISOString(),
        assignedTo,
        category,
        url: page.url,
        lastUpdated: page.last_edited_time,
        attachments,
        properties: page.properties
      };
      
      res.json(item);
    } catch (err) {
      console.error("Error fetching database item:", err);
      
      // Handle Notion API errors
      const error = err as Error;
      const status = (err as any).status || 500;
      const message = error.message || "Failed to fetch database item";
      
      res.status(status).json({ 
        success: false, 
        message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions to extract Notion property values
function extractTitle(properties: any): string {
  const titleProperty = Object.values(properties).find((prop: any) => prop.type === 'title');
  if (titleProperty && titleProperty.title.length > 0) {
    return titleProperty.title.map((text: any) => text.plain_text).join('');
  }
  return 'Untitled';
}

function extractRichText(property: any): string {
  if (!property || property.type !== 'rich_text' || !property.rich_text) {
    return '';
  }
  return property.rich_text.map((text: any) => text.plain_text).join('');
}

function extractSelect(property: any): string {
  if (!property || property.type !== 'select' || !property.select) {
    return '';
  }
  return property.select.name || '';
}

function extractDate(property: any): string | null {
  if (!property || property.type !== 'date' || !property.date) {
    return null;
  }
  return property.date.start || null;
}

function extractPerson(property: any): string {
  if (!property || property.type !== 'people' || !property.people.length) {
    return '';
  }
  return property.people[0].name || '';
}

function extractAttachments(property: any): Array<{ name: string, url: string }> {
  if (!property || property.type !== 'files' || !property.files.length) {
    return [];
  }
  
  return property.files.map((file: any) => ({
    name: file.name || 'Attachment',
    url: file.file?.url || file.external?.url || ''
  })).filter((file: any) => file.url);
}
