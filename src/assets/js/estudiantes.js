/**
 * EduCheck Pro - Sistema de Gestión de Estudiantes COMPLETO
 * Compatible con header unificado y completamente funcional
 */

// ===== VARIABLES GLOBALES =====
let currentStudents = [];
let filteredStudents = [];
let currentFilter = 'all';
let currentView = 'grid';
let selectedStudents = new Set();
let currentEditingStudent = null;
let currentUser = null;

// Elementos DOM
let elements = {
    container: null,
    searchInput: null,
    addButton: null,
    modal: null,
    form: null
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('👥 Inicializando sistema de estudiantes...');
    
    // Esperar a que app.js configure Firebase y el menú
    const waitForApp = setInterval(() => {
        if (window.auth && typeof window.setupMenuToggle === 'function') {
            clearInterval(waitForApp);
            console.log('🔗 Estudiantes.js - App.js detectado');
            
            // Configurar listener de autenticación
            window.auth.onAuthStateChanged((user) => {
                if (user) {
                    currentUser = user;
                    console.log(`👤 Usuario autenticado: ${user.email}`);
                    
                    setTimeout(() => {
                        initializeStudentsSystem();
                    }, 1000);
                    
                } else {
                    console.log('❌ Usuario no autenticado, redirigiendo...');
                    window.location.href = 'login.html';
                }
            });
        }
    }, 100);
    
    setTimeout(() => {
        clearInterval(waitForApp);
        if (!window.auth) {
            console.error('❌ App.js no se cargó correctamente');
        }
    }, 10000);
});

// ===== FUNCIÓN PRINCIPAL DE INICIALIZACIÓN =====
function initializeStudentsSystem() {
    console.log('🎯 Inicializando sistema completo de estudiantes...');
    
    try {
        // Inicializar elementos DOM
        initializeDOMElements();
        
        // Cargar datos
        loadStudents();
        loadInstitutionOptions();
        loadCourseOptions();
        
        // Verificar si hay filtro de curso en URL
        filterStudentsByCourse();
        
        // Configurar interfaz
        setupEventListeners();
        
        // Renderizar datos (solo si no se filtró por curso)
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.get('course')) {
            renderStudents();
            updateStudentsCount();
        }
        
        console.log('✅ Sistema de estudiantes inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando sistema:', error);
        showNotification('Error al cargar el sistema de estudiantes', 'error');
    }
}

// ===== INICIALIZACIÓN DE ELEMENTOS DOM =====
function initializeDOMElements() {
    elements.container = document.getElementById('students-grid');
    elements.searchInput = document.getElementById('search-students');
    elements.addButton = document.getElementById('add-student-btn');
    elements.modal = document.getElementById('student-modal');
    elements.form = document.getElementById('student-form');
    
    console.log('🔧 Elementos DOM inicializados', {
        container: !!elements.container,
        searchInput: !!elements.searchInput,
        addButton: !!elements.addButton,
        modal: !!elements.modal,
        form: !!elements.form
    });
}

// ===== GESTIÓN DE DATOS =====
function loadStudents() {
    try {
        if (!currentUser) {
            console.log('❌ Usuario no autenticado');
            currentStudents = [];
            return;
        }
        
        const savedStudents = getUserData('students');
        currentStudents = savedStudents ? JSON.parse(savedStudents) : [];
        
        // Filtrar solo estudiantes del usuario actual
        currentStudents = currentStudents.filter(student => 
            student.createdBy === currentUser.uid
        );
        
        console.log(`📊 Cargados ${currentStudents.length} estudiantes para usuario ${currentUser.uid}`);
        
        // Aplicar filtros iniciales
        filteredStudents = [...currentStudents];
        
    } catch (error) {
        console.error('❌ Error cargando estudiantes:', error);
        currentStudents = [];
        filteredStudents = [];
    }
}

function saveStudents() {
    if (!currentUser) {
        console.error('❌ No hay usuario para guardar estudiantes');
        return;
    }
    
    const userStudents = currentStudents.filter(s => s.createdBy === currentUser.uid);
    setUserData('students', JSON.stringify(userStudents));
    console.log(`💾 ${userStudents.length} estudiantes guardados para usuario ${currentUser.uid}`);
}

// ===== CONFIGURACIÓN DE EVENTOS =====
function setupEventListeners() {
    console.log('🎛️ Configurando event listeners...');
    
    // Búsqueda con debounce
    if (elements.searchInput) {
        const debouncedSearch = debounce(handleSearch, 300);
        elements.searchInput.addEventListener('input', debouncedSearch);
    }
    
    // Botón agregar estudiante
    if (elements.addButton) {
        elements.addButton.addEventListener('click', openAddStudentModal);
    }
    
    // Formulario de estudiante
    if (elements.form) {
        elements.form.addEventListener('submit', handleSaveStudent);
    }
    
    // Cerrar modales
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Click en overlay para cerrar modales
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
    
    // Botón cancelar
    const cancelBtn = document.getElementById('cancel-student');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeAllModals);
    }
    
    // Filtros
    setupFilterListeners();
    
    console.log('✅ Event listeners configurados');
}

function setupFilterListeners() {
    // Filtro de institución
    const institutionFilter = document.getElementById('filter-institution');
    if (institutionFilter) {
        institutionFilter.addEventListener('change', applyFilters);
    }
    
    // Filtro de curso
    const courseFilter = document.getElementById('filter-course');
    if (courseFilter) {
        courseFilter.addEventListener('change', applyFilters);
    }
    
    // Filtro de estado
    const statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    // Botones de filtro
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
    
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
}

// ===== MANEJADORES DE EVENTOS =====
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (!query) {
        filteredStudents = [...currentStudents];
    } else {
        filteredStudents = currentStudents.filter(student => 
            student.name.toLowerCase().includes(query) ||
            (student.email && student.email.toLowerCase().includes(query)) ||
            (student.phone && student.phone.includes(query))
        );
    }
    
    renderStudents();
    updateStudentsCount();
    console.log(`🔍 Búsqueda: "${query}" - ${filteredStudents.length} resultados`);
}

async function handleSaveStudent(e) {
    e.preventDefault();
    
    console.log('💾 Guardando estudiante...');
    
    const formData = new FormData(e.target);
    const studentData = {
        name: formData.get('name')?.trim(),
        email: formData.get('email')?.trim(),
        phone: formData.get('phone')?.trim(),
        institutionId: formData.get('institutionId'),
        courseId: formData.get('courseId'),
        enrollmentDate: formData.get('enrollmentDate'),
        status: formData.get('status') || 'active',
        notes: formData.get('notes')?.trim(),
        isActive: formData.get('status') === 'active'
    };
    
    // Validaciones
    if (!studentData.name) {
        showNotification('El nombre es obligatorio', 'error');
        return;
    }
    
    if (!studentData.institutionId) {
        showNotification('Debe seleccionar una institución', 'error');
        return;
    }
    
    if (!studentData.courseId) {
        showNotification('Debe seleccionar un curso', 'error');
        return;
    }
    
    if (studentData.email && !isValidEmail(studentData.email)) {
        showNotification('El formato del email no es válido', 'error');
        return;
    }
    
    try {
        if (currentEditingStudent) {
            await updateStudent(currentEditingStudent.id, studentData);
        } else {
            await createStudent(studentData);
        }
        
        closeAllModals();
        
    } catch (error) {
        console.error('❌ Error al guardar estudiante:', error);
        showNotification('Error al guardar el estudiante', 'error');
    }
}

// ===== CRUD OPERATIONS =====
async function createStudent(studentData) {
    const newStudent = {
        id: generateUniqueId(),
        ...studentData,
        attendanceHistory: [],
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    currentStudents.unshift(newStudent);
    saveStudents();
    
    // Actualizar contador de estudiantes en el curso
    updateCourseStudentCount(studentData.courseId);
    
    // Actualizar interfaz
    filteredStudents = [...currentStudents];
    renderStudents();
    updateStudentsCount();
    
    showNotification(`✅ Estudiante "${newStudent.name}" creado correctamente`, 'success');
    console.log(`👥 Estudiante creado: ${newStudent.name} (ID: ${newStudent.id})`);
}

async function updateStudent(studentId, studentData) {
    const studentIndex = currentStudents.findIndex(s => s.id === studentId);
    if (studentIndex === -1) {
        throw new Error('Estudiante no encontrado');
    }
    
    const oldCourseId = currentStudents[studentIndex].courseId;
    
    // Actualizar estudiante
    currentStudents[studentIndex] = {
        ...currentStudents[studentIndex],
        ...studentData,
        lastModified: new Date().toISOString()
    };
    
    saveStudents();
    
    // Actualizar contadores si cambió de curso
    if (oldCourseId !== studentData.courseId) {
        updateCourseStudentCount(oldCourseId);
        updateCourseStudentCount(studentData.courseId);
    }
    
    // Actualizar interfaz
    filteredStudents = [...currentStudents];
    renderStudents();
    updateStudentsCount();
    
    showNotification(`✅ Estudiante "${studentData.name}" actualizado correctamente`, 'success');
    console.log(`📝 Estudiante actualizado: ${studentData.name} (ID: ${studentId})`);
}

function deleteStudent(studentId) {
    const student = currentStudents.find(s => s.id === studentId);
    if (!student) {
        showNotification('Estudiante no encontrado', 'error');
        return;
    }
    
    // Verificar permisos
    if (student.createdBy !== currentUser.uid) {
        showNotification('No tienes permisos para eliminar este estudiante', 'error');
        return;
    }
    
    if (!confirm(`¿Estás seguro de eliminar al estudiante "${student.name}"? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    const courseId = student.courseId;
    
    const studentIndex = currentStudents.findIndex(s => s.id === studentId);
    currentStudents.splice(studentIndex, 1);
    saveStudents();
    
    // Actualizar contador de estudiantes en el curso
    updateCourseStudentCount(courseId);
    
    // Actualizar interfaz
    filteredStudents = [...currentStudents];
    renderStudents();
    updateStudentsCount();
    
    showNotification(`✅ Estudiante "${student.name}" eliminado correctamente`, 'success');
    console.log(`🗑️ Estudiante eliminado: ${student.name} (ID: ${studentId})`);
}

// ===== RENDERIZADO =====
function renderStudents() {
    if (!elements.container) return;
    
    if (filteredStudents.length === 0) {
        renderEmptyState();
        return;
    }
    
    elements.container.innerHTML = filteredStudents.map(student => 
        createStudentCard(student)
    ).join('');
    
    // Configurar event listeners para las tarjetas
    setupCardEventListeners();
    
    console.log(`📋 ${filteredStudents.length} estudiantes renderizados`);
}

function createStudentCard(student) {
    return `
        <div class="student-card" data-student-id="${student.id}">
            <div class="student-header">
                <div class="student-avatar">
                    <span>${getStudentInitials(student)}</span>
                </div>
                <div class="student-actions">
                    <button class="student-action edit" onclick="editStudent('${student.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="student-action delete" onclick="deleteStudent('${student.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="student-info">
                <h4>${student.name}</h4>
                <div class="student-details">
                    <div class="student-detail">
                        <i class="fas fa-envelope"></i>
                        <span>${student.email || 'Sin email'}</span>
                    </div>
                    <div class="student-detail">
                        <i class="fas fa-phone"></i>
                        <span>${student.phone || 'Sin teléfono'}</span>
                    </div>
                    <div class="student-detail">
                        <i class="fas fa-chalkboard-teacher"></i>
                        <span>${getCourseName(student.courseId)}</span>
                    </div>
                    <div class="student-detail">
                        <i class="fas fa-university"></i>
                        <span>${getInstitutionName(student.institutionId)}</span>
                    </div>
                    ${student.enrollmentDate ? `
                        <div class="student-detail">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Inscrito: ${formatDate(student.enrollmentDate)}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="student-status ${student.isActive ? 'active' : 'inactive'}">
                    <i class="fas fa-circle"></i>
                    <span>${student.isActive ? 'Activo' : 'Inactivo'}</span>
                </div>
                
                ${student.notes ? `
                    <div class="student-notes">
                        <i class="fas fa-sticky-note"></i>
                        <span>${student.notes}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderEmptyState() {
    const emptyMessage = currentStudents.length === 0 ? 
        'No hay estudiantes registrados' : 
        'No hay estudiantes que coincidan con los filtros';
    
    elements.container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-user-graduate"></i>
            </div>
            <h3>${emptyMessage}</h3>
            <p>Comienza agregando estudiantes para gestionar tu comunidad educativa.</p>
            <button onclick="openAddStudentModal()" class="empty-action-btn">
                <i class="fas fa-plus"></i>
                Agregar Primer Estudiante
            </button>
        </div>
    `;
}

function updateStudentsCount() {
    const countElement = document.getElementById('students-count');
    if (countElement) {
        const total = currentStudents.length;
        const filtered = filteredStudents.length;
        
        if (total === filtered) {
            countElement.textContent = `${total} estudiante${total !== 1 ? 's' : ''}`;
        } else {
            countElement.textContent = `${filtered} de ${total} estudiantes`;
        }
    }
}

// ===== MODALES Y FORMULARIOS =====
function openAddStudentModal() {
    currentEditingStudent = null;
    resetStudentForm();
    
    const modalTitle = document.getElementById('student-modal-title');
    const saveText = document.getElementById('save-student-text');
    
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Agregar Estudiante';
    if (saveText) saveText.textContent = 'Guardar Estudiante';
    
    if (elements.modal) {
        elements.modal.classList.add('show');
        elements.modal.style.display = 'flex';
    }
    
    console.log('📝 Modal de agregar estudiante abierto');
}

function editStudent(studentId) {
    const student = currentStudents.find(s => s.id === studentId);
    if (!student) {
        showNotification('Estudiante no encontrado', 'error');
        return;
    }
    
    currentEditingStudent = student;
    fillStudentForm(student);
    
    const modalTitle = document.getElementById('student-modal-title');
    const saveText = document.getElementById('save-student-text');
    
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Estudiante';
    if (saveText) saveText.textContent = 'Actualizar Estudiante';
    
    if (elements.modal) {
        elements.modal.classList.add('show');
        elements.modal.style.display = 'flex';
    }
    
    console.log(`📝 Editando estudiante: ${student.name}`);
}

function resetStudentForm() {
    if (!elements.form) return;
    
    elements.form.reset();
    
    // Establecer fecha actual como predeterminada
    const enrollmentDate = document.getElementById('student-enrollment-date');
    if (enrollmentDate) {
        enrollmentDate.value = new Date().toISOString().split('T')[0];
    }
}

function fillStudentForm(student) {
    const fields = {
        'student-name': student.name,
        'student-email': student.email,
        'student-phone': student.phone,
        'student-institution': student.institutionId,
        'student-course': student.courseId,
        'student-enrollment-date': student.enrollmentDate ? student.enrollmentDate.split('T')[0] : '',
        'student-notes': student.notes,
        'student-status': student.status
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field && value) field.value = value;
    });
}

// ===== CARGAR OPCIONES DE SELECTS =====
function loadInstitutionOptions() {
    const institutionSelect = document.getElementById('student-institution');
    const institutionFilter = document.getElementById('filter-institution');
    
    if (!institutionSelect && !institutionFilter) return;
    
    const institutionsData = getUserData('institutions');
    const institutions = institutionsData ? JSON.parse(institutionsData) : [];
    
    // Poblar select del formulario
    if (institutionSelect) {
        institutionSelect.innerHTML = '<option value="">Seleccionar institución</option>';
        institutions.forEach(institution => {
            const option = document.createElement('option');
            option.value = institution.id;
            option.textContent = institution.name;
            institutionSelect.appendChild(option);
        });
    }
    
    // Poblar filtro de instituciones
    if (institutionFilter) {
        institutionFilter.innerHTML = '<option value="">Todas las instituciones</option>';
        institutions.forEach(institution => {
            const option = document.createElement('option');
            option.value = institution.id;
            option.textContent = institution.name;
            institutionFilter.appendChild(option);
        });
    }
}

function loadCourseOptions() {
    const courseSelect = document.getElementById('student-course');
    const courseFilterSelect = document.getElementById('filter-course');
    
    if (!courseSelect && !courseFilterSelect) return;
    
    const coursesData = getUserData('courses');
    const courses = coursesData ? JSON.parse(coursesData) : [];
    
    // Poblar select del formulario
    if (courseSelect) {
        courseSelect.innerHTML = '<option value="">Seleccionar curso</option>';
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            courseSelect.appendChild(option);
        });
    }
    
    // Poblar filtro de cursos
    if (courseFilterSelect) {
        courseFilterSelect.innerHTML = '<option value="">Todos los cursos</option>';
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            courseFilterSelect.appendChild(option);
        });
    }
}

// ===== FILTROS =====
function applyFilters() {
    const institutionFilter = document.getElementById('filter-institution').value;
    const courseFilter = document.getElementById('filter-course').value;
    const statusFilter = document.getElementById('filter-status').value;
    const searchQuery = elements.searchInput.value.toLowerCase().trim();
    
    filteredStudents = currentStudents.filter(student => {
        // Filtro de búsqueda
        const matchesSearch = !searchQuery || 
            student.name.toLowerCase().includes(searchQuery) ||
            (student.email && student.email.toLowerCase().includes(searchQuery)) ||
            (student.phone && student.phone.includes(searchQuery));
        
        // Filtro de institución
        const matchesInstitution = !institutionFilter || student.institutionId === institutionFilter;
        
        // Filtro de curso
        const matchesCourse = !courseFilter || student.courseId === courseFilter;
        
        // Filtro de estado
        const matchesStatus = !statusFilter || 
            (statusFilter === 'active' && student.isActive) ||
            (statusFilter === 'inactive' && !student.isActive);
        
        return matchesSearch && matchesInstitution && matchesCourse && matchesStatus;
    });
    
    renderStudents();
    updateStudentsCount();
    
    console.log(`🔍 Filtros aplicados: ${filteredStudents.length} estudiantes mostrados`);
}

function clearAllFilters() {
    // Limpiar todos los filtros
    document.getElementById('filter-institution').value = '';
    document.getElementById('filter-course').value = '';
    document.getElementById('filter-status').value = '';
    elements.searchInput.value = '';
    
    // Mostrar todos los estudiantes
    filteredStudents = [...currentStudents];
    renderStudents();
    updateStudentsCount();
    
    console.log('🔄 Filtros limpiados');
}

// ===== FUNCIONES PARA FILTRAR POR CURSO DESDE URL =====
function filterStudentsByCourse() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course');
    
    if (courseId) {
        console.log('🔗 Filtrando estudiantes por curso:', courseId);
        
        filteredStudents = currentStudents.filter(student => 
            student.courseId === courseId
        );
        
        updateHeaderForCourse(courseId);
        renderStudents();
        updateStudentsCount();
        addBackToAllButton();
    }
}

function updateHeaderForCourse(courseId) {
    const coursesData = getUserData('courses');
    const courses = coursesData ? JSON.parse(coursesData) : [];
    const course = courses.find(c => c.id === courseId);
    
    if (course) {
        const headerTitle = document.querySelector('.controls-title h2');
        if (headerTitle) {
            headerTitle.innerHTML = `
                <i class="fas fa-users"></i>
                Estudiantes de ${course.name}
            `;
        }
        
        const headerDescription = document.querySelector('.controls-title p');
        if (headerDescription) {
            headerDescription.textContent = `Administra los estudiantes del curso "${course.name}"`;
        }
    }
}

function addBackToAllButton() {
    const controlsActions = document.querySelector('.controls-actions');
    if (controlsActions && !document.getElementById('back-to-all-btn')) {
        const backButton = document.createElement('button');
        backButton.id = 'back-to-all-btn';
        backButton.className = 'action-btn tertiary';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Ver Todos';
        backButton.addEventListener('click', () => {
            window.location.href = 'estudiantes.html';
        });
        
        controlsActions.insertBefore(backButton, controlsActions.firstChild);
    }
}

// ===== ACTUALIZAR CONTADOR DE ESTUDIANTES EN CURSO =====
function updateCourseStudentCount(courseId) {
    if (!courseId) return;
    
    const coursesData = getUserData('courses');
    const courses = coursesData ? JSON.parse(coursesData) : [];
    
    const courseIndex = courses.findIndex(c => c.id === courseId);
    if (courseIndex !== -1) {
        const studentCount = currentStudents.filter(s => s.courseId === courseId).length;
        courses[courseIndex].studentsCount = studentCount;
        setUserData('courses', JSON.stringify(courses));
        
        console.log(`📊 Curso ${courses[courseIndex].name}: ${studentCount} estudiantes`);
    }
}

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

function generateUniqueId() {
    return 'std_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getStudentInitials(student) {
    if (!student.name) return 'NN';
    const names = student.name.trim().split(' ');
    if (names.length === 1) {
        return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
}

function getInstitutionName(institutionId) {
    if (!institutionId) return 'Sin institución';
    
    const institutions = JSON.parse(getUserData('institutions') || '[]');
    const institution = institutions.find(i => i.id === institutionId);
    return institution ? institution.name : 'Institución no encontrada';
}

function getCourseName(courseId) {
    if (!courseId) return 'Sin curso';
    
    const courses = JSON.parse(getUserData('courses') || '[]');
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : 'Curso no encontrado';
}

function formatDate(dateString) {
    if (!dateString) return 'No definido';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

function setupCardEventListeners() {
    const studentCards = document.querySelectorAll('.student-card');
    
    studentCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.student-actions')) {
                const studentId = this.dataset.studentId;
                console.log(`👁️ Mostrando detalles de estudiante: ${studentId}`);
            }
        });
    });
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
        modal.style.display = 'none';
    });
    currentEditingStudent = null;
}

function showNotification(message, type = 'info') {
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
}

// ===== FUNCIONES GLOBALES =====
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.openAddStudentModal = openAddStudentModal;
window.filterStudentsByCourse = filterStudentsByCourse;
window.updateCourseStudentCount = updateCourseStudentCount;

console.log('✅ estudiantes.js COMPLETO cargado correctamente');