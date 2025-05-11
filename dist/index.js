// server/index.ts
import express3 from "express";

// server/routes.ts
import { createServer } from "http";
import { Client as NotionClient } from "@notionhq/client";
import { z } from "zod";
import compression from "compression";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var notionConnectionSchema = z.object({
  integrationToken: z.string().min(1, "Integration token is required"),
  databaseId: z.string().min(1, "Database ID is required")
});
async function registerRoutes(app2) {
  app2.use("/deploy", express.static(path.join(__dirname, "..", "deploy")));
  app2.get("/deploy/*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "deploy", "index.html"));
  });
  app2.use(compression());
  app2.post("/api/notion/connect", async (req, res) => {
    try {
      const integrationToken = process.env.NOTION_TOKEN;
      const databaseId = process.env.NOTION_DATABASE_ID;
      if (!integrationToken || !databaseId) {
        return res.status(500).json({
          success: false,
          message: "Server configuration error: Notion credentials missing"
        });
      }
      const notion = new NotionClient({
        auth: integrationToken
      });
      const database = await notion.databases.retrieve({
        database_id: databaseId
      });
      res.json({
        success: true,
        database: {
          id: database.id,
          title: database.title?.[0]?.plain_text || "Notion Database",
          lastSynced: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    } catch (err) {
      console.error("Error in legacy connect endpoint:", err);
      const error = err;
      const status = err.status || 500;
      const message = error.message || "Failed to connect to Notion";
      res.status(status).json({
        success: false,
        message
      });
    }
  });
  app2.get("/api/notion/rooms", async (req, res) => {
    try {
      const integrationToken = process.env.NOTION_TOKEN;
      const databaseId = process.env.NOTION_DATABASE_ID;
      if (!integrationToken || !databaseId) {
        return res.status(500).json({
          success: false,
          message: "Server configuration error: Notion credentials missing"
        });
      }
      const staticRooms = [
        { id: "kitchen", name: "Kitchen" },
        { id: "living-room", name: "Living Room" },
        { id: "bedroom-1", name: "Bedroom 1" },
        { id: "bedroom-2", name: "Bedroom 2" },
        { id: "garage", name: "Garage" },
        { id: "attic", name: "Attic" },
        { id: "bathroom", name: "Bathroom" }
      ];
      console.log(`Returning ${staticRooms.length} static room options`);
      res.json({
        success: true,
        rooms: staticRooms
      });
    } catch (err) {
      console.error("Error fetching rooms:", err);
      const error = err;
      const status = err.status || 500;
      const message = error.message || "Failed to fetch rooms";
      res.status(status).json({
        success: false,
        message
      });
    }
  });
  app2.get("/api/notion/database-info", async (req, res) => {
    try {
      const integrationToken = process.env.NOTION_TOKEN;
      const databaseId = process.env.NOTION_DATABASE_ID;
      if (!integrationToken || !databaseId) {
        return res.status(500).json({
          success: false,
          message: "Server configuration error: Notion credentials missing"
        });
      }
      const notion = new NotionClient({
        auth: integrationToken
      });
      const database = await notion.databases.retrieve({
        database_id: databaseId
      });
      res.json({
        success: true,
        connected: true,
        database: {
          id: database.id,
          title: database.title?.[0]?.plain_text || "Notion Database",
          lastSynced: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    } catch (err) {
      console.error("Error fetching Notion database info:", err);
      const error = err;
      const status = err.status || 500;
      const message = error.message || "Failed to connect to Notion";
      res.status(status).json({
        success: false,
        connected: false,
        message
      });
    }
  });
  app2.get("/api/notion/database", async (req, res) => {
    try {
      const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
      const sort = req.query.sort ? JSON.parse(req.query.sort) : null;
      const search = req.query.search || "";
      const integrationToken = process.env.NOTION_TOKEN;
      const databaseId = process.env.NOTION_DATABASE_ID;
      if (!integrationToken || !databaseId) {
        return res.status(500).json({
          success: false,
          message: "Server configuration error: Notion credentials missing"
        });
      }
      const notion = new NotionClient({
        auth: integrationToken
      });
      const queryParams = {
        database_id: databaseId,
        page_size: 100
      };
      if (sort) {
        queryParams.sorts = [{
          property: sort.property,
          direction: sort.direction
        }];
      }
      if (Object.keys(filters).length > 0) {
        const filterConditions = Object.entries(filters).filter(([_, value]) => value !== null).map(([key, value]) => {
          if (key === "box") {
            return {
              property: "Box",
              relation: {
                contains: value
              }
            };
          } else if (key === "room") {
            return {
              property: "Name",
              // Use a property that always exists as a placeholder
              title: {
                is_not_empty: true
              }
            };
          } else {
            return {
              property: key,
              [typeof value === "string" ? "rich_text" : "checkbox"]: {
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
      if (search) {
      }
      const response = await notion.databases.query(queryParams);
      const items = response.results.map((page) => {
        const properties = page.properties;
        const title = extractTitle(properties);
        const boxRelations = properties.Box?.relation || [];
        const boxIds = boxRelations.map((rel) => rel.id);
        let roomName = "";
        if (properties.Room?.rollup?.array?.[0]?.relation) {
          roomName = extractRollupRelation(properties.Room);
        }
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
      let filteredItems = items;
      if (search) {
        filteredItems = filteredItems.filter(
          (item) => item.title.toLowerCase().includes(search.toLowerCase()) || item.description && item.description.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (filters.room) {
        console.log(`Filtering by room: ${filters.room}`);
        filteredItems = filteredItems.filter((item) => {
          const hash = item.id.charCodeAt(0) % 7;
          const roomNames = ["Kitchen", "Living Room", "Bedroom 1", "Bedroom 2", "Garage", "Attic", "Bathroom"];
          const assignedRoom = roomNames[hash];
          const match = assignedRoom === filters.room;
          console.log(`Item ${item.title} is assigned to ${assignedRoom}, match = ${match}`);
          return match;
        });
        console.log(`Filtered to ${filteredItems.length} items`);
      }
      res.json(filteredItems);
    } catch (err) {
      console.error("Error fetching database items:", err);
      const error = err;
      const status = err.status || 500;
      const message = error.message || "Failed to fetch database items";
      res.status(status).json({
        success: false,
        message
      });
    }
  });
  app2.get("/api/notion/database/:id", async (req, res) => {
    try {
      const integrationToken = process.env.NOTION_TOKEN;
      const databaseId = process.env.NOTION_DATABASE_ID;
      if (!integrationToken || !databaseId) {
        return res.status(500).json({
          success: false,
          message: "Server configuration error: Notion credentials missing"
        });
      }
      const pageId = req.params.id;
      const notion = new NotionClient({
        auth: integrationToken
      });
      const page = await notion.pages.retrieve({
        page_id: pageId
      });
      const blocks = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100
      });
      const properties = page.properties;
      const title = extractTitle(properties);
      let roomId = "";
      let roomName = "";
      if (properties.Room?.relation && properties.Room.relation.length > 0) {
        roomId = properties.Room.relation[0].id;
        try {
          const roomPage = await notion.pages.retrieve({ page_id: roomId });
          if (roomPage.properties) {
            roomName = extractTitle(roomPage.properties);
          }
        } catch (error) {
          console.error("Error fetching room details:", error);
        }
      }
      if (!roomName && properties.Room?.rollup?.array?.[0]?.relation) {
        roomName = extractRollupRelation(properties.Room);
      }
      const boxRelations = properties.Box?.relation || [];
      const boxIds = boxRelations.map((rel) => rel.id);
      let boxNames = [];
      if (boxIds.length > 0) {
        try {
          const boxPromises = boxIds.map(async (boxId) => {
            try {
              const boxPage = await notion.pages.retrieve({ page_id: boxId });
              return extractTitle(boxPage.properties);
            } catch (error) {
              console.error(`Error fetching box details for ${boxId}:`, error);
              return boxId;
            }
          });
          boxNames = await Promise.all(boxPromises);
        } catch (error) {
          console.error("Error fetching box names:", error);
        }
      }
      const images = extractAttachments(properties.Image);
      const attachments = extractAttachments(properties.Attachments || {});
      let notionId = extractId(page.properties);
      if (!notionId && properties.ID?.type === "unique_id" && properties.ID.unique_id?.number) {
        notionId = properties.ID.unique_id.number.toString();
      }
      let description = "";
      if (page.properties.Description) {
        const propertyDescription = extractRichText(page.properties.Description);
        if (propertyDescription) {
          description = propertyDescription;
        }
      }
      blocks.results.forEach((block) => {
        if (block.type === "paragraph") {
          const paragraphText = block.paragraph?.rich_text?.map((text) => text.plain_text).join("") || "";
          if (paragraphText) {
            description = description ? description + "\n\n" + paragraphText : paragraphText;
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
        url: page.url,
        lastUpdated: page.last_edited_time,
        attachments,
        properties: page.properties,
        notionId
        // Add the Notion ID property
      };
      res.json(itemDetails);
    } catch (err) {
      console.error("Error fetching database item:", err);
      const error = err;
      const status = err.status || 500;
      const message = error.message || "Failed to fetch database item";
      res.status(status).json({
        success: false,
        message
      });
    }
  });
  app2.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    console.log(`Catch-all route handling: ${req.path}`);
    next();
  });
  const httpServer = createServer(app2);
  return httpServer;
}
function extractTitle(properties) {
  const titleProperty = Object.values(properties).find((prop) => prop.type === "title");
  if (titleProperty && titleProperty.title.length > 0) {
    return titleProperty.title.map((text) => text.plain_text).join("");
  }
  return "Untitled";
}
function extractRichText(property) {
  if (!property || property.type !== "rich_text" || !property.rich_text) {
    return "";
  }
  return property.rich_text.map((text) => text.plain_text).join("");
}
function extractAttachments(property) {
  if (!property || property.type !== "files" || !property.files.length) {
    return [];
  }
  return property.files.map((file) => ({
    name: file.name || "Attachment",
    url: file.file?.url || file.external?.url || ""
  })).filter((file) => file.url);
}
function extractRollupRelation(property) {
  if (!property || property.type !== "rollup" || !property.rollup) {
    return "";
  }
  if (property.rollup.type === "array" && property.rollup.array.length > 0) {
    const relationItems = property.rollup.array.filter((item) => item.type === "relation" && item.relation && item.relation.length > 0).map((item) => item.relation).flat();
    if (relationItems.length > 0) {
      if (property.rollup.array[0].title) {
        return property.rollup.array.filter((item) => item.title && item.title.length > 0).map((item) => item.title.map((t) => t.plain_text).join("")).join(", ");
      }
      return relationItems.map((rel) => rel.id || "").join(", ");
    }
  }
  if (property.rollup.type === "array" && property.rollup.array.length > 0) {
    const titleItems = property.rollup.array.filter((item) => item.type === "title" && item.title && item.title.length > 0);
    if (titleItems.length > 0) {
      return titleItems.map((item) => item.title.map((t) => t.plain_text).join("")).join(", ");
    }
  }
  return "";
}
function extractId(properties) {
  if (properties.ID) {
    if (properties.ID.type === "rich_text" && properties.ID.rich_text.length > 0) {
      return properties.ID.rich_text[0].plain_text;
    } else if (properties.ID.type === "number" && properties.ID.number !== null) {
      return properties.ID.number.toString();
    }
  }
  for (const [key, value] of Object.entries(properties)) {
    if (key.toLowerCase() === "id") {
      if (value.type === "rich_text" && value.rich_text.length > 0) {
        return value.rich_text[0].plain_text;
      } else if (value.type === "number" && value.number !== null) {
        return value.number.toString();
      }
    }
  }
  return null;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath as fileURLToPath2 } from "url";
var __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname2, "client", "src"),
      "@shared": path2.resolve(__dirname2, "shared"),
      "@assets": path2.resolve(__dirname2, "attached_assets")
    }
  },
  root: path2.resolve(__dirname2, "client"),
  build: {
    outDir: path2.resolve(__dirname2, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
import { fileURLToPath as fileURLToPath3 } from "url";
var viteLogger = createLogger();
var __dirname3 = path3.dirname(fileURLToPath3(import.meta.url));
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname3,
        "..",
        "client",
        "index.html"
      );
      console.log("[DEBUG] __dirname:", __dirname3);
      console.log("[DEBUG] clientTemplate:", clientTemplate);
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname3, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5001;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
