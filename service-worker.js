const CACHE_NAME = 'educheck-pro-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/login.html',
    '/instituciones.html',
    '/cursos.html',
    '/estudiantes.html',
    '/asistencia.html',
    '/actividades.html',
    '/gallery.html',
    '/profile.html',
    '/ajustes.html',
    
    // CSS
    '/src/assets/css/styles.css',
    '/src/assets/css/responsive.css',
    '/src/assets/css/instituciones.css',
    '/src/assets/css/cursos.css',
    '/src/assets/css/estudiantes.css',
    '/src/assets/css/asistencia.css',
    '/src/assets/css/actividades.css',
    '/src/assets/css/gallery.css',
    '/src/assets/css/profile.css',
    '/src/assets/css/ajustes.css',
    '/src/assets/css/login.css',
    
    // JavaScript - ARCHIVOS QUE SÍ EXISTEN
    '/src/assets/js/app.js',
    '/src/assets/js/dashboard.js',
    '/src/assets/js/estudiantes.js',
    '/src/assets/js/asistencia.js',
    '/src/assets/js/actividades.js',
    '/src/assets/js/ajustes.js',
    '/src/assets/js/gallery.js',
    '/src/assets/js/cursos.js',
    '/src/assets/js/instituciones.js',
    '/src/assets/js/constants.js',
    '/src/assets/js/syncManager.js',
    '/src/assets/js/theme-manager.js',
    '/src/assets/js/profile.js',
    
    // Configuración
    '/src/config/firebase.js',
    
    // Iconos y manifest
    '/icon-192.png',
    '/icon-512.png',
    '/manifest.json',
    
    // Font Awesome (cachear localmente)
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// URLs que NO deben ser cacheadas
const EXCLUDED_URLS = [
    'firebasestorage.googleapis.com',
    'firebase.google.com',
    'googleapis.com',
    'gstatic.com',
    'firebaseapp.com',
    'firebase.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com'
];

// ===== INSTALACIÓN DEL SERVICE WORKER =====
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Cache abierto:', CACHE_NAME);
                
                // Cachear archivos uno por uno para mejor control de errores
                return Promise.allSettled(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(error => {
                            console.warn(`⚠️ No se pudo cachear ${url}:`, error.message);
                            // No fallar por un archivo individual
                            return null;
                        });
                    })
                );
            })
            .then(results => {
                const successful = results.filter(result => result.status === 'fulfilled').length;
                const failed = results.filter(result => result.status === 'rejected').length;
                
                console.log(`✅ Cacheados: ${successful} archivos`);
                if (failed > 0) {
                    console.warn(`⚠️ Fallidos: ${failed} archivos`);
                }
                
                // Forzar activación inmediata
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Error al abrir cache:', error);
            })
    );
});

// ===== ACTIVACIÓN DEL SERVICE WORKER =====
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker: Activando...');
    
    event.waitUntil(
        Promise.all([
            // Limpiar caches antiguos
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Eliminando cache antiguo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Tomar control inmediatamente
            self.clients.claim()
        ])
    );
});

// ===== INTERCEPCIÓN DE REQUESTS =====
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // ❌ NO INTERCEPTAR REQUESTS DE FIREBASE
    if (EXCLUDED_URLS.some(excluded => request.url.includes(excluded))) {
        console.log('🔥 Excluyendo de SW:', request.url);
        return;
    }
    
    // ❌ NO INTERCEPTAR REQUESTS NO-GET
    if (request.method !== 'GET') {
        return;
    }
    
    // ❌ NO INTERCEPTAR REQUESTS CON QUERIES DINÁMICAS
    if (url.search.includes('v=') || url.search.includes('t=') || url.search.includes('cache=')) {
        return;
    }
    
    // ✅ INTERCEPTAR Y CACHEAR
    event.respondWith(
        caches.match(request)
            .then(response => {
                // Si está en cache, devolverlo
                if (response) {
                    console.log('📁 Servido desde cache:', request.url);
                    return response;
                }
                
                // Si no está en cache, hacer fetch
                console.log('🌐 Descargando:', request.url);
                return fetch(request)
                    .then(response => {
                        // Verificar que la respuesta sea válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clonar la respuesta para poder usarla y cachearla
                        const responseToCache = response.clone();
                        
                        // Cachear la respuesta para futuras requests
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(request, responseToCache);
                            })
                            .catch(error => {
                                console.warn('⚠️ Error cacheando:', error);
                            });
                        
                        return response;
                    })
                    .catch(error => {
                        console.error('❌ Error en fetch:', error);
                        
                        // Si es una página HTML y falla, mostrar página offline
                        if (request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                        
                        // Para otros recursos, fallar silenciosamente
                        return new Response('Recurso no disponible offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// ===== MENSAJES DESDE LA APLICACIÓN =====
self.addEventListener('message', event => {
    console.log('📨 Mensaje recibido en SW:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});

// ===== EVENTOS DE SINCRONIZACIÓN EN BACKGROUND =====
self.addEventListener('sync', event => {
    console.log('🔄 Background sync:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Aquí puedes agregar lógica de sincronización
            console.log('⚡ Ejecutando sincronización en background')
        );
    }
});

// ===== NOTIFICACIONES PUSH =====
self.addEventListener('push', event => {
    console.log('📢 Push recibido:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'Notificación de EduCheck Pro',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver',
                icon: '/icon-192.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: '/icon-192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('EduCheck Pro', options)
    );
});

// ===== CLICK EN NOTIFICACIONES =====
self.addEventListener('notificationclick', event => {
    console.log('🔔 Click en notificación:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// ===== LOG DE INICIALIZACIÓN =====
console.log('✅ Service Worker cargado - EduCheck Pro v2');
console.log('📦 Cache name:', CACHE_NAME);
console.log('📁 Archivos a cachear:', urlsToCache.length);
console.log('🚫 URLs excluidas:', EXCLUDED_URLS.length);