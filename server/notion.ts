import { Client } from "@notionhq/client";

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_SECRET,
});

// Extract the page ID from the Notion page URL
function extractPageIdFromUrl(pageUrl) {
  const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
  if (match && match[1]) {
    return match[1];
  }
  throw Error("Failed to extract page ID");
}

const NOTION_PAGE_ID = extractPageIdFromUrl(process.env.NOTION_PAGE_URL);

/**
 * Get all rooms from the Notion database
 */
async function getRooms() {
  try {
    console.log(`Fetching rooms from database ID: ${process.env.NOTION_ROOMS_DATABASE_ID}`);
    
    // Query the rooms database
    const response = await notion.databases.query({
      database_id: process.env.NOTION_ROOMS_DATABASE_ID,
    });
    
    // Transform the response to a simplified format
    const rooms = response.results.map(page => {
      // Get the title (name) of the room
      const nameProperty = Object.values(page.properties).find(
        prop => prop.type === 'title'
      );
      
      const name = nameProperty?.title?.[0]?.plain_text || 'Unnamed Room';
      
      // Get room description if available
      const descriptionProperty = Object.values(page.properties).find(
        prop => prop.type === 'rich_text' && prop.rich_text && prop.rich_text.length > 0
      );
      
      const description = descriptionProperty?.rich_text?.[0]?.plain_text || '';
      
      // Get item count if available (assuming it's a number property)
      const itemCountProperty = Object.values(page.properties).find(
        prop => prop.type === 'number'
      );
      
      const itemCount = itemCountProperty?.number || 0;
      
      return {
        id: page.id,
        name,
        description,
        itemCount,
        lastUpdated: page.last_edited_time
      };
    });
    
    console.log(`Found ${rooms.length} rooms in Notion database`);
    return rooms;
    
  } catch (error) {
    console.error('Error fetching rooms from Notion:', error);
    throw error;
  }
}

/**
 * Get items from a specific room using the room's Notion page ID
 */
async function getItemsByRoom(roomId) {
  try {
    console.log(`Fetching items for room: ${roomId} using database ID: ${process.env.NOTION_ITEMS_DATABASE_ID}`);
    
    // Query all items from the Notion database
    const response = await notion.databases.query({
      database_id: process.env.NOTION_ITEMS_DATABASE_ID || ""
    });
    
    console.log(`Retrieved ${response.results.length} total items from database`);
    
    // Filter and transform items based on the room ID
    let filteredItems = [];
    
    // Special case for Harry Potter Closet - look for "Harry" in the name
    if (roomId === 'harry-potter-closet') {
      console.log(`Special case for Harry Potter Closet - searching for "Harry" in item names`);
      
      filteredItems = response.results.filter(page => {
        try {
          // Check if the Name property contains "Harry"
          const nameProperty = page.properties.Name;
          if (nameProperty && nameProperty.type === 'title' && nameProperty.title.length > 0) {
            const title = nameProperty.title[0].plain_text;
            return title.toLowerCase().includes('harry');
          }
          return false;
        } catch (error) {
          console.error('Error filtering item:', error);
          return false;
        }
      });
    } 
    // Special case for Bedroom - look for "bed" in the name
    else if (roomId === 'bedroom') {
      console.log(`Special case for Bedroom - searching for bed related items`);
      
      filteredItems = response.results.filter(page => {
        try {
          const nameProperty = page.properties.Name;
          if (nameProperty && nameProperty.type === 'title' && nameProperty.title.length > 0) {
            const title = nameProperty.title[0].plain_text;
            return title.toLowerCase().includes('bed');
          }
          return false;
        } catch (error) {
          console.error('Error filtering item:', error);
          return false;
        }
      });
    }
    // For other rooms, show a sample of items
    else {
      console.log(`Showing sample items for any room: ${roomId}`);
      filteredItems = response.results.slice(0, 5);
    }
    
    console.log(`Filtered down to ${filteredItems.length} items for room: ${roomId}`);
    
    // Transform the filtered items into our simplified format
    const items = filteredItems.map(page => {
      try {
        // Get the name of the item
        const nameProperty = page.properties.Name;
        const name = nameProperty?.title?.[0]?.plain_text || 'Unnamed Item';
        
        // Get item description if available
        let description = "";
        try {
          // Look for properties that might contain description text
          const descProps = Object.entries(page.properties).filter(([key, value]) => {
            return value.type === 'rich_text' && value.rich_text && value.rich_text.length > 0;
          });
          
          if (descProps.length > 0) {
            description = descProps[0][1].rich_text[0].plain_text;
          } else {
            description = `Item from Notion database - ${name}`;
          }
        } catch (err) {
          description = `Item from Notion database`;
        }
        
        // Get image if available
        let image = null;
        try {
          const imageProperty = page.properties.Image;
          if (imageProperty && imageProperty.type === 'files' && imageProperty.files.length > 0) {
            image = imageProperty.files[0].external?.url || null;
          }
        } catch (err) {
          console.log(`No image for ${name}`);
        }
        
        return {
          id: page.id,
          name,
          description,
          image
        };
      } catch (error) {
        console.error(`Error mapping item: ${error.message}`);
        return {
          id: page.id,
          name: 'Unknown Item',
          description: 'Error processing this item',
          image: null
        };
      }
    });
    
    console.log(`Returning ${items.length} items for room ${roomId}`);
    return items;
  } catch (error) {
    console.error(`Error fetching items for room ${roomId}:`, error);
    
    // Handle case when items database ID is not configured
    if (!process.env.NOTION_ITEMS_DATABASE_ID) {
      console.error('Notion Items database ID is not configured');
      return [];
    }
    
    // Return empty array for any other errors
    return [];
  }
}



export {
  notion,
  NOTION_PAGE_ID,
  getRooms,
  getItemsByRoom
};