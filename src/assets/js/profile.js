/**
 * EduCheck Pro - Sistema de Gestión de Perfil
 * Módulo completo para administración del perfil del docente
 * 
 * @version 2.0.0
 * @author EduCheck Pro Team
 */

// ===== FUNCIONES AUXILIARES =====

function getUserData(key) {
    const user = window.auth?.currentUser;
    if (!user) return null;
    return localStorage.getItem(`${user.uid}_${key}`);
}

function setUserData(key, value) {
    const user = window.auth?.currentUser;
    if (!user) return false;
    localStorage.setItem(`${user.uid}_${key}`, value);
    return true;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'info' ? '#17a2b8' : '#28a745'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 10000;
        animation: slideInNotification 0.3s ease;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        font-family: 'Quicksand', sans-serif;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutNotification 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== VARIABLES GLOBALES PARA EL MENÚ =====
let profileMenuElements = {
    profileButton: null,
    menuDropdown: null,
    menuCloseBtn: null
};

// ===== FUNCIONES DEL MENÚ TOGGLE =====

function initializeMenuToggle() {
    console.log('🔧 Profile.js - Inicializando menú toggle...');
    
    // Buscar elementos del menú
    const profileButton = document.getElementById('profileButton') || document.querySelector('.profile-button');
    const menuDropdown = document.getElementById('menuDropdown') || document.querySelector('.menu-dropdown');
    const menuCloseBtn = document.getElementById('menu-close-btn') || document.querySelector('.menu-close-btn');
    
    // Guardar referencias globales
    profileMenuElements.profileButton = profileButton;
    profileMenuElements.menuDropdown = menuDropdown;
    profileMenuElements.menuCloseBtn = menuCloseBtn;
    
    console.log('🔍 Profile.js - Elementos encontrados:', {
        profileButton: !!profileButton,
        menuDropdown: !!menuDropdown,
        menuCloseBtn: !!menuCloseBtn,
        profileButtonId: profileButton?.id,
        menuDropdownId: menuDropdown?.id
    });
    
    if (!profileButton || !menuDropdown) {
        console.error('❌ Profile.js - Elementos del menú no encontrados');
        console.log('🔍 Elementos disponibles en DOM:', {
            allButtons: document.querySelectorAll('button').length,
            allMenus: document.querySelectorAll('.menu-dropdown').length,
            byId: {
                profileButton: !!document.getElementById('profileButton'),
                menuDropdown: !!document.getElementById('menuDropdown')
            }
        });
        return false;
    }
    
    // Función para abrir menú
    window.openProfileMenu = function() {
        console.log('📱 Profile.js - Abriendo menú...');
        
        if (!menuDropdown) {
            console.error('❌ No se puede abrir menú - elemento no encontrado');
            return;
        }
        
        // Usar ambas clases para compatibilidad
        menuDropdown.classList.add('show');
        menuDropdown.classList.add('active');
        menuDropdown.style.display = 'flex';
        
        // Prevenir scroll
        document.body.style.overflow = 'hidden';
        document.body.classList.add('menu-open');
        
        console.log('✅ Profile.js - Menú abierto. Clases:', menuDropdown.className);
        console.log('✅ Profile.js - Display:', menuDropdown.style.display);
    };
    
    // Función para cerrar menú
    window.closeProfileMenu = function() {
        console.log('📱 Profile.js - Cerrando menú...');
        
        if (!menuDropdown) {
            console.error('❌ No se puede cerrar menú - elemento no encontrado');
            return;
        }
        
        menuDropdown.classList.remove('show');
        menuDropdown.classList.remove('active');
        menuDropdown.style.display = '';
        
        // Restaurar scroll
        document.body.style.overflow = '';
        document.body.classList.remove('menu-open');
        
        console.log('✅ Profile.js - Menú cerrado');
    };
    
    // Función de debugging
    window.debugProfileMenu = function() {
        console.log('🔍 Profile Menu Debug Info:');
        console.log('===============================');
        console.log('Elements found:', {
            profileButton: !!profileMenuElements.profileButton,
            menuDropdown: !!profileMenuElements.menuDropdown,
            menuCloseBtn: !!profileMenuElements.menuCloseBtn
        });
        
        if (profileMenuElements.menuDropdown) {
            console.log('Menu dropdown state:', {
                className: profileMenuElements.menuDropdown.className,
                display: profileMenuElements.menuDropdown.style.display,
                visible: profileMenuElements.menuDropdown.classList.contains('show') || 
                        profileMenuElements.menuDropdown.classList.contains('active'),
                computedDisplay: window.getComputedStyle(profileMenuElements.menuDropdown).display,
                computedVisibility: window.getComputedStyle(profileMenuElements.menuDropdown).visibility,
                boundingRect: profileMenuElements.menuDropdown.getBoundingClientRect()
            });
        }
        
        console.log('Body classes:', document.body.className);
        console.log('Body overflow:', document.body.style.overflow);
        console.log('===============================');
    };
    
    // Event listener para abrir menú
    profileButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('📱 Profile.js - Click detectado en botón de perfil');
        window.openProfileMenu();
    });
    
    // También escuchar en touchstart para móviles
    profileButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('📱 Profile.js - Touch detectado en botón de perfil');
        window.openProfileMenu();
    });
    
    // Event listener para cerrar menú
    if (menuCloseBtn) {
        menuCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📱 Profile.js - Click en botón cerrar detectado');
            window.closeProfileMenu();
        });
        
        menuCloseBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📱 Profile.js - Touch en botón cerrar detectado');
            window.closeProfileMenu();
        });
    }
    
    // Cerrar menú al hacer click fuera
    document.addEventListener('click', function(e) {
        if ((menuDropdown.classList.contains('show') || menuDropdown.classList.contains('active')) && 
            !menuDropdown.contains(e.target) && 
            !profileButton.contains(e.target)) {
            console.log('📱 Profile.js - Click fuera del menú detectado');
            window.closeProfileMenu();
        }
    });
    
    // Cerrar menú con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && 
            (menuDropdown.classList.contains('show') || menuDropdown.classList.contains('active'))) {
            console.log('📱 Profile.js - Tecla Escape detectada');
            window.closeProfileMenu();
        }
    });
    
    console.log('✅ Profile.js - Menú toggle inicializado correctamente');
    
    // Test inmediato después de inicializar
    setTimeout(() => {
        console.log('🧪 Profile.js - Test inicial del menú:');
        window.debugProfileMenu();
    }, 500);
    
    return true;
}

// ===== FUNCIONES DE PERFIL =====

function loadProfilePhoto() {
    const user = window.auth?.currentUser;
    if (!user) return;
    
    const savedPhoto = localStorage.getItem(`${user.uid}_profilePhoto`);
    if (savedPhoto) {
        const profileImgs = [
            document.getElementById('headerProfileImg'),
            document.getElementById('menuProfileImg'),
            document.getElementById('profileAvatar')
        ];
        
        profileImgs.forEach(img => {
            if (img) img.src = savedPhoto;
        });
    }
}

function initializeDarkMode() {
    const user = window.auth?.currentUser;
    if (!user) return;
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;
    
    // Cargar preferencia guardada
    const savedDarkMode = localStorage.getItem(`${user.uid}_darkMode`) === 'true';
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    
    // Event listener para el toggle
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem(`${user.uid}_darkMode`, 'true');
            showNotification('Modo oscuro activado');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem(`${user.uid}_darkMode`, 'false');
            showNotification('Modo claro activado');
        }
    });
}

function setupPhotoUpload() {
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const photoInput = document.getElementById('photoInput');
    
    if (!changePhotoBtn || !photoInput) return;
    
    changePhotoBtn.addEventListener('click', function(e) {
        e.preventDefault();
        photoInput.click();
    });
    
    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            showNotification('Por favor selecciona una imagen válida', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showNotification('La imagen debe ser menor a 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            
            // Actualizar todas las imágenes de perfil
            const profileImgs = [
                document.getElementById('headerProfileImg'),
                document.getElementById('menuProfileImg'),
                document.getElementById('profileAvatar')
            ];
            
            profileImgs.forEach(img => {
                if (img) img.src = imageData;
            });
            
            // Guardar en localStorage
            const user = window.auth?.currentUser;
            if (user) {
                localStorage.setItem(`${user.uid}_profilePhoto`, imageData);
                showNotification('Foto de perfil actualizada correctamente');
            }
        };
        
        reader.readAsDataURL(file);
    });
}

function updateProfileStatistics() {
    const user = window.auth?.currentUser;
    if (!user) return;
    
    // Obtener datos del usuario
    const students = JSON.parse(getUserData('students') || '[]');
    const institutions = JSON.parse(getUserData('institutions') || '[]');
    
    // Calcular cursos totales
    let totalCourses = 0;
    institutions.forEach(institution => {
        if (institution.courses) {
            totalCourses += institution.courses.length;
        }
    });
    
    // Actualizar elementos de la UI
    const totalStudentsQuick = document.getElementById('totalStudentsQuick');
    const totalInstitutionsQuick = document.getElementById('totalInstitutionsQuick');
    const totalCoursesQuick = document.getElementById('totalCoursesQuick');
    
    if (totalStudentsQuick) {
        totalStudentsQuick.textContent = `${students.length} Estudiantes`;
    }
    
    if (totalInstitutionsQuick) {
        totalInstitutionsQuick.textContent = `${institutions.length} Instituciones`;
    }
    
    if (totalCoursesQuick) {
        totalCoursesQuick.textContent = `${totalCourses} Cursos`;
    }
}

function initializeAchievements() {
    const user = window.auth?.currentUser;
    if (!user) return;
    
    const students = JSON.parse(getUserData('students') || '[]');
    const activities = JSON.parse(getUserData('activities') || '[]');
    const institutions = JSON.parse(getUserData('institutions') || '[]');
    
    const achievements = [
        {
            id: 'first-activity',
            title: 'Primera Actividad',
            description: 'Registraste tu primera actividad',
            icon: 'fas fa-star',
            earned: activities.length > 0
        },
        {
            id: 'five-students',
            title: '5 Estudiantes',
            description: 'Tienes 5 estudiantes registrados',
            icon: 'fas fa-users',
            earned: students.length >= 5
        },
        {
            id: 'first-institution',
            title: 'Primera Institución',
            description: 'Creaste tu primera institución',
            icon: 'fas fa-university',
            earned: institutions.length > 0
        },
        {
            id: 'ten-activities',
            title: '10 Actividades',
            description: 'Has realizado 10 actividades',
            icon: 'fas fa-clipboard-check',
            earned: activities.length >= 10
        },
        {
            id: 'dedication',
            title: 'Dedicación Total',
            description: '25 actividades registradas',
            icon: 'fas fa-heart',
            earned: activities.length >= 25
        },
        {
            id: 'community-builder',
            title: 'Constructor de Comunidad',
            description: '15 estudiantes activos',
            icon: 'fas fa-hands-helping',
            earned: students.length >= 15
        }
    ];
    
    const earnedCount = achievements.filter(a => a.earned).length;
    
    // Actualizar progreso
    const progressElement = document.getElementById('achievementsProgress');
    const progressFill = document.getElementById('progressFill');
    
    if (progressElement) {
        progressElement.textContent = `${earnedCount} de ${achievements.length} logros obtenidos`;
    }
    
    if (progressFill) {
        const percentage = (earnedCount / achievements.length) * 100;
        progressFill.style.width = `${percentage}%`;
    }
    
    // Renderizar logros
    const achievementsGrid = document.getElementById('achievementsGrid');
    if (achievementsGrid) {
        achievementsGrid.innerHTML = achievements.map(achievement => `
            <div class="achievement-card ${achievement.earned ? 'earned' : ''}">
                <div class="achievement-icon">
                    <i class="${achievement.icon}"></i>
                </div>
                <h4>${achievement.title}</h4>
                <p>${achievement.description}</p>
            </div>
        `).join('');
    }
}

function setupEditNameFunction() {
    const editNameBtn = document.getElementById('editNameBtn');
    const teacherName = document.getElementById('teacherName');
    
    if (!editNameBtn || !teacherName) return;
    
    editNameBtn.addEventListener('click', function() {
        const currentName = teacherName.textContent;
        const newName = prompt('Ingresa tu nuevo nombre:', currentName);
        
        if (newName && newName.trim() !== '' && newName !== currentName) {
            // Actualizar en Firebase Auth
            const user = window.auth?.currentUser;
            if (user) {
                user.updateProfile({
                    displayName: newName.trim()
                }).then(() => {
                    // Actualizar en la UI
                    const teacherNameElements = [
                        document.getElementById('headerTeacherName'),
                        document.getElementById('menuTeacherName'),
                        document.getElementById('teacherName')
                    ];
                    
                    teacherNameElements.forEach(element => {
                        if (element) {
                            element.textContent = newName.trim();
                        }
                    });
                    
                    showNotification('Nombre actualizado correctamente');
                }).catch((error) => {
                    console.error('Error al actualizar nombre:', error);
                    showNotification('Error al actualizar el nombre', 'error');
                });
            }
        }
    });
}

// ===== FUNCIÓN PRINCIPAL DE INICIALIZACIÓN =====

function initializeProfile() {
    console.log('🚀 Profile.js - Inicializando perfil...');
    
    const user = window.auth?.currentUser;
    if (!user) {
        console.log('❌ Usuario no autenticado');
        return;
    }
    
    // Actualizar nombre del docente
    const displayName = user.displayName || user.email.split('@')[0];
    
    const teacherNameElements = [
        document.getElementById('headerTeacherName'),
        document.getElementById('menuTeacherName'),
        document.getElementById('teacherName')
    ];
    
    teacherNameElements.forEach(element => {
        if (element) {
            element.textContent = displayName;
        }
    });
    
    // Actualizar fecha de registro
    const joinDateElement = document.getElementById('joinDate');
    if (joinDateElement && user.metadata?.creationTime) {
        const joinDate = new Date(user.metadata.creationTime).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long'
        });
        joinDateElement.textContent = joinDate;
    }
    
    // Cargar foto de perfil
    loadProfilePhoto();
    
    // Inicializar modo oscuro
    initializeDarkMode();
    
    // CRÍTICO: Inicializar menú toggle con delay
    setTimeout(() => {
        const menuInitialized = initializeMenuToggle();
        if (!menuInitialized) {
            console.warn('⚠️ Menú toggle no se pudo inicializar, reintentando...');
            setTimeout(() => {
                initializeMenuToggle();
            }, 1000);
        }
    }, 300);
    
    // Configurar subida de fotos
    setupPhotoUpload();
    
    // Configurar edición de nombre
    setupEditNameFunction();
    
    // Cargar estadísticas
    updateProfileStatistics();
    
    // Inicializar logros
    initializeAchievements();
    
    // Configurar botón de estadísticas
    const viewStatsBtn = document.getElementById('viewStatsBtn');
    if (viewStatsBtn) {
        viewStatsBtn.addEventListener('click', function() {
            showNotification('Página de estadísticas en desarrollo', 'info');
        });
    }
    
    // Configurar estadísticas link
    const estadisticasLink = document.getElementById('estadisticas-link');
    if (estadisticasLink) {
        estadisticasLink.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Página de estadísticas en desarrollo', 'info');
        });
    }
    
    // Configurar logout
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                window.auth.signOut().then(() => {
                    localStorage.clear(); // Limpiar datos locales
                    window.location.href = 'login.html';
                }).catch((error) => {
                    console.error('Error al cerrar sesión:', error);
                    showNotification('Error al cerrar sesión', 'error');
                });
            }
        });
    }
    
    console.log('✅ Profile.js - Perfil inicializado correctamente');
}

// ===== CONFIGURACIÓN FIREBASE Y AUTENTICACIÓN =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Profile.js - DOM cargado');
    
    // Verificar que Firebase esté disponible
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase no está disponible');
        return;
    }
    
    // Verificar que la configuración de Firebase esté lista
    if (!window.auth) {
        console.log('⏳ Esperando configuración de Firebase...');
        const checkAuth = setInterval(() => {
            if (window.auth) {
                clearInterval(checkAuth);
                setupAuthListener();
            }
        }, 100);
    } else {
        setupAuthListener();
    }
    
    function setupAuthListener() {
        window.auth.onAuthStateChanged((user) => {
            if (user) {
                console.log(`👤 Usuario autenticado: ${user.uid} (${user.email})`);
                
                // Esperar más tiempo para asegurar que el DOM esté completamente listo
                setTimeout(() => {
                    initializeProfile();
                }, 1000);
                
            } else {
                console.log('❌ Usuario no autenticado, redirigiendo...');
                window.location.href = 'login.html';
            }
        });
    }
});

// ===== CSS ADICIONAL PARA GARANTIZAR FUNCIONAMIENTO =====
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    /* Profile.js - Estilos adicionales para menú toggle */
    .menu-dropdown {
        position: fixed !important;
        top: 0 !important;
        right: -100% !important;
        width: 100% !important;
        height: 100vh !important;
        background: linear-gradient(135deg, var(--profile-primary, #FFB6C1) 0%, var(--profile-secondary, #B0E0E6) 100%) !important;
        z-index: 9999 !important;
        transition: right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        overflow-y: auto !important;
        display: none !important;
        flex-direction: column !important;
    }
    
    .menu-dropdown.show,
    .menu-dropdown.active {
        right: 0 !important;
        display: flex !important;
    }
    
    /* Asegurar que el botón funcione */
    .profile-button {
        cursor: pointer !important;
        pointer-events: all !important;
        position: relative !important;
        z-index: 10 !important;
    }
    
    /* Prevenir scroll cuando el menú está abierto */
    body.menu-open {
        overflow: hidden !important;
    }
    
    @keyframes slideInNotification {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutNotification {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification {
        font-family: 'Quicksand', sans-serif;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
`;
document.head.appendChild(additionalStyles);

// Hacer funciones globales disponibles inmediatamente
window.profileMenuElements = profileMenuElements;

console.log('✅ Profile.js - Módulo de perfil cargado completamente con debugging avanzado');