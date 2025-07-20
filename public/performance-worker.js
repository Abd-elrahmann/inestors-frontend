
const CACHE_NAME = 'investors-system-v1';
const STATIC_CACHE = 'static-cache-v1';
const API_CACHE = 'api-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/src/styles/performanceStyles.css'
];
self.addEventListener('install', (event) => {
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
        .then((cache) => {
          return cache.addAll(STATIC_ASSETS);
        })
        .catch((error) => {
          console.error('❌ Service Worker: Failed to cache static assets', error);
        })
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  
  self.clients.claim();
});


self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  
  if (!request.url.startsWith('http')) {
    return;
  }
  
  
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } 
  
  else {
    event.respondWith(handleStaticRequest(request));
  }
});


async function handleApiRequest(request) {
  // const url = new URL(request.url);
  
  
  if (request.method === 'GET') {
    try {
      const cache = await caches.open(API_CACHE);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        
        
        
        fetch(request).then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
        }).catch(() => {

        });
        
        return cachedResponse;
      }
      
      
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        
        cache.put(request, networkResponse.clone());
        
      }
      
      return networkResponse;
      
    } catch (error) {
      console.error('❌ Service Worker: API request failed', error);
      
      
      return new Response(
        JSON.stringify({ 
          error: 'Service unavailable',
          message: 'تعذر الاتصال بالخادم'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  
  return fetch(request);
}


async function handleStaticRequest(request) {
  try {
    
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      
      return cachedResponse;
    }
    
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      
      cache.put(request, networkResponse.clone());
      
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ Service Worker: Static request failed', error);
    
    
    if (request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE);
      return cache.match('/index.html');
    }
    
    
    return new Response('Resource not available offline', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}


self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});


self.addEventListener('fetch', (event) => {
  const startTime = performance.now();
  
  event.respondWith(
    handleRequest(event.request).then((response) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      
      if (duration > 1000) {
        console.warn(`⚠️ Slow request: ${event.request.url} took ${duration.toFixed(2)}ms`);
      }
      
      return response;
    })
  );
});


async function handleRequest(request) {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(request);
  } else {
    return handleStaticRequest(request);
  }
} 