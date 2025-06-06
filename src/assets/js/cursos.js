/**
 * EduCheck Pro - Sistema de Gestión de Cursos CORREGIDO
 * Completamente integrado con Firebase y App.js
 * 
 * @version 2.1.2 - ERRORES DE REDIRECCIÓN CORREGIDOS
 * @author EduCheck Pro Team
 */

// ===== VARIABLES GLOBALES =====
let currentInstitution = null;
let allCourses = [];
let allStudents = [];
let currentEditingCourse = null;
let filteredCourses = [];
let courseStats = {
    total: 0,
    students: 0,
    avgAttendance: 0,
    activities: 0
};

// ===== INICIALIZACIÓN CORREGIDA =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 EduCheck Pro - Inicializando sistema de cursos...');
    
    // Verificar que Firebase esté disponible
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase no está disponible');
        return;
    }
    
    // Esperar a que Firebase esté listo
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log('✅ Usuario autenticado:', user.email);
            initializeCoursesSystem();
        } else {
            console.log('❌ Usuario no autenticado, redirigiendo...');
            window.location.href = 'login.html';
        }
    });
});

// ===== FUNCIÓN DE INICIALIZACIÓN COMPLETA =====
async function initializeCoursesSystem() {
    try {
        console.log('🚀 Inicializando sistema de cursos...');
        
        // 1. Verificar autenticación
        const user = firebase.auth()?.currentUser;
        if (!user) {
            console.error('❌ Usuario no autenticado');
            showNotification('Sesión expirada. Redirigiendo al login...', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }
        
        // 2. Obtener ID de institución de la URL o crear por defecto
        const urlParams = new URLSearchParams(window.location.search);
        let institutionId = urlParams.get('institution');
        
        console.log('🔍 Institution ID desde URL:', institutionId);
        
        if (!institutionId) {
            console.log('⚠️ No hay institution ID en URL, creando por defecto...');
            const defaultInstitution = await ensureDefaultInstitution();
            if (defaultInstitution) {
                institutionId = defaultInstitution.id;
                // Actualizar URL sin recargar
                const newUrl = `${window.location.pathname}?institution=${institutionId}`;
                window.history.replaceState({}, '', newUrl);
                console.log('✅ URL actualizada con institution ID:', institutionId);
            } else {
                console.error('❌ No se pudo crear institución por defecto');
                showNotification('Creando tu primera institución...', 'info');
                setTimeout(() => window.location.href = 'instituciones.html?action=create', 2000);
                return;
            }
        }
        
        // 3. Cargar institución
        await loadInstitution(institutionId);
        
        // 4. Cargar datos
        await loadCourses();
        await loadStudents();
        
        // 5. Configurar interfaz
        setupEventListeners();
        setupSearchAndFilters();
        setupMenuIntegration();
        
        // 6. Configurar modo oscuro heredado de app.js
        inheritDarkMode();
        
        // 7. Actualizar interfaz
        updateDashboard();
        displayCourses();
        
        console.log('✅ Sistema de cursos inicializado correctamente');
        showNotification(`📚 Sistema cargado para ${currentInstitution.name}`, 'success');
        
    } catch (error) {
        console.error('❌ Error inicializando sistema:', error);
        showNotification('Error al cargar el sistema: ' + error.message, 'error');
        
        // NO redirigir automáticamente, dar opción al usuario
        setTimeout(() => {
            const userChoice = confirm('Hubo un error cargando el sistema. ¿Quieres ir a gestionar instituciones?');
            if (userChoice) {
                window.location.href = 'instituciones.html';
            }
        }, 3000);
    }
}

// ===== INTEGRACIÓN CON APP.JS CORREGIDA =====
function setupMenuIntegration() {
    console.log('🔗 Configurando integración con menú...');
    
    // Usar setupMenuToggle de app.js si está disponible
    if (typeof window.setupMenuToggle === 'function') {
        window.setupMenuToggle();
        console.log('✅ Menú integrado con app.js');
    } else {
        console.warn('⚠️ setupMenuToggle no disponible en app.js, configurando localmente...');
        setupLocalMenuToggle();
    }
    
    // Actualizar información del usuario si está disponible
    if (typeof window.updateMenuUserInfo === 'function') {
        const user = firebase.auth()?.currentUser;
        if (user) {
            window.updateMenuUserInfo(user);
        }
    }
}

// Configuración local del menú como fallback
function setupLocalMenuToggle() {
    const profileButton = document.getElementById('profileButton');
    const menuDropdown = document.getElementById('menuDropdown');
    const menuCloseBtn = document.getElementById('menu-close-btn');
    
    console.log('🎛️ Configurando menú local...', {
        profileButton: !!profileButton,
        menuDropdown: !!menuDropdown,
        menuCloseBtn: !!menuCloseBtn
    });
    
    if (profileButton && menuDropdown) {
        profileButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Profile button clicked');
            
            menuDropdown.classList.toggle('show');
            document.body.classList.toggle('menu-open');
        });
        
        if (menuCloseBtn) {
            menuCloseBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Close button clicked');
                
                menuDropdown.classList.remove('show');
                document.body.classList.remove('menu-open');
            });
        }
        
        // Cerrar menú con click fuera
        document.addEventListener('click', function(e) {
            if (menuDropdown.classList.contains('show') && 
                !menuDropdown.contains(e.target) && 
                !profileButton.contains(e.target)) {
                menuDropdown.classList.remove('show');
                document.body.classList.remove('menu-open');
            }
        });
        
        // Cerrar menú con Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && menuDropdown.classList.contains('show')) {
                menuDropdown.classList.remove('show');
                document.body.classList.remove('menu-open');
            }
        });
        
        // Configurar logout
        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                    try {
                        await firebase.auth().signOut();
                        showNotification('Sesión cerrada correctamente', 'success');
                        window.location.href = 'login.html';
                    } catch (error) {
                        console.error('❌ Error al cerrar sesión:', error);
                        showNotification('Error al cerrar sesión', 'error');
                    }
                }
            });
        }
        
        console.log('✅ Menú local configurado correctamente');
    } else {
        console.error('❌ No se encontraron elementos del menú');
    }
}

// ===== GESTIÓN DE DATOS CORREGIDA =====
async function ensureDefaultInstitution() {
    const user = firebase.auth()?.currentUser;
    if (!user) {
        console.error('❌ No hay usuario autenticado para crear institución');
        return null;
    }
    
    try {
        let establishments = JSON.parse(getUserData('establishments') || '[]');
        console.log('📊 Establishments encontrados:', establishments.length);
        
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
            const saved = setUserData('establishments', JSON.stringify(establishments));
            
            if (saved) {
                console.log('🏛️ Institución por defecto creada:', defaultInstitution.id);
                return defaultInstitution;
            } else {
                console.error('❌ Error guardando institución por defecto');
                return null;
            }
        }
        
        const defaultInst = establishments.find(e => e.isDefault) || establishments[0];
        console.log('🏛️ Institución por defecto encontrada:', defaultInst.name);
        return defaultInst;
        
    } catch (error) {
        console.error('❌ Error en ensureDefaultInstitution:', error);
        return null;
    }
}

async function loadInstitution(institutionId) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Usuario no autenticado');
        
        const establishments = JSON.parse(getUserData('establishments') || '[]');
        console.log('📊 Buscando institución:', institutionId, 'en', establishments.length, 'establecimientos');
        
        currentInstitution = establishments.find(inst => inst.id === institutionId);
        
        if (!currentInstitution) {
            console.warn('⚠️ Institución no encontrada:', institutionId);
            
            if (establishments.length > 0) {
                console.log('🔄 Usando primera institución disponible');
                currentInstitution = establishments[0];
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('institution', currentInstitution.id);
                window.history.replaceState({}, '', newUrl);
            } else {
                throw new Error('No hay instituciones disponibles');
            }
        }
        
        // Actualizar header
        updateInstitutionHeader();
        
        console.log(`🏛️ Institución cargada: ${currentInstitution.name}`);
        
    } catch (error) {
        console.error('❌ Error cargando institución:', error);
        throw error;
    }
}

function updateInstitutionHeader() {
    const nameElement = document.getElementById('institutionName');
    
    if (nameElement) {
        nameElement.textContent = currentInstitution?.name || 'Institución no definida';
        console.log('✅ Header de institución actualizado');
    } else {
        console.warn('⚠️ Elemento institutionName no encontrado');
    }
}

async function loadCourses() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Usuario no autenticado');
        
        const savedCourses = getUserData('courses');
        const allCoursesData = savedCourses ? JSON.parse(savedCourses) : [];
        
        allCourses = allCoursesData.filter(course => 
            course.institutionId === currentInstitution.id
        );
        
        console.log(`📚 Cargados ${allCourses.length} cursos para ${currentInstitution.name}`);
        
    } catch (error) {
        console.error('❌ Error cargando cursos:', error);
        allCourses = [];
    }
}

async function loadStudents() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Usuario no autenticado');
        
        const savedStudents = getUserData('students');
        const allStudentsData = savedStudents ? JSON.parse(savedStudents) : [];
        
        allStudents = allStudentsData.filter(student => 
            student.institutionId === currentInstitution.id
        );
        
        console.log(`👥 Cargados ${allStudents.length} estudiantes para ${currentInstitution.name}`);
        
    } catch (error) {
        console.error('❌ Error cargando estudiantes:', error);
        allStudents = [];
    }
}

// ===== FUNCIONES DE DATOS AUXILIARES CORREGIDAS =====
function getUserData(key) {
    try {
        // CORREGIDO: Evitar recursión infinita
        if (typeof window.getUserData === 'function' && window.getUserData !== getUserData) {
            return window.getUserData(key);
        }
        
        // Fallback directo sin recursión
        const user = firebase.auth()?.currentUser;
        if (!user) {
            console.warn('⚠️ Usuario no autenticado para getUserData');
            return null;
        }
        
        const result = localStorage.getItem(`${user.uid}_${key}`);
        console.log(`📥 getUserData(${key}):`, result ? 'Data found' : 'No data');
        return result;
        
    } catch (error) {
        console.error('❌ Error en getUserData:', error);
        return null;
    }
}

function setUserData(key, value) {
    try {
        // CORREGIDO: Evitar recursión infinita
        if (typeof window.setUserData === 'function' && window.setUserData !== setUserData) {
            return window.setUserData(key, value);
        }
        
        // Fallback directo sin recursión
        const user = firebase.auth()?.currentUser;
        if (!user) {
            console.warn('⚠️ Usuario no autenticado para setUserData');
            return false;
        }
        
        localStorage.setItem(`${user.uid}_${key}`, value);
        console.log(`📤 setUserData(${key}): Guardado correctamente`);
        return true;
        
    } catch (error) {
        console.error('❌ Error en setUserData:', error);
        return false;
    }
}

// ===== CONFIGURAR EVENT LISTENERS CORREGIDO =====
function setupEventListeners() {
    console.log('🎛️ Configurando event listeners...');
    
    // Botones principales
    const addCourseBtn = document.getElementById('add-course-btn');
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', () => openCourseModal());
        console.log('✅ Botón agregar curso configurado');
    } else {
        console.warn('⚠️ Botón add-course-btn no encontrado');
    }
    
    // NUEVO: Botón agregar estudiantes
    const addStudentsBtn = document.getElementById('add-students-btn');
    if (addStudentsBtn) {
        addStudentsBtn.addEventListener('click', handleAddStudents);
        console.log('✅ Botón agregar estudiantes configurado');
    } else {
        console.warn('⚠️ Botón add-students-btn no encontrado');
    }
    
    const exportBtn = document.getElementById('export-courses-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportCourses);
        console.log('✅ Botón exportar configurado');
    }
    
    // Formulario de curso
    const courseForm = document.getElementById('course-form');
    if (courseForm) {
        courseForm.addEventListener('submit', handleSaveCourse);
        console.log('✅ Formulario de curso configurado');
    } else {
        console.warn('⚠️ Formulario course-form no encontrado');
    }
    
    // Botones de modal
    const closeBtns = document.querySelectorAll('.modal-close');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    console.log('✅ Event listeners configurados');
}

function setupSearchAndFilters() {
    const searchInput = document.getElementById('courseSearch');
    const levelFilter = document.getElementById('levelFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
        console.log('✅ Búsqueda configurada');
    } else {
        console.warn('⚠️ Input de búsqueda no encontrado: courseSearch');
    }
    
    if (levelFilter) {
        levelFilter.addEventListener('change', applyFilters);
        console.log('✅ Filtro de nivel configurado');
    } else {
        console.warn('⚠️ Filtro de nivel no encontrado: levelFilter');
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function applyFilters() {
    const searchTerm = document.getElementById('courseSearch')?.value.toLowerCase() || '';
    const levelFilter = document.getElementById('levelFilter')?.value || '';
    
    filteredCourses = allCourses.filter(course => {
        const matchesSearch = course.name.toLowerCase().includes(searchTerm) ||
                            course.teacher?.toLowerCase().includes(searchTerm) ||
                            course.description?.toLowerCase().includes(searchTerm);
        
        const matchesLevel = !levelFilter || course.level === levelFilter;
        
        return matchesSearch && matchesLevel;
    });
    
    displayCourses();
    
    console.log(`🔍 Filtros aplicados: ${filteredCourses.length}/${allCourses.length} cursos`);
}

function inheritDarkMode() {
    const isDarkMode = document.body.classList.contains('dark-mode') || 
                      localStorage.getItem('darkMode') === 'true';
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // CORREGIDO: Usar el selector CSS correcto para el checkbox
    const darkModeToggle = document.querySelector('#darkModeToggle input[type="checkbox"]');
    if (darkModeToggle) {
        darkModeToggle.checked = isDarkMode;
        darkModeToggle.addEventListener('change', function() {
            document.body.classList.toggle('dark-mode', this.checked);
            localStorage.setItem('darkMode', this.checked);
            showNotification(`Modo ${this.checked ? 'oscuro' : 'claro'} activado`, 'info');
        });
        console.log('✅ Dark mode toggle configurado');
    } else {
        console.warn('⚠️ Dark mode toggle no encontrado');
    }
}

// ===== ACTUALIZACIÓN DE INTERFAZ =====
function updateDashboard() {
    calculateStats();
    
    // Actualizar contadores si existen los elementos
    updateElement('total-courses', courseStats.total);
    updateElement('total-students', courseStats.students);
    updateElement('courses-count', `${courseStats.total} curso${courseStats.total !== 1 ? 's' : ''}`);
    updateElement('students-count', `${courseStats.students} estudiante${courseStats.students !== 1 ? 's' : ''}`);
    
    console.log('📊 Dashboard actualizado');
}

function calculateStats() {
    try {
        courseStats.total = allCourses.length;
        courseStats.students = allStudents.length;
        
        // Calcular asistencia promedio básica
        courseStats.avgAttendance = allCourses.length > 0 ? 85 : 0; // Valor por defecto
        courseStats.activities = 0; // Por implementar
        
        console.log('📊 Estadísticas calculadas:', courseStats);
        
    } catch (error) {
        console.error('❌ Error calculando estadísticas:', error);
        courseStats = { total: 0, students: 0, avgAttendance: 0, activities: 0 };
    }
}

function displayCourses() {
    const container = document.getElementById('coursesContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) {
        console.warn('⚠️ Contenedor de cursos no encontrado: coursesContainer');
        return;
    }
    
    const coursesToShow = filteredCourses.length > 0 ? filteredCourses : allCourses;
    
    if (coursesToShow.length === 0) {
        container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    
    container.innerHTML = coursesToShow.map(course => createCourseCard(course)).join('');
    
    console.log(`📚 Mostrando ${coursesToShow.length} cursos`);
}

function createCourseCard(course) {
    const levelLabels = {
        inicial: 'Inicial',
        primario: 'Primario', 
        secundario: 'Secundario',
        universitario: 'Universitario',
        mixto: 'Mixto'
    };
    
    const courseStudents = allStudents.filter(s => s.courseId === course.id);
    const totalStudents = courseStudents.length;
    
    const createdDate = new Date(course.createdAt || Date.now()).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    const isActive = course.isActive !== false;
    const levelLabel = levelLabels[course.level] || 'Sin especificar';
    
    return `
        <div class="course-card ${isActive ? 'active' : 'inactive'}" data-id="${course.id}">
            <div class="course-header">
                <div class="course-avatar">
                    <span>${course.name.charAt(0).toUpperCase()}</span>
                </div>
                <div class="course-actions">
                    <button class="course-action edit" 
                            onclick="editCourse('${course.id}')" 
                            title="Editar curso">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="course-action delete" 
                            onclick="deleteCourse('${course.id}')" 
                            title="Eliminar curso">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="course-info">
                <h3>${course.name}</h3>
                <div class="course-level ${course.level}">${levelLabel}</div>
            </div>
            
            <div class="course-details">
                ${course.classroom ? `
                    <div class="course-detail">
                        <i class="fas fa-door-open"></i>
                        <span>${course.classroom}</span>
                    </div>
                ` : ''}
                ${course.teacher ? `
                    <div class="course-detail">
                        <i class="fas fa-user-tie"></i>
                        <span>${course.teacher}</span>
                    </div>
                ` : ''}
                ${course.schedule ? `
                    <div class="course-detail">
                        <i class="fas fa-clock"></i>
                        <span>${course.schedule}</span>
                    </div>
                ` : ''}
            </div>
            
            ${course.description ? `
                <div class="course-description">
                    <p>${course.description}</p>
                </div>
            ` : ''}
            
            <div class="course-stats">
                <div class="course-stat">
                    <span class="course-stat-number">${totalStudents}</span>
                    <span class="course-stat-label">Estudiantes</span>
                </div>
                <div class="course-stat">
                    <span class="course-stat-number">85%</span>
                    <span class="course-stat-label">Asistencia</span>
                </div>
            </div>
            
            <div class="course-footer">
                <span class="course-date">
                    <i class="fas fa-calendar-plus"></i>
                    ${createdDate}
                </span>
                <span class="course-status ${isActive ? 'active' : 'inactive'}">
                    <i class="fas ${isActive ? 'fa-check-circle' : 'fa-pause-circle'}"></i>
                    ${isActive ? 'Activo' : 'Inactivo'}
                </span>
            </div>
        </div>
    `;
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// NUEVA: Función para manejar agregar estudiantes
function handleAddStudents() {
    try {
        // Verificar si hay cursos disponibles
        if (allCourses.length === 0) {
            showNotification('Primero debes crear al menos un curso', 'warning');
            return;
        }
        
        // Redirigir a estudiantes.html con parámetros de institución
        const params = new URLSearchParams({
            institution: currentInstitution.id,
            action: 'add',
            from: 'courses'
        });
        
        showNotification('Redirigiendo a gestión de estudiantes...', 'info');
        
        setTimeout(() => {
            window.location.href = `estudiantes.html?${params.toString()}`;
        }, 1000);
        
        console.log('🔄 Redirigiendo a estudiantes.html');
        
    } catch (error) {
        console.error('❌ Error navegando a estudiantes:', error);
        showNotification('Error al navegar a estudiantes: ' + error.message, 'error');
    }
}

// ===== FUNCIÓN showNotification CORREGIDA =====
function showNotification(message, type = 'success') {
    try {
        // CORREGIDO: Evitar recursión infinita
        if (typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
            window.showNotification(message, type);
            return;
        }
        
        // Fallback mejorado sin recursión
        console.log(`🔔 NOTIFICATION [${type.toUpperCase()}]: ${message}`);
        
        // Crear notificación visual simple
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
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto-remover después de 4 segundos
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
        // Fallback ultra-básico
        console.log(`ALERT: ${message}`);
    }
}

// ===== GESTIÓN DE CURSOS =====
function openCourseModal(courseId = null) {
    const modal = document.getElementById('courseModal');
    const modalTitle = document.getElementById('courseModalTitle');
    const saveText = document.getElementById('saveCourseText');
    const form = document.getElementById('course-form');
    
    if (!modal || !form) {
        console.error('❌ Modal de curso no encontrado');
        return;
    }
    
    // Cargar establecimientos en el selector
    loadInstitutionsIntoSelect();
    
    if (courseId) {
        const course = allCourses.find(c => c.id === courseId);
        if (!course) {
            showNotification('Curso no encontrado', 'error');
            return;
        }
        
        currentEditingCourse = courseId;
        if (modalTitle) modalTitle.textContent = 'Editar Curso';
        if (saveText) saveText.textContent = 'Actualizar Curso';
        
        // Llenar formulario
        fillCourseForm(course);
        
    } else {
        currentEditingCourse = null;
        if (modalTitle) modalTitle.textContent = 'Nuevo Curso';
        if (saveText) saveText.textContent = 'Guardar Curso';
        form.reset();
        
        // Preseleccionar institución actual
        const institutionSelect = document.getElementById('courseInstitution');
        if (institutionSelect && currentInstitution) {
            institutionSelect.value = currentInstitution.id;
        }
        
        const activeCheckbox = document.getElementById('courseActive');
        if (activeCheckbox) activeCheckbox.checked = true;
    }
    
    modal.style.display = 'flex';
    
    // Focus en el primer campo
    setTimeout(() => {
        const firstInput = form.querySelector('input[type="text"]');
        if (firstInput) firstInput.focus();
    }, 100);
    
    console.log('✅ Modal de curso abierto');
}

// NUEVA: Función para cargar establecimientos en el selector
function loadInstitutionsIntoSelect() {
    const institutionSelect = document.getElementById('courseInstitution');
    if (!institutionSelect) {
        console.warn('⚠️ Selector de institución no encontrado');
        return;
    }
    
    try {
        const establishments = JSON.parse(getUserData('establishments') || '[]');
        
        // Limpiar opciones existentes (excepto la primera)
        institutionSelect.innerHTML = '<option value="">Seleccionar establecimiento...</option>';
        
        if (establishments.length === 0) {
            institutionSelect.innerHTML += '<option value="" disabled>No hay establecimientos disponibles</option>';
            console.warn('⚠️ No hay establecimientos disponibles');
            return;
        }
        
        // Agregar opciones de establecimientos
        establishments.forEach(establishment => {
            const option = document.createElement('option');
            option.value = establishment.id;
            option.textContent = `${establishment.name} (${establishment.type})`;
            
            // Marcar como seleccionado si es la institución actual
            if (establishment.id === currentInstitution?.id) {
                option.selected = true;
            }
            
            institutionSelect.appendChild(option);
        });
        
        console.log(`✅ Cargados ${establishments.length} establecimientos en el selector`);
        
    } catch (error) {
        console.error('❌ Error cargando establecimientos:', error);
        institutionSelect.innerHTML = '<option value="" disabled>Error cargando establecimientos</option>';
    }
}

// Resto de funciones...
function fillCourseForm(course) {
    const fields = {
        'courseInstitution': course.institutionId,
        'courseName': course.name,
        'courseLevel': course.level,
        'courseClassroom': course.classroom,
        'courseCapacity': course.capacity,
        'courseTeacher': course.teacher,
        'courseSchedule': course.schedule,
        'courseDescription': course.description,
        'courseNotes': course.notes,
        'courseActive': course.isActive !== false
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = value;
            } else {
                field.value = value || '';
            }
        }
    });
    
    console.log('✅ Formulario de curso llenado');
}

function closeCourseModal() {
    const modal = document.getElementById('courseModal');
    if (modal) {
        modal.style.display = 'none';
        currentEditingCourse = null;
    }
}

async function handleSaveCourse(event) {
    event.preventDefault();
    
    const user = firebase.auth()?.currentUser;
    if (!user) {
        showNotification('Usuario no autenticado', 'error');
        return;
    }
    
    const courseData = {
        institutionId: document.getElementById('courseInstitution').value,
        name: document.getElementById('courseName').value.trim(),
        level: document.getElementById('courseLevel').value,
        classroom: document.getElementById('courseClassroom').value.trim(),
        capacity: parseInt(document.getElementById('courseCapacity').value) || null,
        teacher: document.getElementById('courseTeacher').value.trim(),
        schedule: document.getElementById('courseSchedule').value.trim(),
        description: document.getElementById('courseDescription').value.trim(),
        notes: document.getElementById('courseNotes').value.trim(),
        isActive: document.getElementById('courseActive').checked
    };
    
    // Validaciones
    if (!courseData.institutionId) {
        showNotification('Selecciona un establecimiento', 'error');
        return;
    }
    
    if (!courseData.name) {
        showNotification('El nombre del curso es obligatorio', 'error');
        return;
    }
    
    if (!courseData.level) {
        showNotification('Selecciona el nivel educativo', 'error');
        return;
    }
    
    try {
        if (currentEditingCourse) {
            await updateCourse(currentEditingCourse, courseData);
        } else {
            await createCourse(courseData, user);
        }
        
        closeCourseModal();
        
    } catch (error) {
        console.error('❌ Error guardando curso:', error);
        showNotification('Error al guardar el curso: ' + error.message, 'error');
    }
}

async function createCourse(courseData, user) {
    const newCourse = {
        id: generateUniqueId('course'),
        ...courseData,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        students: [],
        attendanceHistory: []
    };
    
    // Guardar en todos los cursos globalmente
    const allCoursesData = JSON.parse(getUserData('courses') || '[]');
    allCoursesData.push(newCourse);
    setUserData('courses', JSON.stringify(allCoursesData));
    
    // Si pertenece a la institución actual, agregarlo a la lista local
    if (courseData.institutionId === currentInstitution.id) {
        allCourses.push(newCourse);
        updateDashboard();
        displayCourses();
    }
    
    showNotification(`✅ Curso "${newCourse.name}" creado correctamente`, 'success');
    console.log(`📚 Curso creado: ${newCourse.name}`);
}

async function updateCourse(courseId, courseData) {
    const index = allCourses.findIndex(c => c.id === courseId);
    if (index === -1) {
        throw new Error('Curso no encontrado');
    }
    
    allCourses[index] = {
        ...allCourses[index],
        ...courseData,
        lastModified: new Date().toISOString()
    };
    
    await saveCourses();
    
    updateDashboard();
    displayCourses();
    
    showNotification(`✅ Curso "${allCourses[index].name}" actualizado`, 'success');
    console.log(`📚 Curso actualizado: ${allCourses[index].name}`);
}

function editCourse(courseId) {
    openCourseModal(courseId);
}

function deleteCourse(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) {
        showNotification('Curso no encontrado', 'error');
        return;
    }
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el curso "${course.name}"?`)) {
        return;
    }
    
    try {
        const courseIndex = allCourses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) {
            throw new Error('Curso no encontrado');
        }
        
        const courseName = allCourses[courseIndex].name;
        
        // Eliminar curso
        allCourses.splice(courseIndex, 1);
        saveCourses();
        
        // Actualizar interfaz
        updateDashboard();
        displayCourses();
        
        showNotification(`✅ Curso "${courseName}" eliminado`, 'success');
        console.log(`🗑️ Curso eliminado: ${courseName}`);
        
    } catch (error) {
        console.error('❌ Error eliminando curso:', error);
        showNotification('Error al eliminar el curso: ' + error.message, 'error');
    }
}

// ===== FUNCIONES AUXILIARES =====
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    currentEditingCourse = null;
}

function generateUniqueId(prefix = 'item') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

async function saveCourses() {
    try {
        const allCoursesData = JSON.parse(getUserData('courses') || '[]');
        const otherCourses = allCoursesData.filter(c => c.institutionId !== currentInstitution.id);
        const updatedCourses = [...otherCourses, ...allCourses];
        
        setUserData('courses', JSON.stringify(updatedCourses));
        
        console.log('💾 Cursos guardados correctamente');
        
    } catch (error) {
        console.error('❌ Error guardando cursos:', error);
        throw error;
    }
}

function exportCourses() {
    try {
        const user = firebase.auth()?.currentUser;
        if (!user) {
            showNotification('Usuario no autenticado', 'error');
            return;
        }
        
        const exportData = {
            exportInfo: {
                date: new Date().toISOString(),
                user: user.email,
                institution: currentInstitution.name,
                version: '2.1.2',
                type: 'courses_backup'
            },
            institution: currentInstitution,
            courses: allCourses,
            students: allStudents,
            stats: courseStats
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `educheck-cursos-${currentInstitution.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showNotification('✅ Datos exportados correctamente', 'success');
        console.log('📤 Datos exportados');
        
    } catch (error) {
        console.error('❌ Error exportando datos:', error);
        showNotification('Error al exportar datos: ' + error.message, 'error');
    }
}

// ===== FUNCIONES GLOBALES =====
window.openCourseModal = openCourseModal;
window.closeCourseModal = closeCourseModal;
window.editCourse = editCourse;
window.deleteCourse = deleteCourse;
window.handleAddStudents = handleAddStudents;
window.exportCourses = exportCourses;
window.showNotification = showNotification;

// Debug
window.diagnosticCourses = function() {
    console.log('🔍 Diagnóstico del sistema de cursos:');
    console.log('📚 Cursos cargados:', allCourses.length);
    console.log('👥 Estudiantes cargados:', allStudents.length);
    console.log('🏛️ Institución actual:', currentInstitution?.name || 'No definida');
    console.log('🔐 Usuario autenticado:', firebase.auth()?.currentUser?.email || 'No autenticado');
    
    return {
        courses: allCourses.length,
        students: allStudents.length,
        institution: currentInstitution?.name,
        user: firebase.auth()?.currentUser?.email
    };
};

console.log('✅ EduCheck Pro - Sistema de cursos cargado correctamente v2.1.2');