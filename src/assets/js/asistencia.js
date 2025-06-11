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
    
    // Filtrar solo cursos activos del usuario actual
    const activeCourses = courses.filter(course => 
        course.createdBy === currentUser.uid && course.isActive !== false
    );
    
    courseSelect.innerHTML = '<option value="">Selecciona un curso</option>';
    
    if (activeCourses.length === 0) {
        courseSelect.innerHTML = '<option value="">No hay cursos disponibles</option>';
        courseSelect.disabled = true;
        return;
    }
    
    activeCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = `${course.name} (${course.studentsCount || 0} estudiantes)`;
        courseSelect.appendChild(option);
    });
    
    courseSelect.disabled = false;
    console.log(`📋 ${activeCourses.length} cursos activos disponibles`);
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
    if (!selectedCourse || !attendanceSession) return;
    
    // Actualizar título de la sesión
    updateElement('sessionTitle', selectedCourse.name);
    updateElement('sessionDate', formatCurrentDate());
    updateElement('sessionTime', formatCurrentTime());
    
    // Obtener información adicional del curso
    const institutionsData = getUserData('institutions');
    const institutions = institutionsData ? JSON.parse(institutionsData) : [];
    const institution = institutions.find(i => i.id === selectedCourse.institutionId);
    
    // Actualizar metadatos
    const sessionMeta = document.getElementById('sessionMeta');
    if (sessionMeta) {
        sessionMeta.innerHTML = `
            <div class="session-detail">
                <i class="fas fa-university"></i>
                <span>${institution ? institution.name : 'Sin institución'}</span>
            </div>
            <div class="session-detail">
                <i class="fas fa-layer-group"></i>
                <span>${getLevelDisplayName(selectedCourse.level)}</span>
            </div>
            <div class="session-detail">
                <i class="fas fa-users"></i>
                <span>${selectedCourse.studentsCount || 0} estudiantes registrados</span>
            </div>
            ${selectedCourse.classroom ? `
                <div class="session-detail">
                    <i class="fas fa-door-open"></i>
                    <span>${selectedCourse.classroom}</span>
                </div>
            ` : ''}
        `;
    }
}

function loadCourseStudents() {
    console.log('👥 Cargando estudiantes del curso...');
    
    if (!selectedCourse) {
        console.error('❌ No hay curso seleccionado');
        return;
    }
    
    // Cargar estudiantes desde localStorage
    const studentsData = getUserData('students');
    const allStudents = studentsData ? JSON.parse(studentsData) : [];
    
    // Filtrar estudiantes del curso seleccionado
    const courseStudents = allStudents.filter(student => 
        student.courseId === selectedCourse.id && student.createdBy === currentUser.uid
    );
    
    console.log(`📋 ${courseStudents.length} estudiantes encontrados en el curso "${selectedCourse.name}"`);
    
    if (courseStudents.length === 0) {
        showEmptyStudentsState();
        return;
    }
    
    // Actualizar variable global
    studentsData = courseStudents;
    
    // Renderizar estudiantes
    renderStudentsList(courseStudents);
    updateStudentsCounter(courseStudents.length);
    
    // Actualizar información del curso en la sesión
    updateSessionInfo();
}

function renderStudentsList(students) {
    const studentsGrid = document.getElementById('studentsGrid');
    if (!studentsGrid) return;
    
    studentsGrid.innerHTML = students.map(student => 
        createStudentAttendanceCard(student)
    ).join('');
    
    console.log(`📋 ${students.length} estudiantes renderizados`);
}

// ===== CREAR TARJETA DE ESTUDIANTE PARA ASISTENCIA =====
function createStudentAttendanceCard(student) {
    const initials = getStudentInitials(student);
    const attendanceRecord = attendanceSession?.attendanceRecords?.find(r => r.studentId === student.id);
    const currentStatus = attendanceRecord?.status || 'pending';
    
    return `
        <div class="student-attendance-card" data-student-id="${student.id}">
            <div class="student-avatar">
                <span>${initials}</span>
            </div>
            
            <div class="student-info">
                <h4 class="student-name">${student.name}</h4>
                <div class="student-details">
                    <div class="student-detail">
                        <i class="fas fa-id-card"></i>
                        <span>${student.documentNumber || 'Sin documento'}</span>
                    </div>
                    <div class="student-detail">
                        <i class="fas fa-envelope"></i>
                        <span>${student.email || 'Sin email'}</span>
                    </div>
                </div>
            </div>
            
            <div class="attendance-controls">
                ${Object.values(ATTENDANCE_STATUS).map(status => `
                    <button class="attendance-btn ${status.value} ${currentStatus === status.value ? 'active' : ''}"
                            onclick="markAttendance('${student.id}', '${status.value}')"
                            title="${status.label}">
                        <i class="fas ${status.icon}"></i>
                        <span>${status.label}</span>
                    </button>
                `).join('')}
            </div>
            
            <div class="attendance-notes">
                <textarea 
                    placeholder="Notas adicionales..."
                    onchange="updateStudentNotes('${student.id}', this.value)"
                    maxlength="200"
                >${attendanceRecord?.notes || ''}</textarea>
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
async function saveAttendanceSession() {
    if (!attendanceSession || !selectedCourse) {
        showNotification('No hay sesión de asistencia activa', 'error');
        return false;
    }
    
    if (attendanceSession.attendanceRecords.length === 0) {
        showNotification('No hay registros de asistencia para guardar', 'warning');
        return false;
    }
    
    try {
        // Finalizar sesión
        attendanceSession.endTime = new Date().toISOString();
        attendanceSession.status = 'completed';
        
        // Obtener historial existente
        const existingHistory = getUserData('attendance_records');
        const allRecords = existingHistory ? JSON.parse(existingHistory) : [];
        
        // Agregar nueva sesión
        allRecords.push(attendanceSession);
        
        // Guardar historial actualizado
        setUserData('attendance_records', JSON.stringify(allRecords));
        
        // Actualizar historial de asistencia de cada estudiante
        await updateStudentAttendanceHistory();
        
        // Sincronizar con Firebase si está disponible
        if (window.db && currentUser) {
            try {
                await window.db.collection('users')
                    .doc(currentUser.uid)
                    .collection('attendance_sessions')
                    .doc(attendanceSession.id)
                    .set(attendanceSession);
                    
                console.log('✅ Sesión sincronizada con Firebase');
            } catch (error) {
                console.warn('⚠️ Error sincronizando con Firebase:', error);
            }
        }
        
        showNotification(`✅ Asistencia guardada: ${attendanceSession.attendanceRecords.length} registros`, 'success');
        
        // Limpiar sesión actual
        attendanceSession = null;
        isSessionActive = false;
        
        // Volver a selección de curso
        setTimeout(() => {
            showCourseSelection();
        }, 2000);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error guardando sesión:', error);
        showNotification('Error al guardar la asistencia', 'error');
        return false;
    }
}

// ===== NUEVA FUNCIÓN: ACTUALIZAR HISTORIAL DE ESTUDIANTES =====
async function updateStudentAttendanceHistory() {
    try {
        const studentsData = getUserData('students');
        const allStudents = studentsData ? JSON.parse(studentsData) : [];
        
        // Actualizar historial de cada estudiante con registro de asistencia
        attendanceSession.attendanceRecords.forEach(record => {
            const studentIndex = allStudents.findIndex(s => s.id === record.studentId);
            if (studentIndex !== -1) {
                // Inicializar historial si no existe
                if (!allStudents[studentIndex].attendanceHistory) {
                    allStudents[studentIndex].attendanceHistory = [];
                }
                
                // Agregar registro al historial
                allStudents[studentIndex].attendanceHistory.push({
                    sessionId: attendanceSession.id,
                    courseId: selectedCourse.id,
                    courseName: selectedCourse.name,
                    date: attendanceSession.date,
                    status: record.status,
                    notes: record.notes || '',
                    timestamp: attendanceSession.endTime
                });
            }
        });
        
        // Guardar estudiantes actualizados
        setUserData('students', JSON.stringify(allStudents));
        
        console.log('✅ Historial de estudiantes actualizado');
        
    } catch (error) {
        console.error('❌ Error actualizando historial de estudiantes:', error);
    }
}

// ===== FUNCIÓN AUXILIAR PARA NIVELES =====
function getLevelDisplayName(level) {
    const levels = {
        'inicial': 'Inicial',
        'primario': 'Primario', 
        'secundario': 'Secundario',
        'universitario': 'Universitario',
        'mixto': 'Mixto'
    };
    return levels[level] || 'Sin nivel';
}

// ===== MODIFICAR showEmptyStudentsState PARA SUGERIR AGREGAR ESTUDIANTES =====
function showEmptyStudentsState() {
    const studentsGrid = document.getElementById('studentsGrid');
    if (!studentsGrid) return;
    
    studentsGrid.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-user-graduate"></i>
            </div>
            <h4>No hay estudiantes en este curso</h4>
            <p>Agrega estudiantes al curso "${selectedCourse?.name || 'seleccionado'}" para poder tomar asistencia.</p>
            <div class="empty-actions">
                <button class="btn-primary" onclick="goToAddStudents()">
                    <i class="fas fa-user-plus"></i>
                    Agregar Estudiantes
                </button>
                <button class="btn-secondary" onclick="showCourseSelection()">
                    <i class="fas fa-arrow-left"></i>
                    Cambiar Curso
                </button>
            </div>
        </div>
    `;
}

// ===== NUEVA FUNCIÓN: IR A AGREGAR ESTUDIANTES =====
function goToAddStudents() {
    // Redirigir a estudiantes con el curso preseleccionado
    const courseId = selectedCourse?.id;
    if (courseId) {
        window.location.href = `estudiantes.html?course=${courseId}`;
    } else {
        window.location.href = 'estudiantes.html';
    }
}

// ===== FUNCIONES AUXILIARES =====
function updateAttendanceStats() {
    if (!attendanceSession) return;
    
    const records = attendanceSession.attendanceRecords;
    const stats = {
        present: records.filter(r => r.status === 'present').length,
        absent: records.filter(r => r.status === 'absent').length,
        late: records.filter(r => r.status === 'late').length,
        total: studentsData.length
    };
    
    // Actualizar elementos de estadísticas
    updateElement('statPresent', stats.present);
    updateElement('statAbsent', stats.absent);
    updateElement('statLate', stats.late);
    updateElement('statTotal', stats.total);
}

function handleStudentSearch(e) {
    const query = e.target.value.toLowerCase();
    const studentCards = document.querySelectorAll('.student-attendance-card');
    
    studentCards.forEach(card => {
        const studentName = card.querySelector('.student-name').textContent.toLowerCase();
        const isVisible = studentName.includes(query);
        card.style.display = isVisible ? 'block' : 'none';
    });
}

function getStudentInitials(student) {
    if (!student.name) return '??';
    const names = student.name.trim().split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
}

function getStudentName(studentId) {
    const student = studentsData.find(s => s.id === studentId);
    return student ? student.name : 'Estudiante';
}

function updateStudentsCounter(count) {
    const counter = document.getElementById('studentsCounter');
    if (counter) {
        counter.textContent = `${count} estudiante${count !== 1 ? 's' : ''}`;
    }
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

function generateUniqueId(prefix = 'item') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

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

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    document.body.style.overflow = '';
}

function showNotification(message, type = 'info') {
    // Usar la función global de app.js si existe
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback simple
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Crear notificación visual simple
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28A745' : type === 'error' ? '#DC3545' : '#17A2B8'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 10000;
        font-family: inherit;
        font-weight: 500;
        max-width: 400px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
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

// Exponer funciones globalmente
window.goToAddStudents = goToAddStudents;
window.markAttendance = markAttendance;
window.updateStudentNotes = updateStudentNotes;
window.markAllStudents = markAllStudents;
window.saveAttendanceSession = saveAttendanceSession;
window.showCourseSelection = showCourseSelection;

console.log('✅ asistencia.js v2.0 cargado correctamente');