/**
 * EduCheck Pro - Dashboard Principal v3.1 CORREGIDO
 * Sistema completo de dashboard con integración mejorada
 */

// ===== VARIABLES GLOBALES =====
let isDashboardInitialized = false;
let currentUser = null;

// ===== INICIALIZACIÓN PRINCIPAL =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Dashboard - DOM cargado');
    
    // Verificar que Firebase esté disponible
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase no está disponible');
        return;
    }
    
    // Esperar a que Firebase esté configurado
    if (!window.auth) {
        console.log('⏳ Esperando configuración de Firebase...');
        const checkAuth = setInterval(() => {
            if (window.auth) {
                clearInterval(checkAuth);
                initializeDashboard();
            }
        }, 100);
    } else {
        initializeDashboard();
    }
});

async function initializeDashboard() {
    try {
        console.log('🚀 Inicializando dashboard...');
        
        // Configurar listener de autenticación
        setupAuthListener();
        
        // Configurar botones de asistencia INMEDIATAMENTE
        setupAttendanceButtons();
        
        // Cargar datos del dashboard
        await loadDashboardData();
        
        console.log('✅ Dashboard inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando dashboard:', error);
    }
}

// ===== AUTENTICACIÓN =====
function setupAuthListener() {
    console.log('🔐 Configurando listener de autenticación...');
    
    window.auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            console.log('✅ Usuario autenticado:', user.email);
            updateUserInterface(user);
            loadDashboardData();
        } else {
            console.log('❌ Usuario no autenticado, redirigiendo...');
            window.location.href = 'login.html';
        }
    });
}

function updateUserInterface(user) {
    console.log('🎨 Actualizando interfaz de usuario...');
    
    // Actualizar nombre del usuario
    const teacherName = document.getElementById('teacherName');
    const menuTeacherName = document.getElementById('menuTeacherName');
    
    const displayName = user.displayName || user.email.split('@')[0] || 'Usuario';
    
    if (teacherName) {
        teacherName.textContent = displayName;
    }
    
    if (menuTeacherName) {
        menuTeacherName.textContent = displayName;
    }
    
    console.log('✅ Interfaz de usuario actualizada');
}

// ===== CARGAR DATOS DEL DASHBOARD =====
async function loadDashboardData() {
    try {
        console.log('📄 Cargando datos del dashboard...');
        
        // Cargar instituciones (solo las primeras 3)
        await loadInstitutions();
        
        // Cargar actividades recientes
        await loadRecentActivities();
        
        // Actualizar contadores de accesos rápidos
        updateQuickAccessCounters();
        
        // Actualizar última clase
        updateLastClassDisplay();
        
        // Configurar botones de asistencia
        setupAttendanceButtons();
        
        console.log('✅ Datos del dashboard cargados');
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
    }
}

// ===== CARGAR INSTITUCIONES =====
async function loadInstitutions() {
    try {
        const institutionsGrid = document.getElementById('institutionsGrid');
        if (!institutionsGrid) return;
        
        const savedInstitutions = getUserData('establishments');
        const institutions = savedInstitutions ? JSON.parse(savedInstitutions) : [];
        
        if (institutions.length === 0) {
            institutionsGrid.innerHTML = `
                <div class="empty-placeholder">
                    <i class="fas fa-university"></i>
                    <h4>No hay instituciones</h4>
                    <p>Crea tu primera institución</p>
                    <a href="instituciones.html" class="create-btn">
                        <i class="fas fa-plus"></i>
                        Crear Institución
                    </a>
                </div>
            `;
            return;
        }
        
        // Mostrar solo las primeras 3 instituciones
        const displayInstitutions = institutions.slice(0, 3);
        
        institutionsGrid.innerHTML = displayInstitutions.map(institution => `
            <div class="institution-card">
                <div class="institution-header">
                    <div class="institution-icon">
                        <i class="fas fa-university"></i>
                    </div>
                    <h4>${institution.name}</h4>
                </div>
                <div class="institution-info">
                    <p class="institution-type">${getTypeLabel(institution.type)}</p>
                    <p class="institution-address">${institution.address || 'Sin dirección'}</p>
                </div>
                <div class="institution-actions">
                    <a href="cursos.html?institution=${institution.id}" class="action-link">
                        <i class="fas fa-chalkboard-teacher"></i>
                        Ver Cursos
                    </a>
                </div>
            </div>
        `).join('');
        
        console.log(`✅ ${displayInstitutions.length} instituciones cargadas`);
        
    } catch (error) {
        console.error('❌ Error cargando instituciones:', error);
    }
}

// ===== CARGAR ACTIVIDADES RECIENTES =====
async function loadRecentActivities() {
    try {
        const recentCarousel = document.getElementById('recentCarousel');
        if (!recentCarousel) return;
        
        const savedActivities = getUserData('recent_activities');
        const activities = savedActivities ? JSON.parse(savedActivities) : [];
        
        if (activities.length === 0) {
            recentCarousel.innerHTML = `
                <div class="carousel-placeholder">
                    <div class="placeholder-card">
                        <i class="fas fa-plus"></i>
                        <p>Registra tu primera actividad</p>
                        <a href="actividades.html" class="create-btn">Crear Actividad</a>
                    </div>
                </div>
            `;
            return;
        }
        
        // Mostrar solo las últimas 5 actividades
        const recentActivities = activities.slice(-5).reverse();
        
        recentCarousel.innerHTML = recentActivities.map(activity => `
            <div class="activity-mini-card">
                <div class="activity-image">
                    ${activity.image ? 
                        `<img src="${activity.image}" alt="${activity.name}" loading="lazy">` :
                        `<div class="placeholder-image">
                            <i class="fas fa-calendar-star"></i>
                        </div>`
                    }
                </div>
                <div class="activity-info">
                    <h5>${activity.name}</h5>
                    <p>${formatDateBeautiful(activity.date)}</p>
                </div>
            </div>
        `).join('');
        
        console.log(`✅ ${recentActivities.length} actividades recientes cargadas`);
        
    } catch (error) {
        console.error('❌ Error cargando actividades:', error);
    }
}

// ===== FUNCIONES DE DATOS =====
function getUserData(key) {
    try {
        // Usar SyncManager si está disponible
        if (window.syncManager && window.syncManager.isManagerReady()) {
            return window.syncManager.getUserData(key);
        }
        
        // Fallback a localStorage directo
        const user = window.auth?.currentUser;
        if (!user) return null;
        
        return localStorage.getItem(`${user.uid}_${key}`);
        
    } catch (error) {
        console.error('❌ Error obteniendo datos:', error);
        return null;
    }
}

// ===== FORMATO DE FECHA =====
function formatDateBeautiful(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}

function getTypeLabel(type) {
    const labels = {
        escuela: 'Escuela',
        colegio: 'Colegio',
        universidad: 'Universidad',
        instituto: 'Instituto',
        otro: 'Otro'
    };
    return labels[type] || 'Institución';
}

// ===== FECHA ACTUAL =====
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
    }
}

// ===== MENU TOGGLE CORREGIDO =====
function setupMenuToggle() {
    console.log('🎛️ Configurando menú toggle...');
    
    const menuToggle = document.getElementById('menuToggle');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const menuClose = document.getElementById('menuClose');
    const menuOverlay = document.getElementById('menuOverlay');
    
    console.log('🔍 Elementos del menú:', {
        menuToggle: !!menuToggle,
        dropdownMenu: !!dropdownMenu,
        menuClose: !!menuClose,
        menuOverlay: !!menuOverlay
    });
    
    if (!menuToggle || !dropdownMenu) {
        console.error('❌ Elementos del menú no encontrados');
        return;
    }
    
    function openMenu() {
        console.log('🔓 Abriendo menú...');
        dropdownMenu.classList.add('active');
        menuToggle.classList.add('active');
        if (menuOverlay) menuOverlay.classList.add('active');
        document.body.classList.add('menu-open');
    }
    
    function closeMenu() {
        console.log('🔒 Cerrando menú...');
        dropdownMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
    
    // Event listeners
    menuToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Menu toggle clicked');
        
        if (dropdownMenu.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    if (menuClose) {
        menuClose.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Menu close clicked');
            closeMenu();
        });
    }
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🖱️ Overlay clicked');
            closeMenu();
        });
    }
    
    // Cerrar con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && dropdownMenu.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Configurar logout
    const logoutOption = document.getElementById('logoutOption');
    if (logoutOption) {
        logoutOption.addEventListener('click', async function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                try {
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
    
    console.log('✅ Menú toggle configurado correctamente');
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

// ===== NOTIFICACIONES =====
function showNotification(message, type = 'success') {
    try {
        console.log(`🔔 NOTIFICATION [${type.toUpperCase()}]: ${message}`);
        
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

// ===== SCROLL TO TOP =====
function setupScrollToTop() {
    const scrollBtn = document.getElementById('scrollToTop');
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

// ===== CONFIGURAR BOTONES DE ASISTENCIA =====
function setupAttendanceButtons() {
    console.log('🎯 Configurando botones de asistencia...');
    
    const startAttendanceBtn = document.getElementById('startAttendanceBtn');
    const repeatAttendanceBtn = document.getElementById('repeatAttendanceBtn');
    
    if (startAttendanceBtn) {
        console.log('✅ Botón iniciar asistencia encontrado');
        startAttendanceBtn.addEventListener('click', function() {
            console.log('🎯 Botón iniciar asistencia clicked');
            showCourseSelector();
        });
    } else {
        console.error('❌ Botón startAttendanceBtn NO encontrado');
    }
    
    if (repeatAttendanceBtn) {
        console.log('✅ Botón repetir asistencia encontrado');
        repeatAttendanceBtn.addEventListener('click', function() {
            console.log('🔄 Botón repetir asistencia clicked');
            repeatLastAttendance();
        });
    } else {
        console.log('⚠️ Botón repeatAttendanceBtn no encontrado (normal si no hay clases previas)');
    }
}

function showCourseSelector() {
    console.log('📚 Mostrando selector de curso...');
    
    const modal = document.getElementById('courseSelectorModal');
    const coursesList = document.getElementById('coursesList');
    const noCoursesMessage = document.getElementById('noCoursesMessage');
    
    if (!modal) {
        console.error('❌ Modal courseSelectorModal no encontrado');
        return;
    }
    
    // Cargar cursos disponibles
    const savedCourses = getUserData('courses');
    const courses = savedCourses ? JSON.parse(savedCourses) : [];
    
    console.log(`📋 ${courses.length} cursos encontrados`);
    
    if (courses.length === 0) {
        if (coursesList) coursesList.style.display = 'none';
        if (noCoursesMessage) noCoursesMessage.style.display = 'block';
    } else {
        if (noCoursesMessage) noCoursesMessage.style.display = 'none';
        if (coursesList) {
            coursesList.style.display = 'block';
            coursesList.innerHTML = courses.map(course => `
                <div class="course-option" onclick="startAttendanceForCourse('${course.id}')">
                    <div class="course-info">
                        <h4>${course.name}</h4>
                        <p>${course.level || 'Sin nivel'} - ${course.studentsCount || 0} estudiantes</p>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `).join('');
        }
    }
    
    // Mostrar modal
    modal.classList.add('show');
    modal.style.display = 'flex';
    document.body.classList.add('menu-open');
    
    console.log('✅ Modal de selector de curso mostrado');
}

function hideCourseSelector() {
    const modal = document.getElementById('courseSelectorModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.classList.remove('menu-open');
    }
}

function startAttendanceForCourse(courseId) {
    console.log('🎯 Iniciando asistencia para curso:', courseId);
    
    // Guardar como última clase
    saveLastClass(courseId);
    
    // Redirigir a la página de asistencia con el curso seleccionado
    window.location.href = `asistencia.html?course=${courseId}`;
}

function saveLastClass(courseId) {
    const savedCourses = getUserData('courses');
    const courses = savedCourses ? JSON.parse(savedCourses) : [];
    const course = courses.find(c => c.id === courseId);
    
    if (course) {
        const lastClass = {
            courseId: courseId,
            courseName: course.name,
            institution: course.institution,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        localStorage.setItem(`${window.auth.currentUser.uid}_last_class`, JSON.stringify(lastClass));
        updateLastClassDisplay();
    }
}

function updateLastClassDisplay() {
    const lastClassSection = document.getElementById('lastClassSection');
    const lastClassName = document.getElementById('lastClassName');
    const lastClassDate = document.getElementById('lastClassDate');
    const repeatBtn = document.getElementById('repeatAttendanceBtn');
    
    if (!lastClassName || !lastClassDate) return;
    
    const savedLastClass = localStorage.getItem(`${window.auth.currentUser.uid}_last_class`);
    
    if (savedLastClass) {
        const lastClass = JSON.parse(savedLastClass);
        const date = new Date(lastClass.date);
        
        lastClassName.textContent = `${lastClass.courseName}`;
        lastClassDate.textContent = `${formatDateBeautiful(lastClass.date)} a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        
        if (repeatBtn) {
            repeatBtn.style.display = 'flex';
        }
    } else {
        lastClassName.textContent = 'No hay clases registradas';
        lastClassDate.textContent = '';
        
        if (repeatBtn) {
            repeatBtn.style.display = 'none';
        }
    }
}

function repeatLastAttendance() {
    const savedLastClass = localStorage.getItem(`${window.auth.currentUser.uid}_last_class`);
    
    if (savedLastClass) {
        const lastClass = JSON.parse(savedLastClass);
        startAttendanceForCourse(lastClass.courseId);
    } else {
        showNotification('No hay una clase anterior registrada', 'warning');
    }
}

// ===== ACTUALIZAR CONTADORES DE ACCESOS RÁPIDOS =====
function updateQuickAccessCounters() {
    console.log('📊 Actualizando contadores de accesos rápidos...');
    
    // Contar instituciones
    const savedInstitutions = getUserData('establishments');
    const institutionsCount = savedInstitutions ? JSON.parse(savedInstitutions).length : 0;
    const institutionsCounter = document.getElementById('institutionsCount');
    if (institutionsCounter) {
        institutionsCounter.textContent = `${institutionsCount} registrada${institutionsCount !== 1 ? 's' : ''}`;
    }
    
    // Contar estudiantes
    const savedStudents = getUserData('students');
    const studentsCount = savedStudents ? JSON.parse(savedStudents).length : 0;
    const studentsCounter = document.getElementById('studentsCount');
    if (studentsCounter) {
        studentsCounter.textContent = `${studentsCount} registrado${studentsCount !== 1 ? 's' : ''}`;
    }
    
    // Contar cursos
    const savedCourses = getUserData('courses');
    const coursesCount = savedCourses ? JSON.parse(savedCourses).length : 0;
    const coursesCounter = document.getElementById('coursesCount');
    if (coursesCounter) {
        coursesCounter.textContent = `${coursesCount} registrado${coursesCount !== 1 ? 's' : ''}`;
    }
    
    // Contar actividades
    const savedActivities = getUserData('recent_activities');
    const activitiesCount = savedActivities ? JSON.parse(savedActivities).length : 0;
    const activitiesCounter = document.getElementById('activitiesCount');
    if (activitiesCounter) {
        activitiesCounter.textContent = `${activitiesCount} registrada${activitiesCount !== 1 ? 's' : ''}`;
    }
    
    console.log('✅ Contadores actualizados:', {
        instituciones: institutionsCount,
        estudiantes: studentsCount,
        cursos: coursesCount,
        actividades: activitiesCount
    });
}

// ===== FUNCIONES GLOBALES =====
window.showNotification = showNotification;
window.setupMenuToggle = setupMenuToggle;

console.log('✅ Dashboard.js v3.1 cargado correctamente');