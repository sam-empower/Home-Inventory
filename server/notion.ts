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
    
    // Get the room name for filtering
    let roomNameForFiltering = "";
    let realRoomId = roomId;
    
    // Handle predefined IDs vs actual Notion IDs
    const predefinedIds = {
      'bedroom': 'Bedroom',
      'master-bathroom': 'Master Bathroom',
      'office': 'Office',
      'coffee-room': 'Coffee Room',
      'living-area': 'Living Area',
      'guest-suite': 'Guest Suite',
      'harry-potter-closet': 'Harry Potter Closet'
    };
    
    // If it's a predefined ID, we need to find the matching Notion page ID
    if (predefinedIds[roomId]) {
      roomNameForFiltering = predefinedIds[roomId];
      console.log(`Searching for Notion page with name: ${roomNameForFiltering}`);
      
      // Find the actual Notion page ID for this room
      try {
        const roomsResponse = await notion.databases.query({
          database_id: process.env.NOTION_ROOMS_DATABASE_ID || ""
        });
        
        // Find the room page that matches our name
        const matchingRoom = roomsResponse.results.find(room => {
          const nameProperty = Object.values(room.properties).find(
            prop => prop.type === 'title'
          );
          
          const roomName = nameProperty?.title?.[0]?.plain_text || '';
          return roomName === roomNameForFiltering;
        });
        
        if (matchingRoom) {
          realRoomId = matchingRoom.id;
          console.log(`Found matching Notion room with ID: ${realRoomId}`);
        } else {
          console.log(`Could not find matching Notion room for: ${roomNameForFiltering}`);
        }
      } catch (error) {
        console.error(`Error finding room ID: ${error.message}`);
      }
    } else {
      // It's already a Notion UUID, get its name
      try {
        const roomResponse = await notion.pages.retrieve({ page_id: roomId });
        
        const titleProp = Object.values(roomResponse.properties).find(
          prop => prop.type === 'title'
        );
        
        if (titleProp && titleProp.title && titleProp.title.length > 0) {
          roomNameForFiltering = titleProp.title[0].plain_text;
          console.log(`Found room name: ${roomNameForFiltering} for ID: ${roomId}`);
        }
      } catch (error) {
        console.error(`Error retrieving room details: ${error.message}`);
      }
    }
    
    // Based on your database structure, we need to:
    // 1. Query all items
    // 2. Find items that have Room rollup property matching our room name
    const itemsResponse = await notion.databases.query({
      database_id: process.env.NOTION_ITEMS_DATABASE_ID || ""
    });
    
    console.log(`Retrieved ${itemsResponse.results.length} total items from database`);
    
    // Filter items based on your database structure
    const filteredItems = itemsResponse.results.filter(item => {
      try {
        // Look at the rollup "Room" property which gets values from boxes
        const roomProperty = item.properties.Room;
        
        if (roomProperty && roomProperty.type === 'rollup') {
          const rollupContent = roomProperty.rollup;
          
          // Check if any of the rollup values match our room name
          if (rollupContent.array && rollupContent.array.length > 0) {
            // Examine each value in the rollup array
            return rollupContent.array.some(value => {
              if (value.type === 'title') {
                // Title content match
                return value.title?.some(titlePart => 
                  titlePart.plain_text === roomNameForFiltering
                );
              }
              return false;
            });
          }
        }
        
        // Also check the Box relation directly, in case it references our room
        const boxProperty = item.properties.Box;
        if (boxProperty && boxProperty.type === 'relation' && boxProperty.relation) {
          // We'd need to check each box and see if it's related to our room
          // This requires additional queries, so for now we'll focus on the rollup
        }
        
        return false;
      } catch (error) {
        console.error(`Error checking item properties: ${error.message}`);
        return false;
      }
    });
    
    console.log(`Filtered to ${filteredItems.length} items for room: ${roomNameForFiltering}`);
    
    // Replace the results with our filtered items
    itemsResponse.results = filteredItems;
    
    // Transform the response to a simplified format
    const items = itemsResponse.results.map(page => {
      // Get the name of the item
      const nameProperty = Object.values(page.properties).find(
        prop => prop.type === 'title'
      );
      
      const name = nameProperty?.title?.[0]?.plain_text || 'Unnamed Item';
      
      // Get item description
      const descriptionProperty = Object.values(page.properties).find(
        prop => prop.type === 'rich_text' && prop.rich_text && prop.rich_text.length > 0
      );
      
      const description = descriptionProperty?.rich_text?.[0]?.plain_text || '';
      
      // Get item image if available
      const imageProperty = Object.values(page.properties).find(
        prop => prop.type === 'files' && prop.files && prop.files.length > 0
      );
      
      const image = imageProperty?.files?.[0]?.external?.url || null;
      
      return {
        id: page.id,
        name,
        description,
        image,
        lastUpdated: page.last_edited_time
      };
    });
    
    console.log(`Found ${items.length} items in room ${roomId}`);
    return items;
    
  } catch (error) {
    console.error(`Error fetching items for room ${roomId}:`, error);
    
    // Only use fallback if critical error (no database ID configured)
    if (!process.env.NOTION_ITEMS_DATABASE_ID) {
      console.log('No items database configured, cannot fetch items');
      throw new Error('Notion Items database ID is not configured');
    }
    
    throw error;
  }
}

// Helper function to generate sample items for each room (as fallback)
function generateSampleItemsForRoom(roomId) {
  const sampleItems = {
    'bedroom': [
      { id: 'bed-1', name: 'Queen Size Bed', description: 'Main sleeping area', image: '/assets/bed.jpg' },
      { id: 'dresser-1', name: 'Wooden Dresser', description: 'For clothing storage', image: '/assets/dresser.jpg' },
      { id: 'nightstand-1', name: 'Nightstand', description: 'Bedside table with lamp', image: '/assets/nightstand.jpg' }
    ],
    'master-bathroom': [
      { id: 'shower-1', name: 'Glass Shower', description: 'Walk-in shower', image: '/assets/shower.jpg' },
      { id: 'sink-1', name: 'Double Sink', description: 'His and hers sinks', image: '/assets/sink.jpg' },
      { id: 'toilet-1', name: 'Toilet', description: 'Standard toilet', image: '/assets/toilet.jpg' }
    ],
    'office': [
      { id: 'desk-1', name: 'Standing Desk', description: 'Adjustable height desk', image: '/assets/desk.jpg' },
      { id: 'chair-1', name: 'Office Chair', description: 'Ergonomic chair', image: '/assets/chair.jpg' },
      { id: 'bookshelf-1', name: 'Bookshelf', description: 'For books and decor', image: '/assets/bookshelf.jpg' }
    ],
    'harry-potter-closet': [
      { id: 'wand-1', name: 'Magic Wand', description: 'Made of holly with phoenix feather core', image: '/assets/wand.jpg' },
      { id: 'invisibility-cloak-1', name: 'Invisibility Cloak', description: 'Makes the wearer invisible', image: '/assets/cloak.jpg' },
      { id: 'marauders-map-1', name: "Marauder's Map", description: 'Shows every part of Hogwarts', image: '/assets/map.jpg' },
      { id: 'broomstick-1', name: 'Nimbus 2000', description: 'Racing broomstick', image: '/assets/broomstick.jpg' }
    ]
  };
  
  // If we have a specific room ID that matches a Notion ID format (not our sample IDs),
  // return a generic set of items
  if (!sampleItems[roomId] && roomId.length > 8) {
    return [
      { id: 'item-1', name: 'Large Cabinet', description: 'Storage cabinet for various items', image: null },
      { id: 'item-2', name: 'Wall Shelf', description: 'Mounted shelf for display items', image: null },
      { id: 'item-3', name: 'Decorative Plant', description: 'Artificial plant for decoration', image: null }
    ];
  }
  
  // Return items for the requested room, or empty array if room not found
  return sampleItems[roomId] || [];
}

export {
  notion,
  NOTION_PAGE_ID,
  getRooms,
  getItemsByRoom
};