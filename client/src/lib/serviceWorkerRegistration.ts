let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register the service worker for the PWA
 */
export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          swRegistration = registration;
          
          // Setup message channel if needed
          setupServiceWorkerMessaging();
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

/**
 * Setup messaging between the main thread and service worker
 */
function setupServiceWorkerMessaging() {
  // Listen for messages from the service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SPOTLIGHT_REQUEST') {
      // Handle spotlight request if needed
      console.log('Received spotlight request from service worker');
    }
  });
}

/**
 * Send message to service worker
 */
export function sendMessageToSW(message: any) {
  return new Promise<void>((resolve, reject) => {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      reject('No active service worker');
      return;
    }
    
    // Send message to service worker
    navigator.serviceWorker.controller.postMessage(message);
    resolve();
  });
}

/**
 * Update the spotlight items in the service worker
 */
export async function updateSpotlightItemsInSW(items: any[]) {
  try {
    await sendMessageToSW({
      type: 'UPDATE_SPOTLIGHT_ITEMS',
      items
    });
    console.log(`Updated ${items.length} spotlight items in service worker`);
  } catch (error) {
    console.error('Failed to update spotlight items in SW:', error);
  }
}
