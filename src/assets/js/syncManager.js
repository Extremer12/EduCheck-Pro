/**
 * EduCheck Pro - Gestor de Sincronización Mejorado v2.0
 * Sync automático bidireccional con detección de conflictos
 * Compatible con Firebase, manejo robusto de errores
 */

class SyncManager {
    constructor() {
        this.db = null;
        this.currentUser = null;
        this.isOnline = navigator.onLine;
        this.pendingOperations = [];
        this.lastSyncTime = {};
        this.syncInProgress = false;
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // No inicializar inmediatamente, esperar a que Firebase esté listo
        this.waitForFirebase();
    }

    async waitForFirebase() {
        // Esperar a que Firebase esté disponible
        const checkFirebase = () => {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                this.init();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }

    async init() {
        if (this.initialized) return;
        
        console.log('🔄 Inicializando SyncManager mejorado v2.0...');
        
        try {
            // Configurar Firebase con verificación
            if (!firebase.firestore) {
                throw new Error('Firebase Firestore no está disponible');
            }
            
            this.db = firebase.firestore();
            
            // Configurar listeners
            this.setupConnectionListeners();
            this.setupAuthListener();
            this.setupPeriodicSync();
            
            this.initialized = true;
            console.log('✅ SyncManager inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando SyncManager:', error);
            
            // Reintentar después de 2 segundos
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`🔄 Reintentando inicialización (${this.retryCount}/${this.maxRetries})...`);
                setTimeout(() => this.init(), 2000);
            }
        }
    }

    setupAuthListener() {
        if (!firebase.auth) {
            console.error('❌ Firebase Auth no está disponible');
            return;
        }

        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                console.log(`👤 Usuario autenticado: ${user.email}`);
                this.currentUser = user;
                
                // Cargar operaciones pendientes del localStorage
                await this.loadPendingOperations();
                
                // Cargar datos desde Firestore al login
                await this.loadAllDataFromFirestore();
                
                // Sincronizar datos locales pendientes
                await this.syncPendingOperations();
                
            } else {
                console.log('👋 Usuario desconectado');
                
                // Limpiar datos si había usuario anterior
                if (this.currentUser) {
                    this.clearLocalData();
                }
                
                this.currentUser = null;
                this.pendingOperations = [];
            }
        });
    }

    setupConnectionListeners() {
        window.addEventListener('online', async () => {
            console.log('🌐 Conexión restaurada');
            this.isOnline = true;
            
            if (this.currentUser) {
                await this.syncPendingOperations();
                this.showNotification('Conexión restaurada. Sincronizando datos...', 'info');
            }
        });

        window.addEventListener('offline', () => {
            console.log('📴 Conexión perdida');
            this.isOnline = false;
            this.showNotification('Sin conexión. Los datos se guardarán localmente.', 'warning');
        });
    }

    setupPeriodicSync() {
        // Sincronizar cada 3 minutos si hay conexión
        setInterval(async () => {
            if (this.isOnline && this.currentUser && !this.syncInProgress) {
                console.log('⏰ Sincronización periódica');
                await this.syncAllData();
            }
        }, 3 * 60 * 1000); // 3 minutos
    }

    // ===== MÉTODOS PRINCIPALES DE SINCRONIZACIÓN =====

    async saveData(collection, data, operation = 'create') {
        if (!this.currentUser) {
            console.error('❌ No hay usuario autenticado');
            return false;
        }

        // Generar ID único si no existe
        if (!data.id) {
            data.id = this.generateUniqueId(collection);
        }

        const timestamp = Date.now();
        const dataWithMeta = {
            ...data,
            createdBy: this.currentUser.uid,
            lastModified: timestamp,
            operation: operation,
            syncStatus: this.isOnline ? 'synced' : 'pending'
        };

        try {
            // 1. Guardar siempre en localStorage primero
            this.saveToLocalStorage(collection, dataWithMeta);
            
            // 2. Si hay conexión, sincronizar inmediatamente
            if (this.isOnline) {
                const syncResult = await this.saveToFirestore(collection, dataWithMeta);
                if (syncResult) {
                    dataWithMeta.syncStatus = 'synced';
                    this.saveToLocalStorage(collection, dataWithMeta);
                    console.log(`✅ ${collection} sincronizado exitosamente`);
                    return true;
                } else {
                    // Fallo al sincronizar, marcar como pendiente
                    this.addPendingOperation(collection, dataWithMeta, operation);
                    dataWithMeta.syncStatus = 'pending';
                    this.saveToLocalStorage(collection, dataWithMeta);
                }
            } else {
                // 3. Sin conexión, agregar a operaciones pendientes
                this.addPendingOperation(collection, dataWithMeta, operation);
                console.log(`📴 ${collection} guardado localmente (pendiente sync)`);
            }
            
            return true;
            
        } catch (error) {
            console.error(`❌ Error guardando ${collection}:`, error);
            
            // Si falla todo, al menos está en localStorage
            this.addPendingOperation(collection, dataWithMeta, operation);
            dataWithMeta.syncStatus = 'error';
            this.saveToLocalStorage(collection, dataWithMeta);
            return false;
        }
    }

    async loadData(collection) {
        if (!this.currentUser) return [];

        try {
            // 1. Cargar datos locales siempre
            const localData = this.loadFromLocalStorage(collection);
            
            // 2. Si hay conexión, verificar actualizaciones en Firestore
            if (this.isOnline) {
                try {
                    const firestoreData = await this.loadFromFirestore(collection);
                    
                    // 3. Merge y resolver conflictos
                    const mergedData = this.mergeData(localData, firestoreData, collection);
                    
                    // 4. Guardar resultado final en localStorage
                    this.saveToLocalStorage(collection, mergedData);
                    
                    return mergedData;
                } catch (firestoreError) {
                    console.warn(`⚠️ Error conectando a Firestore para ${collection}, usando datos locales:`, firestoreError);
                    return localData;
                }
            }
            
            // Sin conexión o error en Firestore, usar datos locales
            return localData;
            
        } catch (error) {
            console.error(`❌ Error cargando ${collection}:`, error);
            // Fallback a array vacío si todo falla
            return [];
        }
    }

    // ===== MÉTODOS DE FIRESTORE =====

    async saveToFirestore(collection, data) {
        if (!this.currentUser || !this.isOnline || !this.db) return false;

        try {
            const userRef = this.db.collection('users').doc(this.currentUser.uid);
            const collectionRef = userRef.collection(collection);

            // Limpiar metadata antes de guardar en Firestore
            const cleanData = { ...data };
            delete cleanData.syncStatus;
            delete cleanData.operation;

            if (data.operation === 'delete') {
                if (data.id) {
                    await collectionRef.doc(data.id).delete();
                    console.log(`🗑️ ${collection}/${data.id} eliminado de Firestore`);
                }
            } else if (data.id && data.operation === 'update') {
                await collectionRef.doc(data.id).set({
                    ...cleanData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                console.log(`📝 ${collection}/${data.id} actualizado en Firestore`);
            } else {
                // Create - usar ID generado localmente
                await collectionRef.doc(data.id).set({
                    ...cleanData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log(`➕ ${collection}/${data.id} creado en Firestore`);
            }

            this.lastSyncTime[collection] = Date.now();
            return true;
            
        } catch (error) {
            console.error(`❌ Error guardando en Firestore ${collection}:`, error);
            return false;
        }
    }

    async loadFromFirestore(collection) {
        if (!this.currentUser || !this.isOnline || !this.db) return [];

        try {
            const userRef = this.db.collection('users').doc(this.currentUser.uid);
            const snapshot = await userRef.collection(collection)
                .orderBy('createdAt', 'desc')
                .get();
            
            const data = [];
            snapshot.forEach(doc => {
                const docData = doc.data();
                data.push({
                    id: doc.id,
                    ...docData,
                    syncStatus: 'synced' // Datos de Firestore están sincronizados
                });
            });

            console.log(`📥 ${collection}: ${data.length} registros desde Firestore`);
            return data;
            
        } catch (error) {
            console.error(`❌ Error cargando desde Firestore ${collection}:`, error);
            throw error; // Re-throw para manejo en loadData
        }
    }

    // ===== MÉTODOS DE LOCALSTORAGE =====

    saveToLocalStorage(collection, data) {
        if (!this.currentUser) return false;

        try {
            const key = `${this.currentUser.uid}_${collection}`;
            
            if (Array.isArray(data)) {
                localStorage.setItem(key, JSON.stringify(data));
                console.log(`💾 ${collection}: ${data.length} registros guardados localmente`);
            } else {
                // Es un item individual, agregar/actualizar en el array existente
                const existingData = JSON.parse(localStorage.getItem(key) || '[]');
                const index = existingData.findIndex(item => item.id === data.id);
                
                if (data.operation === 'delete') {
                    if (index !== -1) {
                        existingData.splice(index, 1);
                        console.log(`🗑️ ${collection}/${data.id} eliminado localmente`);
                    }
                } else if (index !== -1) {
                    existingData[index] = data;
                    console.log(`📝 ${collection}/${data.id} actualizado localmente`);
                } else {
                    existingData.push(data);
                    console.log(`➕ ${collection}/${data.id} creado localmente`);
                }
                
                localStorage.setItem(key, JSON.stringify(existingData));
            }
            
            return true;
        } catch (error) {
            console.error(`❌ Error guardando en localStorage ${collection}:`, error);
            return false;
        }
    }

    loadFromLocalStorage(collection) {
        if (!this.currentUser) return [];

        try {
            const key = `${this.currentUser.uid}_${collection}`;
            const data = localStorage.getItem(key);
            const parsedData = data ? JSON.parse(data) : [];
            
            console.log(`📂 ${collection}: ${parsedData.length} registros cargados localmente`);
            return parsedData;
        } catch (error) {
            console.error(`❌ Error cargando desde localStorage ${collection}:`, error);
            return [];
        }
    }

    // ===== MANEJO DE OPERACIONES PENDIENTES =====

    addPendingOperation(collection, data, operation) {
        // Evitar duplicados
        const existingIndex = this.pendingOperations.findIndex(
            op => op.collection === collection && op.data.id === data.id
        );

        const pendingOp = {
            collection,
            data: { ...data },
            operation,
            timestamp: Date.now(),
            retries: 0
        };

        if (existingIndex !== -1) {
            // Actualizar operación existente
            this.pendingOperations[existingIndex] = pendingOp;
        } else {
            // Agregar nueva operación
            this.pendingOperations.push(pendingOp);
        }

        this.savePendingOperations();
        console.log(`📝 Operación pendiente agregada: ${collection}/${data.id}`);
    }

    async loadPendingOperations() {
        if (!this.currentUser) return;

        try {
            const key = `${this.currentUser.uid}_pendingOperations`;
            const data = localStorage.getItem(key);
            this.pendingOperations = data ? JSON.parse(data) : [];
            
            console.log(`📋 ${this.pendingOperations.length} operaciones pendientes cargadas`);
        } catch (error) {
            console.error('❌ Error cargando operaciones pendientes:', error);
            this.pendingOperations = [];
        }
    }

    savePendingOperations() {
        if (!this.currentUser) return;

        try {
            const key = `${this.currentUser.uid}_pendingOperations`;
            localStorage.setItem(key, JSON.stringify(this.pendingOperations));
        } catch (error) {
            console.error('❌ Error guardando operaciones pendientes:', error);
        }
    }

    async syncPendingOperations() {
        if (!this.isOnline || !this.currentUser || this.pendingOperations.length === 0) {
            return;
        }

        console.log(`🔄 Sincronizando ${this.pendingOperations.length} operaciones pendientes...`);

        const successfulOperations = [];
        const failedOperations = [];
        
        for (const operation of this.pendingOperations) {
            try {
                const success = await this.saveToFirestore(operation.collection, operation.data);
                
                if (success) {
                    successfulOperations.push(operation);
                    
                    // Actualizar estado de sincronización en localStorage
                    operation.data.syncStatus = 'synced';
                    this.saveToLocalStorage(operation.collection, operation.data);
                    
                    console.log(`✅ Operación sincronizada: ${operation.collection}/${operation.data.id}`);
                } else {
                    operation.retries = (operation.retries || 0) + 1;
                    if (operation.retries < 3) {
                        failedOperations.push(operation);
                    }
                    console.warn(`⚠️ Error sincronizando ${operation.collection}/${operation.data.id} (intento ${operation.retries})`);
                }
            } catch (error) {
                console.error(`❌ Error sincronizando operación:`, error);
                operation.retries = (operation.retries || 0) + 1;
                if (operation.retries < 3) {
                    failedOperations.push(operation);
                }
            }
        }

        // Actualizar lista de operaciones pendientes
        this.pendingOperations = failedOperations;
        this.savePendingOperations();

        if (successfulOperations.length > 0) {
            this.showNotification(
                `${successfulOperations.length} operaciones sincronizadas exitosamente`, 
                'success'
            );
        }

        if (failedOperations.length > 0) {
            console.warn(`⚠️ ${failedOperations.length} operaciones pendientes requieren reintento`);
        }
    }

    // ===== MERGE DE DATOS Y RESOLUCIÓN DE CONFLICTOS =====

    mergeData(localData, firestoreData, collection) {
        const merged = new Map();
        const conflicts = [];

        // Agregar todos los datos de Firestore primero
        firestoreData.forEach(item => {
            merged.set(item.id, { ...item, source: 'firestore' });
        });

        // Procesar datos locales
        localData.forEach(localItem => {
            const firestoreItem = merged.get(localItem.id);
            
            if (!firestoreItem) {
                // Item solo existe localmente
                if (localItem.syncStatus === 'pending' || localItem.syncStatus === 'error') {
                    // Agregar a operaciones pendientes si no está sincronizado
                    this.addPendingOperation(collection, localItem, localItem.operation || 'create');
                }
                merged.set(localItem.id, { ...localItem, source: 'local' });
                
            } else {
                // Item existe en ambos lados, resolver conflicto
                const localTime = localItem.lastModified || 0;
                const firestoreTime = firestoreItem.lastModified || 0;
                
                if (localTime > firestoreTime) {
                    // Dato local es más reciente
                    conflicts.push({
                        id: localItem.id,
                        local: localItem,
                        firestore: firestoreItem,
                        resolution: 'local_wins'
                    });
                    
                    merged.set(localItem.id, { ...localItem, source: 'local' });
                    
                    // Sincronizar el dato local más reciente
                    if (localItem.syncStatus !== 'synced') {
                        this.addPendingOperation(collection, localItem, 'update');
                    }
                } else {
                    // Dato de Firestore es más reciente o igual
                    merged.set(localItem.id, { ...firestoreItem, source: 'firestore' });
                }
            }
        });

        if (conflicts.length > 0) {
            console.log(`🔄 ${conflicts.length} conflictos resueltos en ${collection}`);
        }

        const result = Array.from(merged.values());
        console.log(`🔀 Merge completado para ${collection}: ${result.length} registros`);
        
        return result;
    }

    // ===== UTILIDADES =====

    generateUniqueId(collection) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        const prefix = collection.substr(0, 3);
        return `${prefix}_${timestamp}_${random}`;
    }

    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
        }
    }

    // ===== SINCRONIZACIÓN COMPLETA =====

    async syncAllData() {
        if (!this.currentUser || !this.isOnline || this.syncInProgress) return;

        this.syncInProgress = true;
        console.log('🔄 Iniciando sincronización completa...');

        try {
            const collections = ['institutions', 'courses', 'students', 'activities', 'gallery'];
            
            for (const collection of collections) {
                await this.loadData(collection);
                console.log(`✅ ${collection} sincronizado`);
            }

            await this.syncPendingOperations();
            
            console.log('✅ Sincronización completa exitosa');
            
        } catch (error) {
            console.error('❌ Error en sincronización completa:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    async loadAllDataFromFirestore() {
        if (!this.isOnline) {
            console.log('📴 Sin conexión, omitiendo carga desde Firestore');
            return;
        }

        const collections = ['institutions', 'courses', 'students', 'activities', 'gallery'];
        
        console.log('📥 Cargando todos los datos desde Firestore...');
        
        for (const collection of collections) {
            try {
                await this.loadData(collection);
            } catch (error) {
                console.warn(`⚠️ Error cargando ${collection}, continuando...`);
            }
        }
        
        console.log('✅ Carga inicial completada');
    }

    // ===== MÉTODOS PÚBLICOS PARA MÓDULOS =====

    async saveInstitution(institution) {
        return await this.saveData('institutions', institution, institution.id ? 'update' : 'create');
    }

    async loadInstitutions() {
        return await this.loadData('institutions');
    }

    async deleteInstitution(institutionId) {
        return await this.saveData('institutions', { id: institutionId }, 'delete');
    }

    async saveCourse(course) {
        return await this.saveData('courses', course, course.id ? 'update' : 'create');
    }

    async loadCourses() {
        return await this.loadData('courses');
    }

    async deleteCourse(courseId) {
        return await this.saveData('courses', { id: courseId }, 'delete');
    }

    async saveStudent(student) {
        return await this.saveData('students', student, student.id ? 'update' : 'create');
    }

    async loadStudents() {
        return await this.loadData('students');
    }

    async deleteStudent(studentId) {
        return await this.saveData('students', { id: studentId }, 'delete');
    }

    async saveActivity(activity) {
        return await this.saveData('activities', activity, activity.id ? 'update' : 'create');
    }

    async loadActivities() {
        return await this.loadData('activities');
    }

    async deleteActivity(activityId) {
        return await this.saveData('activities', { id: activityId }, 'delete');
    }

    // Método para obtener estadísticas de sincronización
    getSyncStats() {
        return {
            isOnline: this.isOnline,
            pendingOperations: this.pendingOperations.length,
            lastSyncTime: this.lastSyncTime,
            syncInProgress: this.syncInProgress,
            currentUser: this.currentUser?.email || null
        };
    }

    // Método para limpiar datos locales (logout)
    clearLocalData() {
        if (!this.currentUser) return;

        const keys = [
            'institutions', 'courses', 'students', 'activities', 
            'gallery', 'pendingOperations', 'profile'
        ];

        keys.forEach(key => {
            localStorage.removeItem(`${this.currentUser.uid}_${key}`);
        });

        this.pendingOperations = [];
        this.lastSyncTime = {};
        
        console.log('🧹 Datos locales limpiados');
    }

    // Método para forzar sincronización manual
    async forcSync() {
        if (!this.currentUser) {
            this.showNotification('No hay usuario autenticado', 'error');
            return;
        }

        if (!this.isOnline) {
            this.showNotification('Sin conexión a internet', 'warning');
            return;
        }

        this.showNotification('Iniciando sincronización manual...', 'info');
        await this.syncAllData();
    }
}

// Crear instancia global solo cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.syncManager = new SyncManager();
    });
} else {
    window.syncManager = new SyncManager();
}

console.log('✅ SyncManager v2.0 cargado');