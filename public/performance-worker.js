// 🚀 Service Worker لتحسين الأداء

const CACHE_NAME = 'investors-system-v1';
const STATIC_CACHE = 'static-cache-v1';
const API_CACHE = 'api-cache-v1';

// الملفات المهمة للتخزين المؤقت
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/src/styles/performanceStyles.css'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('❌ Service Worker: Failed to cache static assets', error);
      })
  );
  
  // فرض التفعيل الفوري
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // حذف الكاش القديم
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // السيطرة على جميع العملاء
  self.clients.claim();
});

// اعتراض الطلبات
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // تجاهل الطلبات غير HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // استراتيجية مختلفة للـ API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } 
  // استراتيجية للملفات الثابتة
  else {
    event.respondWith(handleStaticRequest(request));
  }
});

// معالجة طلبات API
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // للطلبات GET فقط، استخدم Cache First مع Network Fallback
  if (request.method === 'GET') {
    try {
      const cache = await caches.open(API_CACHE);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        console.log('📦 Service Worker: Serving API from cache', url.pathname);
        
        // تحديث الكاش في الخلفية
        fetch(request).then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
        }).catch(() => {
          // تجاهل أخطاء التحديث
        });
        
        return cachedResponse;
      }
      
      // جلب من الشبكة
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // حفظ في الكاش للمرة القادمة
        cache.put(request, networkResponse.clone());
        console.log('🌐 Service Worker: Cached API response', url.pathname);
      }
      
      return networkResponse;
      
    } catch (error) {
      console.error('❌ Service Worker: API request failed', error);
      
      // إرجاع استجابة خطأ مخصصة
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
  
  // للطلبات غير GET، اذهب مباشرة للشبكة
  return fetch(request);
}

// معالجة الطلبات الثابتة
async function handleStaticRequest(request) {
  try {
    // Cache First Strategy
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 Service Worker: Serving static from cache', request.url);
      return cachedResponse;
    }
    
    // جلب من الشبكة
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // حفظ في الكاش
      cache.put(request, networkResponse.clone());
      console.log('🌐 Service Worker: Cached static asset', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ Service Worker: Static request failed', error);
    
    // للصفحات، أرجع الصفحة الرئيسية
    if (request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE);
      return cache.match('/index.html');
    }
    
    // للموارد الأخرى، أرجع خطأ
    return new Response('Resource not available offline', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// تنظيف الكاش القديم
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('🗑️ Service Worker: Clearing cache', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

// مراقبة الأداء
self.addEventListener('fetch', (event) => {
  const startTime = performance.now();
  
  event.respondWith(
    handleRequest(event.request).then((response) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // تسجيل الطلبات البطيئة
      if (duration > 1000) {
        console.warn(`⚠️ Slow request: ${event.request.url} took ${duration.toFixed(2)}ms`);
      }
      
      return response;
    })
  );
});

// دالة معالجة الطلب الرئيسية
async function handleRequest(request) {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(request);
  } else {
    return handleStaticRequest(request);
  }
} 