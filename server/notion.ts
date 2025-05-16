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
    
    // Get the room name for filtering - try both the predefined IDs and actual Notion IDs
    let roomNameForFiltering = "";
    
    // Map predefined IDs to room names
    const predefinedRoomNames = {
      'bedroom': 'Bedroom',
      'master-bathroom': 'Master Bathroom',
      'office': 'Office',
      'coffee-room': 'Coffee Room',
      'living-area': 'Living Area',
      'guest-suite': 'Guest Suite',
      'harry-potter-closet': 'Harry Potter Closet'
    };
    
    if (predefinedRoomNames[roomId]) {
      roomNameForFiltering = predefinedRoomNames[roomId];
    } else {
      // For a Notion UUID, get the actual room name from the rooms database
      try {
        const roomResponse = await notion.pages.retrieve({ page_id: roomId });
        // Extract the room name from the response (depends on your database structure)
        if (roomResponse && roomResponse.properties) {
          const titleProp = Object.values(roomResponse.properties).find(
            prop => prop.type === 'title'
          );
          if (titleProp && titleProp.title && titleProp.title.length > 0) {
            roomNameForFiltering = titleProp.title[0].plain_text;
          }
        }
      } catch (roomError) {
        console.log(`Could not retrieve room details: ${roomError.message}`);
      }
    }
    
    console.log(`Searching for items related to room: ${roomNameForFiltering}`);
    
    // Query the items database without filtering - we'll filter client-side
    let response = await notion.databases.query({
      database_id: process.env.NOTION_ITEMS_DATABASE_ID || ""
    });
    
    if (!roomNameForFiltering) {
      console.log(`No room name available for filtering, returning all items`);
    } else {
      console.log(`Filtering items for room name: ${roomNameForFiltering}`);
      
      // Filter results to match the room name - this depends on your database structure
      // We need to handle various ways the room might be referenced
      const originalResults = [...response.results];
      const filteredResults = originalResults.filter(page => {
        // Look for properties that might reference the room
        const matchingProperty = Object.entries(page.properties).find(([propName, propValue]) => {
          // Check different types of properties that might reference a room
          
          // Check title/text properties that contain the room name
          if (propValue.type === 'title' || propValue.type === 'rich_text') {
            const textContent = propValue.type === 'title' 
              ? propValue.title?.map(t => t.plain_text).join('') 
              : propValue.rich_text?.map(t => t.plain_text).join('');
            return textContent && textContent.includes(roomNameForFiltering);
          }
          
          // Check select properties
          if (propValue.type === 'select' && propValue.select) {
            return propValue.select.name === roomNameForFiltering;
          }
          
          // Look for relation properties that might link to the room
          if (propValue.type === 'relation' && propValue.relation) {
            return propValue.relation.some(rel => rel.id === roomId);
          }
          
          // Check for the property name itself containing "room" and matching
          return propName.toLowerCase().includes('room') && 
                 String(propValue[propValue.type]?.name || '').includes(roomNameForFiltering);
        });
        
        return !!matchingProperty;
      });
      
      console.log(`Found ${filteredResults.length} items matching room name ${roomNameForFiltering} out of ${originalResults.length} total items`);
      
      // Replace the results with our filtered results
      response.results = filteredResults;
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