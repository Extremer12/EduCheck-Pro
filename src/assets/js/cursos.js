/**
 * EduCheck Pro - Sistema de Gestión de Cursos v2.2 CORREGIDO FINAL
 * Compatible con header unificado y sin errores de notificación
 */

// ===== VARIABLES GLOBALES =====
let currentUser = null;
let institutions = [];
let courses = [];
let currentEditingCourse = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    initializeCourses();
});

async function initializeCourses() {
    console.log('🎓 Inicializando módulo de cursos...');
    
    try {
        // Verificar autenticación
        if (window.auth) {
            window.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    currentUser = user;
                    await loadUserData();
                    await loadCourses();
                    setupCourseEvents();
                    updateCoursesDisplay();
                } else {
                    window.location.href = 'login.html';
                }
            });
        } else {
            console.error('❌ Firebase Auth no disponible');
        }
    } catch (error) {
        console.error('❌ Error inicializando cursos:', error);
        showNotification('Error al cargar el sistema de cursos', 'error');
    }
}

// ===== CARGAR DATOS =====
async function loadUserData() {
    try {
        const institutionsData = getUserData('institutions');
        institutions = institutionsData ? JSON.parse(institutionsData) : [];
        console.log(`🏛️ ${institutions.length} instituciones cargadas:`, institutions.map(i => i.name));
        
        // Verificar si hay instituciones del usuario actual
        const userInstitutions = institutions.filter(i => i.createdBy === currentUser?.uid);
        console.log(`👤 ${userInstitutions.length} instituciones del usuario actual`);
        
        if (userInstitutions.length === 0) {
            console.warn('⚠️ El usuario no tiene instituciones. Debe crear una institución primero.');
        }
        
    } catch (error) {
        console.error('❌ Error cargando instituciones:', error);
        institutions = [];
    }
}

async function loadCourses() {
    try {
        // Cargar cursos del localStorage PRIMERO
        const savedCourses = getUserData('courses');
        courses = savedCourses ? JSON.parse(savedCourses) : [];
        
        console.log(`🎓 ${courses.length} cursos cargados desde localStorage`);
        
        // SOLO intentar Firebase si está disponible Y hay usuario autenticado
        if (window.db && currentUser && courses.length === 0) {
            try {
                console.log('📥 Intentando cargar desde Firebase...');
                const snapshot = await window.db.collection('users')
                    .doc(currentUser.uid)
                    .collection('courses')
                    .orderBy('createdAt', 'desc')
                    .get();
                    
                const firebaseCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                if (firebaseCourses.length > 0) {
                    courses = firebaseCourses;
                    setUserData('courses', JSON.stringify(courses));
                    console.log('✅ Cursos sincronizados desde Firebase');
                }
            } catch (firebaseError) {
                // NO ES UN ERROR CRÍTICO - continuar con datos locales
                console.warn('⚠️ Firebase no disponible, usando datos locales:', firebaseError.code);
            }
        }
        
    } catch (error) {
        console.error('❌ Error cargando cursos:', error);
        courses = []; // Fallback a array vacío
    }
}

// ===== EVENTOS =====
function setupCourseEvents() {
    console.log('🎛️ Configurando eventos de cursos...');
    
    // Botón para nuevo curso
    const newCourseBtn = document.getElementById('new-course-btn');
    if (newCourseBtn) {
        newCourseBtn.addEventListener('click', () => {
            console.log('📝 Abriendo modal para nuevo curso...');
            openCourseModal();
        });
        console.log('✅ Botón nuevo curso configurado');
    } else {
        console.warn('❌ Botón #new-course-btn no encontrado');
    }
    
    // Formulario de curso
    const courseForm = document.getElementById('courseForm');
    if (courseForm) {
        courseForm.addEventListener('submit', handleCourseSubmit);
        console.log('✅ Formulario de curso configurado');
    } else {
        console.warn('❌ Formulario #courseForm no encontrado');
    }
    
    // Cerrar modal con overlay
    const courseModal = document.getElementById('courseModal');
    if (courseModal) {
        courseModal.addEventListener('click', (e) => {
            if (e.target === courseModal) {
                closeCourseModal();
            }
        });
        console.log('✅ Modal de curso configurado');
    } else {
        console.warn('❌ Modal #courseModal no encontrado');
    }
    
    // Búsqueda de cursos
    const searchInput = document.getElementById('course-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterCourses, 300));
    }
    
    // Filtros
    const levelFilter = document.getElementById('level-filter');
    if (levelFilter) {
        levelFilter.addEventListener('change', filterCourses);
    }
    
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterCourses);
    }
    
    console.log('✅ Eventos de cursos configurados completamente');
}

// ===== POBLADORES CORREGIDOS =====
function populateInstitutionSelect() {
    console.log('🏛️ Poblando selector de instituciones...');
    
    const courseInstitutionSelect = document.getElementById('courseInstitution');
    
    if (!courseInstitutionSelect) {
        console.warn('❌ Element courseInstitution not found');
        return;
    }
    
    // Limpiar opciones existentes excepto la primera
    courseInstitutionSelect.innerHTML = '<option value="">Seleccionar institución</option>';
    
    console.log(`📋 ${institutions.length} instituciones disponibles`);
    
    if (institutions.length === 0) {
        const noInstitutionOption = document.createElement('option');
        noInstitutionOption.value = '';
        noInstitutionOption.textContent = 'No hay instituciones disponibles';
        noInstitutionOption.disabled = true;
        courseInstitutionSelect.appendChild(noInstitutionOption);
        return;
    }
    
    // Filtrar solo instituciones del usuario actual
    const userInstitutions = institutions.filter(institution => 
        institution.createdBy === currentUser?.uid
    );
    
    console.log(`🎯 ${userInstitutions.length} instituciones del usuario actual`);
    
    userInstitutions.forEach(institution => {
        const option = document.createElement('option');
        option.value = institution.id;
        option.textContent = institution.name;
        courseInstitutionSelect.appendChild(option);
        console.log(`✅ Agregada institución: ${institution.name}`);
    });
    
    if (userInstitutions.length === 0) {
        const noUserInstitutionOption = document.createElement('option');
        noUserInstitutionOption.value = '';
        noUserInstitutionOption.textContent = 'Debes crear una institución primero';
        noUserInstitutionOption.disabled = true;
        courseInstitutionSelect.appendChild(noUserInstitutionOption);
    }
}

// ===== MODAL FUNCTIONS CORREGIDAS =====
function openCourseModal(courseId = null) {
    console.log('🔓 Abriendo modal de curso...', courseId || 'nuevo');
    
    const modal = document.getElementById('courseModal');
    const form = document.getElementById('courseForm');
    const title = document.getElementById('modal-title');
    
    if (!modal) {
        console.error('❌ Modal de curso no encontrado');
        showNotification('Error: Modal no encontrado', 'error');
        return;
    }
    
    if (!form) {
        console.error('❌ Formulario de curso no encontrado');
        showNotification('Error: Formulario no encontrado', 'error');
        return;
    }
    
    currentEditingCourse = courseId;
    
    if (courseId) {
        // Modo edición
        if (title) title.textContent = 'Editar Curso';
        fillCourseForm(courseId);
    } else {
        // Modo creación
        if (title) title.textContent = 'Crear Nuevo Curso';
        form.reset();
        // Asegurar que el checkbox esté marcado por defecto
        const activeCheckbox = document.getElementById('courseActive');
        if (activeCheckbox) activeCheckbox.checked = true;
    }
    
    // 👇 CRÍTICO: Poblar instituciones ANTES de mostrar el modal
    populateInstitutionSelect();
    
    // Mostrar modal
    modal.classList.add('show');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus en primer campo
    setTimeout(() => {
        const firstInput = form.querySelector('input[type="text"]');
        if (firstInput) {
            firstInput.focus();
            console.log('✅ Focus establecido en:', firstInput.id);
        }
    }, 200); // Aumentar el delay para dar tiempo a cargar las instituciones
    
    console.log('✅ Modal abierto correctamente');
}

function closeCourseModal() {
    const modal = document.getElementById('courseModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Reset form
        const form = document.getElementById('courseForm');
        if (form) {
            form.reset();
        }
        
        currentEditingCourse = null;
        console.log('✅ Modal cerrado');
    }
}

function fillCourseForm(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    console.log('📝 Llenando formulario con datos del curso:', course);
    
    // Llenar campos del formulario
    const fields = {
        'courseName': course.name || '',
        'courseDescription': course.description || '',
        'courseInstitution': course.institutionId || '', // 👈 AGREGAR ESTA LÍNEA
        'courseLevel': course.level || 'basico',
        'courseSchedule': course.schedule || '',
        'courseClassroom': course.classroom || '',
        'courseCapacity': course.capacity || ''
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
            console.log(`✅ Campo ${fieldId} = ${value}`);
        } else {
            console.warn(`⚠️ Campo no encontrado: ${fieldId}`);
        }
    });
    
    // Checkbox de estado activo
    const activeCheckbox = document.getElementById('courseActive');
    if (activeCheckbox) {
        activeCheckbox.checked = course.isActive !== false;
    }
}

// ===== CRUD OPERATIONS =====
async function handleCourseSubmit(e) {
    e.preventDefault();
    
    console.log('📝 Procesando envío de formulario...');
    
    const formData = new FormData(e.target);
    
    // Debug: mostrar todos los datos del formulario
    console.log('🔍 Datos del formulario:');
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
    }
    
    const courseData = {
        name: formData.get('name')?.trim() || formData.get('courseName')?.trim(),
        description: formData.get('description')?.trim() || formData.get('courseDescription')?.trim(),
        institutionId: formData.get('institutionId') || formData.get('courseInstitution'),
        level: formData.get('level') || formData.get('courseLevel') || 'basico',
        schedule: formData.get('schedule')?.trim() || formData.get('courseSchedule')?.trim(),
        duration: formData.get('duration')?.trim() || formData.get('courseDuration')?.trim(),
        capacity: parseInt(formData.get('capacity') || formData.get('courseCapacity')) || 0,
        classroom: formData.get('classroom')?.trim() || formData.get('courseClassroom')?.trim(),
        isActive: formData.get('isActive') === 'on' || formData.get('courseActive') === 'on'
    };
    
    console.log('📊 Datos procesados:', courseData);
    
    // Validaciones
    if (!courseData.name) {
        showNotification('El nombre del curso es obligatorio', 'error');
        return;
    }
    
    if (!courseData.institutionId) {
        showNotification('Debe seleccionar una institución', 'error');
        return;
    }
    
    try {
        if (currentEditingCourse) {
            await updateCourse(currentEditingCourse, courseData);
        } else {
            await createCourse(courseData);
        }
        
        closeCourseModal();
        updateCoursesDisplay();
        
    } catch (error) {
        console.error('❌ Error al guardar curso:', error);
        showNotification('Error al guardar el curso', 'error');
    }
}

async function createCourse(courseData) {
    const newCourse = {
        id: generateUniqueId('course'),
        ...courseData,
        studentsCount: 0,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Guardar localmente
    courses.unshift(newCourse);
    setUserData('courses', JSON.stringify(courses));
    
    // Sincronizar con Firebase
    if (window.db && currentUser) {
        try {
            await window.db.collection('users')
                .doc(currentUser.uid)
                .collection('courses')
                .doc(newCourse.id)
                .set(newCourse);
            console.log('✅ Curso sincronizado con Firebase');
        } catch (error) {
            console.warn('⚠️ Error sincronizando con Firebase:', error);
        }
    }
    
    showNotification('Curso creado exitosamente', 'success');
}

async function updateCourse(courseId, courseData) {
    const courseIndex = courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) {
        showNotification('Curso no encontrado', 'error');
        return;
    }
    
    // Actualizar curso
    courses[courseIndex] = {
        ...courses[courseIndex],
        ...courseData,
        updatedAt: new Date().toISOString()
    };
    
    // Guardar localmente
    setUserData('courses', JSON.stringify(courses));
    
    // Sincronizar con Firebase
    if (window.db && currentUser) {
        try {
            await window.db.collection('users')
                .doc(currentUser.uid)
                .collection('courses')
                .doc(courseId)
                .update({
                    ...courseData,
                    updatedAt: new Date().toISOString()
                });
            console.log('✅ Curso actualizado en Firebase');
        } catch (error) {
            console.warn('⚠️ Error actualizando en Firebase:', error);
        }
    }
    
    showNotification('Curso actualizado exitosamente', 'success');
}

async function deleteCourse(courseId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este curso? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        // Eliminar localmente
        courses = courses.filter(c => c.id !== courseId);
        setUserData('courses', JSON.stringify(courses));
        
        // Eliminar de Firebase
        if (window.db && currentUser) {
            try {
                await window.db.collection('users')
                    .doc(currentUser.uid)
                    .collection('courses')
                    .doc(courseId)
                    .delete();
                console.log('✅ Curso eliminado de Firebase');
            } catch (error) {
                console.warn('⚠️ Error eliminando de Firebase:', error);
            }
        }
        
        // Actualizar vista
        updateCoursesDisplay();
        showNotification('Curso eliminado exitosamente', 'success');
        
    } catch (error) {
        console.error('❌ Error eliminando curso:', error);
        showNotification('Error al eliminar el curso', 'error');
    }
}

// ===== RENDERIZADO =====
function updateCoursesDisplay() {
    const container = document.getElementById('coursesGrid');
    if (!container) return;
    
    const userCourses = courses.filter(course => course.createdBy === currentUser?.uid);
    
    if (userCourses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-illustration">
                    <i class="fas fa-chalkboard-teacher"></i>
                </div>
                <h3>No hay cursos registrados</h3>
                <p>Comienza creando tu primer curso para organizar tus clases y estudiantes</p>
                <button onclick="openCourseModal()" class="empty-action-btn">
                    <i class="fas fa-plus"></i>
                    Crear Primer Curso
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userCourses.map(course => createCourseCard(course)).join('');
    
    // Actualizar contador
    const coursesCount = document.getElementById('courses-count');
    if (coursesCount) {
        coursesCount.textContent = `${userCourses.length} curso${userCourses.length !== 1 ? 's' : ''}`;
    }
}

function createCourseCard(course) {
    const institution = institutions.find(i => i.id === course.institutionId);
    const institutionName = institution ? institution.name : 'Sin institución';
    
    return `
        <div class="course-card ${!course.isActive ? 'inactive' : ''}" data-course-id="${course.id}">
            <div class="course-header">
                <div class="course-level ${course.level || 'basico'}">
                    ${getLevelDisplayName(course.level || 'basico')}
                </div>
                <div class="course-status ${course.isActive ? 'active' : 'inactive'}">
                    <i class="fas fa-circle"></i>
                    <span>${course.isActive ? 'Activo' : 'Inactivo'}</span>
                </div>
            </div>
            
            <div class="course-content">
                <h4 class="course-name">${course.name}</h4>
                <p class="course-description">${course.description || 'Sin descripción'}</p>
                
                <div class="course-meta">
                    <div class="meta-item">
                        <i class="fas fa-users"></i>
                        <span>${course.studentsCount || 0} estudiantes</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-university"></i>
                        <span>${institutionName}</span>
                    </div>
                    ${course.classroom ? `
                        <div class="meta-item">
                            <i class="fas fa-door-open"></i>
                            <span>${course.classroom}</span>
                        </div>
                    ` : ''}
                    ${course.schedule ? `
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${course.schedule}</span>
                        </div>
                    ` : ''}
                    ${course.capacity ? `
                        <div class="meta-item">
                            <i class="fas fa-chair"></i>
                            <span>Capacidad: ${course.capacity}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="course-date">
                    <i class="fas fa-calendar"></i>
                    <span>Creado: ${formatDate(course.createdAt)}</span>
                </div>
            </div>
            
            <div class="course-actions">
                <button class="course-btn view" onclick="viewCourse('${course.id}')" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="course-btn edit" onclick="openCourseModal('${course.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="course-btn students" onclick="manageStudents('${course.id}')" title="Gestionar estudiantes">
                    <i class="fas fa-user-graduate"></i>
                </button>
                <button class="course-btn delete" onclick="deleteCourse('${course.id}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// ===== FUNCIONES AUXILIARES =====
function getLevelDisplayName(level) {
    const levels = {
        'inicial': 'Inicial',
        'primario': 'Primario',
        'secundario': 'Secundario',
        'universitario': 'Universitario',
        'mixto': 'Mixto'
    };
    return levels[level] || 'Básico';
}

function filterCourses() {
    const searchTerm = document.getElementById('course-search')?.value.toLowerCase() || '';
    const levelFilter = document.getElementById('level-filter')?.value || '';
    const statusFilter = document.getElementById('status-filter')?.value || '';
    
    const courseCards = document.querySelectorAll('.course-card');
    
    courseCards.forEach(card => {
        const courseId = card.dataset.courseId;
        const course = courses.find(c => c.id === courseId);
        
        if (!course) {
            card.style.display = 'none';
            return;
        }
        
        let shouldShow = true;
        
        // Filtro de búsqueda
        if (searchTerm) {
            const courseName = course.name.toLowerCase();
            const courseDescription = (course.description || '').toLowerCase();
            if (!courseName.includes(searchTerm) && !courseDescription.includes(searchTerm)) {
                shouldShow = false;
            }
        }
        
        // Filtro de nivel
        if (levelFilter) {
            if (course.level !== levelFilter) {
                shouldShow = false;
            }
        }
        
        // Filtro de estado
        if (statusFilter) {
            if (statusFilter === 'active') {
                if (!course.isActive) shouldShow = false;
            } else if (statusFilter === 'inactive') {
                if (course.isActive) shouldShow = false;
            }
        }
        
        card.style.display = shouldShow ? 'block' : 'none';
    });
}

function viewCourse(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    const institution = institutions.find(i => i.id === course.institutionId);
    
    // Por ahora, mostrar información básica
    alert(`
Curso: ${course.name}
Institución: ${institution ? institution.name : 'Sin institución'}
Nivel: ${getLevelDisplayName(course.level)}
Estudiantes: ${course.studentsCount || 0}
Estado: ${course.isActive ? 'Activo' : 'Inactivo'}
${course.description ? 'Descripción: ' + course.description : ''}
    `);
}

function manageStudents(courseId) {
    // Redirigir a estudiantes con filtro de curso
    window.location.href = `estudiantes.html?course=${courseId}`;
}

// ===== FUNCIONES DE UTILIDAD =====
function generateUniqueId(prefix = 'course') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatDate(dateString) {
    if (!dateString) return 'Fecha no disponible';
    
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

function getUserData(key) {
    if (!currentUser) return null;
    return localStorage.getItem(`${currentUser.uid}_${key}`);
}

function setUserData(key, value) {
    if (!currentUser) return;
    localStorage.setItem(`${currentUser.uid}_${key}`, value);
}

// ===== FUNCIÓN showNotification COMPLETAMENTE CORREGIDA =====
function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // 🔥 CORRECCIÓN: Usar window.showNotification (NO showGlobalNotification)
    if (typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
        // Usar la función global de app.js
        window.showNotification(message, type);
        return;
    }
    
    // ✅ Fallback local mejorado si no existe la función global
    createLocalNotification(message, type);
}

function createLocalNotification(message, type) {
    // Remover notificación anterior si existe
    const existingNotification = document.querySelector('.course-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Crear nueva notificación
    const notification = document.createElement('div');
    notification.className = `course-notification ${type}`;
    
    const colors = {
        success: '#28A745',
        error: '#DC3545',
        warning: '#FFC107',
        info: '#17A2B8'
    };
    
    const icons = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.8rem;">
            <i class="fas fa-${icons[type] || icons.info}" style="color: white; font-size: 1.2rem;"></i>
            <span style="flex: 1;">${message}</span>
        </div>
    `;
    
    // Estilos inline para asegurar visibilidad
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: 'Quicksand', sans-serif;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 400px;
        word-wrap: break-word;
        animation: slideInFromRight 0.3s ease-out;
    `;
    
    // Agregar animación CSS inline
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInFromRight {
            from { 
                transform: translateX(100%); 
                opacity: 0; 
            }
            to { 
                transform: translateX(0); 
                opacity: 1; 
            }
        }
    `;
    if (!document.querySelector('style[data-notification-styles]')) {
        style.setAttribute('data-notification-styles', 'true');
        document.head.appendChild(style);
    }
    
    // Agregar al documento
    document.body.appendChild(notification);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// ===== EXPORTAR FUNCIONES GLOBALES =====
window.openCourseModal = openCourseModal;
window.closeCourseModal = closeCourseModal;
window.deleteCourse = deleteCourse;
window.viewCourse = viewCourse;
window.manageStudents = manageStudents;

// ===== FUNCIONES DE UTILIDAD =====
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

function debugModalElements() {
    const elements = [
        'courseModal',
        'courseForm', 
        'courseName',
        'courseInstitution',
        'courseLevel'
    ];
    
    console.log('🔍 Diagnóstico de elementos del modal:');
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`  ${id}: ${element ? '✅' : '❌'}`);
    });
}


// ===== FUNCIÓN DE DEBUG =====
function debugCourseForm() {
    console.log('🔍 ===== DEBUG FORMULARIO DE CURSO =====');
    
    const elements = [
        'courseModal',
        'courseForm',
        'courseName',
        'courseInstitution', // 👈 VERIFICAR ESTE ELEMENTO
        'courseLevel',
        'courseDescription'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`  ${id}: ${element ? '✅ Encontrado' : '❌ No encontrado'}`);
        if (element && element.tagName === 'SELECT') {
            console.log(`    Opciones: ${element.options.length}`);
        }
    });
    
    console.log(`  Instituciones cargadas: ${institutions.length}`);
    console.log(`  Usuario actual: ${currentUser?.uid || 'No disponible'}`);
    console.log('🔍 ===== FIN DEBUG =====');
}

// Exponer función de debug globalmente
window.debugCourseForm = debugCourseForm;

console.log('✅ Módulo de cursos cargado completamente - v2.2 CORREGIDO FINAL');