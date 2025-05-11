// This file helps verify that service worker registration is working
console.log('Service worker test script loaded');

function testServiceWorker() {
  if ('serviceWorker' in navigator) {
    console.log('Service Worker API is supported');
    
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log('Service worker registrations:', registrations.length);
      
      registrations.forEach(reg => {
        console.log('SW registration scope:', reg.scope);
        console.log('SW registration state:', reg.active ? 'active' : 'inactive');
      });
    });
  } else {
    console.warn('Service Worker API not supported!');
  }
}

// Run the test when document is loaded
window.addEventListener('load', testServiceWorker);