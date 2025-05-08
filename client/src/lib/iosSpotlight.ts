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

/**
 * Check if the current browser supports the CoreSpotlight API
 */
export function isCoreSpotlightSupported(): boolean {
  try {
    // More reliable detection - check if it's an iOS device first
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Then check for the searchKit API
    const hasWebkitSearchKit = typeof window !== 'undefined' && 
      'webkit' in window && 
      (window as any).webkit && 
      'searchKit' in (window as any).webkit;
    
    // Additional check - see if we're running as an installed PWA
    const isStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone === true;
    
    // Log for debugging
    console.log("iOS Spotlight detection:", { 
      isIOS, 
      hasWebkitSearchKit,
      isStandalone,
      userAgent: navigator.userAgent
    });
    
    // Return true only if all conditions are met
    return isIOS && hasWebkitSearchKit && isStandalone;
  } catch (error) {
    console.error("Error detecting Spotlight support:", error);
    return false;
  }
}

/**
 * Initialize the Spotlight integration
 * Should be called when app is first loaded
 */
export async function initSpotlightIntegration(): Promise<void> {
  if (!isCoreSpotlightSupported()) {
    console.log('iOS Spotlight integration not available');
    return;
  }

  // Setup listeners for deep linking
  setupDeepLinking();
  
  // Attempt to initialize CoreSpotlight
  try {
    // @ts-ignore - CoreSpotlight
    const searchKit = (window as any).webkit.searchKit;
    
    // Register domain identifiers
    searchKit.registerDomainIdentifiers(['com.notiondb.item']);
    
    console.log('iOS Spotlight integration initialized');
  } catch (error) {
    console.error('Error initializing iOS Spotlight integration:', error);
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
 */
async function indexInCoreSpotlight(items: SpotlightIndexItem[]): Promise<void> {
  if (!isCoreSpotlightSupported()) {
    return;
  }
  
  try {
    // @ts-ignore - CoreSpotlight
    const searchKit = (window as any).webkit.searchKit;
    
    // First, delete existing items
    await searchKit.deleteSearchableItems({
      domainIdentifier: 'com.notiondb.item'
    });
    
    // Then add new items
    const searchableItems = items.map(item => ({
      uniqueIdentifier: item.id,
      domainIdentifier: 'com.notiondb.item',
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
    
    await searchKit.indexSearchableItems({ items: searchableItems });
  } catch (error) {
    console.error('Error indexing in CoreSpotlight:', error);
    throw error;
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
    // @ts-ignore - CoreSpotlight
    const searchKit = (window as any).webkit.searchKit;
    
    await searchKit.deleteSearchableItems({
      identifiers: [itemId]
    });
    
    // Also remove from local cache
    const request = indexedDB.open('notion-pwa-spotlight', 1);
    
    request.onsuccess = (event) => {
      const db = request.result;
      const transaction = db.transaction(['spotlight-items'], 'readwrite');
      const store = transaction.objectStore('spotlight-items');
      
      store.delete(itemId);
    };
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