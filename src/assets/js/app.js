/**
 * EduCheck Pro - App Principal v2.1 (Versión Corregida)
 * Todas las funcionalidades de index.html funcionando
 */

// Variables globales
let currentUser = null;
let appInitialized = false;

// Funciones auxiliares con fallback
function setUserData(key, value) {
    if (window.syncManager && window.syncManager.isManagerReady()) {
        return window.syncManager.setUserData(key, value);
    }
    
    // Fallback directo
    const user = window.auth?.currentUser;
    if (user) {
        localStorage.setItem(`${user.uid}_${key}`, value);
    }
}

function getUserData(key) {
    if (window.syncManager && window.syncManager.isManagerReady()) {
        return window.syncManager.getUserData(key);
    }
    
    // Fallback directo
    const user = window.auth?.currentUser;
    if (user) {
        return localStorage.getItem(`${user.uid}_${key}`);
    }
    return null;
}

function removeUserData(key) {
    if (window.syncManager && window.syncManager.isManagerReady()) {
        return window.syncManager.removeUserData(key);
    }
    
    // Fallback directo
    const user = window.auth?.currentUser;
    if (user) {
        localStorage.removeItem(`${user.uid}_${key}`);
    }
}

// Función mejorada para crear institución por defecto
async function ensureDefaultInstitution() {
    if (window.syncManager && window.syncManager.isManagerReady()) {
        return await window.syncManager.ensureDefaultInstitution();
    }
    
    // Fallback completo
    const user = window.auth?.currentUser;
    if (!user) return null;
    
    let establishments = JSON.parse(getUserData('establishments') || '[]');
    
    if (establishments.length === 0) {
        const defaultInstitution = {
            id: 'default-institution-' + Date.now(),
            name: 'Mi Institución Educativa',
            type: 'escuela',
            address: '',
            phone: '',
            email: user.email || '',
            director: '',
            notes: 'Institución creada automáticamente',
            isDefault: true,
            createdAt: new Date().toISOString(),
            createdBy: user.uid
        };
        
        establishments.push(defaultInstitution);
        setUserData('establishments', JSON.stringify(establishments));
        
        console.log('🏛️ Institución por defecto creada (fallback)');
        return defaultInstitution;
    }
    
    return establishments.find(e => e.isDefault) || establishments[0];
}

// Inicialización de la aplicación con verificaciones
async function initializeApp() {
    if (appInitialized) return;
    
    try {
        console.log('🚀 Inicializando EduCheck Pro v2.1...');
        
        // Verificar dependencias mínimas
        if (!window.firebase || !window.auth) {
            throw new Error('Firebase no está disponible');
        }
        
        // SyncManager es opcional pero recomendado
        if (!window.syncManager || !window.syncManager.isManagerReady()) {
            console.warn('⚠️ SyncManager no disponible, usando fallback');
        }
        
        // Configurar listeners de autenticación
        window.auth.onAuthStateChanged(async (user) => {
            await handleAuthStateChange(user);
        });
        
        // Configurar listeners de sincronización solo si está disponible
        if (window.syncManager && typeof window.syncManager.onSyncChange === 'function') {
            window.syncManager.onSyncChange((status, error) => {
                handleSyncStatusChange(status, error);
            });
        }
        
        // Configurar event listeners
        setupEventListeners();
        
        // Configurar modo oscuro
        initializeDarkMode();
        
        appInitialized = true;
        console.log('✅ EduCheck Pro inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando aplicación:', error);
        showNotification('Error inicializando la aplicación: ' + error.message, 'error');
        
        // Intentar inicialización básica
        try {
            setupEventListeners();
            initializeDarkMode();
            console.log('⚠️ Inicialización básica completada');
        } catch (fallbackError) {
            console.error('❌ Error en inicialización básica:', fallbackError);
        }
    }
}

async function handleAuthStateChange(user) {
    currentUser = user;
    
    if (user) {
        console.log(`👤 Usuario autenticado: ${user.email}`);
        updateUserInterface(user);
        
        // Configurar listeners de datos solo si SyncManager está disponible
        if (window.syncManager && typeof window.syncManager.onDataChange === 'function') {
            setupDataListeners();
        }
        
        showNotification(`¡Bienvenido, ${user.displayName || user.email}!`, 'success');
        
    } else {
        console.log('🔓 Usuario no autenticado');
        updateUserInterface(null);
    }
}

function handleSyncStatusChange(status, error) {
    const statusIndicator = document.getElementById('sync-status');
    
    if (statusIndicator) {
        switch (status) {
            case 'connected':
                statusIndicator.className = 'sync-status connected';
                statusIndicator.innerHTML = '<i class="fas fa-wifi"></i> Sincronizado';
                break;
            case 'syncing':
                statusIndicator.className = 'sync-status syncing';
                statusIndicator.innerHTML = '<i class="fas fa-sync fa-spin"></i> Sincronizando...';
                break;
            case 'offline':
                statusIndicator.className = 'sync-status offline';
                statusIndicator.innerHTML = '<i class="fas fa-wifi-slash"></i> Sin conexión';
                break;
            case 'error':
                statusIndicator.className = 'sync-status error';
                statusIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
                break;
        }
    }
    
    if (error) {
        console.error('❌ Error de sincronización:', error);
    }
}

function setupDataListeners() {
    if (!window.syncManager || typeof window.syncManager.onDataChange !== 'function') {
        console.warn('⚠️ SyncManager onDataChange no disponible');
        return;
    }
    
    // Listener para instituciones
    window.syncManager.onDataChange('establishments', (institutions) => {
        console.log('🏛️ Instituciones actualizadas:', institutions.length);
        updateInstitutionsUI(institutions);
    });
}

function updateInstitutionsUI(institutions) {
    const institutionSelect = document.getElementById('institution-select');
    if (institutionSelect) {
        institutionSelect.innerHTML = '<option value="">Seleccionar institución...</option>';
        institutions.forEach(institution => {
            const option = document.createElement('option');
            option.value = institution.id;
            option.textContent = institution.name;
            if (institution.isDefault) option.selected = true;
            institutionSelect.appendChild(option);
        });
    }
}

function setupEventListeners() {
    console.log('🎛️ Configurando event listeners...');
    
    // Configurar menú fullscreen PRIMERO
    setupMenuToggle();
    setupMenuItems();
    
    // Configurar dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleDarkMode);
        console.log('✅ Dark mode toggle configurado');
    }

    // Configurar formulario de actividades
    const activityForm = document.querySelector('.activity-form');
    if (activityForm) {
        activityForm.addEventListener('submit', handleActivitySubmit);
        console.log('✅ Formulario de actividades configurado');
    } else {
        console.warn('⚠️ No se encontró formulario de actividades');
    }

    // Configurar upload de imagen
    setupImageUpload();

    // Configurar botones de actividades
    setupActivityButtons();

    console.log('✅ Event listeners configurados');
}

// Función para configurar upload de imagen
function setupImageUpload() {
    const imageInput = document.getElementById('activityImage');
    const imagePreview = document.getElementById('imagePreview');
    const uploadPlaceholder = document.querySelector('.upload-placeholder');
    const removeImageBtn = document.querySelector('.remove-image');
    const imagePreviewContainer = document.querySelector('.image-preview');

    if (imageInput && imagePreview && uploadPlaceholder) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreviewContainer.style.display = 'block';
                    uploadPlaceholder.style.display = 'none';
                    console.log('✅ Imagen cargada para preview');
                };
                reader.readAsDataURL(file);
            }
        });

        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', function() {
                imageInput.value = '';
                imagePreview.src = '#';
                imagePreviewContainer.style.display = 'none';
                uploadPlaceholder.style.display = 'flex';
                console.log('🗑️ Imagen removida');
            });
        }

        console.log('✅ Upload de imagen configurado');
    } else {
        console.warn('⚠️ Elementos de upload de imagen no encontrados');
    }
}

// Función para configurar botones de actividades
function setupActivityButtons() {
    // Configurar fecha por defecto
    const activityDate = document.getElementById('activityDate');
    if (activityDate) {
        const today = new Date().toISOString().split('T')[0];
        activityDate.value = today;
    }

    // Configurar filtros de actividades
    const searchInput = document.getElementById('activity-search');
    const dateFilter = document.getElementById('activity-date-filter');

    if (searchInput) {
        searchInput.addEventListener('input', filterActivities);
    }

    if (dateFilter) {
        dateFilter.addEventListener('change', filterActivities);
    }

    // Cargar actividades existentes
    loadAndDisplayActivities();
    
    console.log('✅ Botones de actividades configurados');
}

// Función mejorada para manejar envío de actividades
async function handleActivitySubmit(e) {
    e.preventDefault();
    
    console.log('📝 Procesando envío de actividad...');
    
    const formData = new FormData(e.target);
    const activityName = formData.get('activityName') || document.getElementById('activityName')?.value;
    const activityDate = formData.get('activityDate') || document.getElementById('activityDate')?.value;
    const activityImage = document.getElementById('activityImage')?.files[0];
    
    console.log('📋 Datos del formulario:', {
        name: activityName,
        date: activityDate,
        hasImage: !!activityImage
    });
    
    if (!activityName || !activityDate) {
        showNotification('Por favor completa todos los campos requeridos', 'error');
        return;
    }
    
    try {
        // Procesar imagen si existe
        let imageData = null;
        if (activityImage) {
            imageData = await convertImageToBase64(activityImage);
            console.log('📸 Imagen procesada para almacenamiento');
        }
        
        const activityData = {
            id: 'activity-' + Date.now(),
            name: activityName,
            date: activityDate,
            image: imageData,
            type: 'general',
            description: '',
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.uid || 'anonymous',
            icon: 'fas fa-book-open'
        };
        
        console.log('💾 Guardando actividad:', activityData.id);
        
        // Intentar guardar con SyncManager
        if (window.syncManager && window.syncManager.isManagerReady()) {
            const activities = JSON.parse(window.syncManager.getUserData('recent_activities') || '[]');
            activities.unshift(activityData);
            window.syncManager.setUserData('recent_activities', JSON.stringify(activities.slice(0, 50)));
            console.log('💾 Actividad guardada con SyncManager');
        } else {
            // Fallback a localStorage directo
            const activities = JSON.parse(getUserData('recent_activities') || '[]');
            activities.unshift(activityData);
            setUserData('recent_activities', JSON.stringify(activities.slice(0, 50)));
            console.log('💾 Actividad guardada con fallback');
        }
        
        showNotification('Actividad registrada exitosamente', 'success');
        
        // Limpiar formulario
        e.target.reset();
        
        // Resetear imagen
        const imagePreview = document.querySelector('.image-preview');
        const uploadPlaceholder = document.querySelector('.upload-placeholder');
        if (imagePreview && uploadPlaceholder) {
            imagePreview.style.display = 'none';
            uploadPlaceholder.style.display = 'flex';
        }
        
        // Recargar lista de actividades
        loadAndDisplayActivities();
        
        console.log('✅ Actividad procesada completamente');
        
    } catch (error) {
        console.error('❌ Error guardando actividad:', error);
        showNotification('Error guardando actividad: ' + error.message, 'error');
    }
}

// Función para convertir imagen a base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Función para cargar y mostrar actividades
function loadAndDisplayActivities() {
    console.log('📋 Cargando actividades...');
    
    let activities = [];
    
    try {
        // Intentar cargar con SyncManager primero
        if (window.syncManager && window.syncManager.isManagerReady()) {
            activities = JSON.parse(window.syncManager.getUserData('recent_activities') || '[]');
        } else {
            // Fallback a localStorage directo
            activities = JSON.parse(getUserData('recent_activities') || '[]');
        }
        
        console.log(`📋 Encontradas ${activities.length} actividades`);
        
        const activitiesGrid = document.getElementById('activities-grid');
        if (!activitiesGrid) {
            console.warn('⚠️ No se encontró contenedor de actividades');
            return;
        }
        
        if (activities.length === 0) {
            activitiesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No hay actividades registradas</h3>
                    <p>Comienza registrando tu primera actividad arriba</p>
                </div>
            `;
            return;
        }
        
        // Generar HTML de actividades
        const activitiesHTML = activities.map(activity => `
            <div class="activity-card" data-activity-id="${activity.id}">
                <div class="activity-header">
                    <div class="activity-icon">
                        <i class="${activity.icon || 'fas fa-book-open'}"></i>
                    </div>
                    <div class="activity-info">
                        <h4>${activity.name}</h4>
                        <p class="activity-date">
                            <i class="fas fa-calendar"></i>
                            ${formatDate(activity.date)}
                        </p>
                        <p class="activity-created">
                            <i class="fas fa-clock"></i>
                            Creada: ${formatDateTime(activity.createdAt)}
                        </p>
                    </div>
                    <div class="activity-actions">
                        <button class="action-btn take-attendance" onclick="openAttendanceModal('${activity.id}')">
                            <i class="fas fa-clipboard-check"></i>
                            Tomar Asistencia
                        </button>
                        <button class="action-btn delete-activity" onclick="deleteActivity('${activity.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${activity.image ? `
                <div class="activity-image">
                    <img src="${activity.image}" alt="${activity.name}" onclick="viewImage('${activity.image}')">
                </div>
                ` : ''}
            </div>
        `).join('');
        
        activitiesGrid.innerHTML = activitiesHTML;
        console.log('✅ Actividades mostradas en la UI');
        
    } catch (error) {
        console.error('❌ Error cargando actividades:', error);
        const activitiesGrid = document.getElementById('activities-grid');
        if (activitiesGrid) {
            activitiesGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error cargando actividades</h3>
                    <p>Recarga la página para intentar nuevamente</p>
                </div>
            `;
        }
    }
}

// Función para filtrar actividades
function filterActivities() {
    const searchTerm = document.getElementById('activity-search')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('activity-date-filter')?.value || '';
    
    const activityCards = document.querySelectorAll('.activity-card');
    
    activityCards.forEach(card => {
        const activityName = card.querySelector('h4')?.textContent.toLowerCase() || '';
        const activityDate = card.querySelector('.activity-date')?.textContent || '';
        
        const matchesSearch = !searchTerm || activityName.includes(searchTerm);
        const matchesDate = !dateFilter || activityDate.includes(dateFilter);
        
        card.style.display = matchesSearch && matchesDate ? 'block' : 'none';
    });
    
    console.log('🔍 Filtros aplicados:', { searchTerm, dateFilter });
}

// Función para eliminar actividad
function deleteActivity(activityId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
        return;
    }
    
    try {
        let activities = [];
        
        // Cargar actividades actuales
        if (window.syncManager && window.syncManager.isManagerReady()) {
            activities = JSON.parse(window.syncManager.getUserData('recent_activities') || '[]');
        } else {
            activities = JSON.parse(getUserData('recent_activities') || '[]');
        }
        
        // Filtrar actividad a eliminar
        activities = activities.filter(activity => activity.id !== activityId);
        
        // Guardar actividades actualizadas
        if (window.syncManager && window.syncManager.isManagerReady()) {
            window.syncManager.setUserData('recent_activities', JSON.stringify(activities));
        } else {
            setUserData('recent_activities', JSON.stringify(activities));
        }
        
        showNotification('Actividad eliminada exitosamente', 'success');
        loadAndDisplayActivities();
        
        console.log('🗑️ Actividad eliminada:', activityId);
        
    } catch (error) {
        console.error('❌ Error eliminando actividad:', error);
        showNotification('Error eliminando actividad: ' + error.message, 'error');
    }
}

// Función para abrir modal de asistencia
function openAttendanceModal(activityId) {
    console.log('📋 Abriendo modal de asistencia para:', activityId);
    showNotification('Función de asistencia en desarrollo', 'info');
}

// Función para ver imagen en grande
function viewImage(imageSrc) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 8px;
        box-shadow: 0 0 30px rgba(0,0,0,0.5);
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

// Funciones de formato de fecha
function formatDate(dateString) {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function handleLogout() {
    try {
        showNotification('Cerrando sesión...', 'info');
        
        await window.auth.signOut();
        
        showNotification('Sesión cerrada exitosamente', 'success');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error cerrando sesión:', error);
        showNotification('Error cerrando sesión: ' + error.message, 'error');
    }
}

function updateUserInterface(user) {
    const userEmail = document.getElementById('user-email');
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    
    if (user) {
        if (userEmail) userEmail.textContent = user.email;
        if (userName) userName.textContent = user.displayName || user.email.split('@')[0];
        if (userAvatar) {
            userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=6366f1&color=fff`;
        }
    } else {
        if (userEmail) userEmail.textContent = '';
        if (userName) userName.textContent = 'Usuario';
        if (userAvatar) userAvatar.src = 'src/assets/images/default-avatar.png';
    }
}

function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) {
            darkModeToggle.checked = true;
        }
    }
    
    console.log('🌙 Dark mode inicializado:', isDarkMode);
}

function toggleDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const isDarkMode = darkModeToggle ? darkModeToggle.checked : document.body.classList.contains('dark-mode');
    
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
    
    showNotification(`Modo ${isDarkMode ? 'oscuro' : 'claro'} activado`, 'info');
    
    console.log('🌙 Dark mode cambiado:', isDarkMode);
}

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.app-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `app-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'info' ? '#3b82f6' : '#10b981'};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        z-index: 9999;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        backdrop-filter: blur(10px);
        max-width: 400px;
        word-wrap: break-word;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        border: 1px solid rgba(255,255,255,0.2);
    `;
    
    const icon = type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '✅';
    notification.innerHTML = `<div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 18px;">${icon}</span>
        <span>${message}</span>
    </div>`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 4000);
}

// Función de diagnóstico completa
function diagnosisEduCheckPro() {
    console.log('🔍 EduCheck Pro v2.1 - Diagnóstico Crítico:');
    console.log('=' .repeat(60));
    
    // Verificar dependencias
    const dependencies = {
        firebase: typeof firebase !== 'undefined',
        auth: typeof window.auth !== 'undefined',
        db: typeof window.db !== 'undefined',
        syncManager: typeof window.syncManager !== 'undefined'
    };
    
    console.log('📦 DEPENDENCIAS:');
    Object.entries(dependencies).forEach(([name, available]) => {
        console.log(`  - ${name}: ${available ? '✅' : '❌'}`);
    });
    
    // Información de Firebase
    if (window.diagnoseFirabase) {
        window.diagnoseFirabase();
    }
    
    // Información de SyncManager
    if (window.syncManager && typeof window.syncManager.getDiagnostic === 'function') {
        window.syncManager.getDiagnostic();
    }
    
    // Información de la aplicación
    console.log('📱 APLICACIÓN:');
    console.log('  - Inicializada:', appInitialized);
    console.log('  - Usuario actual:', currentUser?.email || 'No autenticado');
    console.log('  - Página actual:', window.location.pathname);
    console.log('  - Menu toggle:', !!document.getElementById('profileButton'));
    console.log('  - Formulario actividades:', !!document.querySelector('.activity-form'));
    console.log('  - Upload imagen:', !!document.getElementById('activityImage'));
    
    console.log('=' .repeat(60));
    
    return {
        dependencies,
        app: {
            initialized: appInitialized,
            user: currentUser?.email || null,
            page: window.location.pathname,
            menuToggle: !!document.getElementById('profileButton'),
            activityForm: !!document.querySelector('.activity-form'),
            imageUpload: !!document.getElementById('activityImage')
        }
    };
}

// Hacer funciones disponibles globalmente
window.diagnosisEduCheckPro = diagnosisEduCheckPro;
window.ensureDefaultInstitution = ensureDefaultInstitution;
window.showNotification = showNotification;
window.deleteActivity = deleteActivity;
window.openAttendanceModal = openAttendanceModal;
window.viewImage = viewImage;

// Inicialización con múltiples puntos de entrada
document.addEventListener('DOMContentLoaded', initializeApp);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM ya cargado
    setTimeout(initializeApp, 100);
}

console.log('🚀 EduCheck Pro v2.1 - App.js completo cargado');

// ===== FUNCIONES ESPECÍFICAS PARA EL MENÚ FULLSCREEN =====

function setupMenuToggle() {
    const profileButton = document.getElementById('profileButton');
    const menuDropdown = document.getElementById('menuDropdown');
    const menuCloseBtn = document.getElementById('menu-close-btn');
    
    console.log('🎛️ Configurando menú fullscreen...', {
        profileButton: !!profileButton,
        menuDropdown: !!menuDropdown,
        menuCloseBtn: !!menuCloseBtn
    });
    
    if (profileButton && menuDropdown) {
        // Abrir menú
        profileButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openMenu();
        });
        
        // Cerrar menú con botón X
        if (menuCloseBtn) {
            menuCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeMenu();
            });
        }
        
        // Cerrar menú con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuDropdown.classList.contains('active')) {
                closeMenu();
            }
        });
        
        console.log('✅ Menú fullscreen configurado correctamente');
    } else {
        console.error('❌ No se encontraron elementos del menú:', {
            profileButton: !!profileButton,
            menuDropdown: !!menuDropdown
        });
    }
}

function openMenu() {
    const menuDropdown = document.getElementById('menuDropdown');
    if (menuDropdown) {
        menuDropdown.classList.remove('closing');
        menuDropdown.classList.add('active');
        document.body.style.overflow = 'hidden'; // Evitar scroll del body
        console.log('📱 Menú abierto');
    }
}

function closeMenu() {
    const menuDropdown = document.getElementById('menuDropdown');
    if (menuDropdown) {
        menuDropdown.classList.add('closing');
        
        // Esperar a que termine la animación
        setTimeout(() => {
            menuDropdown.classList.remove('active');
            menuDropdown.classList.remove('closing');
            document.body.style.overflow = ''; // Restaurar scroll
        }, 300);
        
        console.log('📱 Menú cerrado');
    }
}

// Configurar handlers para items del menú
function setupMenuItems() {
    console.log('🔗 Configurando items del menú...');
    
    // Cerrar sesión
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            closeMenu();
            await handleLogout();
        });
    }
    
    // Eliminar cuenta
    const deleteAccountBtn = document.getElementById('deleteAccount');
    const deleteModal = document.getElementById('deleteConfirmModal');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const closeModalBtn = document.getElementById('closeConfirmModal');
    
    if (deleteAccountBtn && deleteModal) {
        deleteAccountBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeMenu();
            deleteModal.classList.add('active');
        });
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.classList.remove('active');
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            deleteModal.classList.remove('active');
        });
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            try {
                await handleDeleteAccount();
                deleteModal.classList.remove('active');
            } catch (error) {
                console.error('❌ Error eliminando cuenta:', error);
                showNotification('Error eliminando cuenta: ' + error.message, 'error');
            }
        });
    }
    
    // Donación
    const donationBtn = document.getElementById('donationBtn');
    if (donationBtn) {
        donationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeMenu();
            window.open('https://www.paypal.com/donate/?business=tu-paypal&currency_code=USD', '_blank');
        });
    }
    
    // Instalar app
    const installBtn = document.getElementById('installApp');
    if (installBtn) {
        installBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeMenu();
            handleInstallApp();
        });
    }
    
    // Navegación con cierre de menú
    const navItems = [
        { id: 'institutions-list', url: 'instituciones.html' },
        { id: 'students-list', url: 'estudiantes.html' },
        { id: 'courses-list', url: 'cursos.html' },
        { id: 'profile', url: 'profile.html' }
    ];
    
    navItems.forEach(item => {
        const element = document.getElementById(item.id);
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                closeMenu();
                
                // Pequeño delay para que se vea el cierre del menú
                setTimeout(() => {
                    if (item.id === 'courses-list') {
                        // Lógica especial para cursos
                        handleCoursesNavigation();
                    } else {
                        window.location.href = item.url;
                    }
                }, 200);
            });
        }
    });
    
    console.log('✅ Items del menú configurados');
}

async function handleCoursesNavigation() {
    try {
        const institution = await ensureDefaultInstitution();
        
        if (institution) {
            window.location.href = `cursos.html?institution=${institution.id}`;
        } else {
            showNotification('Creando tu primera institución...', 'info');
            setTimeout(() => {
                window.location.href = 'instituciones.html?action=create';
            }, 1500);
        }
    } catch (error) {
        console.error('❌ Error navegando a cursos:', error);
        showNotification('Error navegando a cursos: ' + error.message, 'error');
    }
}

async function handleDeleteAccount() {
    try {
        const user = window.auth?.currentUser;
        if (!user) {
            throw new Error('No hay usuario autenticado');
        }
        
        showNotification('Eliminando cuenta...', 'info');
        
        // Eliminar datos del usuario en Firestore
        if (window.db) {
            await window.db.collection('users').doc(user.uid).delete();
        }
        
        // Eliminar cuenta de Firebase Auth
        await user.delete();
        
        // Limpiar localStorage
        localStorage.clear();
        
        showNotification('Cuenta eliminada exitosamente', 'success');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error eliminando cuenta:', error);
        throw error;
    }
}

function handleInstallApp() {
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showNotification('App instalada exitosamente', 'success');
            } else {
                showNotification('Instalación cancelada', 'info');
            }
            window.deferredPrompt = null;
        });
    } else {
        showNotification('Esta función está disponible solo en dispositivos móviles', 'info');
    }
}

// Actualizar información del usuario en el menú
function updateMenuUserInfo(user) {
    const teacherName = document.getElementById('teacher-name');
    const menuTeacherName = document.getElementById('menuTeacherName');
    const profileImgs = document.querySelectorAll('.profile-img, .large-profile-img');
    
    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`;
        
        if (teacherName) teacherName.textContent = displayName;
        if (menuTeacherName) menuTeacherName.textContent = displayName;
        
        profileImgs.forEach(img => {
            if (img) img.src = avatarUrl;
        });
        
        console.log('👤 Información del usuario actualizada en el menú');
    }
}

// Hacer disponibles globalmente
window.openMenu = openMenu;
window.closeMenu = closeMenu;
window.setupMenuToggle = setupMenuToggle;
window.setupMenuItems = setupMenuItems;
window.updateMenuUserInfo = updateMenuUserInfo;

console.log('🎛️ Funciones del menú fullscreen cargadas');