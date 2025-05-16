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
    
    // Check if this is a predefined room ID or a Notion UUID
    const isPredefinedId = ['bedroom', 'master-bathroom', 'office', 'coffee-room', 
                          'living-area', 'guest-suite', 'harry-potter-closet'].includes(roomId);
    
    let response;
    
    if (isPredefinedId) {
      console.log(`Using predefined room ID: ${roomId}, will fetch actual items from Notion database`);
      
      // For predefined rooms, we need to query all items and filter them by room name
      response = await notion.databases.query({
        database_id: process.env.NOTION_ITEMS_DATABASE_ID || ""
      });
      
      // Filter items by room name matching our predefined ID
      const roomName = {
        'bedroom': 'Bedroom',
        'master-bathroom': 'Master Bathroom',
        'office': 'Office',
        'coffee-room': 'Coffee Room',
        'living-area': 'Living Area',
        'guest-suite': 'Guest Suite',
        'harry-potter-closet': 'Harry Potter Closet'
      }[roomId];
      
      console.log(`Filtering items for room name: ${roomName}`);
      
      // Process all items and filter by room name
      const filteredResults = response.results.filter(page => {
        // Look for different ways that room might be specified
        
        // 1. Room as a select field
        const roomSelectProperty = Object.values(page.properties).find(
          prop => prop.type === 'select' && 
                  prop.select && 
                  prop.select.name === roomName
        );
        
        // 2. Room as a text/title field that contains the room name
        const titleWithRoomProperty = Object.values(page.properties).find(
          prop => (prop.type === 'rich_text' || prop.type === 'title') && 
                  ((prop.rich_text?.[0]?.plain_text || '').includes(roomName) ||
                   (prop.title?.[0]?.plain_text || '').includes(roomName))
        );
        
        // Include this item if it matches any of our room criteria
        return roomSelectProperty !== undefined || titleWithRoomProperty !== undefined;
      });
      
      console.log(`Found ${filteredResults.length} items matching room name ${roomName}`);
      
      // Replace the response results with our filtered results
      response.results = filteredResults;
      
    } else {
      // For actual Notion UUIDs, query with relation filter
      response = await notion.databases.query({
        database_id: process.env.NOTION_ITEMS_DATABASE_ID || "",
        filter: {
          property: "Room",
          relation: {
            contains: roomId
          }
        }
      });
    }
    
    // Transform the response to a simplified format
    const items = response.results.map(page => {
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