/**
 * EduCheck Pro - Sistema de Gestión de Estudiantes
 * Módulo completo para administración de estudiantes
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

function getStudentInitials(student) {
    if (!student.name) return 'NN';
    const names = student.name.trim().split(' ');
    if (names.length === 1) {
        return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
}

function generateUniqueId() {
    return 'std_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icons[type] || icons.info}"></i>
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
        notification.classList.remove('show');
    }, 5000);
}

function initializeTheme() {
    const user = window.auth?.currentUser;
    if (!user) return;
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    const savedTheme = getUserData('darkMode') === 'true';
    
    if (savedTheme) {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    }
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleTheme);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    setUserData('darkMode', isDark.toString());
    showNotification(isDark ? '🌙 Modo oscuro activado' : '☀️ Modo claro activado', 'success');
}

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
    
    if (!window.auth) {
        console.error('❌ Firebase Auth no disponible');
        return;
    }
    
    window.auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            console.log(`👤 Usuario autenticado: ${user.uid} (${user.email})`);
            initializeStudentsSystem();
        } else {
            console.log('❌ Usuario no autenticado, redirigiendo...');
            window.location.href = 'login.html';
        }
    });
});

// ===== FUNCIÓN PRINCIPAL DE INICIALIZACIÓN =====
function initializeStudentsSystem() {
    console.log('🎯 Inicializando sistema completo de estudiantes...');
    
    try {
        // Inicializar elementos DOM
        initializeDOMElements();
        
        // Inicializar menú toggle
        initializeMenuToggle();
        
        // Cargar datos
        loadStudents();
        
        // Configurar interfaz
        setupEventListeners();
        initializeTheme();
        updateUserInfo();
        
        // Renderizar datos
        renderStudents();
        updateStudentsCount();
        
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
    
    console.log('🔧 Elementos DOM inicializados');
}

// ===== MENÚ TOGGLE =====
function initializeMenuToggle() {
    console.log('🔧 Estudiantes: Inicializando menú toggle...');
    
    const profileButton = document.getElementById('profileButton');
    const menuDropdown = document.getElementById('menuDropdown');
    const menuCloseBtn = document.getElementById('menu-close-btn');
    
    if (!profileButton || !menuDropdown) {
        console.error('❌ Elementos del menú no encontrados');
        console.log('🔍 Elementos encontrados:', {
            profileButton: !!profileButton,
            menuDropdown: !!menuDropdown,
            menuCloseBtn: !!menuCloseBtn
        });
        return;
    }
    
    function openMenu() {
        menuDropdown.classList.add('show', 'active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        menuDropdown.classList.remove('show', 'active');
        document.body.style.overflow = '';
    }
    
    profileButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Profile button clicked');
        openMenu();
    });
    
    if (menuCloseBtn) {
        menuCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeMenu();
        });
    }
    
    document.addEventListener('click', function(e) {
        if (menuDropdown.classList.contains('show') && 
            !menuDropdown.contains(e.target) && 
            !profileButton.contains(e.target)) {
            closeMenu();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menuDropdown.classList.contains('show')) {
            closeMenu();
        }
    });
    
    // Configurar logout
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                window.auth.signOut().then(() => {
                    window.location.href = 'login.html';
                }).catch((error) => {
                    console.error('Error al cerrar sesión:', error);
                    showNotification('Error al cerrar sesión', 'error');
                });
            }
        });
    }
    
    console.log('✅ Menú toggle inicializado');
}

// ===== ACTUALIZAR INFO DEL USUARIO =====
function updateUserInfo() {
    if (!currentUser) return;
    
    const displayName = currentUser.displayName || currentUser.email.split('@')[0];
    
    const nameElements = [
        document.getElementById('headerTeacherName'),
        document.getElementById('menuTeacherName')
    ];
    
    nameElements.forEach(element => {
        if (element) {
            element.textContent = displayName;
        }
    });
    
    console.log(`👤 Info de usuario actualizada: ${displayName}`);
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

// ===== CONFIGURAR EVENT LISTENERS =====
function setupEventListeners() {
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
    
    console.log('🎛️ Event listeners configurados');
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
    const initials = getStudentInitials(student);
    const statusClass = student.status === 'active' ? 'active' : 'inactive';
    
    return `
        <div class="student-card ${statusClass}" data-student-id="${student.id}">
            <div class="student-header">
                <div class="student-avatar">
                    <span>${initials}</span>
                </div>
                <div class="student-actions">
                    <button class="student-action edit" onclick="editStudent('${student.id}')" title="Editar estudiante">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="student-action delete" onclick="deleteStudent('${student.id}')" title="Eliminar estudiante">
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
                        <i class="fas fa-university"></i>
                        <span>${getInstitutionName(student.institutionId)}</span>
                    </div>
                    <div class="student-detail">
                        <i class="fas fa-chalkboard-teacher"></i>
                        <span>${getCourseName(student.courseId)}</span>
                    </div>
                </div>
                
                <div class="student-status ${statusClass}">
                    <i class="fas fa-circle"></i>
                    ${student.status === 'active' ? 'Activo' : 'Inactivo'}
                </div>
            </div>
        </div>
    `;
}

function renderEmptyState() {
    const emptyMessage = currentStudents.length === 0 ? 
        'No hay estudiantes registrados' : 
        'No hay estudiantes que coincidan con la búsqueda';
    
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
        const count = filteredStudents.length;
        countElement.textContent = `${count} estudiante${count !== 1 ? 's' : ''}`;
    }
}

// ===== FUNCIONES AUXILIARES DE RENDERIZADO =====
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
    
    // Cargar opciones de instituciones y cursos
    loadInstitutionOptions();
    loadCourseOptions();
    
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
    
    loadInstitutionOptions();
    loadCourseOptions();
    
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

function loadInstitutionOptions() {
    const institutionSelect = document.getElementById('student-institution');
    if (!institutionSelect) return;
    
    const institutions = JSON.parse(getUserData('institutions') || '[]')
        .filter(inst => inst.createdBy === currentUser.uid);
    
    institutionSelect.innerHTML = '<option value="">Seleccionar institución</option>';
    
    institutions.forEach(institution => {
        const option = document.createElement('option');
        option.value = institution.id;
        option.textContent = institution.name;
        institutionSelect.appendChild(option);
    });
    
    console.log(`📋 ${institutions.length} instituciones cargadas en selector`);
}

function loadCourseOptions() {
    const courseSelect = document.getElementById('student-course');
    if (!courseSelect) return;
    
    const courses = JSON.parse(getUserData('courses') || '[]')
        .filter(course => course.createdBy === currentUser.uid);
    
    courseSelect.innerHTML = '<option value="">Seleccionar curso</option>';
    
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = course.name;
        courseSelect.appendChild(option);
    });
    
    console.log(`📋 ${courses.length} cursos cargados en selector`);
}

function handleSaveStudent(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const studentData = {
        name: formData.get('studentName')?.trim(),
        email: formData.get('studentEmail')?.trim(),
        phone: formData.get('studentPhone')?.trim(),
        institutionId: formData.get('institutionSelect'),
        courseId: formData.get('courseSelect'),
        enrollmentDate: formData.get('enrollmentDate') || new Date().toISOString(),
        status: formData.get('status') || 'active',
        notes: formData.get('studentNotes')?.trim() || ''
    };
    
    // Validaciones
    if (!studentData.name) {
        showNotification('El nombre del estudiante es obligatorio', 'error');
        return;
    }
    
    if (studentData.email && !isValidEmail(studentData.email)) {
        showNotification('El email no tiene un formato válido', 'error');
        return;
    }
    
    try {
        if (currentEditingStudent) {
            updateStudent(currentEditingStudent.id, studentData);
        } else {
            createStudent(studentData);
        }
        
        closeAllModals();
        
    } catch (error) {
        console.error('❌ Error guardando estudiante:', error);
        showNotification('Error al guardar el estudiante', 'error');
    }
}

function createStudent(studentData) {
    const newStudent = {
        id: generateUniqueId(),
        ...studentData,
        attendanceHistory: [],
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    currentStudents.push(newStudent);
    saveStudents();
    
    // Actualizar interfaz
    filteredStudents = [...currentStudents];
    renderStudents();
    updateStudentsCount();
    
    showNotification(`✅ Estudiante "${newStudent.name}" creado correctamente`, 'success');
    console.log(`👥 Estudiante creado: ${newStudent.name} (ID: ${newStudent.id})`);
}

function updateStudent(studentId, studentData) {
    const studentIndex = currentStudents.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
        showNotification('Estudiante no encontrado', 'error');
        return;
    }
    
    const originalStudent = currentStudents[studentIndex];
    
    // Verificar permisos
    if (originalStudent.createdBy !== currentUser.uid) {
        showNotification('No tienes permisos para editar este estudiante', 'error');
        return;
    }
    
    // Actualizar datos
    currentStudents[studentIndex] = {
        ...originalStudent,
        ...studentData,
        lastModified: new Date().toISOString()
    };
    
    saveStudents();
    
    // Actualizar interfaz
    filteredStudents = [...currentStudents];
    renderStudents();
    updateStudentsCount();
    
    showNotification(`✅ Estudiante "${studentData.name}" actualizado correctamente`, 'success');
    console.log(`👥 Estudiante actualizado: ${studentData.name} (ID: ${studentId})`);
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
    
    const studentIndex = currentStudents.findIndex(s => s.id === studentId);
    currentStudents.splice(studentIndex, 1);
    saveStudents();
    
    // Actualizar interfaz
    filteredStudents = [...currentStudents];
    renderStudents();
    updateStudentsCount();
    
    showNotification(`✅ Estudiante "${student.name}" eliminado correctamente`, 'success');
    console.log(`🗑️ Estudiante eliminado: ${student.name} (ID: ${studentId})`);
}

// ===== FUNCIONES AUXILIARES =====
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function setupCardEventListeners() {
    // Configurar eventos para tarjetas de estudiantes
    const studentCards = document.querySelectorAll('.student-card');
    
    studentCards.forEach(card => {
        // Click en la tarjeta para ver detalles
        card.addEventListener('click', function(e) {
            // Solo si no se clickeó en un botón de acción
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

// ===== FUNCIONES GLOBALES =====
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.openAddStudentModal = openAddStudentModal;

console.log('✅ estudiantes.js cargado completamente con todas las funciones');