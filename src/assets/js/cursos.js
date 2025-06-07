/**
 * EduCheck Pro - Sistema de Gestión de Cursos INTEGRADO
 * Usa las utilidades existentes de database.js y syncManager.js
 */

// ===== VARIABLES GLOBALES =====
let coursesCollection = null;
let coursesListener = null;
let allCourses = [];
let filteredCourses = [];
let currentUser = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 Inicializando gestión de cursos integrada...');
    
    // Esperar a que Firebase esté listo
    const waitForFirebase = setInterval(() => {
        if (window.auth && window.db) {
            clearInterval(waitForFirebase);
            setupAuthListener();
        }
    }, 100);
});

function setupAuthListener() {
    window.auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            console.log('✅ Usuario autenticado para cursos:', user.email);
            initializeCourses();
        } else {
            console.log('❌ Usuario no autenticado');
            window.location.href = 'login.html';
        }
    });
}

// ===== INICIALIZAR CURSOS =====
function initializeCourses() {
    console.log('📚 Inicializando gestión de cursos...');
    
    if (!currentUser) {
        console.error('❌ Usuario no autenticado');
        return;
    }
    
    // Configurar colección usando las referencias existentes
    coursesCollection = window.db.collection('users')
        .doc(currentUser.uid)
        .collection('courses');
    
    // Configurar listener de cursos
    setupCoursesListener();
    
    // Configurar eventos de interfaz
    setupCourseEvents();
    setupModal();
    setupFilters();
    
    console.log('✅ Gestión de cursos inicializada');
}

// ===== LISTENER DE FIREBASE =====
function setupCoursesListener() {
    console.log('👂 Configurando listener de cursos...');
    
    coursesListener = coursesCollection
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            console.log('📊 Cursos actualizados desde Firebase');
            
            allCourses = [];
            snapshot.forEach((doc) => {
                allCourses.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`📚 ${allCourses.length} cursos cargados`);
            
            // Actualizar interfaz
            displayCourses();
            updateCoursesStats();
            
        }, (error) => {
            console.error('❌ Error en listener de cursos:', error);
            showNotification('Error al cargar cursos', 'error');
            showErrorState();
        });
}

// ===== CREAR CURSO USANDO DATABASE.JS =====
async function createCourse(courseData) {
    console.log('➕ Creando nuevo curso...', courseData);
    
    try {
        // Usar función existente de database.js (adaptada para cursos)
        const newCourse = {
            ...courseData,
            id: generateUniqueId(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            userId: currentUser.uid,
            studentsCount: 0
        };
        
        // Guardar usando la estructura existente
        const docRef = await coursesCollection.add(newCourse);
        
        console.log('✅ Curso creado con ID:', docRef.id);
        showNotification('Curso creado correctamente', 'success');
        
        return docRef.id;
        
    } catch (error) {
        console.error('❌ Error creando curso:', error);
        showNotification('Error al crear curso: ' + error.message, 'error');
        throw error;
    }
}

// ===== ACTUALIZAR CURSO =====
async function updateCourse(courseId, courseData) {
    console.log('✏️ Actualizando curso...', courseId, courseData);
    
    try {
        const updatedCourse = {
            ...courseData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await coursesCollection.doc(courseId).update(updatedCourse);
        
        console.log('✅ Curso actualizado:', courseId);
        showNotification('Curso actualizado correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error actualizando curso:', error);
        showNotification('Error al actualizar curso: ' + error.message, 'error');
        throw error;
    }
}

// ===== ELIMINAR CURSO =====
async function deleteCourse(courseId) {
    console.log('🗑️ Eliminando curso...', courseId);
    
    try {
        await coursesCollection.doc(courseId).delete();
        
        console.log('✅ Curso eliminado:', courseId);
        showNotification('Curso eliminado correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error eliminando curso:', error);
        showNotification('Error al eliminar curso: ' + error.message, 'error');
        throw error;
    }
}

// ===== MOSTRAR CURSOS =====
function displayCourses() {
    const coursesGrid = document.getElementById('coursesGrid');
    
    if (!coursesGrid) {
        console.error('❌ coursesGrid no encontrado');
        return;
    }
    
    const coursesToShow = filteredCourses.length > 0 ? filteredCourses : allCourses;
    
    if (coursesToShow.length === 0) {
        showEmptyState();
        return;
    }
    
    const coursesHTML = coursesToShow.map(course => createCourseCard(course)).join('');
    coursesGrid.innerHTML = coursesHTML;
    
    console.log(`📚 Mostrando ${coursesToShow.length} cursos`);
}

function createCourseCard(course) {
    const createdDate = course.createdAt ? formatDate(course.createdAt) : 'Sin fecha';
    const statusClass = course.isActive ? 'active' : 'inactive';
    const statusText = course.isActive ? 'Activo' : 'Inactivo';
    
    return `
        <div class="course-card" data-course-id="${course.id}">
            <div class="course-header">
                <div class="course-level">${course.level || 'Sin nivel'}</div>
                <div class="course-status ${statusClass}">
                    <i class="fas fa-circle"></i>
                    ${statusText}
                </div>
            </div>
            <div class="course-content">
                <h4>${course.name}</h4>
                <p class="course-description">${course.description || 'Sin descripción'}</p>
                <div class="course-meta">
                    <div class="meta-item">
                        <i class="fas fa-door-open"></i>
                        <span>${course.classroom || 'Sin aula'}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-users"></i>
                        <span>${course.studentsCount || 0} estudiantes</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-user-tie"></i>
                        <span>${course.capacity || 'Sin límite'} capacidad</span>
                    </div>
                </div>
                <div class="course-date">
                    <i class="fas fa-calendar"></i>
                    <span>Creado: ${createdDate}</span>
                </div>
            </div>
            <div class="course-actions">
                <button class="course-btn view" onclick="viewCourse('${course.id}')" title="Ver curso">
                    <i class="fas fa-eye"></i>
                    Ver
                </button>
                <button class="course-btn edit" onclick="editCourseModal('${course.id}')" title="Editar curso">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button class="course-btn delete" onclick="confirmDeleteCourse('${course.id}')" title="Eliminar curso">
                    <i class="fas fa-trash"></i>
                    Eliminar
                </button>
            </div>
        </div>
    `;
}

// ===== UTILIDADES (USAR LAS EXISTENTES) =====
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(timestamp) {
    if (!timestamp) return 'Sin fecha';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===== ESTADOS DE INTERFAZ =====
function showEmptyState() {
    const coursesGrid = document.getElementById('coursesGrid');
    coursesGrid.innerHTML = `
        <div class="empty-state">
            <div class="empty-illustration">
                <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <h3>No hay cursos registrados</h3>
            <p>Comienza creando tu primer curso para organizar tu enseñanza</p>
            <button class="empty-action-btn" onclick="openCourseModal()">
                <i class="fas fa-plus"></i>
                <span>Crear Primer Curso</span>
            </button>
        </div>
    `;
}

function showLoadingState() {
    const coursesGrid = document.getElementById('coursesGrid');
    coursesGrid.innerHTML = `
        <div class="loading-placeholder">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando cursos...</p>
        </div>
    `;
}

function showErrorState() {
    const coursesGrid = document.getElementById('coursesGrid');
    coursesGrid.innerHTML = `
        <div class="empty-state error-state">
            <div class="empty-illustration">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Error al cargar cursos</h3>
            <p>Hubo un problema al cargar los cursos. Intenta recargar la página.</p>
            <button class="empty-action-btn" onclick="window.location.reload()">
                <i class="fas fa-refresh"></i>
                <span>Recargar Página</span>
            </button>
        </div>
    `;
}

// ===== EVENTOS Y MODAL (MANTENIENDO TU ESTRUCTURA ACTUAL) =====
function setupCourseEvents() {
    const addCourseBtn = document.getElementById('addCourseBtn');
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', () => openCourseModal());
    }
    
    const courseForm = document.getElementById('course-form');
    if (courseForm) {
        courseForm.addEventListener('submit', handleSaveCourse);
    }
}

function setupModal() {
    const modal = document.getElementById('course-modal');
    const closeBtn = modal?.querySelector('.close-modal');
    const cancelBtn = modal?.querySelector('.cancel-btn');
    const overlay = modal?.querySelector('.modal-overlay');
    
    if (closeBtn) closeBtn.addEventListener('click', closeCourseModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeCourseModal);
    if (overlay) overlay.addEventListener('click', closeCourseModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.style.display === 'flex') {
            closeCourseModal();
        }
    });
}

function setupFilters() {
    const searchInput = document.getElementById('course-search');
    const levelFilter = document.getElementById('level-filter');
    const statusFilter = document.getElementById('status-filter');
    
    if (searchInput) searchInput.addEventListener('input', debounce(filterCourses, 300));
    if (levelFilter) levelFilter.addEventListener('change', filterCourses);
    if (statusFilter) statusFilter.addEventListener('change', filterCourses);
}

function filterCourses() {
    const searchTerm = document.getElementById('course-search')?.value.toLowerCase() || '';
    const levelFilter = document.getElementById('level-filter')?.value || '';
    const statusFilter = document.getElementById('status-filter')?.value || '';
    
    filteredCourses = allCourses.filter(course => {
        const matchesSearch = !searchTerm || 
            course.name.toLowerCase().includes(searchTerm) ||
            (course.description && course.description.toLowerCase().includes(searchTerm));
        
        const matchesLevel = !levelFilter || course.level === levelFilter;
        
        const matchesStatus = !statusFilter || 
            (statusFilter === 'active' && course.isActive) ||
            (statusFilter === 'inactive' && !course.isActive);
        
        return matchesSearch && matchesLevel && matchesStatus;
    });
    
    console.log(`🔍 Filtrado: ${filteredCourses.length} de ${allCourses.length} cursos`);
    displayCourses();
}

function updateCoursesStats() {
    const totalCourses = allCourses.length;
    const activeCourses = allCourses.filter(course => course.isActive).length;
    const totalStudents = allCourses.reduce((sum, course) => sum + (course.studentsCount || 0), 0);
    
    console.log('📊 Estadísticas:', { totalCourses, activeCourses, totalStudents });
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

// ===== FUNCIONES GLOBALES CORREGIDAS =====
let editingCourseId = null;

window.openCourseModal = function(courseData = null) {
    const modal = document.getElementById('course-modal');
    const modalTitle = document.getElementById('modal-title');
    const saveBtnText = document.getElementById('save-btn-text');
    
    if (!modal) return;
    
    if (courseData) {
        // Modo edición
        modalTitle.textContent = 'Editar Curso';
        saveBtnText.textContent = 'Actualizar Curso';
        editingCourseId = courseData.id;
        populateForm(courseData);
    } else {
        // Modo creación
        modalTitle.textContent = 'Nuevo Curso';
        saveBtnText.textContent = 'Guardar Curso';
        editingCourseId = null;
        resetForm();
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus en primer input
    setTimeout(() => {
        const firstInput = modal.querySelector('input:not([type="checkbox"])');
        if (firstInput) firstInput.focus();
    }, 100);
};

window.closeCourseModal = function() {
    const modal = document.getElementById('course-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        editingCourseId = null;
        resetForm();
    }
};

window.viewCourse = function(courseId) {
    console.log('👁️ Ver curso:', courseId);
    window.location.href = `estudiantes.html?course=${courseId}`;
};

window.editCourseModal = function(courseId) {
    console.log('✏️ Editar curso:', courseId);
    try {
        const course = allCourses.find(c => c.id === courseId);
        if (course) {
            openCourseModal(course);
        } else {
            showNotification('Curso no encontrado', 'error');
        }
    } catch (error) {
        console.error('❌ Error cargando curso:', error);
        showNotification('Error al cargar curso', 'error');
    }
};

window.confirmDeleteCourse = function(courseId) {
    console.log('🗑️ Confirmar eliminación:', courseId);
    
    const course = allCourses.find(c => c.id === courseId);
    const courseName = course ? course.name : 'este curso';
    
    // Crear modal de confirmación personalizado
    const confirmModal = document.createElement('div');
    confirmModal.className = 'confirm-modal';
    confirmModal.innerHTML = `
        <div class="confirm-overlay"></div>
        <div class="confirm-content">
            <div class="confirm-header">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Confirmar eliminación</h3>
            </div>
            <div class="confirm-body">
                <p>¿Estás seguro de eliminar el curso <strong>"${courseName}"</strong>?</p>
                <p class="warning">Esta acción no se puede deshacer y eliminará todos los estudiantes asociados.</p>
            </div>
            <div class="confirm-actions">
                <button class="confirm-cancel">Cancelar</button>
                <button class="confirm-delete">Eliminar Curso</button>
            </div>
        </div>
    `;
    
    // Agregar estilos del modal de confirmación
    if (!document.querySelector('#confirm-modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'confirm-modal-styles';
        styles.textContent = `
            .confirm-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease;
            }
            
            .confirm-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
            
            .confirm-content {
                background: var(--edu-bg-primary);
                border: 1px solid var(--edu-border);
                border-radius: var(--edu-radius-2xl);
                box-shadow: var(--edu-shadow-2xl);
                max-width: 500px;
                width: 90%;
                position: relative;
                z-index: 1;
                animation: slideInUp 0.4s ease;
            }
            
            .confirm-header {
                padding: var(--edu-space-2xl);
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                border-radius: var(--edu-radius-2xl) var(--edu-radius-2xl) 0 0;
                display: flex;
                align-items: center;
                gap: var(--edu-space-md);
            }
            
            .confirm-header i {
                font-size: 1.5rem;
            }
            
            .confirm-header h3 {
                margin: 0;
                font-size: 1.3rem;
                font-weight: 700;
            }
            
            .confirm-body {
                padding: var(--edu-space-2xl);
            }
            
            .confirm-body p {
                margin: 0 0 var(--edu-space-md) 0;
                color: var(--edu-text-primary);
                font-size: 1rem;
                line-height: 1.6;
            }
            
            .confirm-body .warning {
                color: #ef4444;
                font-weight: 600;
                font-size: 0.9rem;
            }
            
            .confirm-actions {
                padding: var(--edu-space-2xl);
                border-top: 1px solid var(--edu-border);
                display: flex;
                gap: var(--edu-space-lg);
                justify-content: flex-end;
            }
            
            .confirm-cancel,
            .confirm-delete {
                padding: var(--edu-space-md) var(--edu-space-xl);
                border-radius: var(--edu-radius-lg);
                font-family: inherit;
                font-size: 0.95rem;
                font-weight: 700;
                cursor: pointer;
                transition: var(--edu-transition);
                border: none;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }
            
            .confirm-cancel {
                background: var(--edu-bg-secondary);
                color: var(--edu-text-secondary);
                border: 2px solid var(--edu-border);
            }
            
            .confirm-cancel:hover {
                background: var(--edu-bg-tertiary);
                transform: translateY(-2px);
            }
            
            .confirm-delete {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                box-shadow: var(--edu-shadow-md);
            }
            
            .confirm-delete:hover {
                transform: translateY(-2px);
                box-shadow: var(--edu-shadow-lg);
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(confirmModal);
    document.body.style.overflow = 'hidden';
    
    // Configurar eventos
    const cancelBtn = confirmModal.querySelector('.confirm-cancel');
    const deleteBtn = confirmModal.querySelector('.confirm-delete');
    const overlay = confirmModal.querySelector('.confirm-overlay');
    
    const closeModal = () => {
        confirmModal.remove();
        document.body.style.overflow = '';
    };
    
    const confirmDelete = async () => {
        closeModal();
        try {
            await deleteCourse(courseId);
        } catch (error) {
            console.error('❌ Error eliminando curso:', error);
        }
    };
    
    cancelBtn.addEventListener('click', closeModal);
    deleteBtn.addEventListener('click', confirmDelete);
    overlay.addEventListener('click', closeModal);
    
    // Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
};

// ===== AGREGAR FUNCIÓN PARA RESETEAR FORMULARIO =====
function resetForm() {
    const form = document.getElementById('course-form');
    if (form) {
        form.reset();
        // Marcar curso como activo por defecto
        const activeCheckbox = document.getElementById('courseActive');
        if (activeCheckbox) {
            activeCheckbox.checked = true;
        }
    }
}

// ===== CORREGIR FUNCIÓN PARA MANEJAR GUARDADO =====
async function handleSaveCourse(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const courseData = {
        name: formData.get('name'),
        level: formData.get('level'),
        classroom: formData.get('classroom'),
        capacity: parseInt(formData.get('capacity')) || null,
        description: formData.get('description'),
        isActive: formData.get('isActive') === 'on'
    };
    
    if (!courseData.name || !courseData.level) {
        showNotification('Por favor completa los campos obligatorios', 'error');
        return;
    }
    
    try {
        if (editingCourseId) {
            // Actualizar curso existente
            await updateCourse(editingCourseId, courseData);
        } else {
            // Crear nuevo curso
            await createCourse(courseData);
        }
        
        closeCourseModal();
        
    } catch (error) {
        console.error('❌ Error guardando curso:', error);
        showNotification('Error al guardar curso', 'error');
    }
}

// ===== AGREGAR FUNCIÓN showNotification SI NO EXISTE =====
function showNotification(message, type = 'info', duration = 3000) {
    // Si ya existe en app.js, no duplicar
    if (window.showNotification) {
        window.showNotification(message, type, duration);
        return;
    }
    
    // Implementación básica si no existe
    console.log(`${type.toUpperCase()}: ${message}`);
    alert(message);
}

// ===== LIMPIEZA =====
window.addEventListener('beforeunload', () => {
    if (coursesListener) {
        coursesListener();
    }
});

console.log('✅ Cursos.js integrado con sistema existente cargado');