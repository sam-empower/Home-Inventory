/**
 * iOS Spotlight Integration for PWA
 * Helps integrate inventory items with iOS Spotlight search
 */

import { NotionDatabaseItem } from '@shared/schema';

// Interface for SpotlightIndexItem
interface SpotlightIndexItem {
  id: string;
  title: string;
  description?: string;
  keywords?: string[];
  url: string;
  imageUrl?: string;
  lastUpdated: number;
  room?: string;
  box?: string;
  category?: string;
}

// Cache key for the IndexedDB database
const SPOTLIGHT_CACHE_KEY = 'ios-spotlight-cache';

// Apple specific constants for CSSearchableItem domains
const APP_IDENTIFIER = 'com.notion-inventory.app'; 
const DOMAIN_IDENTIFIER = 'com.notion-inventory.items';

/**
 * Check if the current browser supports the CoreSpotlight API
 * 
 * Enhanced version for testing with better iOS simulation
 */
export function isCoreSpotlightSupported(): boolean {
  try {
    // Get device info for better detection
    const userAgent = navigator.userAgent;
    const isActualIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    
    // Flag to force testing mode
    const forceTestMode = true; // Change to false to only enable on iOS
    
    // Check for iOS-like environment (either real iOS or testing)
    const isIOSEnv = isActualIOS || forceTestMode;
    
    // Log device detection for debugging
    console.log("Device detection for Spotlight:", {
      isIOS: isIOSEnv,
      userAgent: navigator.userAgent,
      testMode: forceTestMode
    });
    
    if (forceTestMode && !isActualIOS) {
      console.log("iOS Spotlight testing mode:", {
        userAgent: navigator.userAgent,
        testMode: true
      });
      
      // Simulate iOS in testing environment
      console.log("iOS Spotlight integration test mode - simulating successful initialization");
      return true;
    }
    
    // REAL iOS DEVICE CODE
    if (isActualIOS) {
      // Check if running as PWA
      const displayMode = window.matchMedia('(display-mode: standalone)').matches;
      const navigatorStandalone = (window.navigator as any).standalone === true;
      const isPWA = displayMode || navigatorStandalone;
      
      // Check for webkit API
      const hasWebkit = typeof window !== 'undefined' && 'webkit' in window && (window as any).webkit;
      
      // Return true only if all conditions are met for real iOS
      return isPWA && hasWebkit;
    }
    
    return forceTestMode; // Return test mode value
  } catch (error) {
    console.error("Error detecting Spotlight support:", error);
    return true; // Still return true in test mode
  }
}

/**
 * Initialize the Spotlight integration
 * Should be called when app is first loaded
 * 
 * NOTE: In test mode, this just simulates successful initialization
 */
export async function initSpotlightIntegration(): Promise<void> {
  if (!isCoreSpotlightSupported()) {
    console.log('iOS Spotlight integration not available');
    return;
  }

  // Setup listeners for deep linking
  setupDeepLinking();
  
  // Force iOS to rescan for Spotlight integration by creating a temporary entry
  try {
    await forceSpotlightRegistration();
  } catch (error) {
    console.warn('Error forcing Spotlight registration:', error);
  }
  
  // For testing feedback - show initialization
  console.log('iOS Spotlight integration initialized with domains:',
    APP_IDENTIFIER, DOMAIN_IDENTIFIER);
  
  // Only try to use the actual API if it exists
  const hasSearchKit = typeof window !== 'undefined' && 
    'webkit' in window && 
    (window as any).webkit && 
    'searchKit' in (window as any).webkit;
    
  if (hasSearchKit) {
    try {
      // @ts-ignore - CoreSpotlight
      const searchKit = (window as any).webkit.searchKit;
      
      // Register domain identifiers - using our app specific domain
      searchKit.registerAppIdentifier(APP_IDENTIFIER);
      searchKit.registerDomainIdentifiers([DOMAIN_IDENTIFIER]);
      
      // Important: Make sure iOS knows to index our app
      searchKit.setIndexEnabled(true);
      
      console.log('iOS Spotlight integration fully initialized with WebKit SearchKit');
    } catch (error) {
      console.warn('Error initializing actual iOS Spotlight integration:', error);
      console.log('Continuing in test mode');
    }
  }
}

/**
 * Forces iOS to recognize and register our app for Spotlight search
 * by creating and immediately removing a test item
 */
async function forceSpotlightRegistration(): Promise<void> {
  // Check if WebKit SearchKit is available
  const hasSearchKit = typeof window !== 'undefined' && 
    'webkit' in window && 
    (window as any).webkit && 
    'searchKit' in (window as any).webkit;
    
  if (hasSearchKit) {
    try {
      // @ts-ignore - CoreSpotlight
      const searchKit = (window as any).webkit.searchKit;
      
      // Create a test entry that helps iOS recognize our app
      const testItem = {
        uniqueIdentifier: 'app-registration-test',
        domainIdentifier: DOMAIN_IDENTIFIER,
        title: 'Inventory App Registration',
        description: 'This is a temporary item to register the app with Spotlight.',
        contentURL: window.location.origin
      };
      
      // Add and then remove the test item
      await searchKit.indexSearchableItems({ items: [testItem] });
      
      // Wait a moment before removing so iOS has time to register
      setTimeout(async () => {
        try {
          await searchKit.deleteSearchableItems({
            identifiers: ['app-registration-test']
          });
        } catch (e) {
          console.warn('Error removing test item:', e);
        }
      }, 500);
      
      console.log('Successfully forced Spotlight registration');
    } catch (error) {
      console.warn('Error with force registration:', error);
    }
  }
}

/**
 * Setup deep linking handlers for Spotlight search results
 */
function setupDeepLinking(): void {
  // Listen for URL changes that might be from Spotlight
  window.addEventListener('popstate', handleDeepLink);
  window.addEventListener('load', () => {
    // Check if the current URL has spotlight parameters
    handleDeepLink();
  });
}

/**
 * Handle deep links from Spotlight
 */
function handleDeepLink(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('item');
  const source = urlParams.get('source');
  
  if (itemId && source === 'spotlight') {
    console.log('Deep link from Spotlight for item:', itemId);
    // Navigate to the item detail page or open the detail modal
    openItemDetail(itemId);
  }
}

/**
 * Open the item detail page or modal
 */
function openItemDetail(itemId: string): void {
  // Dispatch an event that can be caught by the HomePage component
  const event = new CustomEvent('openItemDetail', { 
    detail: { itemId }
  });
  window.dispatchEvent(event);
}

/**
 * Index items for Spotlight search
 * @param items The NotionDatabaseItems to index
 */
export async function indexItemsForSpotlight(items: NotionDatabaseItem[]): Promise<void> {
  if (!isCoreSpotlightSupported()) {
    return;
  }

  try {
    // Convert items to Spotlight format
    const spotlightItems = convertItemsToSpotlightFormat(items);
    
    // Store in local cache
    await storeItemsInLocalCache(spotlightItems);
    
    // Index in CoreSpotlight
    await indexInCoreSpotlight(spotlightItems);
    
    console.log(`Indexed ${spotlightItems.length} items for iOS Spotlight search`);
  } catch (error) {
    console.error('Error indexing items for Spotlight:', error);
  }
}

/**
 * Convert NotionDatabaseItems to Spotlight format
 */
function convertItemsToSpotlightFormat(items: NotionDatabaseItem[]): SpotlightIndexItem[] {
  return items.map(item => {
    // Create a set of keywords from various item properties
    const keywordSet = new Set<string>();
    
    // Add title words to keywords
    item.title.split(/\s+/).forEach(word => {
      if (word.length > 2) keywordSet.add(word.toLowerCase());
    });
    
    // Add description words to keywords if they exist
    if (item.description) {
      item.description.split(/\s+/).forEach(word => {
        if (word.length > 3) keywordSet.add(word.toLowerCase());
      });
    }
    
    // Add room and box names to keywords
    if (item.roomName) keywordSet.add(item.roomName.toLowerCase());
    if (item.boxNames) {
      item.boxNames.forEach(box => keywordSet.add(box.toLowerCase()));
    }
    
    // Create the spotlight item
    return {
      id: item.id,
      title: item.title,
      description: item.description || '',
      keywords: Array.from(keywordSet),
      url: `/?item=${item.id}&source=spotlight`,
      imageUrl: item.images && item.images.length > 0 ? item.images[0].url : undefined,
      lastUpdated: Date.now(),
      room: item.roomName,
      box: item.boxNames?.join(', '),
      category: item.status || undefined
    };
  });
}

/**
 * Store items in local IndexedDB cache
 */
async function storeItemsInLocalCache(items: SpotlightIndexItem[]): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Open or create IndexedDB database
      const request = indexedDB.open('notion-pwa-spotlight', 1);
      
      request.onerror = (event) => {
        reject('Error opening IndexedDB');
      };
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains('spotlight-items')) {
          const store = db.createObjectStore('spotlight-items', { keyPath: 'id' });
          store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        const db = request.result;
        const transaction = db.transaction(['spotlight-items'], 'readwrite');
        const store = transaction.objectStore('spotlight-items');
        
        // Clear existing items first
        store.clear();
        
        // Add all items
        items.forEach(item => {
          store.add(item);
        });
        
        transaction.oncomplete = () => {
          resolve();
        };
        
        transaction.onerror = () => {
          reject('Error storing items in IndexedDB');
        };
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Index items in CoreSpotlight
 * 
 * NOTE: In test mode, this method just logs the items that would be indexed
 * but doesn't actually try to use the searchKit API
 */
async function indexInCoreSpotlight(items: SpotlightIndexItem[]): Promise<void> {
  if (!isCoreSpotlightSupported()) {
    return;
  }
  
  try {
    // Check if webkit.searchKit exists
    const hasSearchKit = typeof window !== 'undefined' && 
      'webkit' in window && 
      (window as any).webkit && 
      'searchKit' in (window as any).webkit;
    
    // For testing/development - just log that we would index these items
    console.log(`Would index ${items.length} items in Spotlight with titles:`, 
      items.map(item => item.title).slice(0, 5));
    
    // Only try to use the actual API if it exists
    if (hasSearchKit) {
      // @ts-ignore - CoreSpotlight
      const searchKit = (window as any).webkit.searchKit;
      
      // Important: Make sure indexing is enabled
      searchKit.setIndexEnabled(true);
      
      // First, delete existing items - use our domain identifier
      await searchKit.deleteSearchableItems({
        domainIdentifier: DOMAIN_IDENTIFIER
      });
      
      // Then add new items
      const searchableItems = items.map(item => ({
        uniqueIdentifier: item.id,
        domainIdentifier: DOMAIN_IDENTIFIER,
        title: item.title,
        description: item.description || '',
        keywords: item.keywords || [],
        thumbnailURL: item.imageUrl,
        contentURL: `${window.location.origin}${item.url}`,
        additionalAttributes: {
          room: item.room || '',
          box: item.box || '',
          category: item.category || ''
        }
      }));
      
      // Add batch size handling - iOS has limits on batch size
      const BATCH_SIZE = 50;
      for (let i = 0; i < searchableItems.length; i += BATCH_SIZE) {
        const batch = searchableItems.slice(i, i + BATCH_SIZE);
        await searchKit.indexSearchableItems({ items: batch });
        console.log(`Indexed batch of ${batch.length} items (${i + batch.length} of ${searchableItems.length})`);
      }

      // Add a system notification to trigger Spotlight update
      if ('Notification' in window && Notification.permission === 'granted') {
        // Create silent notification to help trigger Spotlight update
        new Notification('Inventory items indexed', {
          body: 'You can now search for items using iOS Spotlight Search',
          silent: true,
          requireInteraction: false
        });
      }
      
      console.log('Successfully indexed all items in CoreSpotlight');
    }
  } catch (error) {
    console.error('Error indexing in CoreSpotlight:', error);
    // Don't throw the error in test mode - just log it
  }
}

/**
 * Remove an item from Spotlight index
 */
export async function removeItemFromSpotlight(itemId: string): Promise<void> {
  if (!isCoreSpotlightSupported()) {
    return;
  }
  
  try {
    // For testing/development - just log that we would remove this item
    console.log(`Removing item ${itemId} from Spotlight index`);
    
    // Check if webkit.searchKit exists
    const hasSearchKit = typeof window !== 'undefined' && 
      'webkit' in window && 
      (window as any).webkit && 
      'searchKit' in (window as any).webkit;
      
    // Only try to use the actual API if it exists
    if (hasSearchKit) {
      // @ts-ignore - CoreSpotlight
      const searchKit = (window as any).webkit.searchKit;
      
      // Make sure indexing is enabled first
      searchKit.setIndexEnabled(true);
      
      // Remove item by ID and domain
      await searchKit.deleteSearchableItems({
        identifiers: [itemId],
        domainIdentifier: DOMAIN_IDENTIFIER
      });
      
      console.log('Successfully removed item from CoreSpotlight');
    }
    
    // Always try to remove from local cache
    try {
      const request = indexedDB.open('notion-pwa-spotlight', 1);
      
      request.onsuccess = (event) => {
        const db = request.result;
        
        // Only proceed if the object store exists
        if (db.objectStoreNames.contains('spotlight-items')) {
          const transaction = db.transaction(['spotlight-items'], 'readwrite');
          const store = transaction.objectStore('spotlight-items');
          
          store.delete(itemId);
          console.log('Removed item from local Spotlight cache');
        }
      };
    } catch (dbError) {
      console.warn('Error removing item from IndexedDB:', dbError);
    }
  } catch (error) {
    console.error('Error removing item from Spotlight:', error);
  }
}

/**
 * Get all items from local spotlight cache
 */
export async function getSpotlightItems(): Promise<SpotlightIndexItem[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('notion-pwa-spotlight', 1);
    
    request.onerror = (event) => {
      reject('Error opening IndexedDB');
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains('spotlight-items')) {
        db.createObjectStore('spotlight-items', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = request.result;
      
      // Return empty array if store doesn't exist yet
      if (!db.objectStoreNames.contains('spotlight-items')) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(['spotlight-items'], 'readonly');
      const store = transaction.objectStore('spotlight-items');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
      
      getAllRequest.onerror = () => {
        reject('Error retrieving items from IndexedDB');
      };
    };
  });
}