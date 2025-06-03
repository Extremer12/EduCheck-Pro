/**
 * EduCheck Pro - Sistema Profesional de Gestión Educativa
 * Archivo principal de la aplicación
 * 
 * @description Sistema integral para la gestión de asistencia, 
 *              instituciones educativas y administración académica
 * @version 2.0.0
 * @author EduCheck Pro Team
 * @created 2024
 */

// ===== VARIABLES GLOBALES =====
let deferredPrompt = null;
let currentAttendanceActivity = null;

// ===== FUNCIÓN PARA ACTUALIZAR INFO DEL USUARIO =====
function updateUserInfo(user) {
    const teacherNameElements = document.querySelectorAll('#teacher-name, .menu-header h3');
    const displayName = user.displayName || user.email.split('@')[0];
    
    teacherNameElements.forEach(element => {
        if (element) {
            element.textContent = displayName;
        }
    });
}

// ===== MENÚ TOGGLE =====
function setupToggleMenu() {
    const profileButton = document.querySelector('.profile-button');
    const menuDropdown = document.querySelector('.menu-dropdown');
    const menuCloseBtn = document.getElementById('menu-close-btn');
    const body = document.body;
    
    if (profileButton && menuDropdown) {
        // Función para abrir el menú
        function openMenu() {
            menuDropdown.classList.add('active');
            body.classList.add('menu-open');
            
            // Actualizar visibilidad del menú al abrir
            updateMenuVisibility();
            
            // Enfocar el botón de cierre para accesibilidad
            setTimeout(() => {
                if (menuCloseBtn) {
                    menuCloseBtn.focus();
                }
            }, 100);
        }
        
        // Función para cerrar el menú
        function closeMenu() {
            menuDropdown.classList.remove('active');
            body.classList.remove('menu-open');
            
            // Devolver el foco al botón de perfil
            setTimeout(() => {
                profileButton.focus();
            }, 100);
        }
        
        // Toggle del menú al hacer clic en el botón de perfil
        profileButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (menuDropdown.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
        
        // Cerrar menú con el botón X
        if (menuCloseBtn) {
            menuCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeMenu();
            });
        }
        
        // Cerrar menú con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuDropdown.classList.contains('active')) {
                closeMenu();
            }
        });
        
        // Cerrar menú al hacer clic en los enlaces del menú
        const menuItems = menuDropdown.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Solo cerrar si no es el toggle de modo oscuro
                if (!item.closest('.dark-mode-toggle')) {
                    setTimeout(closeMenu, 100); // Pequeño delay para que la navegación funcione
                }
            });
        });
        
        // Evitar que el menú se cierre al interactuar con elementos internos
        menuDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Gestión específica para elementos que deben cerrar el menú
        const elementsToClose = [
            '#institutions-list',   // ACTUALIZADO: cambiar de students-list
            '#quick-courses',       // NUEVO
            '#profile', 
            '#gallery',
            '#attendance-reports',  // NUEVO
            '#global-stats',        // NUEVO
            '#installApp',
            '#logout',
            '#deleteAccount',
            '#donationBtn'
        ];
        
        elementsToClose.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener('click', (e) => {
                    setTimeout(closeMenu, 100);
                });
            }
        });
        
        // Evitar el scroll del body cuando el menú está abierto
        menuDropdown.addEventListener('scroll', (e) => {
            e.stopPropagation();
        });
        
        // Función global para cerrar el menú (para debugging)
        window.closeMenu = closeMenu;
        window.openMenu = openMenu;
        
        console.log('✅ Menú toggle fullscreen configurado correctamente con nueva arquitectura');
    }
}

// ===== PWA INSTALLATION =====
function setupInstallApp() {
    const installButton = document.getElementById('installApp');
    let canInstall = false;
    
    if (installButton) {
        installButton.style.display = 'flex';
    }
    
    // Capturar evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        canInstall = true;
    });
    
    // Event listener del botón
    if (installButton) {
        installButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const menuDropdown = document.querySelector('.menu-dropdown');
            if (menuDropdown) {
                menuDropdown.classList.remove('active');
            }
            
            if (!deferredPrompt || !canInstall) {
                showNotification('Esta aplicación ya está instalada o no se puede instalar desde este navegador', 'info');
                return;
            }
            
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                showNotification('¡Aplicación instalándose!', 'success');
            } else {
                showNotification('Instalación cancelada', 'info');
            }
            
            deferredPrompt = null;
            canInstall = false;
        });
    }
    
    // Detectar cuando la app está instalada
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        canInstall = false;
        showNotification('¡Aplicación instalada correctamente!', 'success');
    });
}

// ===== AUTENTICACIÓN =====
function setupAuthButtons() {
    const logoutButton = document.getElementById('logout');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await window.auth.signOut();
                showNotification('Sesión cerrada correctamente', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                showNotification('Error al cerrar sesión', 'error');
            }
        });
    }

    // Observer de autenticación
    window.auth.onAuthStateChanged((user) => {
        if (!user && !window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        } else if (user && window.location.pathname.includes('login.html')) {
            window.location.href = 'index.html';
        }

        if (user) {
            updateUserInfo(user);
        }
    });
}

// ===== PREVISUALIZACIÓN DE IMÁGENES =====
function initializeImagePreview() {
    const imageInput = document.getElementById('activityImage');
    const imagePreview = document.querySelector('.image-preview');
    const previewImg = document.getElementById('imagePreview');
    const removeButton = document.querySelector('.remove-image');
    const placeholder = document.querySelector('.upload-placeholder');

    if (imageInput && imagePreview && previewImg) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    imagePreview.style.display = 'block';
                    placeholder.style.display = 'none';
                    removeButton.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        if (removeButton) {
            removeButton.addEventListener('click', function() {
                imageInput.value = '';
                previewImg.src = '#';
                imagePreview.style.display = 'none';
                placeholder.style.display = 'flex';
                removeButton.style.display = 'none';
            });
        }
    }
}

// ===== SCROLL TO TOP =====
function setupScrollToTop() {
    const scrollButton = document.getElementById('scroll-to-top');
    
    if (scrollButton) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollButton.classList.add('show');
            } else {
                scrollButton.classList.remove('show');
            }
        });
        
        scrollButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// ===== MODO OSCURO =====
function setupDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Verificar preferencia guardada o del sistema
    const savedTheme = localStorage.getItem('darkMode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Determinar tema inicial
    let isDarkMode = false;
    if (savedTheme !== null) {
        isDarkMode = savedTheme === 'true';
    } else {
        isDarkMode = systemPrefersDark;
    }
    
    // Aplicar tema inicial
    applyTheme(isDarkMode);
    
    // Configurar toggle
    if (darkModeToggle) {
        darkModeToggle.checked = isDarkMode;
        
        darkModeToggle.addEventListener('change', () => {
            const newTheme = darkModeToggle.checked;
            applyTheme(newTheme);
            localStorage.setItem('darkMode', newTheme.toString());
            
            // Notificación de cambio
            const message = newTheme ? 'Modo oscuro activado' : 'Modo claro activado';
            showNotification(message, 'info');
        });
    }
    
    // Escuchar cambios en la preferencia del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('darkMode') === null) {
            applyTheme(e.matches);
            if (darkModeToggle) {
                darkModeToggle.checked = e.matches;
            }
        }
    });
}

function applyTheme(isDark) {
    const body = document.body;
    
    if (isDark) {
        body.classList.add('dark-mode');
        
        // Actualizar meta theme-color para móviles
        updateThemeColor('#2d2d2d');
        
        console.log('🌙 Modo oscuro activado');
    } else {
        body.classList.remove('dark-mode');
        
        // Restaurar color original
        updateThemeColor('#FFB6C1');
        
        console.log('☀️ Modo claro activado');
    }
    
    // Trigger para re-renderizar elementos si es necesario
    document.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { isDark } 
    }));
}

function updateThemeColor(color) {
    // Actualizar meta theme-color
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = color;
    
    // Actualizar también para Apple
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleMeta) {
        appleMeta = document.createElement('meta');
        appleMeta.name = 'apple-mobile-web-app-status-bar-style';
        document.head.appendChild(appleMeta);
    }
    appleMeta.content = color === '#2d2d2d' ? 'black-translucent' : 'default';
}

// AGREGAR función para toggle rápido (opcional):
function toggleDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = !darkModeToggle.checked;
        darkModeToggle.dispatchEvent(new Event('change'));
    }
}

// AGREGAR escuchador para atajos de teclado (opcional):
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + D para toggle modo oscuro
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleDarkMode();
    }
});

// Hacer función global para debugging
window.toggleDarkMode = toggleDarkMode;

// ===== ELIMINAR CUENTA =====
function setupDeleteAccount() {
    const deleteAccountBtn = document.getElementById('deleteAccount');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const closeConfirmBtn = document.getElementById('closeConfirmModal');
    
    if (deleteAccountBtn && deleteConfirmModal) {
        deleteAccountBtn.addEventListener('click', (e) => {
            e.preventDefault();
            deleteConfirmModal.classList.add('active');
            
            const menuDropdown = document.querySelector('.menu-dropdown');
            if (menuDropdown) {
                menuDropdown.classList.remove('active');
            }
        });
        
        function closeModal() {
            deleteConfirmModal.classList.remove('active');
        }
        
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', closeModal);
        }
        
        if (closeConfirmBtn) {
            closeConfirmBtn.addEventListener('click', closeModal);
        }
        
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', async () => {
                try {
                    const user = window.auth.currentUser;
                    if (user) {
                        Object.keys(localStorage).forEach(key => {
                            if (key.startsWith(user.uid + '_')) {
                                localStorage.removeItem(key);
                            }
                        });
                        
                        await user.delete();
                        showNotification('Cuenta eliminada correctamente', 'success');
                        
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 1500);
                    }
                } catch (error) {
                    console.error('Error al eliminar la cuenta:', error);
                    
                    if (error.code === 'auth/requires-recent-login') {
                        showNotification('Por seguridad, debes iniciar sesión nuevamente antes de eliminar tu cuenta.', 'error');
                        setTimeout(() => {
                            window.auth.signOut().then(() => {
                                window.location.href = 'login.html';
                            });
                        }, 2000);
                    } else {
                        showNotification('Error al eliminar la cuenta: ' + error.message, 'error');
                    }
                } finally {
                    closeModal();
                }
            });
        }
        
        deleteConfirmModal.addEventListener('click', (e) => {
            if (e.target === deleteConfirmModal) {
                closeModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && deleteConfirmModal.classList.contains('active')) {
                closeModal();
            }
        });
    }
}

// ===== BOTÓN DONACIÓN =====
function setupDonationButton() {
    const donationBtn = document.getElementById('donationBtn');
    
    if (donationBtn) {
        donationBtn.addEventListener('click', () => {
            showNotification('¡Gracias por tu interés en donar! Esta función estará disponible próximamente.', 'info');
            
            const menuDropdown = document.querySelector('.menu-dropdown');
            if (menuDropdown) {
                menuDropdown.classList.remove('active');
            }
        });
    }
}

// ===== NOTIFICACIONES =====
function showNotification(message, type = 'success') {
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notification.classList.add('show');
    
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    }
    
    setTimeout(() => {
        if (notification.classList.contains('show')) {
            notification.classList.remove('show');
        }
    }, 5000);
}

// ===== ESTILOS PARA NOTIFICACIONES =====
function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 2000;
            max-width: 350px;
            transform: translateX(120%);
            transition: transform 0.3s ease;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.8rem;
        }
        
        .notification i {
            font-size: 1.5rem;
        }
        
        .notification.success i {
            color: #28a745;
        }
        
        .notification.error i {
            color: #dc3545;
        }
        
        .notification.info i {
            color: #17a2b8;
        }
        
        .close-notification {
            background: none;
            border: none;
            color: #888;
            cursor: pointer;
            padding: 0.5rem;
        }
        
        .close-notification:hover {
            color: #333;
        }
    `;
    document.head.appendChild(style);
}

// ===== GESTIÓN DE DATOS POR USUARIO =====
// ===== FUNCIONES AUXILIARES MEJORADAS =====
function getUserData(key) {
    const user = firebase.auth()?.currentUser;
    if (!user) {
        console.warn('❌ No hay usuario autenticado para obtener datos');
        return null;
    }
    
    try {
        // Intentar usar la función global del sistema principal si existe
        if (typeof window.getUserDataFromApp === 'function') {
            return window.getUserDataFromApp(key);
        }
        
        // Fallback a localStorage directo
        const data = localStorage.getItem(`${user.uid}_${key}`);
        return data;
    } catch (error) {
        console.error(`❌ Error obteniendo datos para ${key}:`, error);
        return null;
    }
}

function setUserData(key, value) {
    const user = firebase.auth()?.currentUser;
    if (!user) {
        console.warn('❌ No hay usuario autenticado para guardar datos');
        return false;
    }
    
    try {
        // Intentar usar la función global del sistema principal si existe
        if (typeof window.setUserDataFromApp === 'function') {
            return window.setUserDataFromApp(key, value);
        }
        
        // Fallback a localStorage directo
        localStorage.setItem(`${user.uid}_${key}`, value);
        return true;
    } catch (error) {
        console.error(`❌ Error guardando datos para ${key}:`, error);
        return false;
    }
}

// NUEVA FUNCIÓN: Migración de datos antiguos al nuevo sistema
function migrateToNewArchitecture() {
    const user = window.auth?.currentUser;
    if (!user) return;
    
    console.log('🔄 EduCheck Pro - Verificando migración...');
    
    const establishments = JSON.parse(getUserData('establishments') || '[]');
    const oldStudents = JSON.parse(getUserData('students') || '[]');
    
    if (oldStudents.length > 0 && establishments.length === 0) {
        console.log('📦 EduCheck Pro - Migrando datos del sistema anterior...');
        
        const defaultEstablishment = {
            id: 'migrated-default',
            name: 'Institución Principal',
            type: 'escuela',
            address: '',
            phone: '',
            notes: 'Institución creada automáticamente durante la migración a EduCheck Pro',
            isDefault: true,
            createdAt: new Date().toISOString(),
            createdBy: user.uid
        };
        
        const defaultCourse = {
            id: 'migrated-course',
            institutionId: 'migrated-default',
            name: 'Curso General',
            level: 'mixto',
            notes: 'Curso creado automáticamente durante la migración a EduCheck Pro',
            createdAt: new Date().toISOString(),
            students: oldStudents.map(student => ({
                ...student,
                institutionId: 'migrated-default',
                courseId: 'migrated-course'
            }))
        };
        
        setUserData('establishments', JSON.stringify([defaultEstablishment]));
        setUserData('courses', JSON.stringify([defaultCourse]));
        setUserData('migrationCompleted', 'true');
        
        console.log('✅ EduCheck Pro - Migración completada exitosamente');
        showNotification('¡Bienvenido a EduCheck Pro! Sistema actualizado correctamente', 'success');
    }
}

// NUEVA FUNCIÓN: Obtener estadísticas globales para el menú
function getGlobalStats() {
    const user = window.auth?.currentUser;
    if (!user) return null;
    
    const establishments = JSON.parse(getUserData('establishments') || '[]');
    const courses = JSON.parse(getUserData('courses') || '[]');
    const students = JSON.parse(getUserData('students') || '[]'); // NUEVO: obtener estudiantes reales
    
    return {
        institutions: establishments.length,
        courses: courses.length,
        students: students.length, // ACTUALIZADO: usar datos reales
        hasDefault: establishments.some(e => e.isDefault)
    };
}

// NUEVA FUNCIÓN: Actualizar información en tiempo real del menú
function updateMenuInfo() {
    const stats = getGlobalStats();
    if (!stats) return;
    
    // Actualizar texto dinámico en el menú
    const institutionsItem = document.querySelector('#institutions-list .menu-item-content p');
    if (institutionsItem) {
        if (stats.institutions === 0) {
            institutionsItem.textContent = 'Agregar tu primera institución';
        } else {
            institutionsItem.textContent = `${stats.institutions} instituciones • ${stats.courses} cursos`;
        }
    }
    
    // NUEVO: Actualizar información de estudiantes
    const studentsItem = document.querySelector('#students-list .menu-item-content p');
    if (studentsItem) {
        if (stats.students === 0) {
            studentsItem.textContent = 'Agregar tus primeros estudiantes';
        } else {
            studentsItem.textContent = `${stats.students} estudiantes registrados`;
        }
    }
    
    const quickCoursesItem = document.querySelector('#quick-courses .menu-item-content p');
    if (quickCoursesItem && stats.hasDefault) {
        const defaultInstitution = getDefaultInstitution();
        const institutionCourses = JSON.parse(getUserData('courses') || '[]')
            .filter(c => c.establishmentId === defaultInstitution?.id);
        
        quickCoursesItem.textContent = `${institutionCourses.length} cursos disponibles`;
    }
}

// ACTUALIZAR función migrateTemporaryData existente
function migrateTemporaryData() {
    const user = window.auth?.currentUser;
    if (!user) return;
    
    // Migración de datos temporales existente
    const tempActivities = localStorage.getItem('activities');
    if (tempActivities && !getUserData('activities')) {
        setUserData('activities', tempActivities);
        localStorage.removeItem('activities');
        console.log('📦 Datos de actividades migrados al usuario');
    }
    
    const tempStudents = localStorage.getItem('students');
    if (tempStudents && !getUserData('students')) {
        setUserData('students', tempStudents);
        localStorage.removeItem('students');
        console.log('👥 Datos de estudiantes migrados al usuario');
    }
    
    // NUEVA: Migración a la nueva arquitectura
    migrateToNewArchitecture();
    
    // Actualizar información del menú
    updateMenuInfo();
}

// ===== FUNCIONES AUXILIARES =====
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}

function formatDateForInput(dateString) {
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch (error) {
        return new Date().toISOString().split('T')[0];
    }
}

// ===== GESTIÓN DE ACTIVIDADES =====
function addActivity(event) {
    event.preventDefault();
    
    const activityName = document.getElementById('activityName').value;
    const activityDate = document.getElementById('activityDate').value;
    
    try {
        const imageInput = document.getElementById('activityImage');
        
        if (imageInput && imageInput.files && imageInput.files[0]) {
            readFileAsDataURL(imageInput.files[0]).then(data => {
                saveActivityWithImage(activityName, activityDate, data);
            });
        } else {
            saveActivityWithImage(activityName, activityDate, null);
        }
    } catch (error) {
        console.error('Error al agregar actividad:', error);
        showNotification('Error al agregar la actividad: ' + error.message, 'error');
    }
}

function saveActivityWithImage(name, date, imageData) {
    try {
        const activityId = Date.now();
        const activity = {
            id: activityId,
            name: name,
            date: date,
            imageData: imageData
        };

        let activities = [];
        const savedActivities = getUserData('activities');
        
        if (savedActivities) {
            if (typeof savedActivities === 'string') {
                activities = JSON.parse(savedActivities);
            } else {
                activities = savedActivities;
            }
        }
        
        activities.unshift(activity);
        setUserData('activities', JSON.stringify(activities));

        // Limpiar formulario
        document.querySelector('.activity-form').reset();
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.src = '#';
            preview.style.display = 'none';
        }
        document.querySelector('.remove-image').style.display = 'none';
        document.querySelector('.upload-placeholder').style.display = 'flex';

        loadActivities();
        showNotification('Actividad agregada correctamente', 'success');
    } catch (error) {
        console.error('Error al guardar actividad:', error);
        showNotification('Error al guardar la actividad', 'error');
    }
}

function loadActivities() {
    const activitiesGrid = document.getElementById('activities-grid');
    if (!activitiesGrid) return;

    let activities = [];
    
    try {
        const savedActivities = getUserData('activities');
        
        if (savedActivities) {
            activities = JSON.parse(savedActivities);
        }
        
        // Aplicar filtros
        const searchTerm = document.getElementById('activity-search')?.value.toLowerCase();
        const dateFilter = document.getElementById('activity-date-filter')?.value;

        if (searchTerm) {
            activities = activities.filter(activity => 
                activity.name.toLowerCase().includes(searchTerm)
            );
        }

        if (dateFilter) {
            activities = activities.filter(activity => {
                const activityDate = new Date(activity.date);
                const filterDate = new Date(dateFilter);
                return activityDate.toDateString() === filterDate.toDateString();
            });
        }

        // Renderizar actividades
        activitiesGrid.innerHTML = activities.length ? activities.map(activity => `
            <div class="activity-card" data-id="${activity.id}">
                <div class="activity-header">
                    <div class="activity-title">
                        <h3>
                            <span class="title-text">${activity.name}</span>
                            <button class="edit-inline-btn" onclick="editField('title', '${activity.id}')" title="Editar título">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                        </h3>
                    </div>
                    
                    <div class="activity-date">
                        <i class="fas fa-calendar"></i>
                        <span class="date-text">${formatDate(activity.date)}</span>
                        <button class="edit-inline-btn" onclick="editField('date', '${activity.id}')" title="Editar fecha">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                    </div>
                    
                    <button class="delete-activity-icon" onclick="deleteActivity('${activity.id}')" title="Eliminar actividad">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                ${activity.imageData ? `
                    <div class="activity-image" onclick="openGallery('${activity.id}')">
                        <img src="${activity.imageData}" alt="${activity.name}">
                        <div class="image-actions">
                            <button class="image-action-btn" onclick="event.stopPropagation(); handleImage('${activity.id}', event)" title="Eliminar imagen">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                ` : `
                    <label class="add-image-placeholder" for="image-${activity.id}">
                        <input type="file" id="image-${activity.id}" class="image-input" accept="image/*" onchange="addImage('${activity.id}', event)" hidden>
                        <div class="upload-content">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <span>Agregar imagen</span>
                        </div>
                    </label>
                `}

                <button class="attendance-btn" onclick="openAttendanceModal('${activity.id}')">
                    <i class="fas fa-clipboard-check"></i>
                    Tomar Asistencia
                </button>
            </div>
        `).join('') : `
            <div class="empty-state">
                <i class="fas fa-calendar-plus"></i>
                <p>No hay actividades registradas</p>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar actividades:', error);
        activitiesGrid.innerHTML = `
            <div class="empty-state error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al cargar actividades</p>
            </div>
        `;
    }
}

function editField(type, activityId) {
    const card = document.querySelector(`.activity-card[data-id="${activityId}"]`);
    const element = card.querySelector(`.${type}-text`);
    const currentValue = element.textContent.trim();
    
    if (element.querySelector('.edit-input')) return;
    
    const container = document.createElement('div');
    container.className = 'edit-container';
    
    if (type === 'title') {
        container.innerHTML = `
            <input type="text" class="edit-input" value="${currentValue}">
            <button class="save-edit" onclick="saveEdit('${type}', '${activityId}')">
                <i class="fas fa-check"></i>
            </button>
        `;
    } else if (type === 'date') {
        const dateValue = formatDateForInput(currentValue);
        container.innerHTML = `
            <input type="date" class="edit-input" value="${dateValue}">
            <button class="save-edit" onclick="saveEdit('${type}', '${activityId}')">
                <i class="fas fa-check"></i>
            </button>
        `;
    }
    
    element.innerHTML = '';
    element.appendChild(container);
    const input = container.querySelector('input');
    input.focus();
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            loadActivities();
        }
        if (e.key === 'Enter') {
            saveEdit(type, activityId);
        }
    });
}

function saveEdit(type, activityId) {
    const card = document.querySelector(`.activity-card[data-id="${activityId}"]`);
    const input = card.querySelector(`.${type}-text .edit-input`);
    const newValue = input.value.trim();

    if (!newValue) {
        showNotification('El campo no puede estar vacío', 'error');
        return;
    }

    if (confirm('¿Estás seguro de que deseas guardar los cambios?')) {
        const activities = JSON.parse(getUserData('activities') || '[]');
        const index = activities.findIndex(a => a.id.toString() === activityId.toString());

        if (index !== -1) {
            if (type === 'title') {
                activities[index].name = newValue;
            } else if (type === 'date') {
                activities[index].date = newValue;
            }
            
            setUserData('activities', JSON.stringify(activities));
            showNotification('Actividad actualizada correctamente', 'success');
            loadActivities();
        } else {
            showNotification('Error: No se encontró la actividad', 'error');
        }
    } else {
        loadActivities();
    }
}

function deleteActivity(activityId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer.')) {
        try {
            const activities = JSON.parse(getUserData('activities') || '[]');
            const filteredActivities = activities.filter(a => a.id.toString() !== activityId.toString());
            
            setUserData('activities', JSON.stringify(filteredActivities));
            loadActivities();
            showNotification('Actividad eliminada correctamente', 'success');
        } catch (error) {
            console.error('Error al eliminar actividad:', error);
            showNotification('Error al eliminar la actividad', 'error');
        }
    }
}

function addImage(activityId, event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const activities = JSON.parse(getUserData('activities') || '[]');
            const index = activities.findIndex(a => a.id.toString() === activityId.toString());
            
            if (index !== -1) {
                activities[index].imageData = e.target.result;
                setUserData('activities', JSON.stringify(activities));
                loadActivities();
                showNotification('Imagen agregada correctamente', 'success');
            }
        } catch (error) {
            console.error('Error al agregar imagen:', error);
            showNotification('Error al agregar la imagen', 'error');
        }
    };
    reader.readAsDataURL(file);
}

function handleImage(activityId, event) {
    event.stopPropagation();
    
    if (confirm('¿Deseas eliminar esta imagen?')) {
        try {
            const activities = JSON.parse(getUserData('activities') || '[]');
            const index = activities.findIndex(a => a.id.toString() === activityId.toString());
            
            if (index !== -1) {
                activities[index].imageData = null;
                setUserData('activities', JSON.stringify(activities));
                loadActivities();
                showNotification('Imagen eliminada correctamente', 'success');
            }
        } catch (error) {
            console.error('Error al eliminar imagen:', error);
            showNotification('Error al eliminar la imagen', 'error');
        }
    }
}

function openGallery(activityId) {
    window.location.href = `gallery.html?activity=${activityId}`;
}

// ===== SISTEMA DE ASISTENCIA =====
function openAttendanceModal(activityId) {
    console.log('🎯 Abriendo modal de asistencia para actividad:', activityId);
    
    const user = window.auth?.currentUser;
    if (!user) {
        showNotification('Debes estar autenticado para tomar asistencia', 'error');
        return;
    }

    const activities = JSON.parse(getUserData('activities') || '[]');
    const activity = activities.find(a => a.id.toString() === activityId.toString());
    
    if (!activity) {
        showNotification('Actividad no encontrada', 'error');
        return;
    }

    currentAttendanceActivity = activity;
    
    document.getElementById('attendance-activity-name').textContent = activity.name;
    document.getElementById('attendance-activity-date').textContent = formatDate(activity.date);
    
    loadStudentsForAttendance();
    
    const modal = document.getElementById('attendance-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function loadStudentsForAttendance() {
    const user = window.auth?.currentUser;
    if (!user) return;

    // NUEVO: Intentar obtener estudiantes del nuevo sistema
    let students = [];
    
    if (window.getStudentsForAttendance && typeof window.getStudentsForAttendance === 'function') {
        // Usar el nuevo sistema de estudiantes si está disponible
        students = window.getStudentsForAttendance();
    } else {
        // Fallback al sistema anterior
        students = JSON.parse(getUserData('students') || '[]');
    }
    
    const attendanceList = document.getElementById('students-attendance-list');
    const noStudentsMessage = document.getElementById('no-students-message');
    
    document.getElementById('total-students').textContent = students.length;
    
    if (students.length === 0) {
        attendanceList.style.display = 'none';
        noStudentsMessage.style.display = 'block';
        return;
    }

    attendanceList.style.display = 'block';
    noStudentsMessage.style.display = 'none';

    const existingAttendance = getExistingAttendance(currentAttendanceActivity.id);
    
    attendanceList.innerHTML = students.map(student => {
        const studentAttendance = existingAttendance?.find(a => a.studentId === student.id);
        const status = studentAttendance?.status || 'present';
        const notes = studentAttendance?.notes || '';
        
        return `
            <div class="student-attendance-item" data-student-id="${student.id}">
                <div class="student-info">
                    <div class="student-avatar">
                        ${(student.name || student.fullName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div class="student-details">
                        <h6>${student.fullName || `${student.name} ${student.lastname}`}</h6>
                        <p>${student.grade || student.courseName || 'Sin curso'}</p>
                    </div>
                </div>
                
                <div class="attendance-controls">
                    <div class="attendance-toggle">
                        <button class="attendance-option present ${status === 'present' ? 'active' : ''}" 
                                onclick="setAttendanceStatus('${student.id}', 'present')" 
                                title="Marcar como presente">
                            <i class="fas fa-check"></i>
                            Presente
                        </button>
                        <button class="attendance-option absent ${status === 'absent' ? 'active' : ''}" 
                                onclick="setAttendanceStatus('${student.id}', 'absent')" 
                                title="Marcar como ausente">
                            <i class="fas fa-times"></i>
                            Ausente
                        </button>
                    </div>
                    
                    <input type="text" 
                           class="student-notes" 
                           placeholder="Notas..."
                           value="${notes}"
                           data-student-id="${student.id}"
                           title="Agregar notas sobre el estudiante">
                </div>
            </div>
        `;
    }).join('');

    updateAttendanceCounters();
}

function setAttendanceStatus(studentId, status) {
    const studentItem = document.querySelector(`[data-student-id="${studentId}"]`);
    if (!studentItem) return;

    const buttons = studentItem.querySelectorAll('.attendance-option');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const activeButton = studentItem.querySelector(`.attendance-option.${status}`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    updateAttendanceCounters();
}

function updateAttendanceCounters() {
    const presentCount = document.querySelectorAll('.attendance-option.present.active').length;
    const totalStudents = document.querySelectorAll('.student-attendance-item').length;
    const absentCount = totalStudents - presentCount;
    
    document.getElementById('present-count').textContent = presentCount;
    document.getElementById('absent-count').textContent = absentCount;
}

function markAllPresent() {
    const students = document.querySelectorAll('.student-attendance-item');
    students.forEach(student => {
        const studentId = student.dataset.studentId;
        setAttendanceStatus(studentId, 'present');
    });
    
    showNotification('Todos los estudiantes marcados como presentes', 'success');
}

function markAllAbsent() {
    const students = document.querySelectorAll('.student-attendance-item');
    students.forEach(student => {
        const studentId = student.dataset.studentId;
        setAttendanceStatus(studentId, 'absent');
    });
    
    showNotification('Todos los estudiantes marcados como ausentes', 'info');
}

function getExistingAttendance(activityId) {
    const user = window.auth?.currentUser;
    if (!user) return null;

    const attendanceRecords = JSON.parse(getUserData('attendance') || '[]');
    const record = attendanceRecords.find(r => r.activityId === activityId);
    return record?.attendance || null;
}

function saveAttendance() {
    const user = window.auth?.currentUser;
    if (!user) {
        showNotification('Debes estar autenticado para guardar asistencia', 'error');
        return;
    }

    if (!currentAttendanceActivity) {
        showNotification('Error: No hay actividad seleccionada', 'error');
        return;
    }

    const attendanceData = [];
    const studentItems = document.querySelectorAll('.student-attendance-item');
    
    studentItems.forEach(item => {
        const studentId = item.dataset.studentId;
        const activeButton = item.querySelector('.attendance-option.active');
        const notesInput = item.querySelector('.student-notes');
        
        const status = activeButton ? (activeButton.classList.contains('present') ? 'present' : 'absent') : 'present';
        const notes = notesInput ? notesInput.value.trim() : '';
        
        attendanceData.push({
            studentId,
            status,
            notes,
            timestamp: new Date().toISOString()
        });
    });

    try {
        let attendanceRecords = JSON.parse(getUserData('attendance') || '[]');
        
        const existingIndex = attendanceRecords.findIndex(r => r.activityId === currentAttendanceActivity.id);
        
        const attendanceRecord = {
            activityId: currentAttendanceActivity.id,
            activityName: currentAttendanceActivity.name,
            activityDate: currentAttendanceActivity.date,
            attendance: attendanceData,
            savedAt: new Date().toISOString()
        };
        
        if (existingIndex !== -1) {
            attendanceRecords[existingIndex] = attendanceRecord;
            showNotification('Asistencia actualizada correctamente', 'success');
        } else {
            attendanceRecords.push(attendanceRecord);
            showNotification('Asistencia guardada correctamente', 'success');
        }
        
        setUserData('attendance', JSON.stringify(attendanceRecords));
        closeAttendanceModal();
        
        console.log('📊 Asistencia guardada:', attendanceRecord);
        
    } catch (error) {
        console.error('Error al guardar asistencia:', error);
        showNotification('Error al guardar asistencia: ' + error.message, 'error');
    }
}

function closeAttendanceModal() {
    const modal = document.getElementById('attendance-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    currentAttendanceActivity = null;
}

function setupAttendanceModal() {
    const closeModalBtn = document.getElementById('close-attendance-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeAttendanceModal);
    }
    
    const saveBtn = document.getElementById('save-attendance');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveAttendance);
    }
    
    const cancelBtn = document.getElementById('cancel-attendance');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeAttendanceModal);
    }
    
    const markAllPresentBtn = document.getElementById('mark-all-present');
    if (markAllPresentBtn) {
        markAllPresentBtn.addEventListener('click', markAllPresent);
    }
    
    const markAllAbsentBtn = document.getElementById('mark-all-absent');
    if (markAllAbsentBtn) {
        markAllAbsentBtn.addEventListener('click', markAllAbsent);
    }
    
    const modal = document.getElementById('attendance-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAttendanceModal();
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('show')) {
            closeAttendanceModal();
        }
    });
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-title-btn')) {
            const activityCard = e.target.closest('.activity-card');
            const titleSpan = activityCard.querySelector('.title-text');
            makeEditable(titleSpan, 'text');
        }
        
        if (e.target.classList.contains('edit-date-btn')) {
            const activityCard = e.target.closest('.activity-card');
            const dateSpan = activityCard.querySelector('.date-text');
            makeEditable(dateSpan, 'date');
        }

        if (e.target.classList.contains('attendance-btn')) {
            const activityId = e.target.closest('.activity-card').dataset.id;
            openAttendanceModal(activityId);
        }
    });

    const galleryButton = document.getElementById('gallery');
    if (galleryButton) {
        galleryButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'gallery.html';
        });
    }

    const profileButton = document.getElementById('profile');
    if (profileButton) {
        profileButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'profile.html';
        });
    }

    // ACTUALIZADO: Cambiar de "students-list" a "institutions-list"
    const institutionsButton = document.getElementById('institutions-list');
    if (institutionsButton) {
        institutionsButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'instituciones.html'; // Cambiar de alumnos.html a instituciones.html
        });
    }

    // NUEVO: Botón de cursos rápidos
    const quickCoursesButton = document.getElementById('quick-courses');
    if (quickCoursesButton) {
        quickCoursesButton.addEventListener('click', (e) => {
            e.preventDefault();
            const defaultInstitution = getDefaultInstitution();
            if (defaultInstitution) {
                window.location.href = `cursos.html?institution=${defaultInstitution.id}`;
            } else {
                window.location.href = 'instituciones.html';
            }
        });
    }

    // NUEVO: Botón de planillas de asistencia
    const attendanceReportsButton = document.getElementById('attendance-reports');
    if (attendanceReportsButton) {
        attendanceReportsButton.addEventListener('click', (e) => {
            e.preventDefault();
            // Por ahora redirigir a instituciones, más adelante será una página específica
            showNotification('🚧 Sistema de planillas en desarrollo', 'info');
        });
    }

    // NUEVO: Botón de estadísticas globales
    const globalStatsButton = document.getElementById('global-stats');
    if (globalStatsButton) {
        globalStatsButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'instituciones.html#stats';
        });
    }

    // NUEVO: Botón de estudiantes
    const studentsButton = document.getElementById('students-list');
    if (studentsButton) {
        studentsButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'estudiantes.html';
        });
    }
}

// NUEVA FUNCIÓN: Obtener institución por defecto
function getDefaultInstitution() {
    const user = window.auth?.currentUser;
    if (!user) return null;
    
    const establishments = JSON.parse(getUserData('establishments') || '[]');
    return establishments.find(e => e.isDefault) || establishments[0] || null;
}

// NUEVA FUNCIÓN: Actualizar visibilidad del menú dinámico
function updateMenuVisibility() {
    const user = window.auth?.currentUser;
    if (!user) return;
    
    const quickCoursesBtn = document.getElementById('quick-courses');
    const defaultInstitution = getDefaultInstitution();
    
    if (quickCoursesBtn) {
        if (defaultInstitution) {
            quickCoursesBtn.style.display = 'flex';
            quickCoursesBtn.querySelector('.menu-item-content span').textContent = 
                `Cursos de ${defaultInstitution.name}`;
        } else {
            quickCoursesBtn.style.display = 'none';
        }
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar componentes
    setupToggleMenu();
    setupAuthButtons();
    setupInstallApp();
    setupScrollToTop();
    initializeImagePreview();
    setupDarkMode();
    setupDeleteAccount();
    setupDonationButton();
    addNotificationStyles();
    setupAttendanceModal();
    
    // Configurar formularios
    const activityForm = document.querySelector('.activity-form');
    if (activityForm) {
        activityForm.addEventListener('submit', addActivity);
    }
    
    // Cargar actividades
    loadActivities();
    
    // Configurar eventos
    setupEventListeners();
    
    // Event listeners para filtros
    const searchInput = document.getElementById('activity-search');
    const dateFilter = document.getElementById('activity-date-filter');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            loadActivities();
        });
    }

    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            loadActivities();
        });
    }

    // Observer para autenticación
    window.auth.onAuthStateChanged(user => {
        console.log('Estado de autenticación cambiado:', user ? user.uid : 'No autenticado');
        
        if (user) {
            updateUserInfo(user);
            migrateTemporaryData();
            
            // NUEVO: Actualizar visibilidad del menú después de cargar datos
            setTimeout(() => {
                loadActivities();
                updateMenuVisibility(); // Actualizar menú según instituciones disponibles
            }, 100);
        } else {
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
    });
});

// ===== FUNCIONES GLOBALES =====
window.openAttendanceModal = openAttendanceModal;
window.setAttendanceStatus = setAttendanceStatus;
window.closeAttendanceModal = closeAttendanceModal;
window.saveAttendance = saveAttendance;
window.markAllPresent = markAllPresent;
window.markAllAbsent = markAllAbsent;
window.deleteActivity = deleteActivity;
window.addImage = addImage;
window.handleImage = handleImage;
window.openGallery = openGallery;
window.editField = editField;
window.saveEdit = saveEdit;
window.migrateToNewArchitecture = migrateToNewArchitecture;
window.getGlobalStats = getGlobalStats;
window.updateMenuInfo = updateMenuInfo;
window.getDefaultInstitution = getDefaultInstitution;

// Agregar función de diagnóstico
function diagnoseFirabase() {
    console.log('🔍 EduCheck Pro - Diagnóstico Firebase:');
    console.log('Firebase disponible:', typeof firebase !== 'undefined');
    console.log('Apps inicializadas:', firebase?.apps?.length || 0);
    console.log('Auth disponible:', !!window.auth);
    console.log('DB disponible:', !!window.db);
    console.log('Usuario actual:', window.auth?.currentUser?.uid || 'No autenticado');
    
    // Verificar conectividad
    if (window.db) {
        window.db.enableNetwork().then(() => {
            console.log('🌐 Firestore online');
        }).catch(error => {
            console.error('❌ Error conectividad Firestore:', error);
        });
    }
}

// Hacer disponible globalmente para debug
window.diagnoseFirabase = diagnoseFirabase;

console.log('✅ App.js limpio y funcionando correctamente');