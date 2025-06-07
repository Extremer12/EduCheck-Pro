/* filepath: c:\Users\julian\EduCheck-Pro\src\assets\js\ajustes.js */
/**
 * EduCheck Pro - Sistema de Ajustes Centralizados
 * Maneja configuración global incluido modo oscuro
 */

// ===== VARIABLES GLOBALES =====
let currentUser = null;
let userSettings = {
    darkMode: false,
    fontSize: 'normal',
    animations: true,
    desktopNotifications: false,
    soundEffects: true
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('⚙️ Inicializando sistema de ajustes...');
    
    // Esperar a que app.js configure Firebase y el menú
    const waitForApp = setInterval(() => {
        if (window.auth && typeof window.setupMenuToggle === 'function') {
            clearInterval(waitForApp);
            initializeSettings();
        }
    }, 100);
    
    setTimeout(() => {
        if (!currentUser) {
            console.warn('⚠️ App.js no se inicializó en tiempo esperado');
            clearInterval(waitForApp);
            initializeSettings();
        }
    }, 10000);
});

// ===== FUNCIÓN PRINCIPAL DE INICIALIZACIÓN =====
function initializeSettings() {
    console.log('🎯 Inicializando sistema completo de ajustes...');
    
    try {
        // Configurar autenticación
        setupAuthListener();
        
        // Cargar configuración guardada
        loadUserSettings();
        
        // Configurar eventos
        setupSettingsEvents();
        
        // Aplicar configuración actual
        applyAllSettings();
        
        console.log('✅ Sistema de ajustes inicializado');
        
    } catch (error) {
        console.error('❌ Error inicializando ajustes:', error);
        showNotification('Error al cargar ajustes', 'error');
    }
}

// ===== CONFIGURACIÓN DE AUTENTICACIÓN =====
function setupAuthListener() {
    if (window.auth) {
        window.auth.onAuthStateChanged(user => {
            currentUser = user;
            if (user) {
                console.log('👤 Usuario autenticado en ajustes:', user.email);
                loadUserSettings();
            }
        });
    }
}

// ===== CARGAR CONFIGURACIÓN DEL USUARIO =====
function loadUserSettings() {
    try {
        const savedSettings = getUserData('settings');
        if (savedSettings) {
            userSettings = { ...userSettings, ...JSON.parse(savedSettings) };
            console.log('📂 Configuración cargada:', userSettings);
        }
        
        updateSettingsInterface();
    } catch (error) {
        console.error('❌ Error cargando configuración:', error);
    }
}

// ===== GUARDAR CONFIGURACIÓN =====
function saveUserSettings() {
    try {
        setUserData('settings', JSON.stringify(userSettings));
        console.log('💾 Configuración guardada:', userSettings);
        
        // Disparar evento personalizado para notificar cambios
        window.dispatchEvent(new CustomEvent('settingsChanged', {
            detail: userSettings
        }));
        
    } catch (error) {
        console.error('❌ Error guardando configuración:', error);
    }
}

// ===== ACTUALIZAR INTERFAZ DE AJUSTES =====
function updateSettingsInterface() {
    const darkModeToggle = document.getElementById('globalDarkModeToggle');
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    const animationsToggle = document.getElementById('animationsToggle');
    const desktopNotifications = document.getElementById('desktopNotifications');
    const soundEffects = document.getElementById('soundEffects');
    
    if (darkModeToggle) darkModeToggle.checked = userSettings.darkMode;
    if (fontSizeSelect) fontSizeSelect.value = userSettings.fontSize;
    if (animationsToggle) animationsToggle.checked = userSettings.animations;
    if (desktopNotifications) desktopNotifications.checked = userSettings.desktopNotifications;
    if (soundEffects) soundEffects.checked = userSettings.soundEffects;
}

// ===== CONFIGURAR EVENTOS (ACTUALIZAR FUNCIÓN EXISTENTE) =====
function setupSettingsEvents() {
    // Modo oscuro global
    const darkModeToggle = document.getElementById('globalDarkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            const isDark = e.target.checked;
            userSettings.darkMode = isDark;
            applyDarkMode(isDark);
            saveUserSettings();
            showNotification('Modo oscuro ' + (isDark ? 'activado' : 'desactivado'), 'success');
        });
    }
    
    // Tamaño de fuente
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    if (fontSizeSelect) {
        fontSizeSelect.addEventListener('change', (e) => {
            const fontSize = e.target.value;
            userSettings.fontSize = fontSize;
            applyFontSize(fontSize);
            saveUserSettings();
            showNotification('Tamaño de fuente actualizado', 'success');
        });
    }
    
    // Animaciones
    const animationsToggle = document.getElementById('animationsToggle');
    if (animationsToggle) {
        animationsToggle.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            userSettings.animations = enabled;
            applyAnimations(enabled);
            saveUserSettings();
            showNotification('Animaciones ' + (enabled ? 'habilitadas' : 'deshabilitadas'), 'success');
        });
    }
    
    // Notificaciones de escritorio
    const desktopNotifications = document.getElementById('desktopNotifications');
    if (desktopNotifications) {
        desktopNotifications.addEventListener('change', async (e) => {
            const enabled = e.target.checked;
            if (enabled) {
                await requestNotificationPermission();
            }
            userSettings.desktopNotifications = enabled;
            saveUserSettings();
            showNotification('Notificaciones de escritorio ' + (enabled ? 'habilitadas' : 'deshabilitadas'), 'success');
        });
    }
    
    // Efectos de sonido
    const soundEffects = document.getElementById('soundEffects');
    if (soundEffects) {
        soundEffects.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            userSettings.soundEffects = enabled;
            saveUserSettings();
            showNotification('Efectos de sonido ' + (enabled ? 'habilitados' : 'deshabilitados'), 'success');
        });
    }
    
    // Botones de acción
    setupActionButtons();
    
    // Nuevos botones
    setupDonationButton();
    setupDeleteAccountButton();
}

// ===== CONFIGURAR BOTONES DE ACCIÓN =====
function setupActionButtons() {
    // Exportar datos
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportUserData);
    }
    
    // Limpiar caché
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', clearCache);
    }
    
    // Restablecer configuración
    const resetBtn = document.getElementById('resetSettingsBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSettings);
    }
}

// ===== CONFIGURAR BOTÓN DE DONACIÓN =====
function setupDonationButton() {
    const donationBtn = document.getElementById('donationBtn');
    if (donationBtn) {
        donationBtn.addEventListener('click', openDonationModal);
    }
    
    // Botón copiar alias
    const copyAliasBtn = document.getElementById('copyAliasBtn');
    if (copyAliasBtn) {
        copyAliasBtn.addEventListener('click', copyAlias);
    }
}

// ===== CONFIGURAR BOTÓN DE ELIMINAR CUENTA =====
function setupDeleteAccountButton() {
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', openDeleteAccountModal);
    }
    
    // Input de confirmación
    const deleteConfirmation = document.getElementById('deleteConfirmation');
    if (deleteConfirmation) {
        deleteConfirmation.addEventListener('input', validateDeleteConfirmation);
    }
    
    // Botón confirmar eliminación
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteAccount);
    }
}

// ===== APLICAR TODOS LOS AJUSTES =====
function applyAllSettings() {
    applyDarkMode(userSettings.darkMode);
    applyFontSize(userSettings.fontSize);
    applyAnimations(userSettings.animations);
    
    console.log('🎨 Todos los ajustes aplicados');
}

// ===== APLICAR MODO OSCURO GLOBALMENTE =====
function applyDarkMode(isDark) {
    const body = document.body;
    const html = document.documentElement;
    
    if (isDark) {
        body.classList.add('dark-mode');
        html.setAttribute('data-theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        html.removeAttribute('data-theme');
    }
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('darkMode', isDark);
    
    // Transmitir a otras pestañas
    broadcastSettingChange('darkMode', isDark);
}

// ===== APLICAR TAMAÑO DE FUENTE =====
function applyFontSize(size) {
    const root = document.documentElement;
    
    const sizeMap = {
        'small': '0.875',
        'normal': '1',
        'large': '1.125',
        'extra-large': '1.25'
    };
    
    root.style.setProperty('--font-scale', sizeMap[size] || '1');
    localStorage.setItem('fontSize', size);
    
    broadcastSettingChange('fontSize', size);
}

// ===== APLICAR ANIMACIONES =====
function applyAnimations(enabled) {
    const root = document.documentElement;
    
    if (enabled) {
        root.style.removeProperty('--animation-duration');
        root.classList.remove('no-animations');
    } else {
        root.style.setProperty('--animation-duration', '0s');
        root.classList.add('no-animations');
    }
    
    localStorage.setItem('animations', enabled.toString());
    broadcastSettingChange('animations', enabled);
}

// ===== TRANSMITIR CAMBIOS A OTRAS PESTAÑAS =====
function broadcastSettingChange(setting, value) {
    // Usar localStorage para comunicarse entre pestañas
    localStorage.setItem(`setting_${setting}`, JSON.stringify({
        value: value,
        timestamp: Date.now()
    }));
}

// ===== ESCUCHAR CAMBIOS DE OTRAS PESTAÑAS =====
window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('setting_')) {
        const setting = e.key.replace('setting_', '');
        const data = JSON.parse(e.newValue);
        
        // Aplicar el cambio si es reciente (menos de 5 segundos)
        if (Date.now() - data.timestamp < 5000) {
            switch (setting) {
                case 'darkMode':
                    applyDarkMode(data.value);
                    userSettings.darkMode = data.value;
                    updateSettingsInterface();
                    break;
                case 'fontSize':
                    applyFontSize(data.value);
                    userSettings.fontSize = data.value;
                    updateSettingsInterface();
                    break;
                case 'animations':
                    applyAnimations(data.value);
                    userSettings.animations = data.value;
                    updateSettingsInterface();
                    break;
            }
        }
    }
});

// ===== FUNCIONES DE ACCIÓN =====
async function exportUserData() {
    try {
        showNotification('Preparando exportación...', 'info');
        
        const userData = {
            settings: userSettings,
            institutions: getUserData('institutions'),
            courses: getUserData('courses'),
            students: getUserData('students'),
            activities: getUserData('activities'),
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `educheck-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Datos exportados correctamente', 'success');
    } catch (error) {
        console.error('❌ Error exportando datos:', error);
        showNotification('Error al exportar datos', 'error');
    }
}

async function clearCache() {
    try {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }
        
        // Limpiar datos temporales del localStorage (mantener configuración)
        const keysToKeep = ['darkMode', 'fontSize', 'animations'];
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && !keysToKeep.some(keepKey => key.includes(keepKey))) {
                // Solo limpiar si no es configuración importante
                if (!key.includes('settings') && !key.includes('auth')) {
                    localStorage.removeItem(key);
                }
            }
        }
        
        showNotification('Caché limpiado correctamente', 'success');
    } catch (error) {
        console.error('❌ Error limpiando caché:', error);
        showNotification('Error al limpiar caché', 'error');
    }
}

function resetSettings() {
    if (confirm('¿Estás seguro de que quieres restablecer toda la configuración? Esta acción no se puede deshacer.')) {
        // Restablecer a valores por defecto
        userSettings = {
            darkMode: false,
            fontSize: 'normal',
            animations: true,
            desktopNotifications: false,
            soundEffects: true
        };
        
        saveUserSettings();
        applyAllSettings();
        updateSettingsInterface();
        
        showNotification('Configuración restablecida correctamente', 'success');
    }
}

async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showNotification('Notificaciones de escritorio activadas', 'success');
        } else {
            showNotification('Permisos de notificación denegados', 'warning');
            userSettings.desktopNotifications = false;
            updateSettingsInterface();
        }
    }
}

// ===== FUNCIONES AUXILIARES =====
function getUserData(key) {
    if (!currentUser) return null;
    const userKey = `${currentUser.uid}_${key}`;
    return localStorage.getItem(userKey);
}

function setUserData(key, value) {
    if (!currentUser) return false;
    const userKey = `${currentUser.uid}_${key}`;
    localStorage.setItem(userKey, value);
    return true;
}

function showNotification(message, type = 'info') {
    // Usar la función global de app.js si existe
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
}

// ===== INICIALIZACIÓN AUTOMÁTICA AL CARGAR OTRAS PÁGINAS =====
// Esta función se ejecutará automáticamente en todas las páginas
function initializeGlobalSettings() {
    // Cargar configuración guardada
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedFontSize = localStorage.getItem('fontSize') || 'normal';
    const savedAnimations = localStorage.getItem('animations') !== 'false';
    
    // Aplicar inmediatamente
    applyDarkMode(savedDarkMode);
    applyFontSize(savedFontSize);
    applyAnimations(savedAnimations);
}

// ===== EXPONER FUNCIONES GLOBALMENTE =====
window.initializeGlobalSettings = initializeGlobalSettings;
window.applyDarkMode = applyDarkMode;
window.userSettings = userSettings;
window.openDonationModal = openDonationModal;
window.closeDonationModal = closeDonationModal;
window.openDeleteAccountModal = openDeleteAccountModal;
window.closeDeleteAccountModal = closeDeleteAccountModal;
window.copyAlias = copyAlias;

// Ejecutar automáticamente si no estamos en la página de ajustes
if (!document.body.classList.contains('settings-page')) {
    initializeGlobalSettings();
}

console.log('✅ ajustes.js cargado correctamente');

// ===== CERRAR MODALES CON CLICK FUERA O ESC =====
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        if (e.target.id === 'donationModal') {
            closeDonationModal();
        } else if (e.target.id === 'deleteAccountModal') {
            closeDeleteAccountModal();
        }
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDonationModal();
        closeDeleteAccountModal();
    }
});

// ===== ABRIR MODAL DE DONACIÓN =====
function openDonationModal() {
    const modal = document.getElementById('donationModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// ===== CERRAR MODAL DE DONACIÓN =====
function closeDonationModal() {
    const modal = document.getElementById('donationModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ===== COPIAR ALIAS =====
async function copyAlias() {
    const aliasText = document.getElementById('aliasText').textContent;
    const copyBtn = document.getElementById('copyAliasBtn');
    
    try {
        await navigator.clipboard.writeText(aliasText);
        
        // Feedback visual
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        
        showNotification('Alias copiado al portapapeles', 'success');
        
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
        
    } catch (error) {
        // Fallback para navegadores que no soportan clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = aliasText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        showNotification('Alias copiado al portapapeles', 'success');
    }
}

// ===== ABRIR MODAL DE ELIMINAR CUENTA =====
function openDeleteAccountModal() {
    const modal = document.getElementById('deleteAccountModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Resetear input
        const deleteConfirmation = document.getElementById('deleteConfirmation');
        if (deleteConfirmation) {
            deleteConfirmation.value = '';
            deleteConfirmation.classList.remove('valid');
        }
        
        // Deshabilitar botón
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.disabled = true;
        }
    }
}

// ===== CERRAR MODAL DE ELIMINAR CUENTA =====
function closeDeleteAccountModal() {
    const modal = document.getElementById('deleteAccountModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ===== VALIDAR CONFIRMACIÓN DE ELIMINACIÓN =====
function validateDeleteConfirmation() {
    const input = document.getElementById('deleteConfirmation');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    if (input && confirmBtn) {
        const isValid = input.value.trim().toUpperCase() === 'ELIMINAR';
        
        if (isValid) {
            input.classList.add('valid');
            confirmBtn.disabled = false;
        } else {
            input.classList.remove('valid');
            confirmBtn.disabled = true;
        }
    }
}

// ===== CONFIRMAR ELIMINACIÓN DE CUENTA =====
async function confirmDeleteAccount() {
    if (!currentUser) {
        showNotification('Error: Usuario no autenticado', 'error');
        return;
    }
    
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmBtn.innerHTML;
    
    try {
        // Mostrar loading
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        confirmBtn.disabled = true;
        
        showNotification('Eliminando cuenta...', 'info');
        
        // 1. Eliminar todos los datos del usuario
        await deleteAllUserData();
        
        // 2. Eliminar cuenta de Firebase Auth
        await currentUser.delete();
        
        showNotification('Cuenta eliminada exitosamente', 'success');
        
        // 3. Redirigir al login después de un breve delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error eliminando cuenta:', error);
        
        let errorMessage = 'Error al eliminar la cuenta';
        
        if (error.code === 'auth/requires-recent-login') {
            errorMessage = 'Por seguridad, necesitas iniciar sesión nuevamente antes de eliminar tu cuenta';
        }
        
        showNotification(errorMessage, 'error');
        
        // Restaurar botón
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
}

// ===== ELIMINAR TODOS LOS DATOS DEL USUARIO =====
async function deleteAllUserData() {
    if (!currentUser) return;
    
    const userId = currentUser.uid;
    
    try {
        // Eliminar datos de localStorage
        const keysToDelete = [
            `${userId}_institutions`,
            `${userId}_courses`,
            `${userId}_students`,
            `${userId}_activities`,
            `${userId}_attendance_records`,
            `${userId}_gallery_images`,
            `${userId}_user_settings`,
            `${userId}_user_profile`,
            `${userId}_last_class`
        ];
        
        keysToDelete.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Si hay Firestore disponible, eliminar datos de la nube
        if (window.db) {
            const userDoc = window.db.collection('users').doc(userId);
            
            // Eliminar subcolecciones
            const collections = ['institutions', 'courses', 'students', 'activities', 'attendance', 'gallery'];
            
            for (const collectionName of collections) {
                const snapshot = await userDoc.collection(collectionName).get();
                const batch = window.db.batch();
                
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                if (snapshot.docs.length > 0) {
                    await batch.commit();
                }
            }
            
            // Eliminar documento principal del usuario
            await userDoc.delete();
        }
        
        console.log('✅ Todos los datos del usuario eliminados');
        
    } catch (error) {
        console.error('Error eliminando datos del usuario:', error);
        throw error;
    }
}