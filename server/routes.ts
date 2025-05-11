import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Client as NotionClient } from "@notionhq/client";
import { notionService } from "./notion";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import compression from "compression";
import path from "path";

// Validate Notion connection credentials
const notionConnectionSchema = z.object({
  integrationToken: z.string().min(1, "Integration token is required"),
  databaseId: z.string().min(1, "Database ID is required"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Special route to serve test deployment app
  app.use('/deploy', express.static(path.join(import.meta.dirname, '..', 'deploy')));
  
  // Test deployment catch-all route for client-side routing
  app.get('/deploy/*', (req, res) => {
    res.sendFile(path.join(import.meta.dirname, '..', 'deploy', 'index.html'));
  });
  
  // Add diagnostics endpoint for troubleshooting production issues
  app.get('/api/diagnostics/env', (req, res) => {
    const requiredVars = ['NOTION_TOKEN', 'NOTION_DATABASE_ID'];
    const variables: Record<string, boolean> = {};
    
    // Check for required environment variables
    let allPresent = true;
    requiredVars.forEach(varName => {
      const isPresent = !!process.env[varName];
      variables[varName] = isPresent;
      if (!isPresent) {
        allPresent = false;
      }
    });
    
    res.json({
      success: allPresent,
      message: allPresent 
        ? 'All required environment variables are present' 
        : 'Some required environment variables are missing',
      variables
    });
  });
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
  
  // Get rooms directly from Notion Rooms database
  app.get('/api/notion/rooms', async (req, res) => {
    try {
      // Use environment variables for Notion API credentials
      const integrationToken = process.env.NOTION_TOKEN;
      const roomsDatabaseId = process.env.NOTION_ROOMS_DATABASE_ID;
      
      if (!integrationToken || !roomsDatabaseId) {
        return res.status(500).json({ 
          success: false, 
          message: "Server configuration error: Notion credentials or Rooms database ID missing" 
        });
      }
      
      // Initialize Notion client
      const notion = new NotionClient({
        auth: integrationToken
      });
      
      console.log(`Fetching rooms from Notion database ID: ${roomsDatabaseId}`);
      
      // Query the rooms database directly
      const response = await notion.databases.query({
        database_id: roomsDatabaseId,
        page_size: 100,
      });
      
      // Extract room names from the database entries
      const rooms = response.results.map(page => {
        const title = extractTitle(page.properties);
        return {
          id: title.toLowerCase().replace(/\s+/g, '-'),
          name: title
        };
      });
      
      if (rooms.length === 0) {
        console.warn("No rooms found in the Notion Rooms database");
        // Fallback to static rooms if no rooms found in the data
        return res.json({
          success: true,
          rooms: [
            { id: 'kitchen', name: 'Kitchen' },
            { id: 'living-room', name: 'Living Room' }, 
            { id: 'bedroom-1', name: 'Bedroom 1' },
            { id: 'bedroom-2', name: 'Bedroom 2' }, 
            { id: 'garage', name: 'Garage' },
            { id: 'attic', name: 'Attic' },
            { id: 'bathroom', name: 'Bathroom' },
            { id: 'harry-potter-closet', name: 'Harry Potter Closet' } // Add the missing room
          ]
        });
      }
      
      console.log(`Found ${rooms.length} room(s) in Notion data`);
      console.log('Rooms:', rooms.map(r => r.name).join(', '));
      
      res.json({ 
        success: true, 
        rooms
      });
    } catch (err) {
      console.error("Error fetching rooms:", err);
      
      // Handle Notion API errors
      const error = err as Error;
      const status = (err as any).status || 500;
      const message = error.message || "Failed to fetch rooms";
      
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
        const filterConditions = Object.entries(filters)
          .filter(([_, value]) => value !== null)
          .map(([key, value]) => {
            // Special case for box filter
            if (key === 'box') {
              return {
                property: 'Box',
                relation: {
                  contains: value as string
                }
              };
            }
            // Special case for room filter (since it's a rollup property)
            else if (key === 'room') {
              // For rooms, we need to filter client-side after fetching
              // This is a placeholder to indicate we want a room filter
              return {
                property: 'Name', // Use a property that always exists as a placeholder
                title: {
                  is_not_empty: true
                }
              };
            }
            // Normal text-based filters
            else {
              return {
                property: key,
                [typeof value === 'string' ? 'rich_text' : 'checkbox']: {
                  equals: value
                }
              };
            }
          });
        
        if (filterConditions.length > 0) {
          queryParams.filter = {
            and: filterConditions
          };
        }
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
        
        // Extract Box relation if available
        const boxRelations = properties.Box?.relation || [];
        const boxIds = boxRelations.map((rel: any) => rel.id);
        
        // Extract Room relation if available
        let roomName = "";
        if (properties.Room?.rollup?.array?.[0]?.relation) {
          roomName = extractRollupRelation(properties.Room);
        }
        
        // Extract images if available
        const images = extractAttachments(properties.Image);
        
        return {
          id: page.id,
          title,
          boxIds,
          roomName,
          images,
          url: page.url,
          lastUpdated: page.last_edited_time,
          properties: page.properties
        };
      });
      
      // Apply post-processing filters
      let filteredItems = items;
      
      // Filter by search term if provided
      if (search) {
        filteredItems = filteredItems.filter(item => 
          item.title.toLowerCase().includes(search.toLowerCase()) || 
          (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
        );
      }
      
      // Apply room filter client-side if needed
      if (filters.room) {
        console.log(`Filtering by room: ${filters.room}`);
        
        // Filter by actual room name
        filteredItems = filteredItems.filter(item => {
          // If we have room data, filter by it
          if (item.roomName) {
            const itemRoomId = item.roomName.toLowerCase().replace(/\s+/g, '-');
            const match = itemRoomId === filters.room || item.roomName === filters.room;
            
            console.log(`Item ${item.title} is in room "${item.roomName}", match = ${match}`);
            return match;
          }
          
          // If no room data, don't include in filtered results
          return false;
        });
        
        console.log(`Filtered to ${filteredItems.length} items`);
      }
      
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
      // Use environment variables for Notion API credentials
      const integrationToken = process.env.NOTION_TOKEN;
      const databaseId = process.env.NOTION_DATABASE_ID;
      
      if (!integrationToken || !databaseId) {
        return res.status(500).json({ 
          success: false, 
          message: "Server configuration error: Notion credentials missing" 
        });
      }
      
      // Use the page ID directly from the request
      const pageId = req.params.id;
      
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
      
      // If this is a box, look for room property
      let roomId = "";
      let roomName = "";
      
      if (properties.Room?.relation && properties.Room.relation.length > 0) {
        // This is a direct room relation (for boxes)
        roomId = properties.Room.relation[0].id;
        
        try {
          // Get the room name by fetching the room page
          const roomPage = await notion.pages.retrieve({ page_id: roomId });
          if (roomPage.properties) {
            roomName = extractTitle(roomPage.properties);
          }
        } catch (error) {
          console.error("Error fetching room details:", error);
        }
      }
      
      // If no direct room relation, check for rollup (for items)
      if (!roomName && properties.Room?.rollup?.array?.[0]?.relation) {
        roomName = extractRollupRelation(properties.Room);
      }
      
      // Extract Box relation if available (for items)
      const boxRelations = properties.Box?.relation || [];
      const boxIds = boxRelations.map((rel: any) => rel.id);
      
      // For each box ID, fetch the box name
      let boxNames: string[] = [];
      if (boxIds.length > 0) {
        try {
          // Get box names by fetching each box
          const boxPromises = boxIds.map(async (boxId: string) => {
            try {
              const boxPage = await notion.pages.retrieve({ page_id: boxId });
              return extractTitle((boxPage as any).properties);
            } catch (error) {
              console.error(`Error fetching box details for ${boxId}:`, error);
              return boxId; // Fallback to ID if we can't get the name
            }
          });
          
          boxNames = await Promise.all(boxPromises);
        } catch (error) {
          console.error("Error fetching box names:", error);
        }
      }
      
      // Extract images if available
      const images = extractAttachments(properties.Image);
      
      // Get additional attachments if any
      const attachments = extractAttachments(properties.Attachments || {});
      
      // Extract the custom ID number from properties if available
      let notionId = extractId((page as any).properties);
      
      // Also check for unique_id type
      if (!notionId && properties.ID?.type === 'unique_id' && properties.ID.unique_id?.number) {
        notionId = properties.ID.unique_id.number.toString();
      }
      
      // Process blocks and properties to get full description
      let description = '';
      
      // 1. First check Description property if it exists
      if ((page as any).properties.Description) {
        const propertyDescription = extractRichText((page as any).properties.Description);
        if (propertyDescription) {
          description = propertyDescription;
        }
      }
      
      // 2. Then add any paragraph blocks found
      blocks.results.forEach(block => {
        if ((block as any).type === 'paragraph') {
          const paragraphText = (block as any).paragraph?.rich_text?.map((text: any) => text.plain_text).join('') || '';
          if (paragraphText) {
            description = description ? description + '\n\n' + paragraphText : paragraphText;
          }
        }
      });
        
      const itemDetails = {
        id: page.id,
        title,
        boxIds,
        boxNames,
        roomName,
        description,
        images,
        url: (page as any).url,
        lastUpdated: (page as any).last_edited_time,
        attachments,
        properties: (page as any).properties,
        notionId: notionId // Add the Notion ID property
      };
      
      res.json(itemDetails);
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

  // Add a catch-all route handler for non-API routes
  // This ensures all routes will serve the index.html for client-side routing
  app.get('*', (req, res, next) => {
    // If this is an API request, let it pass through to the API handlers
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    console.log(`Catch-all route handling: ${req.path}`);
    
    // For all other requests, send the index.html (will be handled by setupVite or serveStatic)
    next();
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

function extractRollupRelation(property: any): string {
  if (!property || property.type !== 'rollup' || !property.rollup) {
    return '';
  }
  
  // Handle rollup that contains relations
  if (property.rollup.type === 'array' && property.rollup.array.length > 0) {
    const relationItems = property.rollup.array
      .filter((item: any) => item.type === 'relation' && item.relation && item.relation.length > 0)
      .map((item: any) => item.relation)
      .flat();
    
    if (relationItems.length > 0) {
      // If we have title values in the rollup, use those (room names)
      if (property.rollup.array[0].title) {
        return property.rollup.array
          .filter((item: any) => item.title && item.title.length > 0)
          .map((item: any) => item.title.map((t: any) => t.plain_text).join(''))
          .join(', ');
      }
      
      // Otherwise just return the relation IDs
      return relationItems.map((rel: any) => rel.id || '').join(', ');
    }
  }
  
  // Handle rollup that contains titles directly
  if (property.rollup.type === 'array' && property.rollup.array.length > 0) {
    const titleItems = property.rollup.array
      .filter((item: any) => item.type === 'title' && item.title && item.title.length > 0);
    
    if (titleItems.length > 0) {
      return titleItems
        .map((item: any) => item.title.map((t: any) => t.plain_text).join(''))
        .join(', ');
    }
  }
  
  return '';
}

/**
 * Extracts the ID number from Notion properties
 * Looks for a property called "ID" that contains a number
 */
function extractId(properties: any): string | null {
  // Check if we have an ID property
  if (properties.ID) {
    // Could be rich_text or number type
    if (properties.ID.type === 'rich_text' && properties.ID.rich_text.length > 0) {
      return properties.ID.rich_text[0].plain_text;
    } else if (properties.ID.type === 'number' && properties.ID.number !== null) {
      return properties.ID.number.toString();
    }
  }
  
  // Try case-insensitive search for "id" property
  for (const [key, value] of Object.entries(properties)) {
    if (key.toLowerCase() === 'id') {
      if (value.type === 'rich_text' && value.rich_text.length > 0) {
        return value.rich_text[0].plain_text;
      } else if (value.type === 'number' && value.number !== null) {
        return value.number.toString();
      }
    }
  }
  
  return null;
}
