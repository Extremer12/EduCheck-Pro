/**
 * EduCheck Pro - Sistema de Asistencias v2.0 COMPLETO
 * Compatible con header unificado y sistema simétrico
 */

// ===== VARIABLES GLOBALES =====
let currentUser = null;
let selectedCourse = null;
let selectedInstitution = null;
let attendanceSession = null;
let studentsData = [];
let attendanceRecords = [];
let searchTimeout = null;
let isSessionActive = false;

// Estados de asistencia con colores simétricos
const ATTENDANCE_STATUS = {
    PRESENT: {
        value: 'present',
        label: 'Presente',
        icon: 'fa-check',
        color: '#28A745'
    },
    ABSENT: {
        value: 'absent',
        label: 'Ausente',
        icon: 'fa-times',
        color: '#DC3545'
    },
    LATE: {
        value: 'late',
        label: 'Tardanza',
        icon: 'fa-clock',
        color: '#FFC107'
    },
    EXCUSED: {
        value: 'excused',
        label: 'Justificado',
        icon: 'fa-file-medical',
        color: '#6C757D'
    }
};

// ===== INICIALIZACIÓN PRINCIPAL =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Inicializando sistema de asistencias...');
    
    // Esperar a que app.js configure Firebase y el menú
    const waitForApp = setInterval(() => {
        if (window.auth && window.isAppInitialized) {
            clearInterval(waitForApp);
            initializeAttendanceSystem();
        }
    }, 100);
    
    // Timeout de seguridad
    setTimeout(() => {
        clearInterval(waitForApp);
        if (!window.auth) {
            console.error('❌ Firebase no disponible después del timeout');
            showNotification('Error al cargar Firebase', 'error');
        }
    }, 10000);
});

// ===== FUNCIÓN PRINCIPAL DE INICIALIZACIÓN =====
async function initializeAttendanceSystem() {
    console.log('🎯 Inicializando sistema completo de asistencias...');
    
    try {
        // Verificar autenticación
        setupAuthListener();
        
        // Inicializar elementos DOM
        initializeDOMElements();
        
        // Configurar eventos
        setupEventListeners();
        
        // Cargar datos iniciales
        await loadInitialData();
        
        // Verificar parámetros URL
        checkURLParameters();
        
        // Actualizar interfaz
        updatePageInterface();
        
        console.log('✅ Sistema de asistencias inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando asistencias:', error);
        showNotification('Error al inicializar el sistema de asistencias', 'error');
    }
}

// ===== CONFIGURACIÓN DE AUTENTICACIÓN =====
function setupAuthListener() {
    if (window.auth) {
        window.auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                console.log('👤 Usuario autenticado en asistencias:', user.email);
                updatePageInterface();
            } else {
                console.log('❌ Usuario no autenticado, redirigiendo...');
                window.location.href = 'login.html';
            }
        });
    }
}

// ===== INICIALIZACIÓN DE ELEMENTOS DOM =====
function initializeDOMElements() {
    console.log('🔧 Inicializando elementos DOM...');
    
    // Verificar elementos críticos
    const criticalElements = [
        'courseSelectionSection',
        'attendancePanel',
        'studentsGrid'
    ];
    
    criticalElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ Elemento ${elementId} no encontrado`);
        }
    });
    
    console.log('✅ Elementos DOM verificados');
}

// ===== CONFIGURACIÓN DE EVENTOS =====
function setupEventListeners() {
    console.log('🎛️ Configurando event listeners...');
    
    // Botón para iniciar asistencia
    const startAttendanceBtn = document.getElementById('startAttendanceBtn');
    if (startAttendanceBtn) {
        startAttendanceBtn.addEventListener('click', showCourseSelection);
    }
    
    // Formulario de selección de curso
    const courseForm = document.getElementById('courseSelectionForm');
    if (courseForm) {
        courseForm.addEventListener('submit', handleCourseSelection);
    }
    
    // Búsqueda de estudiantes
    const searchInput = document.getElementById('studentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleStudentSearch, 300));
    }
    
    // Botones de acción rápida
    setupQuickActionButtons();
    
    // Modales
    setupModalEvents();
    
    console.log('✅ Event listeners configurados');
}

function setupQuickActionButtons() {
    // Marcar todos presentes
    const markAllPresentBtn = document.getElementById('markAllPresent');
    if (markAllPresentBtn) {
        markAllPresentBtn.addEventListener('click', () => markAllStudents('present'));
    }
    
    // Marcar todos ausentes
    const markAllAbsentBtn = document.getElementById('markAllAbsent');
    if (markAllAbsentBtn) {
        markAllAbsentBtn.addEventListener('click', () => markAllStudents('absent'));
    }
    
    // Guardar asistencia
    const saveAttendanceBtn = document.getElementById('saveAttendance');
    if (saveAttendanceBtn) {
        saveAttendanceBtn.addEventListener('click', saveAttendanceSession);
    }
}

function setupModalEvents() {
    // Cerrar modales
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-modal')) {
            closeAllModals();
        }
        
        if (e.target.classList.contains('modal') && e.target.style.display === 'block') {
            closeAllModals();
        }
    });
    
    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// ===== CARGA DE DATOS INICIALES =====
async function loadInitialData() {
    console.log('📊 Cargando datos iniciales...');
    
    try {
        await loadInstitutions();
        await loadCourses();
        await loadStudents();
        await loadAttendanceHistory();
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        showNotification('Error al cargar datos iniciales', 'error');
    }
}

async function loadInstitutions() {
    try {
        const institutionsData = getUserData('institutions');
        const institutions = institutionsData ? JSON.parse(institutionsData) : [];
        console.log(`🏛️ ${institutions.length} instituciones cargadas`);
        return institutions;
    } catch (error) {
        console.error('❌ Error cargando instituciones:', error);
        return [];
    }
}

async function loadCourses() {
    try {
        const coursesData = getUserData('courses');
        const courses = coursesData ? JSON.parse(coursesData) : [];
        console.log(`📚 ${courses.length} cursos cargados`);
        return courses;
    } catch (error) {
        console.error('❌ Error cargando cursos:', error);
        return [];
    }
}

async function loadStudents() {
    try {
        const studentsData = getUserData('students');
        const students = studentsData ? JSON.parse(studentsData) : [];
        console.log(`👥 ${students.length} estudiantes cargados`);
        return students;
    } catch (error) {
        console.error('❌ Error cargando estudiantes:', error);
        return [];
    }
}

async function loadAttendanceHistory() {
    try {
        const attendanceData = getUserData('attendance_records');
        attendanceRecords = attendanceData ? JSON.parse(attendanceData) : [];
        console.log(`📋 ${attendanceRecords.length} registros de asistencia cargados`);
        return attendanceRecords;
    } catch (error) {
        console.error('❌ Error cargando historial de asistencia:', error);
        attendanceRecords = [];
        return [];
    }
}

// ===== VERIFICACIÓN DE PARÁMETROS URL =====
function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course');
    
    if (courseId) {
        console.log('🔗 Curso especificado en URL:', courseId);
        // Preseleccionar curso y mostrar panel de asistencia
        selectCourseFromURL(courseId);
    } else {
        console.log('📋 Mostrando selección de curso');
        showCourseSelection();
    }
}

async function selectCourseFromURL(courseId) {
    try {
        const courses = await loadCourses();
        selectedCourse = courses.find(c => c.id === courseId);
        
        if (selectedCourse) {
            console.log('✅ Curso encontrado:', selectedCourse.name);
            showAttendancePanel();
        } else {
            console.warn('⚠️ Curso no encontrado, mostrando selección');
            showCourseSelection();
        }
    } catch (error) {
        console.error('❌ Error seleccionando curso desde URL:', error);
        showCourseSelection();
    }
}

// ===== ACTUALIZAR INTERFAZ =====
function updatePageInterface() {
    // Actualizar información del usuario si existe
    if (currentUser) {
        const userElements = document.querySelectorAll('[data-user-name]');
        userElements.forEach(element => {
            element.textContent = currentUser.displayName || currentUser.email.split('@')[0];
        });
    }
    
    // Actualizar fecha actual
    updateCurrentDate();
    
    // Actualizar contadores
    updateCounters();
}

function updateCurrentDate() {
    const dateElements = document.querySelectorAll('[data-current-date]');
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    dateElements.forEach(element => {
        element.textContent = formattedDate;
    });
}

function updateCounters() {
    const coursesData = getUserData('courses');
    const courses = coursesData ? JSON.parse(coursesData) : [];
    
    const totalCourses = courses.length;
    const totalStudents = studentsData.length;
    
    // Actualizar elementos de contador
    updateElement('totalCourses', totalCourses);
    updateElement('totalStudents', totalStudents);
}

// ===== SELECCIÓN DE CURSO =====
function showCourseSelection() {
    console.log('📚 Mostrando selección de curso...');
    
    hideAttendancePanel();
    showElement('courseSelectionSection');
    
    populateInstitutionSelector();
    populateCourseSelector();
}

function populateInstitutionSelector() {
    const institutionSelect = document.getElementById('institutionSelect');
    if (!institutionSelect) return;
    
    const institutionsData = getUserData('institutions');
    const institutions = institutionsData ? JSON.parse(institutionsData) : [];
    
    institutionSelect.innerHTML = '<option value="">Selecciona una institución</option>';
    
    institutions.forEach(institution => {
        const option = document.createElement('option');
        option.value = institution.id;
        option.textContent = institution.name;
        institutionSelect.appendChild(option);
    });
    
    // Evento para filtrar cursos por institución
    institutionSelect.addEventListener('change', (e) => {
        selectedInstitution = e.target.value;
        populateCourseSelector();
    });
}

function populateCourseSelector() {
    const courseSelect = document.getElementById('courseSelect');
    if (!courseSelect) return;
    
    const coursesData = getUserData('courses');
    const courses = coursesData ? JSON.parse(coursesData) : [];
    
    // Filtrar cursos por institución si hay una seleccionada
    const filteredCourses = selectedInstitution 
        ? courses.filter(course => course.institutionId === selectedInstitution)
        : courses;
    
    courseSelect.innerHTML = '<option value="">Selecciona un curso</option>';
    
    filteredCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = `${course.name} - ${course.level || 'Sin nivel'}`;
        courseSelect.appendChild(option);
    });
    
    console.log(`📋 ${filteredCourses.length} cursos disponibles`);
}

function handleCourseSelection(e) {
    e.preventDefault();
    
    const courseSelect = document.getElementById('courseSelect');
    const selectedCourseId = courseSelect.value;
    
    if (!selectedCourseId) {
        showNotification('Por favor selecciona un curso', 'warning');
        return;
    }
    
    // Buscar el curso seleccionado
    const coursesData = getUserData('courses');
    const courses = coursesData ? JSON.parse(coursesData) : [];
    selectedCourse = courses.find(c => c.id === selectedCourseId);
    
    if (selectedCourse) {
        console.log('✅ Curso seleccionado:', selectedCourse.name);
        showAttendancePanel();
    } else {
        showNotification('Error al seleccionar el curso', 'error');
    }
}

// ===== PANEL DE ASISTENCIA =====
function showAttendancePanel() {
    console.log('📋 Mostrando panel de asistencia...');
    
    hideElement('courseSelectionSection');
    showElement('attendancePanel');
    
    // Inicializar sesión de asistencia
    initializeAttendanceSession();
    
    // Actualizar información de la sesión
    updateSessionInfo();
    
    // Cargar estudiantes del curso
    loadCourseStudents();
    
    // Actualizar estadísticas
    updateAttendanceStats();
}

function hideAttendancePanel() {
    hideElement('attendancePanel');
}

function initializeAttendanceSession() {
    attendanceSession = {
        id: generateUniqueId('session'),
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        endTime: null,
        attendanceRecords: [],
        status: 'active'
    };
    
    isSessionActive = true;
    console.log('🎯 Sesión de asistencia iniciada:', attendanceSession.id);
}

function updateSessionInfo() {
    // Actualizar título de la sesión
    updateElement('sessionTitle', selectedCourse.name);
    updateElement('sessionDate', formatCurrentDate());
    updateElement('sessionTime', formatCurrentTime());
    
    // Actualizar metadatos
    const sessionMeta = document.getElementById('sessionMeta');
    if (sessionMeta) {
        sessionMeta.innerHTML = `
            <span><i class="fas fa-calendar"></i> ${formatCurrentDate()}</span>
            <span class="separator">•</span>
            <span><i class="fas fa-clock"></i> ${formatCurrentTime()}</span>
            <span class="separator">•</span>
            <span><i class="fas fa-chalkboard-teacher"></i> ${selectedCourse.level || 'Sin nivel'}</span>
        `;
    }
}

function loadCourseStudents() {
    console.log('👥 Cargando estudiantes del curso...');
    
    // Filtrar estudiantes del curso seleccionado
    const allStudents = loadStudents();
    const courseStudents = studentsData.filter(student => 
        student.courseId === selectedCourse.id
    );
    
    console.log(`📋 ${courseStudents.length} estudiantes en el curso`);
    
    if (courseStudents.length === 0) {
        showEmptyStudentsState();
    } else {
        renderStudentsList(courseStudents);
        updateStudentsCounter(courseStudents.length);
    }
}

function renderStudentsList(students) {
    const studentsGrid = document.getElementById('studentsGrid');
    if (!studentsGrid) return;
    
    studentsGrid.innerHTML = students.map(student => 
        createStudentAttendanceCard(student)
    ).join('');
    
    // Configurar eventos de las tarjetas
    setupStudentCardEvents();
    
    console.log(`📋 ${students.length} tarjetas de estudiantes renderizadas`);
}

// ===== CREAR TARJETA DE ESTUDIANTE PARA ASISTENCIA =====
function createStudentAttendanceCard(student) {
    const initials = getStudentInitials(student);
    
    return `
        <div class="student-attendance-card" data-student-id="${student.id}">
            <div class="student-avatar">
                ${initials}
            </div>
            
            <div class="student-info">
                <h4 class="student-name">${student.name}</h4>
                <div class="student-details">
                    <div class="student-detail">
                        <i class="fas fa-id-badge"></i>
                        <span>${student.studentId || 'Sin ID'}</span>
                    </div>
                    <div class="student-detail">
                        <i class="fas fa-envelope"></i>
                        <span>${student.email || 'Sin email'}</span>
                    </div>
                </div>
            </div>
            
            <div class="attendance-controls">
                <button class="attendance-btn present" 
                        onclick="markAttendance('${student.id}', 'present')" 
                        title="Marcar presente">
                    <i class="fas fa-check"></i>
                    <span>Presente</span>
                </button>
                <button class="attendance-btn absent" 
                        onclick="markAttendance('${student.id}', 'absent')" 
                        title="Marcar ausente">
                    <i class="fas fa-times"></i>
                    <span>Ausente</span>
                </button>
                <button class="attendance-btn late" 
                        onclick="markAttendance('${student.id}', 'late')" 
                        title="Marcar tardanza">
                    <i class="fas fa-clock"></i>
                    <span>Tarde</span>
                </button>
            </div>
            
            <div class="attendance-notes">
                <textarea placeholder="Notas adicionales..." 
                          onchange="updateStudentNotes('${student.id}', this.value)"></textarea>
            </div>
        </div>
    `;
}

// ===== FUNCIÓN PARA MARCAR ASISTENCIA =====
function markAttendance(studentId, status) {
    console.log(`📝 Marcando asistencia: ${studentId} - ${status}`);
    
    // Actualizar estado visual de la tarjeta
    const studentCard = document.querySelector(`[data-student-id="${studentId}"]`);
    if (studentCard) {
        // Remover estados anteriores
        const buttons = studentCard.querySelectorAll('.attendance-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        // Activar botón seleccionado
        const selectedBtn = studentCard.querySelector(`.attendance-btn.${status}`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
    }
    
    // Actualizar o crear registro de asistencia
    const existingRecord = attendanceSession.attendanceRecords.find(r => r.studentId === studentId);
    
    if (existingRecord) {
        existingRecord.status = status;
        existingRecord.timestamp = new Date().toISOString();
    } else {
        attendanceSession.attendanceRecords.push({
            studentId: studentId,
            status: status,
            timestamp: new Date().toISOString(),
            notes: ''
        });
    }
    
    // Actualizar estadísticas
    updateAttendanceStats();
    
    // Mostrar notificación
    const studentName = getStudentName(studentId);
    const statusText = ATTENDANCE_STATUS[status.toUpperCase()]?.label || status;
    showNotification(`${studentName} marcado como ${statusText}`, 'success');
}

// ===== FUNCIÓN PARA ACTUALIZAR NOTAS =====
function updateStudentNotes(studentId, notes) {
    console.log(`📝 Actualizando notas para ${studentId}:`, notes);
    
    // Buscar o crear registro de asistencia
    let record = attendanceSession.attendanceRecords.find(r => r.studentId === studentId);
    
    if (!record) {
        record = {
            studentId: studentId,
            status: 'present', // Estado por defecto
            timestamp: new Date().toISOString(),
            notes: notes
        };
        attendanceSession.attendanceRecords.push(record);
    } else {
        record.notes = notes;
    }
}

// ===== FUNCIONES DE ACCIÓN RÁPIDA =====
function markAllStudents(status) {
    console.log(`📋 Marcando todos los estudiantes como ${status}`);
    
    const studentCards = document.querySelectorAll('.student-attendance-card');
    
    studentCards.forEach(card => {
        const studentId = card.dataset.studentId;
        markAttendance(studentId, status);
    });
    
    const statusText = ATTENDANCE_STATUS[status.toUpperCase()]?.label || status;
    showNotification(`Todos los estudiantes marcados como ${statusText}`, 'success');
}

// ===== GUARDAR SESIÓN DE ASISTENCIA =====
function saveAttendanceSession() {
    if (!attendanceSession || !isSessionActive) {
        showNotification('No hay sesión activa para guardar', 'warning');
        return;
    }
    
    try {
        // Finalizar sesión
        attendanceSession.endTime = new Date().toISOString();
        attendanceSession.status = 'completed';
        
        // Cargar registros existentes
        const existingRecords = attendanceRecords || [];
        
        // Agregar nueva sesión
        existingRecords.push(attendanceSession);
        
        // Guardar en localStorage
        setUserData('attendance_records', JSON.stringify(existingRecords));
        
        // Actualizar variable global
        attendanceRecords = existingRecords;
        
        console.log('✅ Asistencia guardada:', attendanceSession.id);
        showNotification('Asistencia guardada correctamente', 'success');
        
        // Opcional: volver a la selección de curso
        setTimeout(() => {
            showCourseSelection();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error guardando asistencia:', error);
        showNotification('Error al guardar la asistencia', 'error');
    }
}

// ===== ACTUALIZAR ESTADÍSTICAS =====
function updateAttendanceStats() {
    if (!attendanceSession) return;
    
    const records = attendanceSession.attendanceRecords;
    const total = studentsData.filter(s => s.courseId === selectedCourse.id).length;
    
    const stats = {
        present: records.filter(r => r.status === 'present').length,
        absent: records.filter(r => r.status === 'absent').length,
        late: records.filter(r => r.status === 'late').length,
        total: total
    };
    
    // Actualizar elementos de estadísticas
    updateElement('presentCount', stats.present);
    updateElement('absentCount', stats.absent);
    updateElement('lateCount', stats.late);
    updateElement('totalCount', stats.total);
    
    // Calcular porcentaje de asistencia
    const attendancePercentage = total > 0 ? Math.round((stats.present / total) * 100) : 0;
    updateElement('attendancePercentage', `${attendancePercentage}%`);
}

// ===== BÚSQUEDA DE ESTUDIANTES =====
function handleStudentSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const studentCards = document.querySelectorAll('.student-attendance-card');
    
    studentCards.forEach(card => {
        const studentName = card.querySelector('.student-name').textContent.toLowerCase();
        const studentId = card.querySelector('.student-detail span').textContent.toLowerCase();
        
        const matches = studentName.includes(query) || studentId.includes(query);
        card.style.display = matches ? 'block' : 'none';
    });
    
    console.log(`🔍 Búsqueda de estudiantes: "${query}"`);
}

// ===== FUNCIONES AUXILIARES =====
function getUserData(key) {
    if (!currentUser) return null;
    const userKey = `${currentUser.uid}_${key}`;
    return localStorage.getItem(userKey);
}

function setUserData(key, value) {
    if (!currentUser) return false;
    const userKey = `${currentUser.uid}_${key}`;
    localStorage.setItem(userKey, value);
    return true;
}

function generateUniqueId(prefix = 'item') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

function getStudentInitials(student) {
    if (!student.name) return '??';
    const names = student.name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

function getStudentName(studentId) {
    const student = studentsData.find(s => s.id === studentId);
    return student ? student.name : 'Estudiante desconocido';
}

function formatCurrentDate() {
    return new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatCurrentTime() {
    return new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function showElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.style.display = 'block';
    }
}

function hideElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.style.display = 'none';
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

function setupStudentCardEvents() {
    // Eventos ya configurados en el HTML generado
    console.log('🎛️ Eventos de tarjetas de estudiantes configurados');
}

function showEmptyStudentsState() {
    const studentsGrid = document.getElementById('studentsGrid');
    if (studentsGrid) {
        studentsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <h4>No hay estudiantes en este curso</h4>
                <p>Agrega estudiantes al curso para poder tomar asistencia</p>
                <button class="btn-primary" onclick="window.location.href='estudiantes.html'">
                    <i class="fas fa-plus"></i>
                    Agregar Estudiantes
                </button>
            </div>
        `;
    }
}

function updateStudentsCounter(count) {
    updateElement('studentsCount', count);
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

function showNotification(message, type = 'info') {
    // Usar la función global de app.js si existe
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback básico
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Crear notificación simple
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        color: #333;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        z-index: 3000;
        font-family: 'Quicksand', sans-serif;
        font-weight: 500;
        max-width: 300px;
        transform: translateX(120%);
        transition: transform 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ===== FUNCIONES GLOBALES =====
window.markAttendance = markAttendance;
window.updateStudentNotes = updateStudentNotes;
window.markAllStudents = markAllStudents;
window.saveAttendanceSession = saveAttendanceSession;

console.log('✅ asistencia.js v2.0 cargado correctamente');