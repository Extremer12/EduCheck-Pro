/**
 * EduCheck Pro - Sistema de Reportes y Estadísticas v1.0
 * Compatible con header unificado y completamente funcional
 */

// ===== VARIABLES GLOBALES =====
let currentUser = null;
let reportsData = {
    institutions: [],
    courses: [],
    students: [],
    activities: [],
    attendance: []
};
let currentFilters = {
    dateRange: 'all',
    institution: '',
    course: '',
    period: 'month'
};
let chartInstances = {};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Inicializando sistema de reportes...');
    
    // Esperar a que app.js configure Firebase y el menú
    const waitForApp = setInterval(() => {
        if (window.auth && typeof window.setupMenuToggle === 'function') {
            clearInterval(waitForApp);
            console.log('🔗 Reportes.js - App.js detectado');
            initializeReportsSystem();
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
async function initializeReportsSystem() {
    console.log('🎯 Inicializando sistema completo de reportes...');
    
    try {
        // Configurar autenticación
        setupAuthListener();
        
        // Configurar elementos DOM
        initializeDOMElements();
        
        // Configurar eventos
        setupEventListeners();
        
        console.log('✅ Sistema de reportes inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando reportes:', error);
        showNotification('Error al cargar el sistema de reportes', 'error');
    }
}

// ===== CONFIGURACIÓN DE AUTENTICACIÓN =====
function setupAuthListener() {
    if (window.auth) {
        window.auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                console.log('👤 Usuario autenticado:', user.email);
                loadReportsData();
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
        'filterInstitution',
        'filterCourse',
        'filterDateRange',
        'filterPeriod',
        'totalInstitutions',
        'totalStudents',
        'averageAttendance',
        'totalActivities'
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
    
    // Filtros
    const filterInstitution = document.getElementById('filterInstitution');
    if (filterInstitution) {
        filterInstitution.addEventListener('change', handleInstitutionFilter);
    }
    
    const filterCourse = document.getElementById('filterCourse');
    if (filterCourse) {
        filterCourse.addEventListener('change', handleCourseFilter);
    }
    
    const filterDateRange = document.getElementById('filterDateRange');
    if (filterDateRange) {
        filterDateRange.addEventListener('change', handleDateRangeFilter);
    }
    
    const filterPeriod = document.getElementById('filterPeriod');
    if (filterPeriod) {
        filterPeriod.addEventListener('change', handlePeriodFilter);
    }
    
    // Botones de acción
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
    
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', openGenerateReportModal);
    }
    
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportAllData);
    }
    
    console.log('✅ Event listeners configurados');
}

// ===== CARGA DE DATOS =====
async function loadReportsData() {
    console.log('📊 Cargando datos para reportes...');
    
    try {
        // Cargar datos del localStorage
        reportsData.institutions = loadUserData('institutions') || [];
        reportsData.courses = loadUserData('courses') || [];
        reportsData.students = loadUserData('students') || [];
        reportsData.activities = loadUserData('recent_activities') || [];
        reportsData.attendance = loadUserData('attendance_records') || [];
        
        console.log('📋 Datos cargados:', {
            instituciones: reportsData.institutions.length,
            cursos: reportsData.courses.length,
            estudiantes: reportsData.students.length,
            actividades: reportsData.activities.length,
            asistencias: reportsData.attendance.length
        });
        
        // Verificar si hay datos
        if (hasReportsData()) {
            // Poblar filtros
            populateFilters();
            
            // Generar reportes
            generateKeyMetrics();
            generateCharts();
            generateDetailedData();
            
            // Ocultar estado vacío
            hideEmptyState();
        } else {
            // Mostrar estado vacío
            showEmptyState();
        }
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        showNotification('Error al cargar los datos', 'error');
    }
}

// ===== VERIFICAR SI HAY DATOS =====
function hasReportsData() {
    return reportsData.institutions.length > 0 || 
           reportsData.courses.length > 0 || 
           reportsData.students.length > 0 || 
           reportsData.activities.length > 0;
}

// ===== POBLAR FILTROS =====
function populateFilters() {
    console.log('🎛️ Poblando filtros...');
    
    // Filtro de instituciones
    const institutionSelect = document.getElementById('filterInstitution');
    if (institutionSelect) {
        institutionSelect.innerHTML = '<option value="">Todas las instituciones</option>';
        reportsData.institutions.forEach(institution => {
            const option = document.createElement('option');
            option.value = institution.id;
            option.textContent = institution.name;
            institutionSelect.appendChild(option);
        });
    }
    
    // Filtro de cursos
    populateCourseFilter();
    
    console.log('✅ Filtros poblados');
}

function populateCourseFilter(institutionId = null) {
    const courseSelect = document.getElementById('filterCourse');
    if (!courseSelect) return;
    
    courseSelect.innerHTML = '<option value="">Todos los cursos</option>';
    
    let coursesToShow = reportsData.courses;
    if (institutionId) {
        coursesToShow = reportsData.courses.filter(course => course.institutionId === institutionId);
    }
    
    coursesToShow.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = course.name;
        courseSelect.appendChild(option);
    });
}

// ===== MANEJADORES DE FILTROS =====
function handleInstitutionFilter(e) {
    currentFilters.institution = e.target.value;
    populateCourseFilter(e.target.value);
    console.log('🏛️ Filtro de institución:', currentFilters.institution);
}

function handleCourseFilter(e) {
    currentFilters.course = e.target.value;
    console.log('📚 Filtro de curso:', currentFilters.course);
}

function handleDateRangeFilter(e) {
    currentFilters.dateRange = e.target.value;
    console.log('📅 Filtro de fecha:', currentFilters.dateRange);
}

function handlePeriodFilter(e) {
    currentFilters.period = e.target.value;
    console.log('⏰ Filtro de período:', currentFilters.period);
}

function clearAllFilters() {
    console.log('🗑️ Limpiando todos los filtros...');
    
    currentFilters = {
        dateRange: 'all',
        institution: '',
        course: '',
        period: 'month'
    };
    
    // Resetear selectores
    const selectors = ['filterInstitution', 'filterCourse', 'filterDateRange', 'filterPeriod'];
    selectors.forEach(selectorId => {
        const selector = document.getElementById(selectorId);
        if (selector) {
            selector.value = '';
        }
    });
    
    // Repoblar curso sin filtro
    populateCourseFilter();
    
    // Regenerar reportes
    applyFilters();
}

function applyFilters() {
    console.log('🔍 Aplicando filtros:', currentFilters);
    
    // Regenerar métricas y gráficos con filtros
    generateKeyMetrics();
    generateCharts();
    generateDetailedData();
    
    showNotification('Filtros aplicados correctamente', 'success');
}

// ===== GENERAR MÉTRICAS CLAVE =====
function generateKeyMetrics() {
    console.log('📊 Generando métricas clave...');
    
    // Filtrar datos según filtros actuales
    const filteredData = getFilteredData();
    
    // Calcular métricas
    const metrics = {
        totalInstitutions: filteredData.institutions.length,
        totalStudents: filteredData.students.length,
        totalActivities: filteredData.activities.length,
        averageAttendance: calculateAverageAttendance(filteredData.attendance)
    };
    
    // Actualizar elementos
    updateElement('totalInstitutions', metrics.totalInstitutions);
    updateElement('totalStudents', metrics.totalStudents);
    updateElement('totalActivities', metrics.totalActivities);
    updateElement('averageAttendance', `${metrics.averageAttendance}%`);
    
    console.log('✅ Métricas actualizadas:', metrics);
}

// ===== GENERAR GRÁFICOS =====
function generateCharts() {
    console.log('📈 Generando gráficos...');
    
    // Destruir gráficos existentes
    Object.values(chartInstances).forEach(chart => {
        if (chart) chart.destroy();
    });
    chartInstances = {};
    
    const filteredData = getFilteredData();
    
    // Gráfico de asistencia por tiempo
    generateAttendanceChart(filteredData);
    
    // Gráfico de distribución por institución
    generateInstitutionChart(filteredData);
    
    // Gráfico de actividades por mes
    generateActivitiesChart(filteredData);
    
    // Ranking de cursos
    generateCoursesRanking(filteredData);
    
    console.log('✅ Gráficos generados');
}

function generateAttendanceChart(data) {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    
    // Procesar datos de asistencia por período
    const attendanceByPeriod = processAttendanceByPeriod(data.attendance);
    
    chartInstances.attendance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: attendanceByPeriod.labels,
            datasets: [{
                label: 'Porcentaje de Asistencia',
                data: attendanceByPeriod.data,
                borderColor: '#FFB6C1',
                backgroundColor: 'rgba(255, 182, 193, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolución de la Asistencia'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function generateInstitutionChart(data) {
    const ctx = document.getElementById('institutionChart');
    if (!ctx) return;
    
    // Contar estudiantes por institución
    const institutionData = processStudentsByInstitution(data);
    
    chartInstances.institution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: institutionData.labels,
            datasets: [{
                data: institutionData.data,
                backgroundColor: [
                    '#FFB6C1',
                    '#B0E0E6',
                    '#98FB98',
                    '#DDA0DD',
                    '#F0E68C'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución de Estudiantes por Institución'
                }
            }
        }
    });
}

function generateActivitiesChart(data) {
    const ctx = document.getElementById('activitiesChart');
    if (!ctx) return;
    
    // Procesar actividades por mes
    const activitiesByMonth = processActivitiesByMonth(data.activities);
    
    chartInstances.activities = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: activitiesByMonth.labels,
            datasets: [{
                label: 'Actividades',
                data: activitiesByMonth.data,
                backgroundColor: '#B0E0E6',
                borderColor: '#87CEEB',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Actividades por Mes'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function generateCoursesRanking(data) {
    const ctx = document.getElementById('coursesChart');
    if (!ctx) return;
    
    // Procesar ranking de cursos por estudiantes
    const coursesRanking = processCoursesRanking(data);
    
    chartInstances.courses = new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: coursesRanking.labels,
            datasets: [{
                label: 'Número de Estudiantes',
                data: coursesRanking.data,
                backgroundColor: '#98FB98',
                borderColor: '#90EE90',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Ranking de Cursos por Estudiantes'
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

// ===== GENERAR DATOS DETALLADOS =====
function generateDetailedData() {
    console.log('📋 Generando tabla de datos detallados...');
    
    const filteredData = getFilteredData();
    const tableBody = document.getElementById('detailedDataTable');
    
    if (!tableBody) return;
    
    // Combinar datos de estudiantes con información adicional
    const detailedData = filteredData.students.map(student => {
        const course = reportsData.courses.find(c => c.id === student.courseId);
        const institution = reportsData.institutions.find(i => i.id === student.institutionId);
        const attendanceRate = calculateStudentAttendance(student.id);
        
        return {
            studentName: student.name,
            courseName: course ? course.name : 'Sin curso',
            institutionName: institution ? institution.name : 'Sin institución',
            enrollmentDate: formatDate(student.enrollmentDate),
            attendanceRate: attendanceRate,
            status: student.status || 'active'
        };
    });
    
    // Generar HTML de la tabla
    tableBody.innerHTML = detailedData.map(row => `
        <tr>
            <td>${row.studentName}</td>
            <td>${row.courseName}</td>
            <td>${row.institutionName}</td>
            <td>${row.enrollmentDate}</td>
            <td>
                <span class="attendance-badge ${getAttendanceBadgeClass(row.attendanceRate)}">
                    ${row.attendanceRate}%
                </span>
            </td>
            <td>
                <span class="status-badge ${row.status}">
                    ${getStatusLabel(row.status)}
                </span>
            </td>
        </tr>
    `).join('');
    
    console.log(`✅ Tabla generada con ${detailedData.length} registros`);
}

// ===== FUNCIONES DE PROCESAMIENTO DE DATOS =====
function getFilteredData() {
    let filtered = {
        institutions: [...reportsData.institutions],
        courses: [...reportsData.courses],
        students: [...reportsData.students],
        activities: [...reportsData.activities],
        attendance: [...reportsData.attendance]
    };
    
    // Filtrar por institución
    if (currentFilters.institution) {
        filtered.courses = filtered.courses.filter(c => c.institutionId === currentFilters.institution);
        filtered.students = filtered.students.filter(s => s.institutionId === currentFilters.institution);
        filtered.institutions = filtered.institutions.filter(i => i.id === currentFilters.institution);
    }
    
    // Filtrar por curso
    if (currentFilters.course) {
        filtered.students = filtered.students.filter(s => s.courseId === currentFilters.course);
        filtered.courses = filtered.courses.filter(c => c.id === currentFilters.course);
    }
    
    // Filtrar por rango de fechas
    if (currentFilters.dateRange && currentFilters.dateRange !== 'all') {
        const dateLimit = getDateLimit(currentFilters.dateRange);
        filtered.activities = filtered.activities.filter(a => new Date(a.date) >= dateLimit);
        filtered.attendance = filtered.attendance.filter(a => new Date(a.date) >= dateLimit);
    }
    
    return filtered;
}

function processAttendanceByPeriod(attendanceData) {
    // Agrupar por período según filtro
    const periods = {};
    
    attendanceData.forEach(record => {
        const date = new Date(record.date);
        const periodKey = getPeriodKey(date);
        
        if (!periods[periodKey]) {
            periods[periodKey] = { total: 0, present: 0 };
        }
        
        record.attendanceRecords.forEach(studentRecord => {
            periods[periodKey].total++;
            if (studentRecord.status === 'present') {
                periods[periodKey].present++;
            }
        });
    });
    
    const labels = Object.keys(periods).sort();
    const data = labels.map(label => {
        const period = periods[label];
        return period.total > 0 ? Math.round((period.present / period.total) * 100) : 0;
    });
    
    return { labels, data };
}

function processStudentsByInstitution(data) {
    const institutionCounts = {};
    
    data.students.forEach(student => {
        const institution = data.institutions.find(i => i.id === student.institutionId);
        const institutionName = institution ? institution.name : 'Sin institución';
        
        institutionCounts[institutionName] = (institutionCounts[institutionName] || 0) + 1;
    });
    
    return {
        labels: Object.keys(institutionCounts),
        data: Object.values(institutionCounts)
    };
}

function processActivitiesByMonth(activitiesData) {
    const monthCounts = {};
    
    activitiesData.forEach(activity => {
        const date = new Date(activity.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });
    
    const labels = Object.keys(monthCounts).sort().map(key => {
        const [year, month] = key.split('-');
        return new Date(year, month - 1).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
    });
    
    const data = Object.keys(monthCounts).sort().map(key => monthCounts[key]);
    
    return { labels, data };
}

function processCoursesRanking(data) {
    const courseCounts = {};
    
    data.students.forEach(student => {
        const course = data.courses.find(c => c.id === student.courseId);
        const courseName = course ? course.name : 'Sin curso';
        
        courseCounts[courseName] = (courseCounts[courseName] || 0) + 1;
    });
    
    // Ordenar por cantidad de estudiantes
    const sorted = Object.entries(courseCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10); // Top 10
    
    return {
        labels: sorted.map(([name]) => name),
        data: sorted.map(([, count]) => count)
    };
}

// ===== FUNCIONES DE CÁLCULO =====
function calculateAverageAttendance(attendanceData) {
    if (attendanceData.length === 0) return 0;
    
    let totalStudents = 0;
    let totalPresent = 0;
    
    attendanceData.forEach(record => {
        record.attendanceRecords.forEach(studentRecord => {
            totalStudents++;
            if (studentRecord.status === 'present') {
                totalPresent++;
            }
        });
    });
    
    return totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;
}

function calculateStudentAttendance(studentId) {
    let totalClasses = 0;
    let attendedClasses = 0;
    
    reportsData.attendance.forEach(record => {
        const studentRecord = record.attendanceRecords.find(r => r.studentId === studentId);
        if (studentRecord) {
            totalClasses++;
            if (studentRecord.status === 'present') {
                attendedClasses++;
            }
        }
    });
    
    return totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
}

// ===== FUNCIONES DE UTILIDAD =====
function getPeriodKey(date) {
    switch (currentFilters.period) {
        case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            return weekStart.toISOString().split('T')[0];
        case 'year':
            return date.getFullYear().toString();
        default: // month
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
}

function getDateLimit(range) {
    const now = new Date();
    switch (range) {
        case 'week':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'month':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case 'quarter':
            return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case 'year':
            return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default:
            return new Date(0);
    }
}

function getAttendanceBadgeClass(rate) {
    if (rate >= 90) return 'excellent';
    if (rate >= 75) return 'good';
    if (rate >= 60) return 'average';
    return 'poor';
}

function getStatusLabel(status) {
    const labels = {
        active: 'Activo',
        inactive: 'Inactivo',
        graduated: 'Graduado',
        suspended: 'Suspendido'
    };
    return labels[status] || 'Desconocido';
}

// ===== FUNCIONES DE EXPORTACIÓN =====
function openGenerateReportModal() {
    console.log('📝 Abriendo modal de generación de reportes...');
    
    const modal = document.getElementById('generateReportModal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

async function exportAllData() {
    console.log('📤 Exportando todos los datos...');
    
    try {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                user: currentUser.email,
                filters: currentFilters
            },
            data: getFilteredData(),
            summary: {
                totalInstitutions: reportsData.institutions.length,
                totalCourses: reportsData.courses.length,
                totalStudents: reportsData.students.length,
                totalActivities: reportsData.activities.length,
                averageAttendance: calculateAverageAttendance(reportsData.attendance)
            }
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `educheck-pro-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Datos exportados correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error exportando datos:', error);
        showNotification('Error al exportar los datos', 'error');
    }
}

// ===== ESTADO VACÍO =====
function showEmptyState() {
    const emptyState = document.getElementById('emptyReports');
    const mainContent = document.querySelectorAll('.key-metrics, .charts-section, .detailed-data');
    
    if (emptyState) {
        emptyState.style.display = 'block';
    }
    
    mainContent.forEach(section => {
        section.style.display = 'none';
    });
}

function hideEmptyState() {
    const emptyState = document.getElementById('emptyReports');
    const mainContent = document.querySelectorAll('.key-metrics, .charts-section, .detailed-data');
    
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    mainContent.forEach(section => {
        section.style.display = 'block';
    });
}

// ===== FUNCIONES AUXILIARES =====
function loadUserData(key) {
    if (!currentUser) return [];
    
    try {
        const userKey = `${currentUser.uid}_${key}`;
        const data = localStorage.getItem(userKey);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error cargando ${key}:`, error);
        return [];
    }
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    } catch (error) {
        return 'Fecha inválida';
    }
}

function showNotification(message, type = 'info') {
    // Usar la función global de app.js si existe
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
}

// ===== FUNCIONES GLOBALES =====
window.openGenerateReportModal = openGenerateReportModal;
window.closeModal = closeModal;
window.exportAllData = exportAllData;

console.log('✅ Sistema de reportes v1.0 cargado correctamente');