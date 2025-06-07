/**
 * EduCheck Pro - App Principal v4.0 COMPLETAMENTE CORREGIDO
 * Sistema unificado sin duplicaciones
 */

// ===== VARIABLES GLOBALES =====
let isAppInitialized = false;
let authStateChangeListener = null;

console.log('🚀 App.js v4.0 cargando...');

// ===== INICIALIZACIÓN PRINCIPAL =====
async function initializeApp() {
    if (isAppInitialized) {
        console.log('⚠️ App ya inicializada, omitiendo...');
        return;
    }
    
    console.log('🚀 Iniciando EduCheck Pro v4.0...');
    
    try {
        // Verificar dependencias críticas
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK no disponible');
        }
        
        if (!window.auth) {
            throw new Error('Firebase Auth no configurado');
        }
        
        // Configurar autenticación
        setupAuthListener();
        
        // Configurar interfaz de usuario UNIFICADA
        setupUnifiedInterface();
        
        // Configurar scroll to top
        setupScrollToTop();
        
        isAppInitialized = true;
        console.log('✅ App inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando app:', error);
        showNotification('Error al cargar la aplicación: ' + error.message, 'error');
    }
}

// ===== CONFIGURACIÓN DE AUTENTICACIÓN =====
function setupAuthListener() {
    console.log('🔐 Configurando listener de autenticación...');
    
    if (authStateChangeListener) {
        console.log('⚠️ Listener ya configurado');
        return;
    }
    
    authStateChangeListener = window.auth.onAuthStateChanged(async (user) => {
        console.log('🔐 Estado de autenticación cambió:', user ? user.email : 'No autenticado');
        
        if (user) {
            console.log('✅ Usuario autenticado:', user.email);
            updateUserInterface(user);
            
        } else {
            console.log('❌ Usuario no autenticado, redirigiendo...');
            window.location.href = 'login.html';
        }
    });
}

// ===== INTERFAZ UNIFICADA =====
function setupUnifiedInterface() {
    console.log('🎨 Configurando interfaz unificada...');
    
    // Configurar menú toggle - ESPERAR A QUE EL DOM ESTÉ LISTO
    setTimeout(() => {
        setupMenuToggle();
        setupMenuNavigation();
    }, 100);
    
    // Configurar modo oscuro
    initializeDarkMode();
    
    // Actualizar fecha
    updateCurrentDate();
    
    console.log('✅ Interfaz unificada configurada');
}

function updateUserInterface(user) {
    console.log('👤 Actualizando información del usuario...');
    
    const teacherName = document.getElementById('teacherName');
    const menuTeacherName = document.getElementById('menuTeacherName');
    
    const displayName = user.displayName || user.email.split('@')[0] || 'Usuario';
    
    // Actualizar todos los elementos que muestren el nombre
    [teacherName, menuTeacherName].forEach(element => {
        if (element) {
            element.textContent = displayName;
        }
    });
    
    console.log('✅ Información del usuario actualizada:', displayName);
}

function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        dateElement.textContent = now.toLocaleDateString('es-ES', options);
        console.log('📅 Fecha actualizada');
    }
}

// ===== MENÚ TOGGLE CORREGIDO COMPLETAMENTE =====
function setupMenuToggle() {
    console.log('🎛️ [APP] Configurando menú toggle...');
    
    // Buscar elementos con más tiempo
    const menuToggle = document.getElementById('menuToggle');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const menuClose = document.getElementById('menuClose');
    const menuOverlay = document.getElementById('menuOverlay');
    
    console.log('🔍 [APP] Elementos del menú encontrados:', {
        menuToggle: !!menuToggle,
        dropdownMenu: !!dropdownMenu,
        menuClose: !!menuClose,
        menuOverlay: !!menuOverlay
    });
    
    if (!menuToggle) {
        console.error('❌ [APP] menuToggle NO encontrado. Reintentando en 1 segundo...');
        setTimeout(setupMenuToggle, 1000);
        return;
    }
    
    if (!dropdownMenu) {
        console.error('❌ [APP] dropdownMenu NO encontrado. Reintentando en 1 segundo...');
        setTimeout(setupMenuToggle, 1000);
        return;
    }
    
    // Limpiar listeners anteriores
    const newMenuToggle = menuToggle.cloneNode(true);
    menuToggle.parentNode.replaceChild(newMenuToggle, menuToggle);
    
    function openMenu() {
        console.log('🔓 [APP] Abriendo menú...');
        dropdownMenu.classList.add('active');
        newMenuToggle.classList.add('active');
        if (menuOverlay) menuOverlay.classList.add('active');
        document.body.classList.add('menu-open');
    }
    
    function closeMenu() {
        console.log('🔒 [APP] Cerrando menú...');
        dropdownMenu.classList.remove('active');
        newMenuToggle.classList.remove('active');
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
    
    // Event listener principal
    newMenuToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ [APP] Menu toggle clicked');
        
        if (dropdownMenu.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    // Event listener para cerrar
    if (menuClose) {
        const newMenuClose = menuClose.cloneNode(true);
        menuClose.parentNode.replaceChild(newMenuClose, menuClose);
        
        newMenuClose.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ [APP] Menu close clicked');
            closeMenu();
        });
    }
    
    // Event listener para overlay
    if (menuOverlay) {
        const newMenuOverlay = menuOverlay.cloneNode(true);
        menuOverlay.parentNode.replaceChild(newMenuOverlay, menuOverlay);
        
        newMenuOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🖱️ [APP] Overlay clicked');
            closeMenu();
        });
    }
    
    // Cerrar con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && dropdownMenu.classList.contains('active')) {
            console.log('⌨️ [APP] Escape pressed - cerrando menú');
            closeMenu();
        }
    });
    
    // Configurar logout
    setupLogout();
    
    console.log('✅ [APP] Menú toggle configurado correctamente');
}

// ===== NAVEGACIÓN DEL MENÚ =====
function setupMenuNavigation() {
    console.log('🧭 [APP] Configurando navegación del menú...');
    
    const menuItems = document.querySelectorAll('.menu-item');
    const currentPage = window.location.pathname.split('/').pop();
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        
        // Marcar página activa
        if (href && href === currentPage) {
            item.classList.add('active');
        }
        
        // Configurar navegación (solo si no es logout)
        if (href && href !== '#' && !item.id) {
            item.addEventListener('click', function(e) {
                console.log('🔗 [APP] Navegando a:', href);
                
                // Cerrar menú antes de navegar
                const dropdownMenu = document.getElementById('dropdownMenu');
                const menuToggle = document.getElementById('menuToggle');
                const menuOverlay = document.getElementById('menuOverlay');
                
                if (dropdownMenu) dropdownMenu.classList.remove('active');
                if (menuToggle) menuToggle.classList.remove('active');
                if (menuOverlay) menuOverlay.classList.remove('active');
                document.body.classList.remove('menu-open');
                
                // Navegar después de cerrar el menú
                setTimeout(() => {
                    window.location.href = href;
                }, 200);
                
                e.preventDefault();
            });
        }
    });
    
    console.log('✅ [APP] Navegación del menú configurada');
}

// ===== LOGOUT =====
function setupLogout() {
    const logoutOption = document.getElementById('logoutOption');
    
    if (logoutOption) {
        // Limpiar listeners anteriores
        const newLogoutOption = logoutOption.cloneNode(true);
        logoutOption.parentNode.replaceChild(newLogoutOption, logoutOption);
        
        newLogoutOption.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                try {
                    console.log('🚪 Cerrando sesión...');
                    await window.auth.signOut();
                    showNotification('Sesión cerrada correctamente', 'success');
                    window.location.href = 'login.html';
                } catch (error) {
                    console.error('❌ Error al cerrar sesión:', error);
                    showNotification('Error al cerrar sesión', 'error');
                }
            }
        });
    }
}

// ===== MODO OSCURO =====
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    
    if (darkModeToggle) {
        darkModeToggle.checked = isDarkMode;
        
        darkModeToggle.addEventListener('change', function() {
            const darkMode = this.checked;
            document.body.classList.toggle('dark-mode', darkMode);
            localStorage.setItem('darkMode', darkMode);
            
            showNotification(
                `Modo ${darkMode ? 'oscuro' : 'claro'} activado`, 
                'info'
            );
        });
    }
}

// ===== SCROLL TO TOP =====
function setupScrollToTop() {
    const scrollBtn = document.getElementById('scroll-to-top');
    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollBtn.style.display = 'flex';
            } else {
                scrollBtn.style.display = 'none';
            }
        });
        
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// ===== NOTIFICACIONES =====
function showNotification(message, type = 'success') {
    try {
        console.log(`🔔 [APP] NOTIFICATION [${type.toUpperCase()}]: ${message}`);
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#3B82F6'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            font-family: 'Quicksand', sans-serif;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 18px;">${icon}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
        
    } catch (error) {
        console.error('❌ Error en showNotification:', error);
        console.log(`ALERT: ${message}`);
    }
}

// ===== FUNCIONES DE DATOS =====
function getUserData(key) {
    try {
        const user = window.auth?.currentUser;
        if (!user) {
            console.warn('⚠️ Usuario no autenticado para getUserData');
            return null;
        }
        
        const result = localStorage.getItem(`${user.uid}_${key}`);
        return result;
        
    } catch (error) {
        console.error('❌ Error en getUserData:', error);
        return null;
    }
}

function setUserData(key, value) {
    try {
        const user = window.auth?.currentUser;
        if (!user) {
            console.warn('⚠️ Usuario no autenticado para setUserData');
            return false;
        }
        
        localStorage.setItem(`${user.uid}_${key}`, value);
        return true;
        
    } catch (error) {
        console.error('❌ Error en setUserData:', error);
        return false;
    }
}

// ===== INICIALIZACIÓN AUTOMÁTICA =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 [APP] DOM cargado, esperando Firebase...');
    
    // Esperar a que Firebase esté disponible
    const waitForFirebase = setInterval(() => {
        if (window.auth) {
            clearInterval(waitForFirebase);
            console.log('🔥 [APP] Firebase detectado, inicializando app...');
            
            // Delay para asegurar que el DOM esté completamente cargado
            setTimeout(() => {
                initializeApp();
            }, 500);
        }
    }, 100);
    
    // Timeout de seguridad
    setTimeout(() => {
        clearInterval(waitForFirebase);
        if (!window.auth) {
            console.error('❌ [APP] Firebase no se cargó en el tiempo esperado');
        }
    }, 10000);
});

// ===== EXPONER FUNCIONES GLOBALMENTE =====
window.showNotification = showNotification;
window.setupMenuToggle = setupMenuToggle;
window.getUserData = getUserData;
window.setUserData = setUserData;

console.log('✅ App.js v4.0 cargado correctamente - Sistema unificado');