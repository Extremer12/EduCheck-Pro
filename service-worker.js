const CACHE_NAME = 'horita-feliz-v1';
const urlsToCache = [
    './',
    './index.html',
    './login.html',
    './manifest.json',
    './src/assets/css/styles.css',
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
