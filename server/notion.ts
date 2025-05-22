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
      database_id: process.env.NOTION_ITEMS_DATABASE_ID || "",
      page_size: 100 // Request a larger page size to get more items
    });
    
    console.log(`Retrieved ${response.results.length} total items from database`);
    
    // Debug: Check the schema of the first item to understand the database structure
    if (response.results.length > 0) {
      const firstItem = response.results[0];
      console.log(`Database schema sample - Properties of first item:`);
      for (const [key, value] of Object.entries(firstItem.properties)) {
        console.log(`Property: ${key}, Type: ${value.type}`);
      }
    }
    
    // Filter and transform items based on the room ID
    let filteredItems = [];
    
    // Special case for Harry Potter Closet - look for "Harry Potter" in the rollup Room property
    if (roomId === 'harry-potter-closet') {
      console.log(`Special case for Harry Potter Closet - searching in Room rollup property`);
      
      filteredItems = response.results.filter(page => {
        try {
          // First, check the Room rollup property if it exists
          const roomProperty = page.properties.Room;
          if (roomProperty && roomProperty.type === 'rollup') {
            // Look at the rollup array
            const rollupArray = roomProperty.rollup?.array || [];
            
            // Check each item in the rollup array
            for (const rollupItem of rollupArray) {
              if (rollupItem.type === 'title' && rollupItem.title && rollupItem.title.length > 0) {
                const roomName = rollupItem.title[0].plain_text;
                if (roomName.toLowerCase().includes('harry potter')) {
                  console.log(`Found match for Harry Potter in Room rollup: ${roomName}`);
                  return true;
                }
              }
            }
          }
          
          // If no match in Room rollup, check the Box relation property
          const boxProperty = page.properties.Box;
          if (boxProperty && boxProperty.type === 'relation' && boxProperty.relation && boxProperty.relation.length > 0) {
            // Just having an item in the Harry Potter relation is a match
            // We'll need to look up the box details to confirm, but for now we'll include it
            return true;
          }
          
          // Lastly, check other text properties for "Harry"
          for (const [key, value] of Object.entries(page.properties)) {
            if (value.type === 'title' && value.title && value.title.length > 0) {
              const text = value.title[0].plain_text;
              if (text.toLowerCase().includes('harry')) {
                return true;
              }
            }
            
            if (value.type === 'rich_text' && value.rich_text && value.rich_text.length > 0) {
              const text = value.rich_text[0].plain_text;
              if (text.toLowerCase().includes('harry')) {
                return true;
              }
            }
          }
          
          return false;
        } catch (error) {
          console.error('Error filtering item for Harry Potter:', error);
          return false;
        }
      });
    } 
    // Special case for Bedroom - look for "bed" in the name or any other property
    else if (roomId === 'bedroom') {
      console.log(`Special case for Bedroom - searching for bed related items in any property`);
      
      filteredItems = response.results.filter(page => {
        try {
          // Search through all properties for "bed"
          for (const [key, value] of Object.entries(page.properties)) {
            // Check text properties for "bed"
            if (value.type === 'title' && value.title && value.title.length > 0) {
              const text = value.title[0].plain_text;
              if (text.toLowerCase().includes('bed')) {
                return true;
              }
            }
            
            if (value.type === 'rich_text' && value.rich_text && value.rich_text.length > 0) {
              const text = value.rich_text[0].plain_text;
              if (text.toLowerCase().includes('bed')) {
                return true;
              }
            }
          }
          
          return false;
        } catch (error) {
          console.error('Error filtering item:', error);
          return false;
        }
      });
    }
    // For other rooms, try to find any relevant items by room name
    else {
      console.log(`Searching all items for room: ${roomId}`);
      
      // Try to find the actual room name if this is a Notion UUID
      let actualRoomName = "";
      if (roomId.length > 30) {
        try {
          // Try to get the room name from Notion
          const roomPage = await notion.pages.retrieve({ page_id: roomId });
          const titleProp = Object.values(roomPage.properties).find(
            prop => prop.type === 'title'
          );
          
          if (titleProp && titleProp.title && titleProp.title.length > 0) {
            actualRoomName = titleProp.title[0].plain_text;
            console.log(`Found room name from Notion: ${actualRoomName}`);
          }
        } catch (error) {
          console.error(`Error getting room name: ${error.message}`);
        }
      }
      
      // If we have an actual room name, filter by it
      if (actualRoomName) {
        filteredItems = response.results.filter(page => {
          try {
            const nameProperty = page.properties.Name;
            if (nameProperty && nameProperty.type === 'title' && nameProperty.title.length > 0) {
              // Check if the title contains the room name
              const title = nameProperty.title[0].plain_text;
              if (title.toLowerCase().includes(actualRoomName.toLowerCase())) {
                return true;
              }
            }
            
            // Also check any other properties for matches
            for (const [key, value] of Object.entries(page.properties)) {
              // Check text properties for room name
              if ((value.type === 'rich_text' || value.type === 'title') && 
                  (key.toLowerCase().includes('room') || key.toLowerCase().includes('location'))) {
                
                const textContent = value.type === 'rich_text' 
                  ? value.rich_text?.map(t => t.plain_text).join(' ') 
                  : value.title?.map(t => t.plain_text).join(' ');
                
                if (textContent && textContent.toLowerCase().includes(actualRoomName.toLowerCase())) {
                  return true;
                }
              }
            }
            
            return false;
          } catch (error) {
            console.error('Error filtering item by room name:', error);
            return false;
          }
        });
      } else {
        // If we don't have a room name, return all items (no slicing/limiting)
        filteredItems = response.results;
      }
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
            // Check for both external and file URLs (Notion can have either)
            const file = imageProperty.files[0];
            if (file.type === 'external') {
              image = file.external.url;
              console.log(`Found external image URL: ${image}`);
            } else if (file.type === 'file') {
              image = file.file.url;
              console.log(`Found Notion-hosted image URL: ${image}`);
            }
          }
        } catch (err) {
          console.log(`No image for ${name}: ${err.message}`);
        }
        
        // Get box names if available
        let boxNames: string[] = [];
        try {
          const boxProperty = page.properties.Box;
          if (boxProperty && boxProperty.type === 'relation' && boxProperty.relation) {
            // Get the actual box titles through a separate request for each box
            const boxPromises = boxProperty.relation.map(async (rel) => {
              try {
                const boxPage = await notion.pages.retrieve({ page_id: rel.id });
                const titleProp = Object.values(boxPage.properties).find(
                  prop => prop.type === 'title'
                );
                return titleProp?.title?.[0]?.plain_text || rel.id;
              } catch (err) {
                console.log(`Error fetching box name: ${err.message}`);
                return rel.id;
              }
            });
            boxNames = await Promise.all(boxPromises);
          }
        } catch (err) {
          console.log(`No box relation for ${name}: ${err.message}`);
        }

        // Get ID field value if available
        let itemId = "";
        try {
          const idProperty = page.properties.ID;
          if (idProperty && idProperty.type === 'number') {
            itemId = idProperty.number?.toString() || "";
          }
        } catch (err) {
          console.log(`No ID field for ${name}: ${err.message}`);
        }

        return {
          id: page.id,
          name,
          description,
          image,
          boxNames,
          itemId
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