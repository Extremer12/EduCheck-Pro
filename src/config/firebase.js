/**
 * EduCheck Pro - Configuración Firebase Completa v2.1
 * Con limpieza automática de IndexedDB
 */

// Configuración Firebase (mantenemos la tuya)
const firebaseConfig = {
    apiKey: "AIzaSyAC2DxR63utzR1tmnHCqzApYTraxMsH79M",
    authDomain: "horita-feliz-system.firebaseapp.com",
    projectId: "horita-feliz-system",
    storageBucket: "horita-feliz-system.firebasestorage.app",
    messagingSenderId: "469162449559",
    appId: "1:469162449559:web:734e8756fd03b1388ce7d2",
    measurementId: "G-6645JXJBD6"
};

// Verificar que Firebase SDK esté disponible
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK no está disponible. Verifica que los scripts estén cargados correctamente.');
    throw new Error('Firebase SDK requerido');
}

console.log('🔥 Firebase SDK detectado, versión:', firebase.SDK_VERSION);

// Función para limpiar IndexedDB problemático
async function cleanFirestoreIndexedDB() {
    return new Promise((resolve) => {
        if (!('indexedDB' in window)) {
            console.log('⚠️ IndexedDB no disponible en este navegador');
            resolve(false);
            return;
        }

        try {
            const dbName = 'firestore/horita-feliz-system/default';
            console.log('🧹 Intentando limpiar IndexedDB:', dbName);
            
            const deleteRequest = indexedDB.deleteDatabase(dbName);
            
            deleteRequest.onsuccess = () => {
                console.log('✅ IndexedDB limpiado exitosamente');
                resolve(true);
            };
            
            deleteRequest.onerror = () => {
                console.log('⚠️ No se pudo limpiar IndexedDB automáticamente');
                resolve(false);
            };
            
            deleteRequest.onblocked = () => {
                console.log('⚠️ Limpieza de IndexedDB bloqueada (otras pestañas abiertas)');
                resolve(false);
            };
            
            // Timeout por si se queda colgado
            setTimeout(() => {
                console.log('⌛ Timeout en limpieza de IndexedDB');
                resolve(false);
            }, 5000);
            
        } catch (error) {
            console.log('⚠️ Error intentando limpiar IndexedDB:', error);
            resolve(false);
        }
    });
}

// Inicializar Firebase con verificaciones mejoradas
async function initializeFirebaseWithPersistence() {
    try {
        if (!firebase.apps.length) {
            console.log('🔥 Inicializando Firebase...');
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase inicializado correctamente');
        } else {
            console.log('🔥 Firebase ya estaba inicializado');
        }
        
        // Inicializar servicios
        console.log('🔧 Inicializando servicios Firebase...');
        
        // Auth
        if (!window.auth) {
            window.auth = firebase.auth();
            console.log('✅ Firebase Auth inicializado');
        }
        
        // Firestore
        if (!window.db) {
            window.db = firebase.firestore();
            console.log('✅ Firestore inicializado');
        }
        
        // Configurar persistencia de autenticación
        try {
            await window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            console.log('✅ Persistencia de autenticación configurada');
        } catch (error) {
            console.warn('⚠️ Error configurando persistencia auth:', error.code);
        }

        // Configurar persistencia offline con limpieza automática si falla
        if (!window.firestoreConfigured) {
            try {
                await window.db.enablePersistence({
                    synchronizeTabs: false // Evitar conflictos con múltiples pestañas
                });
                console.log('✅ Persistencia offline habilitada');
                window.firestoreConfigured = true;
                
            } catch (err) {
                if (err.code === 'failed-precondition') {
                    console.log('🧹 Detectado problema de versión en IndexedDB, limpiando...');
                    
                    const cleaned = await cleanFirestoreIndexedDB();
                    
                    if (cleaned) {
                        console.log('💡 IndexedDB limpiado. Recarga la página para reconfigurar persistencia.');
                        
                        // Mostrar notificación al usuario
                        if (window.showNotification) {
                            window.showNotification('Base de datos local actualizada. Recarga la página.', 'info');
                        } else {
                            // Fallback si showNotification no está disponible
                            const notification = document.createElement('div');
                            notification.style.cssText = `
                                position: fixed;
                                top: 20px;
                                right: 20px;
                                background: #3b82f6;
                                color: white;
                                padding: 12px 20px;
                                border-radius: 8px;
                                z-index: 10000;
                                font-family: Arial, sans-serif;
                                font-size: 14px;
                                box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                                cursor: pointer;
                            `;
                            notification.innerHTML = `
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span>🔄</span>
                                    <div>
                                        <div style="font-weight: bold;">Base de datos actualizada</div>
                                        <div style="font-size: 12px;">Click para recargar</div>
                                    </div>
                                </div>
                            `;
                            notification.onclick = () => window.location.reload();
                            document.body.appendChild(notification);
                            
                            // Remover después de 10 segundos
                            setTimeout(() => {
                                if (notification.parentNode) {
                                    notification.parentNode.removeChild(notification);
                                }
                            }, 10000);
                        }
                    } else {
                        console.log('💡 No se pudo limpiar automáticamente. Limpieza manual requerida.');
                        console.log('💡 Para limpiar manualmente: DevTools > Application > Storage > Clear storage');
                    }
                    
                } else if (err.code === 'unimplemented') {
                    console.log('💡 Navegador no soporta persistencia offline');
                } else {
                    console.warn('⚠️ Error desconocido en persistencia:', err.code);
                }
                
                // Continuar sin persistencia
                console.log('📱 Continuando sin persistencia offline');
                window.firestoreConfigured = true;
            }
        }
        
    } catch (error) {
        console.error('❌ Error inicializando Firebase:', error);
        throw error;
    }
}

// Función de diagnóstico mejorada
function diagnoseFirabase() {
    const user = window.auth?.currentUser;
    
    console.log('🔍 EduCheck Pro - Diagnóstico Firebase:');
    console.log('=' .repeat(50));
    console.log('🔥 FIREBASE:');
    console.log('  - SDK disponible:', typeof firebase !== 'undefined');
    console.log('  - Versión:', firebase?.SDK_VERSION || 'No disponible');
    console.log('  - Apps inicializadas:', firebase?.apps?.length || 0);
    console.log('  - App name:', firebase?.apps?.[0]?.name || 'No disponible');
    
    console.log('🔐 AUTENTICACIÓN:');
    console.log('  - Auth disponible:', !!window.auth);
    console.log('  - Usuario autenticado:', !!user);
    console.log('  - Email:', user?.email || 'No autenticado');
    console.log('  - UID:', user?.uid || 'No disponible');
    console.log('  - Email verificado:', user?.emailVerified || false);
    
    console.log('💾 FIRESTORE:');
    console.log('  - DB disponible:', !!window.db);
    console.log('  - App asociada:', window.db?.app?.name || 'No disponible');
    console.log('  - Configurado:', !!window.firestoreConfigured);
    
    console.log('🌐 CONEXIÓN:');
    console.log('  - Online:', navigator.onLine);
    console.log('  - Host:', window.location.host);
    console.log('  - Protocol:', window.location.protocol);
    
    console.log('=' .repeat(50));
    
    return {
        firebase: {
            available: typeof firebase !== 'undefined',
            version: firebase?.SDK_VERSION,
            apps: firebase?.apps?.length || 0
        },
        auth: {
            available: !!window.auth,
            user: !!user,
            email: user?.email,
            uid: user?.uid,
            verified: user?.emailVerified
        },
        firestore: {
            available: !!window.db,
            app: window.db?.app?.name,
            configured: !!window.firestoreConfigured
        },
        connection: {
            online: navigator.onLine,
            host: window.location.host,
            protocol: window.location.protocol
        }
    };
}

// Hacer disponibles globalmente
window.diagnoseFirabase = diagnoseFirabase;
window.firebase = firebase; // Asegurar disponibilidad global
window.cleanFirestoreCache = cleanFirestoreIndexedDB;

// Inicializar Firebase con persistencia mejorada
initializeFirebaseWithPersistence();

console.log('🔥 Firebase configuración v2.1 cargada');