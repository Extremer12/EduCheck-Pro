const CACHE_NAME = 'educheck-pro-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/src/assets/css/styles.css',
    './src/assets/css/responsive.css',
    './src/assets/js/app.js',
    './src/assets/js/auth.js',
    './src/assets/js/students.js',
    './src/assets/js/attendance.js',
    './src/assets/js/profile.js',
    './src/utils/database.js',
    './src/utils/helpers.js',
    './icon-192.png',
    './icon-512.png'
];

// URLs que NO deben ser cacheadas (AMPLIADO)
const EXCLUDED_URLS = [
    'firebasestorage.googleapis.com',
    'firebase.google.com',
    'googleapis.com',
    'gstatic.com',
    'firebaseapp.com'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                // Cachear archivos uno por uno para evitar errores
                return Promise.allSettled(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(error => {
                            console.warn(`No se pudo cachear ${url}:`, error);
                        });
                    })
                );
            })
            .catch(error => {
                console.error('Error al abrir cache:', error);
            })
    );
});

self.addEventListener('fetch', event => {
    // No interceptar requests de Firebase Storage o relacionados
    if (EXCLUDED_URLS.some(excluded => event.request.url.includes(excluded))) {
        console.log('🔥 Excluyendo de SW:', event.request.url);
        return;
    }
    
    // No interceptar requests POST, PUT, DELETE
    if (event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si está en cache, devolverlo
                if (response) {
                    return response;
                }
                // Si no, hacer fetch normal
                return fetch(event.request);
            }
        )
    );
});
