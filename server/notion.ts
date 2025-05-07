import { Client } from "@notionhq/client";
import { 
  NotionDatabaseItem, 
  NotionDatabase
} from "@shared/schema";

export interface NotionService {
  validateConnection(integrationToken: string, databaseId: string): Promise<{
    success: boolean,
    database?: NotionDatabase,
    error?: string
  }>;
  getDatabaseItems(
    integrationToken: string, 
    databaseId: string, 
    filters?: Record<string, any>, 
    sort?: { property: string, direction: "ascending" | "descending" },
    search?: string
  ): Promise<NotionDatabaseItem[]>;
  getDatabaseItem(
    integrationToken: string, 
    pageId: string
  ): Promise<NotionDatabaseItem | null>;
}

export class NotionAPIService implements NotionService {
  /**
   * Validates the Notion connection by retrieving database metadata
   */
  async validateConnection(integrationToken: string, databaseId: string): Promise<{
    success: boolean,
    database?: NotionDatabase,
    error?: string
  }> {
    try {
      const notion = new Client({
        auth: integrationToken
      });

      // Try to access the database to validate credentials
      const database = await notion.databases.retrieve({
        database_id: databaseId
      });

      if (!database) {
        return {
          success: false,
          error: "Database not found"
        };
      }

      // Extract database title 
      let title = "Notion Database";
      if (database.title && database.title.length > 0) {
        title = database.title.map(text => text.plain_text).join('');
      }

      return {
        success: true,
        database: {
          id: database.id,
          userId: 0, // In a real app, this would be the authenticated user's ID
          title,
          lastSynced: new Date(),
          schema: database.properties
        }
      };
    } catch (error) {
      console.error("Error validating Notion connection:", error);
      return {
        success: false,
        error: error.message || "Failed to connect to Notion database"
      };
    }
  }

  /**
   * Get all items from the specified Notion database with filtering and sorting
   */
  async getDatabaseItems(
    integrationToken: string, 
    databaseId: string, 
    filters: Record<string, any> = {}, 
    sort?: { property: string, direction: "ascending" | "descending" },
    search?: string
  ): Promise<NotionDatabaseItem[]> {
    try {
      const notion = new Client({
        auth: integrationToken
      });

      // Build query parameters
      const queryParams: any = {
        database_id: databaseId,
        page_size: 100
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
        const filterConditions = [];

        for (const [key, value] of Object.entries(filters)) {
          if (value === null) continue;

          // Create filter condition based on property type
          // This is simplified - in a real app, you'd determine the property type
          // from the database schema and build the filter accordingly
          filterConditions.push({
            property: key,
            [typeof value === 'string' ? 'rich_text' : 'checkbox']: {
              equals: value
            }
          });
        }

        if (filterConditions.length > 0) {
          queryParams.filter = {
            and: filterConditions
          };
        }
      }

      // Query the database
      const response = await notion.databases.query(queryParams);

      // Process results
      const items = await Promise.all(response.results.map(async page => {
        // First extract the ID
        const notionId = this.extractId(page.properties);
        if (!notionId) {
          console.warn('No ID found for page:', page.id);
        }

        // Extract properties from the page
        const properties = page.properties;

        // Extract common fields
        const title = this.extractTitle(properties);
        const description = this.extractRichText(this.findProperty(properties, 'Description', 'rich_text'));
        const status = this.extractSelect(this.findProperty(properties, 'Status', 'select'));
        const priority = this.extractSelect(this.findProperty(properties, 'Priority', 'select'));
        const date = this.extractDate(this.findProperty(properties, 'Date', 'date'));
        const assignedTo = this.extractPerson(this.findProperty(properties, 'Assigned', 'people') || 
                                              this.findProperty(properties, 'AssignedTo', 'people'));
        const category = this.extractSelect(this.findProperty(properties, 'Category', 'select'));

        // Check for attachments
        const attachmentsProperty = this.findProperty(properties, 'Attachments', 'files') ||
                                    this.findProperty(properties, 'Files', 'files');
        const attachments = this.extractAttachments(attachmentsProperty);

        // Extract room and box information
        const boxRelations = properties.Box?.relation || [];
        const boxIds = boxRelations.map((rel: any) => rel.id);
        
        let roomName = "";
        if (properties.Room?.rollup?.array?.[0]?.relation) {
          roomName = this.extractRollupRelation(properties.Room);
        }

        const item: NotionDatabaseItem = {
          id: String(notionId || page.id), // Ensure we convert number to string if numeric ID
          notionPageId: page.id,
          databaseId,
          title,
          boxIds,
          roomName,
          description,
          status,
          priority,
          date: date ? new Date(date) : new Date(),
          assignedTo,
          category,
          url: page.url,
          lastUpdated: new Date(page.last_edited_time),
          properties: page.properties,
          attachments
        };

        return item;
      }));

      // Apply text search if provided
      if (search && search.trim() !== '') {
        const searchTerm = search.toLowerCase().trim();
        return items.filter(item => 
          item.title.toLowerCase().includes(searchTerm) || 
          (item.description && item.description.toLowerCase().includes(searchTerm))
        );
      }

      return items;
    } catch (error) {
      console.error("Error fetching database items:", error);
      throw new Error(`Failed to fetch database items: ${error.message}`);
    }
  }

  /**
   * Get a single item from Notion by page ID
   */
  async getDatabaseItem(
    integrationToken: string, 
    pageId: string
  ): Promise<NotionDatabaseItem | null> {
    try {
      const notion = new Client({
        auth: integrationToken
      });

      // Retrieve the page
      const page = await notion.pages.retrieve({
        page_id: pageId
      });

      // Get page content blocks
      const blocks = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100
      });

      // Extract properties
      const properties = page.properties;

      const title = this.extractTitle(properties);
      const description = this.extractRichText(this.findProperty(properties, 'Description', 'rich_text'));
      const status = this.extractSelect(this.findProperty(properties, 'Status', 'select'));
      const priority = this.extractSelect(this.findProperty(properties, 'Priority', 'select'));
      const date = this.extractDate(this.findProperty(properties, 'Date', 'date'));
      const assignedTo = this.extractPerson(this.findProperty(properties, 'Assigned', 'people') || 
                                            this.findProperty(properties, 'AssignedTo', 'people'));
      const category = this.extractSelect(this.findProperty(properties, 'Category', 'select'));

      // Check for attachments
      const attachmentsProperty = this.findProperty(properties, 'Attachments', 'files') ||
                                  this.findProperty(properties, 'Files', 'files');
      const attachments = this.extractAttachments(attachmentsProperty);

      // Process blocks to get full description
      let fullDescription = description || '';

      blocks.results.forEach(block => {
        if (block.type === 'paragraph' && block.paragraph) {
          const paragraphText = block.paragraph.rich_text
            ?.map(text => text.plain_text)
            .join('') || '';

          if (paragraphText) {
            fullDescription += fullDescription ? '\n\n' + paragraphText : paragraphText;
          }
        }
      });

      const notionId = this.extractId(page.properties);
      const item: NotionDatabaseItem = {
        id: notionId || page.id, // Fall back to page.id if no ID property
        notionPageId: page.id,
        databaseId: '', // We don't have this directly from the page, would be set from the query context
        title,
        description: fullDescription,
        status,
        priority,
        date: date ? new Date(date) : new Date(),
        assignedTo,
        category,
        url: page.url,
        lastUpdated: new Date(page.last_edited_time),
        properties: page.properties,
        attachments
      };

      return item;
    } catch (error) {
      console.error("Error fetching database item:", error);
      throw new Error(`Failed to fetch database item: ${error.message}`);
    }
  }

  /**
   * Helper method to find a property by name or type
   */
  private findProperty(properties: Record<string, any>, name: string, type: string): any {
    // First try to find by exact name
    if (properties[name] && properties[name].type === type) {
      return properties[name];
    }

    // Try case-insensitive name match
    const nameLower = name.toLowerCase();
    for (const [key, value] of Object.entries(properties)) {
      if (key.toLowerCase() === nameLower && value.type === type) {
        return value;
      }
    }

    // Find first property of this type
    for (const value of Object.values(properties)) {
      if (value.type === type) {
        return value;
      }
    }

    return null;
  }

  /**
   * Extract title from properties
   */
  private extractTitle(properties: Record<string, any>): string {
    // Find the title property
    for (const prop of Object.values(properties)) {
      if (prop.type === 'title' && prop.title.length > 0) {
        return prop.title.map(text => text.plain_text).join('');
      }
    }
    return 'Untitled';
  }

  /**
   * Extract rich text content
   */
  private extractRichText(property: any): string {
    if (!property || property.type !== 'rich_text' || !property.rich_text) {
      return '';
    }
    return property.rich_text.map(text => text.plain_text).join('');
  }

  /**
   * Extract select option value
   */
  private extractSelect(property: any): string {
    if (!property || property.type !== 'select' || !property.select) {
      return '';
    }
    return property.select.name || '';
  }

  /**
   * Extract date value
   */
  private extractDate(property: any): string | null {
    if (!property || property.type !== 'date' || !property.date) {
      return null;
    }
    return property.date.start || null;
  }

  /**
   * Extract person assigned
   */
  private extractPerson(property: any): string {
    if (!property || property.type !== 'people' || !property.people.length) {
      return '';
    }
    return property.people[0].name || property.people[0].id || '';
  }

  /**
   * Extract file attachments
   */
  private extractAttachments(property: any): Array<{ name: string, url: string }> {
    if (!property || property.type !== 'files' || !property.files.length) {
      return [];
    }

    return property.files
      .map(file => ({
        name: file.name || 'Attachment',
        url: file.file?.url || file.external?.url || ''
      }))
      .filter(file => file.url);
  }

  /**
   * Extracts the ID from the Notion properties.  Assumes ID is a text property.
   */
  private extractId(properties: Record<string, any>): string | null {
    const idProperty = properties['ID'];
    if (!idProperty) {
      console.log('No ID property found');
      return null;
    }
    console.log('Found ID property:', idProperty);
    
    if (idProperty.type === 'number') {
      const numericId = idProperty.number;
      console.log('Found numeric ID:', numericId);
      return numericId !== null ? numericId.toString() : null;
    }
    if (idProperty.type === 'rich_text' && idProperty.rich_text.length > 0) {
      return idProperty.rich_text[0].plain_text;
    }
    return null;
  }
}

// Create and export a singleton instance
export const notionService = new NotionAPIService();