/**
 * EduCheck Pro - Sistema de Asistencias v3.0 COMPLETO Y FUNCIONAL
 * Compatible con header unificado y completamente operativo
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
let allInstitutions = [];
let allCourses = [];

// Estados de asistencia con colores simétricos
const ATTENDANCE_STATUS = {
    PRESENT: {
        value: 'present',
        label: 'Presente',
        icon: 'fa-check',
        color: '#10B981'
    },
    ABSENT: {
        value: 'absent',
        label: 'Ausente',
        icon: 'fa-times',
        color: '#EF4444'
    },
    LATE: {
        value: 'late',
        label: 'Tardanza',
        icon: 'fa-clock',
        color: '#F59E0B'
    },
    EXCUSED: {
        value: 'excused',
        label: 'Justificado',
        icon: 'fa-file-medical',
        color: '#6B7280'
    }
};

// ===== INICIALIZACIÓN PRINCIPAL =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Inicializando sistema de asistencias...');
    
    // Esperar a que app.js configure Firebase y el menú
    const waitForApp = setInterval(() => {
        if (window.auth && typeof window.setupMenuToggle === 'function') {
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
        } else {
            initializeAttendanceSystem();
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
        
        // Configurar botones de acción rápida
        setupQuickActionButtons();
        
        // Cargar datos iniciales
        await loadInitialData();
        
        // Verificar parámetros URL
        checkURLParameters();
        
        // Actualizar interfaz
        updatePageInterface();
        
        // Configurar modales
        setupModalEvents();
        
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
                loadInitialData();
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
        'institutionSelect',
        'courseSelect',
        'startAttendanceBtn'
    ];
    
    criticalElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ Elemento ${elementId} no encontrado`);
        } else {
            console.log(`✅ Elemento ${elementId} encontrado`);
        }
    });
    
    console.log('✅ Elementos DOM verificados');
}

// ===== CONFIGURACIÓN DE EVENTOS =====
function setupEventListeners() {
    console.log('🎛️ Configurando event listeners...');
    
    // Selector de institución
    const institutionSelect = document.getElementById('institutionSelect');
    if (institutionSelect) {
        institutionSelect.addEventListener('change', handleInstitutionChange);
        console.log('✅ Event listener para institutionSelect configurado');
    }
    
    // Selector de curso
    const courseSelect = document.getElementById('courseSelect');
    if (courseSelect) {
        courseSelect.addEventListener('change', handleCourseChange);
        console.log('✅ Event listener para courseSelect configurado');
    }
    
    // Botón para iniciar asistencia
    const startAttendanceBtn = document.getElementById('startAttendanceBtn');
    if (startAttendanceBtn) {
        startAttendanceBtn.addEventListener('click', handleStartAttendance);
        console.log('✅ Event listener para startAttendanceBtn configurado');
    }
    
    // Botón volver a selección de curso
    const backToCourseSelection = document.getElementById('backToCourseSelection');
    if (backToCourseSelection) {
        backToCourseSelection.addEventListener('click', showCourseSelection);
    }
    
    // Búsqueda de estudiantes
    const searchInput = document.getElementById('searchStudents');
    if (searchInput) {
        searchInput.addEventListener('input', handleStudentSearch);
    }
    
    // Filtro de estado
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', handleStatusFilter);
    }
    
    console.log('✅ Event listeners configurados');
}

// ===== BOTONES DE ACCIÓN RÁPIDA =====
function setupQuickActionButtons() {
    console.log('🎛️ Configurando botones de acción rápida...');
    
    // Marcar todos presentes
    const markAllPresentBtn = document.getElementById('markAllPresentBtn');
    if (markAllPresentBtn) {
        markAllPresentBtn.addEventListener('click', () => markAllStudents('present'));
    }
    
    // Marcar todos ausentes
    const markAllAbsentBtn = document.getElementById('markAllAbsentBtn');
    if (markAllAbsentBtn) {
        markAllAbsentBtn.addEventListener('click', () => markAllStudents('absent'));
    }
    
    // Reiniciar asistencia
    const resetAttendanceBtn = document.getElementById('resetAttendanceBtn');
    if (resetAttendanceBtn) {
        resetAttendanceBtn.addEventListener('click', resetAttendanceSession);
    }
    
    // Guardar sesión
    const saveSessionBtn = document.getElementById('saveSessionBtn');
    if (saveSessionBtn) {
        saveSessionBtn.addEventListener('click', saveAttendanceSession);
    }
    
    console.log('✅ Botones de acción rápida configurados');
}

// ===== MANEJADORES DE EVENTOS =====
function handleInstitutionChange(e) {
    const institutionId = e.target.value;
    selectedInstitution = institutionId;
    
    console.log('🏛️ Institución seleccionada:', institutionId);
    
    // Limpiar curso seleccionado
    selectedCourse = null;
    
    // Poblar cursos de la institución seleccionada
    populateCourseSelector(institutionId);
    
    // Deshabilitar botón de inicio
    const startBtn = document.getElementById('startAttendanceBtn');
    if (startBtn) {
        startBtn.disabled = true;
    }
}

function handleCourseChange(e) {
    const courseId = e.target.value;
    
    if (courseId) {
        // Encontrar el curso seleccionado
        selectedCourse = allCourses.find(c => c.id === courseId);
        
        console.log('📚 Curso seleccionado:', selectedCourse);
        
        // Habilitar botón de inicio
        const startBtn = document.getElementById('startAttendanceBtn');
        if (startBtn) {
            startBtn.disabled = false;
        }
    } else {
        selectedCourse = null;
        const startBtn = document.getElementById('startAttendanceBtn');
        if (startBtn) {
            startBtn.disabled = true;
        }
    }
}

function handleStartAttendance() {
    if (!selectedCourse) {
        showNotification('Por favor selecciona un curso', 'warning');
        return;
    }
    
    console.log('🎯 Iniciando sesión de asistencia para:', selectedCourse.name);
    showAttendancePanel();
}

function handleStudentSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        if (!query) {
            renderStudentsList(studentsData);
        } else {
            const filteredStudents = studentsData.filter(student => 
                student.name.toLowerCase().includes(query) ||
                (student.email && student.email.toLowerCase().includes(query)) ||
                (student.studentId && student.studentId.toLowerCase().includes(query))
            );
            renderStudentsList(filteredStudents);
        }
    }, 300);
}

function handleStatusFilter(e) {
    const filterValue = e.target.value;
    const studentCards = document.querySelectorAll('.student-attendance-card');
    
    studentCards.forEach(card => {
        if (!filterValue || filterValue === 'all') {
            card.style.display = 'block';
        } else {
            const hasStatus = card.querySelector(`.attendance-btn.${filterValue}.active`);
            card.style.display = hasStatus ? 'block' : 'none';
        }
    });
}

function resetAttendanceSession() {
    if (confirm('¿Estás seguro de que quieres reiniciar la sesión de asistencia?')) {
        if (attendanceSession) {
            attendanceSession.attendanceRecords = [];
            renderStudentsList(studentsData);
            updateAttendanceStats();
            showNotification('Sesión de asistencia reiniciada', 'info');
        }
    }
}

// ===== CARGA DE DATOS INICIALES =====
async function loadInitialData() {
    console.log('📊 Cargando datos iniciales...');
    
    try {
        // Cargar instituciones
        const institutionsData = getUserData('institutions');
        allInstitutions = institutionsData ? JSON.parse(institutionsData) : [];
        console.log(`🏛️ ${allInstitutions.length} instituciones cargadas`);
        
        // Cargar cursos
        const coursesData = getUserData('courses');
        allCourses = coursesData ? JSON.parse(coursesData) : [];
        console.log(`📚 ${allCourses.length} cursos cargados`);
        
        // Cargar estudiantes
        const studentsDataRaw = getUserData('students');
        const allStudents = studentsDataRaw ? JSON.parse(studentsDataRaw) : [];
        console.log(`👥 ${allStudents.length} estudiantes cargados`);
        
        // Cargar registros de asistencia previos
        const recordsData = getUserData('attendance_records');
        attendanceRecords = recordsData ? JSON.parse(recordsData) : [];
        
        // Poblar selectores INMEDIATAMENTE
        populateInstitutionSelector();
        
        console.log('✅ Datos iniciales cargados correctamente');
        
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        showNotification('Error al cargar datos', 'error');
    }
}

// ===== VERIFICACIÓN DE PARÁMETROS URL =====
function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course');
    
    if (courseId) {
        console.log('🔗 Curso especificado en URL:', courseId);
        selectCourseFromURL(courseId);
    } else {
        console.log('📋 Mostrando selección de curso');
        showCourseSelection();
    }
}

async function selectCourseFromURL(courseId) {
    try {
        // Buscar el curso en los datos cargados
        selectedCourse = allCourses.find(c => c.id === courseId);
        
        if (selectedCourse) {
            console.log('✅ Curso encontrado:', selectedCourse.name);
            
            // Preseleccionar institución y curso
            const institutionSelect = document.getElementById('institutionSelect');
            const courseSelect = document.getElementById('courseSelect');
            
            if (institutionSelect) {
                institutionSelect.value = selectedCourse.institutionId;
                selectedInstitution = selectedCourse.institutionId;
            }
            
            // Poblar cursos de esa institución
            populateCourseSelector(selectedCourse.institutionId);
            
            // Esperar un poco para que se poblen los cursos
            setTimeout(() => {
                if (courseSelect) {
                    courseSelect.value = courseId;
                    const startBtn = document.getElementById('startAttendanceBtn');
                    if (startBtn) {
                        startBtn.disabled = false;
                    }
                }
            }, 100);
            
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
    const totalCourses = allCourses.length;
    const totalStudents = studentsData.length;
    
    // Actualizar elementos de contador
    updateElement('totalCourses', totalCourses);
    updateElement('totalStudents', totalStudents);
}

// ===== SELECCIÓN DE CURSO =====
function showCourseSelection() {
    console.log('📚 Mostrando selección de curso...');
    
    // Ocultar panel de asistencia si está visible
    hideAttendancePanel();
    
    // Mostrar sección de selección de curso
    const courseSelectionSection = document.getElementById('courseSelectionSection');
    if (courseSelectionSection) {
        courseSelectionSection.style.display = 'block';
        courseSelectionSection.classList.remove('hidden');
    }
    
    // Poblar selectores
    populateInstitutionSelector();
    populateCourseSelector();
    
    console.log('✅ Selección de curso mostrada');
}

function hideAttendancePanel() {
    const attendancePanel = document.getElementById('attendancePanel');
    if (attendancePanel) {
        attendancePanel.style.display = 'none';
        attendancePanel.classList.add('hidden');
    }
}

function showAttendancePanel() {
    console.log('📋 Mostrando panel de asistencia...');
    
    // Ocultar selección de curso
    const courseSelectionSection = document.getElementById('courseSelectionSection');
    if (courseSelectionSection) {
        courseSelectionSection.style.display = 'none';
        courseSelectionSection.classList.add('hidden');
    }
    
    // Mostrar panel de asistencia
    const attendancePanel = document.getElementById('attendancePanel');
    if (attendancePanel) {
        attendancePanel.style.display = 'block';
        attendancePanel.classList.remove('hidden');
    }
    
    // Inicializar sesión de asistencia
    initializeAttendanceSession();
    
    console.log('✅ Panel de asistencia mostrado');
}

// ===== POPULADORES =====
function populateInstitutionSelector() {
    console.log('🏛️ Poblando selector de instituciones...');
    
    const institutionSelect = document.getElementById('institutionSelect');
    if (!institutionSelect) {
        console.error('❌ Element institutionSelect not found');
        return;
    }
    
    // Limpiar opciones
    institutionSelect.innerHTML = '<option value="">Seleccionar institución</option>';
    
    if (allInstitutions.length === 0) {
        institutionSelect.innerHTML = '<option value="">No hay instituciones registradas</option>';
        return;
    }
    
    // Filtrar por usuario actual (si está autenticado)
    let userInstitutions = allInstitutions;
    if (currentUser) {
        userInstitutions = allInstitutions.filter(institution => 
            institution.createdBy === currentUser.uid
        );
    }
    
    console.log(`🎯 ${userInstitutions.length} instituciones del usuario actual`);
    
    // Agregar opciones
    userInstitutions.forEach(institution => {
        const option = document.createElement('option');
        option.value = institution.id;
        option.textContent = institution.name;
        institutionSelect.appendChild(option);
        console.log(`✅ Agregada institución: ${institution.name}`);
    });
    
    if (userInstitutions.length === 0) {
        institutionSelect.innerHTML = '<option value="">No tienes instituciones registradas</option>';
    }
}

function populateCourseSelector(institutionId = null) {
    console.log('📚 Poblando selector de cursos para institución:', institutionId);
    
    const courseSelect = document.getElementById('courseSelect');
    if (!courseSelect) {
        console.error('❌ Element courseSelect not found');
        return;
    }
    
    // Limpiar opciones
    courseSelect.innerHTML = '<option value="">Seleccionar curso</option>';
    
    if (!institutionId) {
        courseSelect.disabled = true;
        courseSelect.innerHTML = '<option value="">Primero selecciona una institución</option>';
        return;
    }
    
    // Filtrar cursos de la institución seleccionada
    const institutionCourses = allCourses.filter(course => 
        course.institutionId === institutionId
    );
    
    console.log(`📋 ${institutionCourses.length} cursos encontrados para la institución`);
    
    if (institutionCourses.length === 0) {
        courseSelect.innerHTML = '<option value="">No hay cursos en esta institución</option>';
        courseSelect.disabled = true;
        return;
    }
    
    // Habilitar y poblar
    courseSelect.disabled = false;
    
    institutionCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = `${course.name} - ${getLevelDisplayName(course.level || 'general')}`;
        courseSelect.appendChild(option);
        console.log(`✅ Agregado curso: ${course.name}`);
    });
}

function getLevelDisplayName(level) {
    const levels = {
        'inicial': 'Inicial',
        'primario': 'Primario', 
        'secundario': 'Secundario',
        'universitario': 'Universitario',
        'tecnico': 'Técnico',
        'general': 'General'
    };
    return levels[level] || 'General';
}

// ===== SESIÓN DE ASISTENCIA =====
function initializeAttendanceSession() {
    if (!selectedCourse) return;
    
    console.log('🎯 Inicializando sesión de asistencia para:', selectedCourse.name);
    
    // Crear nueva sesión
    attendanceSession = {
        id: generateUniqueId('session'),
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        attendanceRecords: [],
        notes: '',
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString()
    };
    
    // Cargar estudiantes del curso
    loadCourseStudents();
    
    // Actualizar interfaz
    updateSessionInfo();
    updateAttendanceStats();
    
    isSessionActive = true;
    
    console.log('✅ Sesión de asistencia inicializada');
}

function loadCourseStudents() {
    console.log('👥 Cargando estudiantes del curso:', selectedCourse.id);
    
    const allStudentsData = getUserData('students');
    const allStudents = allStudentsData ? JSON.parse(allStudentsData) : [];
    
    // Filtrar estudiantes del curso seleccionado
    studentsData = allStudents.filter(student => student.courseId === selectedCourse.id);
    
    console.log(`👥 ${studentsData.length} estudiantes del curso cargados`);
    
    // Renderizar lista de estudiantes
    renderStudentsList(studentsData);
}

function renderStudentsList(students) {
    const studentsGrid = document.getElementById('studentsGrid');
    if (!studentsGrid) {
        console.error('❌ studentsGrid no encontrado');
        return;
    }
    
    if (students.length === 0) {
        studentsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-user-slash"></i>
                </div>
                <h4>No hay estudiantes</h4>
                <p>Este curso no tiene estudiantes asignados.</p>
                <button class="btn-primary" onclick="window.location.href='estudiantes.html?course=${selectedCourse.id}'">
                    <i class="fas fa-plus"></i>
                    Agregar Estudiantes
                </button>
            </div>
        `;
        return;
    }
    
    // Renderizar tarjetas de estudiantes
    studentsGrid.innerHTML = students.map(student => createStudentCard(student)).join('');
    
    console.log(`📋 ${students.length} estudiantes renderizados`);
}

function createStudentCard(student) {
    const record = attendanceSession?.attendanceRecords.find(r => r.studentId === student.id);
    const status = record?.status || 'pending';
    const notes = record?.notes || '';
    
    return `
        <div class="student-attendance-card" data-student-id="${student.id}">
            <div class="student-avatar">
                <span>${getStudentInitials(student.name)}</span>
            </div>
            <div class="student-info">
                <div class="student-name">${student.name}</div>
                <div class="student-details">
                    <div class="student-detail">
                        <i class="fas fa-id-card"></i>
                        <span>${student.studentId || 'N/A'}</span>
                    </div>
                    <div class="student-detail">
                        <i class="fas fa-envelope"></i>
                        <span>${student.email || 'N/A'}</span>
                    </div>
                </div>
            </div>
            <div class="attendance-controls">
                <button class="attendance-btn present ${status === 'present' ? 'active' : ''}" 
                        onclick="markAttendance('${student.id}', 'present')" title="Presente">
                    <i class="fas fa-check"></i>
                </button>
                <button class="attendance-btn absent ${status === 'absent' ? 'active' : ''}" 
                        onclick="markAttendance('${student.id}', 'absent')" title="Ausente">
                    <i class="fas fa-times"></i>
                </button>
                <button class="attendance-btn late ${status === 'late' ? 'active' : ''}" 
                        onclick="markAttendance('${student.id}', 'late')" title="Tardanza">
                    <i class="fas fa-clock"></i>
                </button>
            </div>
            <div class="attendance-notes">
                <textarea placeholder="Notas adicionales..." 
                          onchange="updateStudentNotes('${student.id}', this.value)">${notes}</textarea>
            </div>
        </div>
    `;
}

function getStudentInitials(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

// ===== MARCAR ASISTENCIA =====
function markAttendance(studentId, status) {
    if (!attendanceSession) return;
    
    // Buscar registro existente
    let recordIndex = attendanceSession.attendanceRecords.findIndex(r => r.studentId === studentId);
    
    if (recordIndex === -1) {
        // Crear nuevo registro
        attendanceSession.attendanceRecords.push({
            studentId: studentId,
            status: status,
            timestamp: new Date().toISOString(),
            notes: ''
        });
    } else {
        // Actualizar registro existente
        attendanceSession.attendanceRecords[recordIndex].status = status;
        attendanceSession.attendanceRecords[recordIndex].timestamp = new Date().toISOString();
    }
    
    // Actualizar interfaz
    updateStudentCardStatus(studentId, status);
    updateAttendanceStats();
    
    console.log(`✅ Asistencia marcada: ${studentId} - ${status}`);
}

function updateStudentCardStatus(studentId, status) {
    const studentCard = document.querySelector(`[data-student-id="${studentId}"]`);
    if (!studentCard) return;
    
    // Remover clases activas anteriores
    const buttons = studentCard.querySelectorAll('.attendance-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Agregar clase activa al botón correspondiente
    const activeButton = studentCard.querySelector(`.attendance-btn.${status}`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function markAllStudents(status) {
    if (!attendanceSession || !studentsData.length) return;
    
    if (confirm(`¿Marcar a todos los estudiantes como ${ATTENDANCE_STATUS[status.toUpperCase()].label}?`)) {
        studentsData.forEach(student => {
            markAttendance(student.id, status);
        });
        
        showNotification(`Todos los estudiantes marcados como ${ATTENDANCE_STATUS[status.toUpperCase()].label}`, 'success');
    }
}

function updateStudentNotes(studentId, notes) {
    if (!attendanceSession) return;
    
    let recordIndex = attendanceSession.attendanceRecords.findIndex(r => r.studentId === studentId);
    
    if (recordIndex === -1) {
        // Crear nuevo registro si no existe
        attendanceSession.attendanceRecords.push({
            studentId: studentId,
            status: 'pending',
            timestamp: new Date().toISOString(),
            notes: notes
        });
    } else {
        // Actualizar notas del registro existente
        attendanceSession.attendanceRecords[recordIndex].notes = notes;
    }
}

// ===== ESTADÍSTICAS DE ASISTENCIA =====
function updateAttendanceStats() {
    if (!attendanceSession) return;
    
    const total = studentsData.length;
    const present = attendanceSession.attendanceRecords.filter(r => r.status === 'present').length;
    const absent = attendanceSession.attendanceRecords.filter(r => r.status === 'absent').length;
    const late = attendanceSession.attendanceRecords.filter(r => r.status === 'late').length;
    const pending = total - (present + absent + late);
    
    // Actualizar elementos de estadísticas
    updateElement('totalStudentsCount', total);
    updateElement('presentCount', present);
    updateElement('absentCount', absent);
    updateElement('lateCount', late);
    updateElement('pendingCount', pending);
    
    // Calcular porcentaje de asistencia
    const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0;
    updateElement('attendancePercentage', `${attendancePercentage}%`);
    
    console.log('📊 Estadísticas actualizadas:', { total, present, absent, late, pending });
}

function updateSessionInfo() {
    if (!selectedCourse || !attendanceSession) return;
    
    updateElement('sessionCourseName', selectedCourse.name);
    updateElement('sessionDate', new Date().toLocaleDateString('es-ES'));
    updateElement('sessionTime', attendanceSession.time);
}

// ===== GUARDAR SESIÓN =====
function saveAttendanceSession() {
    if (!attendanceSession) {
        showNotification('No hay sesión activa para guardar', 'warning');
        return;
    }
    
    if (attendanceSession.attendanceRecords.length === 0) {
        showNotification('No se ha marcado asistencia para ningún estudiante', 'warning');
        return;
    }
    
    try {
        // Guardar en el historial local
        attendanceRecords.push({
            ...attendanceSession,
            savedAt: new Date().toISOString()
        });
        
        setUserData('attendance_records', JSON.stringify(attendanceRecords));
        
        // Sincronizar con Firebase si está disponible
        if (window.syncManager && currentUser) {
            window.syncManager.syncData('attendance', 'create', attendanceSession, attendanceSession.id);
        }
        
        showNotification('Sesión de asistencia guardada correctamente', 'success');
        
        // Limpiar sesión actual
        attendanceSession = null;
        isSessionActive = false;
        
        // Volver a la selección de curso
        showCourseSelection();
        
        console.log('✅ Sesión de asistencia guardada');
        
    } catch (error) {
        console.error('❌ Error guardando sesión:', error);
        showNotification('Error al guardar la sesión', 'error');
    }
}

// ===== CONFIGURACIÓN DE MODALES =====
function setupModalEvents() {
    // Cerrar modales con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Cerrar modales haciendo clic en el overlay
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
}

// ===== FUNCIONES AUXILIARES =====
function getUserData(key) {
    try {
        if (!currentUser) {
            console.warn('⚠️ Usuario no autenticado, usando datos globales');
            return localStorage.getItem(key);
        }
        
        const userKey = `${currentUser.uid}_${key}`;
        const data = localStorage.getItem(userKey);
        
        // Si no hay datos del usuario, intentar datos globales como fallback
        if (!data) {
            console.log(`📊 No hay datos específicos del usuario para ${key}, intentando datos globales`);
            return localStorage.getItem(key);
        }
        
        console.log(`📊 Datos obtenidos para ${userKey}: ${data ? 'encontrado' : 'no encontrado'}`);
        return data;
    } catch (error) {
        console.error(`❌ Error obteniendo datos para ${key}:`, error);
        return null;
    }
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

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function showNotification(message, type = 'info') {
    // Usar la función global de app.js si existe
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback local
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#3B82F6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        font-family: 'Quicksand', sans-serif;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 18px;">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ===== FUNCIONES GLOBALES =====
window.markAttendance = markAttendance;
window.updateStudentNotes = updateStudentNotes;
window.markAllStudents = markAllStudents;
window.showCourseSelection = showCourseSelection;
window.saveAttendanceSession = saveAttendanceSession;
window.resetAttendanceSession = resetAttendanceSession;

console.log('✅ Sistema de asistencias v3.0 cargado completamente');