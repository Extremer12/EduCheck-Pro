/**
 * EduCheck Pro - Configuración Firebase v3.2 DIAGNÓSTICO COMPLETO
 * Solución definitiva para problemas de autenticación
 */

// ===== PREVENIR INICIALIZACIÓN MÚLTIPLE =====
if (window.firebaseInitialized) {
    console.log('⚠️ Firebase ya inicializado, omitiendo...');
} else {
    console.log('🔥 Inicializando Firebase v3.2 con diagnóstico completo...');
    
    // ===== CONFIGURACIÓN MEJORADA =====
    const firebaseConfig = {
        apiKey: "AIzaSyAC2DxR63utzR1tmnHCqzApYTraxMsH79M",
        authDomain: "horita-feliz-system.firebaseapp.com",
        projectId: "horita-feliz-system",
        storageBucket: "horita-feliz-system.firebasestorage.app",
        messagingSenderId: "469162449559",
        appId: "1:469162449559:web:734e8756fd03b1388ce7d2",
        measurementId: "G-6645JXJBD6"
    };

    // ===== FUNCIÓN DE DIAGNÓSTICO GLOBAL =====
    window.diagnoseFirebase = function() {
        console.log('🔍 ===== DIAGNÓSTICO COMPLETO DE FIREBASE =====');
        
        // Verificar Firebase SDK
        console.log('📦 Firebase SDK:', {
            available: typeof firebase !== 'undefined',
            version: firebase?.SDK_VERSION || 'Desconocida',
            apps: firebase?.apps?.length || 0
        });
        
        // Verificar configuración
        console.log('⚙️ Configuración:', firebaseConfig);
        
        // Verificar servicios
        console.log('🛠️ Servicios:', {
            app: typeof firebase?.app === 'function',
            auth: typeof firebase?.auth === 'function',
            firestore: typeof firebase?.firestore === 'function',
            storage: typeof firebase?.storage === 'function'
        });
        
        // Verificar estado actual
        console.log('🔄 Estado actual:', {
            firebaseInitialized: window.firebaseInitialized,
            authAvailable: !!window.auth,
            dbAvailable: !!window.db,
            storageAvailable: !!window.storage
        });
        
        // Verificar Auth específicamente
        if (window.auth) {
            console.log('🔐 Estado de Auth:', {
                configured: !!window.auth,
                currentUser: window.auth.currentUser?.email || 'No autenticado',
                app: window.auth.app?.name || 'No app',
                languageCode: window.auth.languageCode
            });
        }
        
        // Verificar red
        console.log('🌐 Red:', {
            online: navigator.onLine,
            domain: window.location.hostname,
            protocol: window.location.protocol
        });
        
        console.log('🔍 ===== FIN DIAGNÓSTICO =====');
    };

    // ===== FUNCIÓN PARA PROBAR AUTH =====
    window.testFirebaseAuth = async function() {
        console.log('🧪 ===== TEST DE FIREBASE AUTH =====');
        
        if (!window.auth) {
            console.error('❌ Auth no está disponible');
            return false;
        }
        
        try {
            // Test básico: obtener configuración
            console.log('📋 Configuración Auth:', {
                apiKey: window.auth.app.options.apiKey ? 'Configurado' : 'Falta',
                authDomain: window.auth.app.options.authDomain,
                projectId: window.auth.app.options.projectId
            });
            
            // Test de conectividad
            console.log('🔌 Probando conectividad...');
            
            // Intentar un test que no requiera credenciales
            const testEmail = 'test@test.com';
            const testPassword = '123456';
            
            try {
                // Esto debería fallar con credenciales incorrectas, pero nos dirá si la API funciona
                await window.auth.signInWithEmailAndPassword(testEmail, testPassword);
                console.log('⚠️ Test inesperado: login exitoso con credenciales de prueba');
            } catch (testError) {
                if (testError.code === 'auth/user-not-found' || testError.code === 'auth/wrong-password') {
                    console.log('✅ API de Auth funciona correctamente (error esperado)');
                    return true;
                } else {
                    console.error('❌ Error en API de Auth:', testError);
                    return false;
                }
            }
            
        } catch (error) {
            console.error('❌ Error en test de Auth:', error);
            return false;
        }
    };

    // ===== INICIALIZACIÓN CON VERIFICACIÓN =====
    async function initializeFirebaseServices() {
        try {
            console.log('🚀 Iniciando Firebase...');
            
            // Verificar que Firebase SDK esté disponible
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK no está disponible');
            }
            
            // Inicializar app
            let app;
            if (!firebase.apps.length) {
                app = firebase.initializeApp(firebaseConfig);
            } else {
                app = firebase.app();
            }
            
            // Verificar configuración crítica
            if (!app.options.apiKey) {
                throw new Error('API Key no configurada');
            }
            
            // Inicializar Auth
            window.auth = firebase.auth();
            window.auth.languageCode = 'es';
            await window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            
            // 👇 INICIALIZAR FIRESTORE SI ESTÁ DISPONIBLE
            if (typeof firebase.firestore === 'function' && !window.db) {
                try {
                    window.db = firebase.firestore();
                    console.log('✅ Firestore inicializado');
                } catch (firestoreError) {
                    console.warn('⚠️ No se pudo inicializar Firestore:', firestoreError);
                }
            }
            
            // 👇 INICIALIZAR STORAGE SI ESTÁ DISPONIBLE
            if (typeof firebase.storage === 'function' && !window.storage) {
                try {
                    window.storage = firebase.storage();
                    console.log('✅ Storage inicializado');
                } catch (storageError) {
                    console.warn('⚠️ No se pudo inicializar Storage:', storageError);
                }
            }
            
            console.log('✅ Firebase inicializado correctamente');
            console.log('📊 Servicios disponibles:', {
                auth: !!window.auth,
                firestore: !!window.db,
                storage: !!window.storage
            });
            
            window.firebaseInitialized = true;
            window.dispatchEvent(new CustomEvent('firebaseReady'));
            
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando Firebase:', error);
            throw error;
        }
    }
    
    // ===== FUNCIÓN PARA MOSTRAR ERRORES =====
    function showFirebaseError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'firebase-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: #ff4444;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 9999;
            font-family: Arial, sans-serif;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 14px;
        `;
        
        errorDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 0.5rem;">
                🔥 Error de Firebase
            </div>
            <div style="margin-bottom: 0.5rem;">
                ${message}
            </div>
            <button onclick="window.diagnoseFirebase()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 12px;">
                🔍 Diagnosticar
            </button>
        `;
        
        // Remover error anterior si existe
        const existingError = document.getElementById('firebase-error');
        if (existingError) {
            existingError.remove();
        }
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 15000);
    }
    
    // ===== INICIALIZACIÓN AUTOMÁTICA =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFirebaseServices);
    } else {
        setTimeout(initializeFirebaseServices, 100);
    }
}

console.log('✅ firebase.js v3.2 cargado con diagnóstico completo');