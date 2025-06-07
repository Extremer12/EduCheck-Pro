/**
 * EduCheck Pro - Gestor de Sincronización v2.1 CORREGIDO
 * Con mejor espera para Firebase
 */

class SyncManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.isInitialized = false;
        this.initPromise = null;
        
        console.log('🔄 SyncManager: Esperando Firebase...');
        this.waitForFirebase();
    }
    
    waitForFirebase() {
        // Escuchar el evento personalizado de Firebase
        const handleFirebaseReady = () => {
            console.log('🔄 SyncManager: Firebase ready detectado');
            this.initPromise = this.init();
        };
        
        if (window.firebaseInitialized && window.auth && window.db) {
            console.log('🔄 SyncManager: Firebase ya disponible');
            this.initPromise = this.init();
        } else {
            window.addEventListener('firebaseReady', handleFirebaseReady);
            
            // Timeout de seguridad más largo
            setTimeout(() => {
                if (!this.isInitialized) {
                    console.warn('⚠️ SyncManager: Firebase no se inicializó en tiempo esperado');
                    window.removeEventListener('firebaseReady', handleFirebaseReady);
                    
                    // Intentar inicializar de todos modos
                    if (window.auth && window.db) {
                        this.initPromise = this.init();
                    }
                }
            }, 15000); // Aumentado a 15 segundos
        }
    }
    
    async init() {
        if (this.isInitialized) {
            return;
        }
        
        try {
            console.log('🔄 Inicializando SyncManager...');
            
            // Verificar que Firebase esté realmente disponible
            if (!window.auth) {
                throw new Error('Firebase Auth no disponible');
            }
            
            // 👇 HACER FIRESTORE OPCIONAL PARA EL DASHBOARD
            if (!window.db && typeof firebase?.firestore === 'function') {
                console.log('🔄 Inicializando Firestore...');
                window.db = firebase.firestore();
            }
            
            if (!window.db) {
                console.warn('⚠️ Firestore no disponible - SyncManager funcionará en modo limitado');
                // No lanzar error, solo continuar sin Firestore
            }
            
            // Configurar listeners
            this.setupOnlineListener();
            this.setupAuthListener();
            
            this.isInitialized = true;
            console.log('✅ SyncManager inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando SyncManager:', error);
            
            // Retry después de 5 segundos
            setTimeout(() => {
                console.log('🔄 Reintentando inicialización de SyncManager...');
                this.init();
            }, 5000);
        }
    }
    
    setupOnlineListener() {
        window.addEventListener('online', () => {
            console.log('🌐 Conexión restaurada');
            this.isOnline = true;
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            console.log('📵 Conexión perdida');
            this.isOnline = false;
        });
    }
    
    setupAuthListener() {
        window.auth.onAuthStateChanged(user => {
            if (user && this.isOnline) {
                console.log('👤 Usuario autenticado, procesando queue');
                this.processSyncQueue();
            }
        });
    }
    
    async processSyncQueue() {
        if (!this.isOnline || !window.auth.currentUser || this.syncQueue.length === 0) {
            return;
        }
        
        // 👇 VERIFICAR QUE FIRESTORE ESTÉ DISPONIBLE
        if (!window.db) {
            console.warn('⚠️ No se puede procesar queue sin Firestore');
            return;
        }
        
        console.log(`🔄 Procesando ${this.syncQueue.length} elementos en queue`);
        
        const queue = [...this.syncQueue];
        this.syncQueue = [];
        
        for (const item of queue) {
            try {
                await this.processQueueItem(item);
            } catch (error) {
                console.error('❌ Error procesando item de queue:', error);
                this.syncQueue.push(item);
            }
        }
    }
    
    async processQueueItem(item) {
        const { collection, action, data, id } = item;
        
        switch (action) {
            case 'create':
            case 'update':
                await window.db.collection(collection).doc(id).set(data, { merge: true });
                break;
            case 'delete':
                await window.db.collection(collection).doc(id).delete();
                break;
        }
        
        console.log(`✅ Sincronizado: ${action} en ${collection}`);
    }
    
    // Métodos públicos
    async syncData(collection, action, data, id) {
        const syncItem = { collection, action, data, id, timestamp: Date.now() };
        
        // 👇 VERIFICAR FIRESTORE ANTES DE SINCRONIZAR
        if (!window.db) {
            console.warn('⚠️ Firestore no disponible - guardando en queue local');
            this.syncQueue.push(syncItem);
            return;
        }
        
        if (this.isOnline && window.auth.currentUser) {
            try {
                await this.processQueueItem(syncItem);
            } catch (error) {
                console.warn('⚠️ Error sincronizando inmediatamente, agregando a queue');
                this.syncQueue.push(syncItem);
            }
        } else {
            console.log('📤 Agregando a queue offline:', syncItem);
            this.syncQueue.push(syncItem);
        }
    }
}

// ===== INICIALIZACIÓN GLOBAL =====
if (!window.syncManager) {
    window.syncManager = new SyncManager();
}

console.log('✅ syncManager.js v2.1 cargado');