/**
 * EduCheck Pro - SyncManager Simplificado v2.2
 * Versión con inicialización inmediata mejorada
 */

class SyncManager {
    constructor() {
        this.user = null;
        this.syncInProgress = false;
        this.listeners = new Map();
        this.offlineQueue = [];
        this.dataChangeListeners = new Map();
        this.syncStatus = 'disconnected';
        this.initAttempts = 0;
        this.maxInitAttempts = 10;
        this.isReady = false;
        
        console.log('🔄 SyncManager v2.2 inicializando...');
        this.initWithRetry();
    }

    async initWithRetry() {
        this.initAttempts++;
        
        // Verificar dependencias críticas
        if (!window.firebase) {
            if (this.initAttempts < this.maxInitAttempts) {
                console.log(`⏳ SyncManager esperando Firebase... (${this.initAttempts}/${this.maxInitAttempts})`);
                setTimeout(() => this.initWithRetry(), 200); // Más rápido
                return;
            } else {
                console.error('❌ SyncManager: Firebase no disponible después de varios intentos');
                return;
            }
        }

        // Esperar a que auth y db estén disponibles
        if (!window.auth || !window.db) {
            if (this.initAttempts < this.maxInitAttempts) {
                console.log(`⏳ SyncManager esperando Auth/DB... (${this.initAttempts}/${this.maxInitAttempts})`);
                setTimeout(() => this.initWithRetry(), 200); // Más rápido
                return;
            } else {
                console.error('❌ SyncManager: Auth/DB no disponibles después de varios intentos');
                return;
            }
        }

        // Ahora sí inicializar
        this.init();
    }

    init() {
        console.log('✅ SyncManager: Todas las dependencias disponibles');
        this.isReady = true;
        
        // Escuchar cambios de autenticación
        window.auth.onAuthStateChanged((user) => {
            this.handleAuthChange(user);
        });

        // Configurar listeners de conexión
        this.setupConnectionListeners();
        
        console.log('✅ SyncManager inicializado y listo');
        
        // Notificar que está listo
        if (window.app && typeof window.app.onSyncManagerReady === 'function') {
            window.app.onSyncManagerReady();
        }
    }

    handleAuthChange(user) {
        this.user = user;
        
        if (user) {
            console.log(`👤 SyncManager: Usuario conectado - ${user.email}`);
            this.syncStatus = 'connected';
            this.startBasicSync();
        } else {
            console.log('🔓 SyncManager: Usuario desconectado');
            this.syncStatus = 'disconnected';
            this.stopSync();
        }
    }

    setupConnectionListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 SyncManager: Conexión restaurada');
            this.syncStatus = 'connected';
        });

        window.addEventListener('offline', () => {
            console.log('📱 SyncManager: Sin conexión');
            this.syncStatus = 'offline';
        });
    }

    async startBasicSync() {
        if (!this.user) return;
        
        try {
            console.log('🔄 Iniciando sincronización básica...');
            
            // Migrar datos existentes si existen
            await this.migrateLocalData();
            
            // Configurar listeners básicos
            this.setupBasicListeners();
            
            console.log('✅ Sincronización básica iniciada');
            
        } catch (error) {
            console.error('❌ Error en sincronización básica:', error);
        }
    }

    async migrateLocalData() {
        if (!this.user) return;
        
        console.log('📦 Verificando datos locales...');
        
        // Verificar y migrar instituciones
        const establishments = this.getUserDataDirect('establishments');
        if (establishments) {
            try {
                const data = JSON.parse(establishments);
                console.log(`📤 Encontradas ${data.length} instituciones locales`);
            } catch (error) {
                console.warn('⚠️ Error parseando instituciones:', error);
            }
        }
    }

    setupBasicListeners() {
        if (!this.user || !window.db) return;
        
        console.log('📡 Configurando listeners básicos...');
        
        try {
            // Solo listener para instituciones por ahora
            const userId = this.user.uid;
            const institutionsRef = window.db.collection('users').doc(userId).collection('institutions');
            
            const unsubscribe = institutionsRef.onSnapshot((snapshot) => {
                console.log('🏛️ Actualizando instituciones...');
                
                const institutions = [];
                snapshot.forEach((doc) => {
                    institutions.push({ id: doc.id, ...doc.data() });
                });
                
                // Actualizar localStorage
                this.setUserDataDirect('establishments', JSON.stringify(institutions));
                
            }, (error) => {
                console.error('❌ Error en listener de instituciones:', error);
            });

            this.listeners.set('institutions', unsubscribe);
            
        } catch (error) {
            console.error('❌ Error configurando listeners:', error);
        }
    }

    stopSync() {
        this.listeners.forEach((unsubscribe) => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners.clear();
        console.log('🛑 Sincronización detenida');
    }

    // Métodos de localStorage con usuario
    setUserDataDirect(key, value) {
        if (!this.user) return;
        const userKey = `${this.user.uid}_${key}`;
        localStorage.setItem(userKey, value);
    }

    getUserDataDirect(key) {
        if (!this.user) return null;
        const userKey = `${this.user.uid}_${key}`;
        return localStorage.getItem(userKey);
    }

    removeUserDataDirect(key) {
        if (!this.user) return;
        const userKey = `${this.user.uid}_${key}`;
        localStorage.removeItem(userKey);
    }

    // Métodos públicos para compatibilidad
    setUserData(key, value) {
        return this.setUserDataDirect(key, value);
    }

    getUserData(key) {
        return this.getUserDataDirect(key);
    }

    removeUserData(key) {
        return this.removeUserDataDirect(key);
    }

    // Método para crear institución por defecto
    async ensureDefaultInstitution() {
        if (!this.user) return null;
        
        let establishments = JSON.parse(this.getUserData('establishments') || '[]');
        
        if (establishments.length === 0) {
            const defaultInstitution = {
                id: 'default-institution-' + Date.now(),
                name: 'Mi Institución Educativa',
                type: 'escuela',
                address: '',
                phone: '',
                email: this.user.email || '',
                director: '',
                notes: 'Institución creada automáticamente',
                isDefault: true,
                createdAt: new Date().toISOString(),
                createdBy: this.user.uid
            };
            
            // Guardar localmente
            establishments.push(defaultInstitution);
            this.setUserData('establishments', JSON.stringify(establishments));
            
            // Intentar guardar en Firebase
            try {
                await this.saveInstitution(defaultInstitution);
                console.log('🏛️ Institución creada y sincronizada');
            } catch (error) {
                console.warn('⚠️ Institución creada localmente, sincronización pendiente');
            }
            
            return defaultInstitution;
        }
        
        return establishments.find(e => e.isDefault) || establishments[0];
    }

    async saveInstitution(institution) {
        if (!this.user || !window.db) return institution;
        
        try {
            const userId = this.user.uid;
            const docRef = window.db.collection('users').doc(userId).collection('institutions').doc(institution.id);
            
            await docRef.set({
                ...institution,
                lastModified: window.firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log(`✅ Institución guardada: ${institution.id}`);
            return institution;
            
        } catch (error) {
            console.error('❌ Error guardando institución:', error);
            throw error;
        }
    }

    // Métodos de estado
    getSyncStatus() {
        return {
            status: this.syncStatus,
            user: !!this.user,
            online: navigator.onLine,
            syncInProgress: this.syncInProgress,
            queueLength: this.offlineQueue.length,
            listenersActive: this.listeners.size,
            initAttempts: this.initAttempts,
            dependenciesReady: !!(window.firebase && window.auth && window.db),
            isReady: this.isReady
        };
    }

    async forcSync() {
        console.log('🔄 Forzando sincronización...');
        if (this.user && this.isReady) {
            await this.startBasicSync();
        }
    }

    // Listeners de cambios de datos
    onDataChange(collection, callback) {
        if (!this.dataChangeListeners.has(collection)) {
            this.dataChangeListeners.set(collection, []);
        }
        
        this.dataChangeListeners.get(collection).push(callback);
        
        return () => {
            const callbacks = this.dataChangeListeners.get(collection);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    onSyncChange(callback) {
        if (!this.syncChangeListeners) {
            this.syncChangeListeners = [];
        }
        this.syncChangeListeners.push(callback);
        
        return () => {
            const index = this.syncChangeListeners.indexOf(callback);
            if (index > -1) {
                this.syncChangeListeners.splice(index, 1);
            }
        };
    }

    // Diagnóstico mejorado
    getDiagnostic() {
        const status = this.getSyncStatus();
        
        console.log('🔍 SyncManager - Diagnóstico:');
        console.log('📊 Estado:', status.status);
        console.log('👤 Usuario:', status.user);
        console.log('🌐 Online:', status.online);
        console.log('👂 Listeners:', status.listenersActive);
        console.log('🔄 Intentos init:', status.initAttempts);
        console.log('✅ Dependencias:', status.dependenciesReady);
        console.log('🚀 Ready:', status.isReady);
        
        return status;
    }

    // Método para verificar si está listo
    isManagerReady() {
        return this.isReady;
    }
}

// Crear instancia global INMEDIATAMENTE
console.log('🔄 Creando SyncManager global...');

// Instanciar directamente sin delay
window.syncManager = new SyncManager();

// Funciones globales para compatibilidad INMEDIATAS
window.setUserData = (key, value) => {
    if (window.syncManager && window.syncManager.isManagerReady()) {
        return window.syncManager.setUserData(key, value);
    }
    console.warn('⚠️ SyncManager no está listo, usando localStorage directo');
    const user = window.auth?.currentUser;
    if (user) {
        localStorage.setItem(`${user.uid}_${key}`, value);
    }
};

window.getUserData = (key) => {
    if (window.syncManager && window.syncManager.isManagerReady()) {
        return window.syncManager.getUserData(key);
    }
    console.warn('⚠️ SyncManager no está listo, usando localStorage directo');
    const user = window.auth?.currentUser;
    if (user) {
        return localStorage.getItem(`${user.uid}_${key}`);
    }
    return null;
};

window.removeUserData = (key) => {
    if (window.syncManager && window.syncManager.isManagerReady()) {
        return window.syncManager.removeUserData(key);
    }
    console.warn('⚠️ SyncManager no está listo, usando localStorage directo');
    const user = window.auth?.currentUser;
    if (user) {
        localStorage.removeItem(`${user.uid}_${key}`);
    }
};

console.log('✅ SyncManager v2.2 cargado con funciones globales');