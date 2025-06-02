/**
 * EduCheck Pro - Gestión de Cursos
 * Sistema de administración de cursos y estudiantes
 * 
 * @description Módulo para gestionar cursos, estudiantes y asistencia por institución
 * @version 2.0.0
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

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 Inicializando sistema de cursos...');
    
    // Verificar autenticación
    if (window.auth) {
        window.auth.onAuthStateChanged(user => {
            if (user) {
                initializeCoursesSystem();
            } else {
                window.location.href = 'login.html';
            }
        });
    } else {
        console.error('❌ Firebase Auth no disponible');
    }
});

// ===== FUNCIÓN PRINCIPAL DE INICIALIZACIÓN =====
function initializeCoursesSystem() {
    console.log('🎯 Inicializando sistema completo de cursos...');
    
    try {
        // Obtener institución desde URL
        const urlParams = new URLSearchParams(window.location.search);
        const institutionId = urlParams.get('institution');
        
        if (!institutionId) {
            console.error('❌ No se especificó institución');
            showNotification('No se especificó la institución', 'error');
            setTimeout(() => {
                window.location.href = 'instituciones.html';
            }, 2000);
            return;
        }
        
        // Cargar institución
        loadInstitution(institutionId);
        
        // Cargar datos
        loadCourses();
        loadStudents();
        
        // Configurar interfaz
        setupEventListeners();
        setupSearchAndFilters();
        setupTabSystem();
        initializeDarkMode();
        
        // Actualizar interfaz
        updateDashboard();
        displayCourses();
        updateRecentActivity();
        
        console.log('✅ Sistema de cursos inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando sistema:', error);
        showNotification('Error al cargar el sistema', 'error');
    }
}

// ===== GESTIÓN DE DATOS =====

// Cargar institución
function loadInstitution(institutionId) {
    try {
        // CORREGIR: cambiar 'institutions' por 'establishments'
        const institutions = JSON.parse(getUserData('establishments') || '[]');
        currentInstitution = institutions.find(inst => inst.id === institutionId);
        
        if (!currentInstitution) {
            throw new Error('Institución no encontrada');
        }
        
        // Actualizar header
        document.getElementById('institution-name').textContent = currentInstitution.name;
        document.getElementById('institution-subtitle').textContent = 
            `Gestión de cursos - ${currentInstitution.type || 'Institución educativa'}`;
        
        console.log(`🏛️ Institución cargada: ${currentInstitution.name}`);
        
    } catch (error) {
        console.error('❌ Error cargando institución:', error);
        showNotification('Error cargando institución', 'error');
        setTimeout(() => {
            window.location.href = 'instituciones.html';
        }, 2000);
    }
}

// Cargar cursos
function loadCourses() {
    try {
        const savedCourses = getUserData('courses');
        const allCoursesData = savedCourses ? JSON.parse(savedCourses) : [];
        
        // Filtrar cursos de la institución actual
        allCourses = allCoursesData.filter(course => 
            course.institutionId === currentInstitution.id
        );
        
        console.log(`📚 Cargados ${allCourses.length} cursos para ${currentInstitution.name}`);
        
    } catch (error) {
        console.error('❌ Error cargando cursos:', error);
        allCourses = [];
    }
}

// Cargar estudiantes
function loadStudents() {
    try {
        const savedStudents = getUserData('students');
        const allStudentsData = savedStudents ? JSON.parse(savedStudents) : [];
        
        // Filtrar estudiantes de la institución actual
        allStudents = allStudentsData.filter(student => 
            student.institutionId === currentInstitution.id
        );
        
        console.log(`👥 Cargados ${allStudents.length} estudiantes para ${currentInstitution.name}`);
        
    } catch (error) {
        console.error('❌ Error cargando estudiantes:', error);
        allStudents = [];
    }
}

// Calcular estadísticas
function calculateStats() {
    try {
        const activeCourses = allCourses.filter(course => course.isActive !== false);
        const totalStudents = allStudents.length;
        
        // Calcular asistencia promedio
        let totalAttendance = 0;
        let studentsWithAttendance = 0;
        
        allStudents.forEach(student => {
            const attendance = student.attendanceHistory || [];
            if (attendance.length > 0) {
                const present = attendance.filter(a => 
                    a.status === 'present' || a.status === 'late'
                ).length;
                const percentage = (present / attendance.length) * 100;
                totalAttendance += percentage;
                studentsWithAttendance++;
            }
        });
        
        const avgAttendance = studentsWithAttendance > 0 ? 
            Math.round(totalAttendance / studentsWithAttendance) : 0;
        
        // Calcular actividades (simulado)
        const activities = JSON.parse(getUserData('activities') || '[]');
        const institutionActivities = activities.filter(activity => 
            activity.institutionId === currentInstitution.id
        );
        
        courseStats = {
            total: activeCourses.length,
            students: totalStudents,
            avgAttendance: avgAttendance,
            activities: institutionActivities.length
        };
        
        console.log('📊 Estadísticas calculadas:', courseStats);
        
    } catch (error) {
        console.error('❌ Error calculando estadísticas:', error);
        courseStats = { total: 0, students: 0, avgAttendance: 0, activities: 0 };
    }
}

// ===== INTERFAZ DE USUARIO =====

// Configurar event listeners
function setupEventListeners() {
    // Formulario de curso
    const courseForm = document.getElementById('course-form');
    if (courseForm) {
        courseForm.addEventListener('submit', handleSaveCourse);
    }
    
    // Formularios de estudiantes
    const singleStudentForm = document.getElementById('single-student-form');
    if (singleStudentForm) {
        singleStudentForm.addEventListener('submit', handleSaveSingleStudent);
    }
    
    const multipleStudentsForm = document.getElementById('multiple-students-form');
    if (multipleStudentsForm) {
        multipleStudentsForm.addEventListener('submit', handleSaveMultipleStudents);
    }
    
    // Botones de cierre de modal
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Botón de confirmación de eliminación
    const confirmDeleteBtn = document.getElementById('confirm-delete-course');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteCourse);
    }
    
    // Botón de vista previa de estudiantes
    const previewBtn = document.getElementById('preview-students-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', previewMultipleStudents);
    }
    
    // Click en overlay para cerrar modales
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
    
    console.log('🎛️ Event listeners configurados');
}

// Configurar búsqueda y filtros
function setupSearchAndFilters() {
    const searchInput = document.getElementById('course-search');
    const levelFilter = document.getElementById('level-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    if (levelFilter) {
        levelFilter.addEventListener('change', applyFilters);
    }
    
    console.log('🔍 Búsqueda y filtros configurados');
}

// Configurar sistema de tabs
function setupTabSystem() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // Actualizar botones
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Actualizar contenido
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}-student-tab` || 
                    content.id === `${targetTab}-students-tab`) {
                    content.classList.add('active');
                }
            });
            
            // Actualizar botones del modal
            updateStudentModalButtons(targetTab);
        });
    });
    
    console.log('📑 Sistema de tabs configurado');
}

// Actualizar botones del modal de estudiantes
function updateStudentModalButtons(activeTab) {
    const previewBtn = document.getElementById('preview-students-btn');
    const saveBtn = document.getElementById('save-students-btn');
    const saveText = document.getElementById('save-students-text');
    
    if (activeTab === 'single') {
        previewBtn.style.display = 'none';
        saveText.textContent = 'Agregar Estudiante';
    } else {
        previewBtn.style.display = 'flex';
        saveText.textContent = 'Agregar Estudiantes';
    }
}

// Aplicar filtros
function applyFilters() {
    const searchTerm = document.getElementById('course-search').value.toLowerCase();
    const levelFilter = document.getElementById('level-filter').value;
    
    filteredCourses = allCourses.filter(course => {
        const matchesSearch = course.name.toLowerCase().includes(searchTerm) ||
                            (course.teacher && course.teacher.toLowerCase().includes(searchTerm)) ||
                            (course.classroom && course.classroom.toLowerCase().includes(searchTerm));
        
        const matchesLevel = !levelFilter || course.level === levelFilter;
        
        return matchesSearch && matchesLevel;
    });
    
    displayCourses();
}

// Actualizar dashboard
function updateDashboard() {
    calculateStats();
    
    // Actualizar elementos del dashboard
    updateElement('total-courses', courseStats.total);
    updateElement('total-students', courseStats.students);
    updateElement('avg-attendance', `${courseStats.avgAttendance}%`);
    updateElement('total-activities', courseStats.activities);
    
    // Actualizar contador de cursos
    const count = allCourses.length;
    updateElement('course-count', `(${count} ${count === 1 ? 'curso' : 'cursos'})`);
    
    console.log('📊 Dashboard actualizado');
}

// Mostrar cursos
function displayCourses() {
    const container = document.getElementById('courses-container');
    const emptyState = document.getElementById('empty-courses');
    
    if (!container) return;
    
    const coursesToShow = filteredCourses.length > 0 ? filteredCourses : allCourses;
    
    if (coursesToShow.length === 0) {
        container.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }
    
    container.style.display = 'grid';
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    container.innerHTML = coursesToShow.map(course => 
        createCourseCard(course)
    ).join('');
    
    console.log(`📚 Mostrando ${coursesToShow.length} cursos`);
}

// Crear tarjeta de curso
function createCourseCard(course) {
    const levelLabels = {
        inicial: 'Inicial',
        primario: 'Primario',
        secundario: 'Secundario',
        universitario: 'Universitario',
        mixto: 'Mixto'
    };
    
    const levelLabel = levelLabels[course.level] || 'Sin especificar';
    
    // Calcular estadísticas del curso
    const courseStudents = allStudents.filter(s => s.courseId === course.id);
    const totalStudents = courseStudents.length;
    
    // Calcular asistencia del curso
    let courseAttendance = 0;
    if (totalStudents > 0) {
        const totalAttendance = courseStudents.reduce((sum, student) => {
            const attendance = student.attendanceHistory || [];
            if (attendance.length === 0) return sum;
            const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
            return sum + ((present / attendance.length) * 100);
        }, 0);
        courseAttendance = Math.round(totalAttendance / totalStudents);
    }
    
    // Actividades del curso (simulado)
    const courseActivities = Math.floor(Math.random() * 20) + 5; // Simulado por ahora
    
    const createdDate = new Date(course.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const isActive = course.isActive !== false;
    
    return `
        <div class="course-card" data-id="${course.id}">
            <div class="course-header">
                <div class="course-info">
                    <h4 class="course-name">${course.name}</h4>
                    <span class="course-level">${levelLabel}</span>
                </div>
                <div class="course-status ${isActive ? 'active' : 'inactive'}" 
                     title="${isActive ? 'Curso activo' : 'Curso inactivo'}">
                    <i class="fas ${isActive ? 'fa-check-circle' : 'fa-pause-circle'}"></i>
                </div>
            </div>
            
            <div class="course-stats">
                <div class="stat-mini">
                    <span class="stat-mini-number">${totalStudents}</span>
                    <span class="stat-mini-label">Estudiantes</span>
                </div>
                <div class="stat-mini">
                    <span class="stat-mini-number">${courseAttendance}%</span>
                    <span class="stat-mini-label">Asistencia</span>
                </div>
                <div class="stat-mini">
                    <span class="stat-mini-number">${courseActivities}</span>
                    <span class="stat-mini-label">Actividades</span>
                </div>
            </div>
            
            ${course.classroom || course.schedule || course.teacher ? `
                <div class="course-details">
                    ${course.classroom ? `
                        <div class="detail-row">
                            <i class="fas fa-door-open"></i>
                            <span>${course.classroom}</span>
                        </div>
                    ` : ''}
                    ${course.schedule ? `
                        <div class="detail-row">
                            <i class="fas fa-clock"></i>
                            <span>${course.schedule}</span>
                        </div>
                    ` : ''}
                    ${course.teacher ? `
                        <div class="detail-row">
                            <i class="fas fa-user-tie"></i>
                            <span>${course.teacher}</span>
                        </div>
                    ` : ''}
                    ${course.capacity ? `
                        <div class="detail-row">
                            <i class="fas fa-users"></i>
                            <span>Capacidad: ${course.capacity} estudiantes</span>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            ${course.description ? `
                <div class="course-details">
                    <div class="detail-row">
                        <i class="fas fa-align-left"></i>
                        <span>${course.description}</span>
                    </div>
                </div>
            ` : ''}
            
            <div class="course-actions">
                <button class="action-btn view-students-btn" 
                        onclick="viewCourseStudents('${course.id}')"
                        title="Ver estudiantes">
                    <i class="fas fa-users"></i>
                    <span>Estudiantes</span>
                </button>
                <button class="action-btn edit-course-btn" 
                        onclick="editCourse('${course.id}')"
                        title="Editar curso">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-course-btn" 
                        onclick="deleteCourse('${course.id}')"
                        title="Eliminar curso">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="card-footer" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--courses-border); font-size: 0.8rem; color: var(--courses-text-light);">
                <i class="fas fa-calendar-plus"></i>
                Creado: ${createdDate}
            </div>
        </div>
    `;
}

// ===== FUNCIONES DE MODAL DE CURSOS =====

// Abrir modal de curso
function openCourseModal(courseId = null) {
    const modal = document.getElementById('course-modal');
    const modalTitle = document.getElementById('course-modal-title');
    const saveText = document.getElementById('save-course-text');
    const form = document.getElementById('course-form');
    
    if (courseId) {
        // Modo edición
        const course = allCourses.find(c => c.id === courseId);
        if (!course) return;
        
        currentEditingCourse = courseId;
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Curso';
        saveText.textContent = 'Actualizar Curso';
        
        // Llenar formulario
        document.getElementById('courseName').value = course.name;
        document.getElementById('courseLevel').value = course.level;
        document.getElementById('courseClassroom').value = course.classroom || '';
        document.getElementById('courseSchedule').value = course.schedule || '';
        document.getElementById('courseTeacher').value = course.teacher || '';
        document.getElementById('courseCapacity').value = course.capacity || '';
        document.getElementById('courseDescription').value = course.description || '';
        document.getElementById('courseNotes').value = course.notes || '';
        document.getElementById('courseActive').checked = course.isActive !== false;
        
    } else {
        // Modo creación
        currentEditingCourse = null;
        modalTitle.innerHTML = '<i class="fas fa-chalkboard-teacher"></i> Agregar Curso';
        saveText.textContent = 'Guardar Curso';
        form.reset();
        document.getElementById('courseActive').checked = true;
    }
    
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // Focus en el primer campo
    setTimeout(() => {
        document.getElementById('courseName').focus();
    }, 100);
}

// Cerrar modal de curso
function closeCourseModal() {
    const modal = document.getElementById('course-modal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    currentEditingCourse = null;
    
    // Limpiar formulario
    document.getElementById('course-form').reset();
}

// Manejar guardado de curso
function handleSaveCourse(event) {
    event.preventDefault();
    
    const user = window.auth?.currentUser;
    if (!user) {
        showNotification('Usuario no autenticado', 'error');
        return;
    }
    
    // Obtener datos del formulario
    const formData = {
        name: document.getElementById('courseName').value.trim(),
        level: document.getElementById('courseLevel').value,
        classroom: document.getElementById('courseClassroom').value.trim(),
        schedule: document.getElementById('courseSchedule').value.trim(),
        teacher: document.getElementById('courseTeacher').value.trim(),
        capacity: parseInt(document.getElementById('courseCapacity').value) || null,
        description: document.getElementById('courseDescription').value.trim(),
        notes: document.getElementById('courseNotes').value.trim(),
        isActive: document.getElementById('courseActive').checked
    };
    
    // Validación
    if (!formData.name) {
        showNotification('El nombre del curso es obligatorio', 'error');
        return;
    }
    
    if (!formData.level) {
        showNotification('Selecciona el nivel educativo', 'error');
        return;
    }
    
    // Verificar nombres duplicados
    const existingCourse = allCourses.find(c => 
        c.name.toLowerCase() === formData.name.toLowerCase() && 
        c.id !== currentEditingCourse
    );
    
    if (existingCourse) {
        showNotification('Ya existe un curso con este nombre', 'error');
        return;
    }
    
    try {
        if (currentEditingCourse) {
            // Actualizar curso existente
            updateCourse(currentEditingCourse, formData);
        } else {
            // Crear nuevo curso
            createCourse(formData, user);
        }
        
        // Cerrar modal
        closeCourseModal();
        
    } catch (error) {
        console.error('❌ Error guardando curso:', error);
        showNotification('Error al guardar el curso', 'error');
    }
}

// Crear nuevo curso
function createCourse(formData, user) {
    const newCourse = {
        id: generateId(),
        ...formData,
        institutionId: currentInstitution.id,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        students: [],
        attendanceHistory: []
    };
    
    allCourses.push(newCourse);
    saveCourses();
    
    // Actualizar interfaz
    updateDashboard();
    displayCourses();
    updateCourseSelects();
    addRecentActivity('create_course', newCourse.name);
    
    showNotification(`✅ Curso "${newCourse.name}" creado correctamente`, 'success');
    console.log(`📚 Curso creado: ${newCourse.name} (ID: ${newCourse.id})`);
}

// Actualizar curso existente
function updateCourse(courseId, formData) {
    const index = allCourses.findIndex(c => c.id === courseId);
    if (index === -1) return;
    
    // Actualizar datos
    allCourses[index] = {
        ...allCourses[index],
        ...formData,
        lastModified: new Date().toISOString()
    };
    
    saveCourses();
    
    // Actualizar interfaz
    updateDashboard();
    displayCourses();
    updateCourseSelects();
    addRecentActivity('update_course', allCourses[index].name);
    
    showNotification(`✅ Curso "${allCourses[index].name}" actualizado`, 'success');
    console.log(`📚 Curso actualizado: ${allCourses[index].name}`);
}

// ===== FUNCIONES DE ELIMINACIÓN =====

// Eliminar curso
function deleteCourse(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;
    
    document.getElementById('delete-course-name').textContent = course.name;
    document.getElementById('confirm-delete-course').dataset.courseId = courseId;
    
    const modal = document.getElementById('delete-course-modal');
    modal.classList.add('show');
    modal.style.display = 'flex';
}

// Cerrar modal de eliminación
function closeDeleteModal() {
    const modal = document.getElementById('delete-course-modal');
    modal.classList.remove('show');
    modal.style.display = 'none';
}

// Confirmar eliminación
function confirmDeleteCourse() {
    const courseId = document.getElementById('confirm-delete-course').dataset.courseId;
    const courseIndex = allCourses.findIndex(c => c.id === courseId);
    
    if (courseIndex === -1) return;
    
    const courseName = allCourses[courseIndex].name;
    
    try {
        // Eliminar estudiantes relacionados
        deleteRelatedStudents(courseId);
        
        // Eliminar curso
        allCourses.splice(courseIndex, 1);
        saveCourses();
        
        // Cerrar modal
        closeDeleteModal();
        
        // Actualizar interfaz
        updateDashboard();
        displayCourses();
        updateCourseSelects();
        addRecentActivity('delete_course', courseName);
        
        showNotification(`✅ Curso "${courseName}" eliminado`, 'success');
        console.log(`🗑️ Curso eliminado: ${courseName}`);
        
    } catch (error) {
        console.error('❌ Error eliminando curso:', error);
        showNotification('Error al eliminar el curso', 'error');
    }
}

// Eliminar estudiantes relacionados
function deleteRelatedStudents(courseId) {
    // Eliminar estudiantes del curso
    allStudents = allStudents.filter(s => s.courseId !== courseId);
    saveStudents();
    
    // También eliminar de la base de datos global
    const allStudentsData = JSON.parse(getUserData('students') || '[]');
    const filteredStudents = allStudentsData.filter(s => s.courseId !== courseId);
    setUserData('students', JSON.stringify(filteredStudents));
    
    console.log(`🧹 Estudiantes del curso eliminados: ${courseId}`);
}

// ===== FUNCIONES DE ESTUDIANTES =====

// Abrir modal de estudiantes masivos
function openBulkStudentModal() {
    const modal = document.getElementById('bulk-student-modal');
    
    // Actualizar selects de cursos
    updateCourseSelects();
    
    // Resetear tabs y formularios
    document.querySelector('.tab-btn[data-tab="single"]').click();
    document.getElementById('single-student-form').reset();
    document.getElementById('multiple-students-form').reset();
    hideStudentsPreview();
    
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // Focus en el primer campo
    setTimeout(() => {
        document.getElementById('studentName').focus();
    }, 100);
}

// Cerrar modal de estudiantes
function closeBulkStudentModal() {
    const modal = document.getElementById('bulk-student-modal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    
    // Limpiar formularios
    document.getElementById('single-student-form').reset();
    document.getElementById('multiple-students-form').reset();
    hideStudentsPreview();
}

// Actualizar selects de cursos
function updateCourseSelects() {
    const singleSelect = document.getElementById('studentCourse');
    const bulkSelect = document.getElementById('bulkStudentCourse');
    
    const activeCourses = allCourses.filter(course => course.isActive !== false);
    
    const options = activeCourses.map(course => 
        `<option value="${course.id}">${course.name} (${course.level})</option>`
    ).join('');
    
    if (singleSelect) {
        singleSelect.innerHTML = '<option value="">Seleccionar curso</option>' + options;
    }
    
    if (bulkSelect) {
        bulkSelect.innerHTML = '<option value="">Seleccionar curso</option>' + options;
    }
}

// Manejar guardado de estudiante individual
function handleSaveSingleStudent(event) {
    event.preventDefault();
    
    const user = window.auth?.currentUser;
    if (!user) {
        showNotification('Usuario no autenticado', 'error');
        return;
    }
    
    // Obtener datos del formulario
    const formData = {
        name: document.getElementById('studentName').value.trim(),
        courseId: document.getElementById('studentCourse').value,
        age: parseInt(document.getElementById('studentAge').value) || null,
        phone: document.getElementById('studentPhone').value.trim(),
        notes: document.getElementById('studentNotes').value.trim()
    };
    
    // Validación
    if (!formData.name) {
        showNotification('El nombre del estudiante es obligatorio', 'error');
        return;
    }
    
    if (!formData.courseId) {
        showNotification('Selecciona un curso', 'error');
        return;
    }
    
    try {
        createStudent(formData, user);
        
        // Limpiar formulario
        document.getElementById('single-student-form').reset();
        
        showNotification(`✅ Estudiante "${formData.name}" agregado correctamente`, 'success');
        
    } catch (error) {
        console.error('❌ Error guardando estudiante:', error);
        showNotification('Error al guardar el estudiante', 'error');
    }
}

// Manejar guardado de estudiantes múltiples
function handleSaveMultipleStudents(event) {
    event.preventDefault();
    
    const user = window.auth?.currentUser;
    if (!user) {
        showNotification('Usuario no autenticado', 'error');
        return;
    }
    
    const courseId = document.getElementById('bulkStudentCourse').value;
    const studentsText = document.getElementById('studentsTextarea').value.trim();
    
    // Validación
    if (!courseId) {
        showNotification('Selecciona un curso', 'error');
        return;
    }
    
    if (!studentsText) {
        showNotification('Ingresa la lista de estudiantes', 'error');
        return;
    }
    
    try {
        const students = parseStudentsText(studentsText);
        
        if (students.length === 0) {
            showNotification('No se encontraron estudiantes válidos', 'error');
            return;
        }
        
        // Crear estudiantes
        let createdCount = 0;
        students.forEach(studentData => {
            if (studentData.name && studentData.name.trim()) {
                createStudent({
                    ...studentData,
                    courseId: courseId
                }, user);
                createdCount++;
            }
        });
        
        // Limpiar formulario
        document.getElementById('multiple-students-form').reset();
        hideStudentsPreview();
        
        showNotification(`✅ ${createdCount} estudiantes agregados correctamente`, 'success');
        
    } catch (error) {
        console.error('❌ Error guardando estudiantes:', error);
        showNotification('Error al guardar los estudiantes', 'error');
    }
}

// Parsear texto de estudiantes
function parseStudentsText(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const students = [];
    
    lines.forEach(line => {
        const parts = line.split(',').map(part => part.trim());
        const student = {
            name: parts[0] || '',
            age: parseInt(parts[1]) || null,
            phone: parts[2] || '',
            notes: parts[3] || ''
        };
        
        if (student.name) {
            students.push(student);
        }
    });
    
    return students;
}

// Vista previa de estudiantes múltiples
function previewMultipleStudents() {
    const studentsText = document.getElementById('studentsTextarea').value.trim();
    
    if (!studentsText) {
        showNotification('Ingresa la lista de estudiantes', 'error');
        return;
    }
    
    const students = parseStudentsText(studentsText);
    
    if (students.length === 0) {
        showNotification('No se encontraron estudiantes válidos', 'error');
        return;
    }
    
    showStudentsPreview(students);
}

// Mostrar vista previa
function showStudentsPreview(students) {
    const previewSection = document.getElementById('students-preview');
    const previewList = document.getElementById('preview-list');
    
    previewList.innerHTML = students.map((student, index) => {
        const isValid = student.name && student.name.trim();
        return `
            <div class="preview-item">
                <div class="preview-student-info">
                    <div class="preview-student-name">${student.name || 'Sin nombre'}</div>
                    <div class="preview-student-details">
                        ${student.age ? `Edad: ${student.age}` : ''} 
                        ${student.phone ? `• Tel: ${student.phone}` : ''} 
                        ${student.notes ? `• ${student.notes}` : ''}
                    </div>
                </div>
                <span class="preview-status ${isValid ? 'valid' : 'error'}">
                    ${isValid ? 'Válido' : 'Error'}
                </span>
            </div>
        `;
    }).join('');
    
    previewSection.style.display = 'block';
}

// Ocultar vista previa
function hideStudentsPreview() {
    const previewSection = document.getElementById('students-preview');
    previewSection.style.display = 'none';
}

// Crear estudiante
function createStudent(formData, user) {
    const newStudent = {
        id: generateId(),
        name: formData.name,
        courseId: formData.courseId,
        institutionId: currentInstitution.id,
        age: formData.age,
        phone: formData.phone,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        attendanceHistory: [],
        isActive: true
    };
    
    // Agregar a la lista local
    allStudents.push(newStudent);
    
    // Guardar en base de datos global
    const allStudentsData = JSON.parse(getUserData('students') || '[]');
    allStudentsData.push(newStudent);
    setUserData('students', JSON.stringify(allStudentsData));
    
    // Actualizar interfaz
    updateDashboard();
    displayCourses();
    addRecentActivity('create_student', newStudent.name);
    
    console.log(`👥 Estudiante creado: ${newStudent.name} (ID: ${newStudent.id})`);
}

// ===== FUNCIONES DE NAVEGACIÓN =====

// Ver estudiantes de un curso
function viewCourseStudents(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;
    
    console.log(`👥 Navegando a estudiantes del curso: ${course.name}`);
    // Aquí se podría navegar a una página específica de estudiantes
    // Por ahora mostraremos una notificación
    showNotification(`🚧 Vista de estudiantes para "${course.name}" en desarrollo`, 'info');
}

// Editar curso
function editCourse(courseId) {
    openCourseModal(courseId);
}

// Ver todos los estudiantes
function viewAllStudents() {
    console.log('👥 Navegando a vista de todos los estudiantes...');
    showNotification('🚧 Vista de todos los estudiantes en desarrollo', 'info');
}

// Generar reportes
function generateReports() {
    console.log('📊 Generando reportes...');
    showNotification('🚧 Sistema de reportes en desarrollo', 'info');
}

// Ver toda la actividad
function viewAllActivity() {
    console.log('📋 Navegando a vista de toda la actividad...');
    showNotification('🚧 Vista completa de actividad en desarrollo', 'info');
}

// ===== EXPORTACIÓN DE DATOS =====

// Exportar datos de cursos
function exportCoursesData() {
    try {
        const user = window.auth?.currentUser;
        if (!user) {
            showNotification('Usuario no autenticado', 'error');
            return;
        }
        
        const exportData = {
            exportInfo: {
                date: new Date().toISOString(),
                user: user.email,
                institution: currentInstitution.name,
                version: '2.0',
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
        link.download = `cursos-${currentInstitution.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('✅ Datos de cursos exportados correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error exportando datos:', error);
        showNotification('Error al exportar datos', 'error');
    }
}

// ===== ACTIVIDAD RECIENTE =====

// Actualizar actividad reciente
function updateRecentActivity() {
    const container = document.getElementById('recent-activity-list');
    if (!container) return;
    
    const activities = JSON.parse(getUserData('recent_activities') || '[]');
    
    // Filtrar actividades de la institución actual
    const institutionActivities = activities.filter(activity => 
        activity.institutionId === currentInstitution.id
    );
    
    if (institutionActivities.length === 0) {
        container.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-description">No hay actividad reciente</div>
                    <div class="activity-time">Comienza agregando tu primer curso</div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = institutionActivities
        .slice(0, 5) // Mostrar solo las últimas 5
        .map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-time">${formatActivityTime(activity.timestamp)}</div>
                </div>
            </div>
        `)
        .join('');
}

// Agregar actividad reciente
function addRecentActivity(type, itemName) {
    const activities = JSON.parse(getUserData('recent_activities') || '[]');
    
    const descriptions = {
        create_course: `Curso "${itemName}" creado`,
        update_course: `Curso "${itemName}" actualizado`,
        delete_course: `Curso "${itemName}" eliminado`,
        create_student: `Estudiante "${itemName}" agregado`,
        update_student: `Estudiante "${itemName}" actualizado`,
        delete_student: `Estudiante "${itemName}" eliminado`
    };
    
    const newActivity = {
        id: generateId(),
        type: type,
        description: descriptions[type] || 'Actividad realizada',
        itemName: itemName,
        institutionId: currentInstitution.id,
        timestamp: new Date().toISOString()
    };
    
    activities.unshift(newActivity); // Agregar al inicio
    
    // Mantener solo las últimas 50 actividades
    if (activities.length > 50) {
        activities.splice(50);
    }
    
    setUserData('recent_activities', JSON.stringify(activities));
    updateRecentActivity();
}

// Obtener icono de actividad
function getActivityIcon(type) {
    const icons = {
        create_course: 'fa-plus-circle',
        update_course: 'fa-edit',
        delete_course: 'fa-trash',
        create_student: 'fa-user-plus',
        update_student: 'fa-user-edit',
        delete_student: 'fa-user-times'
    };
    return icons[type] || 'fa-circle';
}

// Formatear tiempo de actividad
function formatActivityTime(timestamp) {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return activityTime.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
    });
}

// ===== MODO OSCURO =====

// Inicializar modo oscuro
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Cargar preferencia guardada
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    }
    
    // Event listener para el toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'true');
                showNotification('🌙 Modo oscuro activado', 'success');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
                showNotification('☀️ Modo claro activado', 'success');
            }
        });
    }
}

// ===== FUNCIONES AUXILIARES =====

// Cerrar todos los modales
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
        modal.style.display = 'none';
    });
    currentEditingCourse = null;
    hideStudentsPreview();
}

// Generar ID único
function generateId() {
    return 'course_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Guardar cursos
function saveCourses() {
    const user = window.auth?.currentUser;
    if (user) {
        // Guardar en base de datos global
        const allCoursesData = JSON.parse(getUserData('courses') || '[]');
        
        // Actualizar cursos de esta institución
        const otherCourses = allCoursesData.filter(c => c.institutionId !== currentInstitution.id);
        const updatedCourses = [...otherCourses, ...allCourses];
        
        setUserData('courses', JSON.stringify(updatedCourses));
        console.log('💾 Cursos guardados');
    }
}

// Guardar estudiantes
function saveStudents() {
    const user = window.auth?.currentUser;
    if (user) {
        // Ya se actualiza en createStudent, pero mantenemos consistencia
        console.log('💾 Estudiantes actualizados');
    }
}

// Actualizar elemento del DOM
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Mostrar notificación
function showNotification(message, type = 'success') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                           type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Estilos inline
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        padding: 1rem 1.5rem;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 3000;
        max-width: 400px;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        border-left: 4px solid ${type === 'success' ? '#28a745' : 
                                type === 'error' ? '#dc3545' : '#17a2b8'};
        font-family: 'Quicksand', sans-serif;
        font-weight: 500;
    `;
    
    // Estilos para modo oscuro
    if (document.body.classList.contains('dark-mode')) {
        notification.style.background = '#2d2d2d';
        notification.style.color = '#e0e0e0';
    }
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-ocultar después de 4 segundos
    setTimeout(() => {
        hideNotification(notification);
    }, 4000);
    
    // Evento para cerrar manualmente
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
        hideNotification(notification);
    });
}

// Ocultar notificación
function hideNotification(notification) {
    notification.style.transform = 'translateX(120%)';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// ===== FUNCIONES DE DATOS DE USUARIO =====

function getUserData(key) {
    const user = window.auth?.currentUser;
    if (!user) return null;
    return localStorage.getItem(`${user.uid}_${key}`);
}

function setUserData(key, data) {
    const user = window.auth?.currentUser;
    if (!user) return;
    localStorage.setItem(`${user.uid}_${key}`, data);
}

// ===== FUNCIONES GLOBALES =====

// Hacer funciones disponibles globalmente
window.openCourseModal = openCourseModal;
window.closeCourseModal = closeCourseModal;
window.editCourse = editCourse;
window.deleteCourse = deleteCourse;
window.closeDeleteModal = closeDeleteModal;
window.viewCourseStudents = viewCourseStudents;
window.openBulkStudentModal = openBulkStudentModal;
window.closeBulkStudentModal = closeBulkStudentModal;
window.previewMultipleStudents = previewMultipleStudents;
window.viewAllStudents = viewAllStudents;
window.generateReports = generateReports;
window.viewAllActivity = viewAllActivity;
window.exportCoursesData = exportCoursesData;

console.log('📚 cursos.js cargado correctamente');