/**
 * EduCheck Pro - Gestión de Instituciones
 * Sistema de administración de instituciones educativas
 * 
 * @description Módulo para crear, editar y gestionar instituciones educativas
 * @version 2.0.0
 * @author EduCheck Pro Team
 */

// ===== VARIABLES GLOBALES =====
let allInstitutions = [];
let currentEditingInstitution = null;
let globalStats = {
    institutions: 0,
    courses: 0,
    students: 0,
    attendance: 0
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏛️ Inicializando sistema de instituciones...');
    
    // Verificar autenticación
    if (window.auth) {
        window.auth.onAuthStateChanged(user => {
            if (user) {
                initializeInstitutionsSystem();
            } else {
                window.location.href = 'login.html';
            }
        });
    } else {
        console.error('❌ Firebase Auth no disponible');
    }
});

// ===== FUNCIÓN PRINCIPAL DE INICIALIZACIÓN =====
function initializeInstitutionsSystem() {
    console.log('🎯 Inicializando sistema completo...');
    
    try {
        // Cargar datos
        loadInstitutions();
        calculateGlobalStats();
        
        // Configurar interfaz
        setupEventListeners();
        initializeDarkMode();
        
        // Actualizar interfaz
        updateDashboard();
        displayInstitutions();
        updateRecentActivity();
        
        console.log('✅ Sistema de instituciones inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando sistema:', error);
        showNotification('Error al cargar el sistema', 'error');
    }
}

// ===== GESTIÓN DE DATOS =====

// Cargar instituciones
function loadInstitutions() {
    try {
        const user = window.auth?.currentUser;
        if (!user) {
            console.log('❌ Usuario no autenticado');
            return;
        }
        
        const savedInstitutions = getUserData('institutions');
        allInstitutions = savedInstitutions ? JSON.parse(savedInstitutions) : [];
        
        console.log(`📊 Cargadas ${allInstitutions.length} instituciones`);
        
        // Migrar datos antiguos si es necesario
        migrateOldEstablishments();
        
    } catch (error) {
        console.error('❌ Error cargando instituciones:', error);
        allInstitutions = [];
    }
}

// Migrar establecimientos antiguos
function migrateOldEstablishments() {
    const oldEstablishments = getUserData('establishments');
    
    if (oldEstablishments && allInstitutions.length === 0) {
        console.log('🔄 Migrando establecimientos antiguos...');
        
        try {
            const establishments = JSON.parse(oldEstablishments);
            const migratedInstitutions = establishments.map(est => ({
                id: est.id || generateId(),
                name: est.name,
                type: est.type || 'otro',
                address: est.address || '',
                phone: est.phone || '',
                notes: est.notes || '',
                isDefault: est.isDefault || false,
                createdAt: est.createdAt || new Date().toISOString(),
                createdBy: window.auth.currentUser.uid,
                // Nuevos campos
                courses: [],
                students: [],
                settings: {
                    allowMultipleCourses: true,
                    requireAttendance: true,
                    academicYearStart: 'march'
                },
                stats: {
                    totalCourses: 0,
                    totalStudents: 0,
                    averageAttendance: 0,
                    lastActivity: null
                }
            }));
            
            allInstitutions = migratedInstitutions;
            saveInstitutions();
            
            console.log('✅ Migración completada');
            showNotification('Datos migrados al nuevo sistema', 'success');
            
        } catch (error) {
            console.error('❌ Error en migración:', error);
        }
    }
}

// Calcular estadísticas globales
function calculateGlobalStats() {
    try {
        const courses = JSON.parse(getUserData('courses') || '[]');
        const students = JSON.parse(getUserData('students') || '[]');
        
        globalStats = {
            institutions: allInstitutions.length,
            courses: courses.length,
            students: students.length,
            attendance: calculateGlobalAttendance(students)
        };
        
        console.log('📊 Estadísticas calculadas:', globalStats);
        
    } catch (error) {
        console.error('❌ Error calculando estadísticas:', error);
        globalStats = { institutions: 0, courses: 0, students: 0, attendance: 0 };
    }
}

// Calcular asistencia global
function calculateGlobalAttendance(students) {
    if (students.length === 0) return 0;
    
    const totalAttendance = students.reduce((sum, student) => {
        const attendance = student.attendanceHistory || [];
        if (attendance.length === 0) return sum;
        
        const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
        const percentage = (present / attendance.length) * 100;
        return sum + percentage;
    }, 0);
    
    return Math.round(totalAttendance / students.length);
}

// ===== INTERFAZ DE USUARIO =====

// Configurar event listeners
function setupEventListeners() {
    // Formulario de institución
    const institutionForm = document.getElementById('institution-form');
    if (institutionForm) {
        institutionForm.addEventListener('submit', handleSaveInstitution);
    }
    
    // Botones de cierre de modal
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Botón de confirmación de eliminación
    const confirmDeleteBtn = document.getElementById('confirm-delete-institution');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteInstitution);
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
    
    // Botones de navegación rápida
    setupQuickNavigationButtons();
    
    console.log('🎛️ Event listeners configurados');
}

// Configurar botones de navegación rápida
function setupQuickNavigationButtons() {
    // Scroll a instituciones
    window.scrollToInstitutions = function() {
        document.getElementById('institutions-section').scrollIntoView({ 
            behavior: 'smooth' 
        });
    };
    
    // Mostrar horario de hoy
    window.showTodaySchedule = function() {
        console.log('📅 Mostrando horario de hoy...');
        showNotification('🚧 Función de horarios en desarrollo', 'info');
    };
    
    // Exportar datos globales
    window.exportGlobalData = function() {
        exportAllData();
    };
    
    // Abrir modal de agregar institución
    window.openAddInstitutionModal = function() {
        openInstitutionModal();
    };
    
    // Cerrar modal de institución
    window.closeInstitutionModal = function() {
        closeInstitutionModal();
    };
    
    // Cerrar modal de eliminación
    window.closeDeleteModal = function() {
        closeDeleteInstitutionModal();
    };
}

// Actualizar dashboard
function updateDashboard() {
    // Actualizar estadísticas principales
    updateElement('total-institutions', globalStats.institutions);
    updateElement('total-courses', globalStats.courses);
    updateElement('total-students', globalStats.students);
    updateElement('global-attendance', `${globalStats.attendance}%`);
    
    // Actualizar contador de instituciones
    const count = allInstitutions.length;
    updateElement('institution-count', `(${count} ${count === 1 ? 'institución' : 'instituciones'})`);
    
    console.log('📊 Dashboard actualizado');
}

// Mostrar instituciones
function displayInstitutions() {
    const container = document.getElementById('institutions-container');
    const emptyState = document.getElementById('empty-institutions');
    
    if (!container) return;
    
    if (allInstitutions.length === 0) {
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
    
    container.innerHTML = allInstitutions.map(institution => 
        createInstitutionCard(institution)
    ).join('');
    
    console.log(`🏛️ Mostrando ${allInstitutions.length} instituciones`);
}

// Crear tarjeta de institución
function createInstitutionCard(institution) {
    const typeIcons = {
        universidad: 'fa-university',
        instituto: 'fa-building',
        escuela: 'fa-school',
        colegio: 'fa-graduation-cap',
        jardin: 'fa-child',
        capacitacion: 'fa-chalkboard-teacher',
        iglesia: 'fa-church',
        otro: 'fa-building'
    };
    
    const typeLabels = {
        universidad: 'Universidad',
        instituto: 'Instituto',
        escuela: 'Escuela',
        colegio: 'Colegio',
        jardin: 'Jardín de Infantes',
        capacitacion: 'Centro de Capacitación',
        iglesia: 'Iglesia/Centro Religioso',
        otro: 'Otro'
    };
    
    const icon = typeIcons[institution.type] || 'fa-building';
    const typeLabel = typeLabels[institution.type] || 'Otro';
    
    // Calcular estadísticas de la institución
    const courses = JSON.parse(getUserData('courses') || '[]')
        .filter(c => c.institutionId === institution.id);
    const students = JSON.parse(getUserData('students') || '[]')
        .filter(s => s.institutionId === institution.id);
    
    const avgAttendance = students.length > 0 ? 
        Math.round(students.reduce((sum, s) => {
            const attendance = s.attendanceHistory || [];
            if (attendance.length === 0) return sum;
            const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
            return sum + ((present / attendance.length) * 100);
        }, 0) / students.length) : 0;
    
    const createdDate = new Date(institution.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    return `
        <div class="institution-card" data-id="${institution.id}">
            <div class="institution-header">
                <div class="institution-info">
                    <h4 class="institution-name">${institution.name}</h4>
                    <span class="institution-type">${typeLabel}</span>
                </div>
                ${institution.isDefault ? `
                    <div class="institution-badge" title="Institución principal">
                        <i class="fas fa-star"></i>
                    </div>
                ` : ''}
            </div>
            
            <div class="institution-stats">
                <div class="stat-mini">
                    <span class="stat-mini-number">${courses.length}</span>
                    <span class="stat-mini-label">Cursos</span>
                </div>
                <div class="stat-mini">
                    <span class="stat-mini-number">${students.length}</span>
                    <span class="stat-mini-label">Alumnos</span>
                </div>
                <div class="stat-mini">
                    <span class="stat-mini-number">${avgAttendance}%</span>
                    <span class="stat-mini-label">Asistencia</span>
                </div>
            </div>
            
            ${institution.address || institution.phone ? `
                <div class="institution-details">
                    ${institution.address ? `
                        <div class="detail-row">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${institution.address}</span>
                        </div>
                    ` : ''}
                    ${institution.phone ? `
                        <div class="detail-row">
                            <i class="fas fa-phone"></i>
                            <span>${institution.phone}</span>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            ${institution.notes ? `
                <div class="institution-details">
                    <div class="detail-row">
                        <i class="fas fa-sticky-note"></i>
                        <span>${institution.notes}</span>
                    </div>
                </div>
            ` : ''}
            
            <div class="institution-actions">
                <button class="action-btn view-courses-btn" 
                        onclick="viewInstitutionCourses('${institution.id}')"
                        title="Ver cursos">
                    <i class="fas fa-chalkboard-teacher"></i>
                    <span>Cursos</span>
                </button>
                <button class="action-btn edit-institution-btn" 
                        onclick="editInstitution('${institution.id}')"
                        title="Editar institución">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-institution-btn" 
                        onclick="deleteInstitution('${institution.id}')"
                        title="Eliminar institución">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="card-footer">
                <small class="registration-date">
                    <i class="fas fa-calendar-plus"></i>
                    Creada: ${createdDate}
                </small>
            </div>
        </div>
    `;
}

// ===== FUNCIONES DE MODAL =====

// Abrir modal de institución
function openInstitutionModal(institutionId = null) {
    const modal = document.getElementById('institution-modal');
    const modalTitle = document.getElementById('modal-title');
    const saveBtnText = document.getElementById('save-btn-text');
    const form = document.getElementById('institution-form');
    
    if (institutionId) {
        // Modo edición
        const institution = allInstitutions.find(i => i.id === institutionId);
        if (!institution) return;
        
        currentEditingInstitution = institutionId;
        modalTitle.textContent = 'Editar Institución';
        saveBtnText.textContent = 'Actualizar Institución';
        
        // Llenar formulario
        document.getElementById('institutionName').value = institution.name;
        document.getElementById('institutionType').value = institution.type;
        document.getElementById('institutionAddress').value = institution.address || '';
        document.getElementById('institutionPhone').value = institution.phone || '';
        document.getElementById('institutionNotes').value = institution.notes || '';
        document.getElementById('setAsDefault').checked = institution.isDefault || false;
        
    } else {
        // Modo creación
        currentEditingInstitution = null;
        modalTitle.textContent = 'Agregar Institución';
        saveBtnText.textContent = 'Guardar Institución';
        form.reset();
    }
    
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // Focus en el primer campo
    setTimeout(() => {
        document.getElementById('institutionName').focus();
    }, 100);
}

// Cerrar modal de institución
function closeInstitutionModal() {
    const modal = document.getElementById('institution-modal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    currentEditingInstitution = null;
    
    // Limpiar formulario
    document.getElementById('institution-form').reset();
}

// Manejar guardado de institución
function handleSaveInstitution(event) {
    event.preventDefault();
    
    const user = window.auth?.currentUser;
    if (!user) {
        showNotification('Usuario no autenticado', 'error');
        return;
    }
    
    // Obtener datos del formulario
    const formData = {
        name: document.getElementById('institutionName').value.trim(),
        type: document.getElementById('institutionType').value,
        address: document.getElementById('institutionAddress').value.trim(),
        phone: document.getElementById('institutionPhone').value.trim(),
        notes: document.getElementById('institutionNotes').value.trim(),
        isDefault: document.getElementById('setAsDefault').checked
    };
    
    // Validación
    if (!formData.name) {
        showNotification('El nombre de la institución es obligatorio', 'error');
        return;
    }
    
    if (!formData.type) {
        showNotification('Selecciona el tipo de institución', 'error');
        return;
    }
    
    // Verificar nombres duplicados
    const existingInstitution = allInstitutions.find(i => 
        i.name.toLowerCase() === formData.name.toLowerCase() && 
        i.id !== currentEditingInstitution
    );
    
    if (existingInstitution) {
        showNotification('Ya existe una institución con este nombre', 'error');
        return;
    }
    
    try {
        if (currentEditingInstitution) {
            // Actualizar institución existente
            updateInstitution(currentEditingInstitution, formData);
        } else {
            // Crear nueva institución
            createInstitution(formData, user);
        }
        
        // Cerrar modal
        closeInstitutionModal();
        
    } catch (error) {
        console.error('❌ Error guardando institución:', error);
        showNotification('Error al guardar la institución', 'error');
    }
}

// Crear nueva institución
function createInstitution(formData, user) {
    // Si se marca como default, quitar default de las demás
    if (formData.isDefault) {
        allInstitutions.forEach(i => i.isDefault = false);
    }
    
    const newInstitution = {
        id: generateId(),
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        courses: [],
        students: [],
        settings: {
            allowMultipleCourses: true,
            requireAttendance: true,
            academicYearStart: 'march'
        },
        stats: {
            totalCourses: 0,
            totalStudents: 0,
            averageAttendance: 0,
            lastActivity: new Date().toISOString()
        }
    };
    
    allInstitutions.push(newInstitution);
    saveInstitutions();
    
    // Actualizar interfaz
    calculateGlobalStats();
    updateDashboard();
    displayInstitutions();
    addRecentActivity('create', newInstitution.name);
    
    showNotification(`✅ Institución "${newInstitution.name}" creada correctamente`, 'success');
    console.log(`🏛️ Institución creada: ${newInstitution.name} (ID: ${newInstitution.id})`);
}

// Actualizar institución existente
function updateInstitution(institutionId, formData) {
    const index = allInstitutions.findIndex(i => i.id === institutionId);
    if (index === -1) return;
    
    // Si se marca como default, quitar default de las demás
    if (formData.isDefault) {
        allInstitutions.forEach(i => i.isDefault = false);
    }
    
    // Actualizar datos
    allInstitutions[index] = {
        ...allInstitutions[index],
        ...formData,
        lastModified: new Date().toISOString()
    };
    
    saveInstitutions();
    
    // Actualizar interfaz
    calculateGlobalStats();
    updateDashboard();
    displayInstitutions();
    addRecentActivity('update', allInstitutions[index].name);
    
    showNotification(`✅ Institución "${allInstitutions[index].name}" actualizada`, 'success');
    console.log(`🏛️ Institución actualizada: ${allInstitutions[index].name}`);
}

// ===== FUNCIONES DE ELIMINACIÓN =====

// Abrir modal de confirmación de eliminación
function deleteInstitution(institutionId) {
    const institution = allInstitutions.find(i => i.id === institutionId);
    if (!institution) return;
    
    document.getElementById('delete-institution-name').textContent = institution.name;
    document.getElementById('confirm-delete-institution').dataset.institutionId = institutionId;
    
    const modal = document.getElementById('delete-institution-modal');
    modal.classList.add('show');
    modal.style.display = 'flex';
}

// Cerrar modal de eliminación
function closeDeleteInstitutionModal() {
    const modal = document.getElementById('delete-institution-modal');
    modal.classList.remove('show');
    modal.style.display = 'none';
}

// Confirmar eliminación
function confirmDeleteInstitution() {
    const institutionId = document.getElementById('confirm-delete-institution').dataset.institutionId;
    const institutionIndex = allInstitutions.findIndex(i => i.id === institutionId);
    
    if (institutionIndex === -1) return;
    
    const institutionName = allInstitutions[institutionIndex].name;
    
    try {
        // Eliminar cursos y estudiantes relacionados
        deleteRelatedData(institutionId);
        
        // Eliminar institución
        allInstitutions.splice(institutionIndex, 1);
        saveInstitutions();
        
        // Cerrar modal
        closeDeleteInstitutionModal();
        
        // Actualizar interfaz
        calculateGlobalStats();
        updateDashboard();
        displayInstitutions();
        addRecentActivity('delete', institutionName);
        
        showNotification(`✅ Institución "${institutionName}" eliminada`, 'success');
        console.log(`🗑️ Institución eliminada: ${institutionName}`);
        
    } catch (error) {
        console.error('❌ Error eliminando institución:', error);
        showNotification('Error al eliminar la institución', 'error');
    }
}

// Eliminar datos relacionados
function deleteRelatedData(institutionId) {
    // Eliminar cursos
    const courses = JSON.parse(getUserData('courses') || '[]');
    const filteredCourses = courses.filter(c => c.institutionId !== institutionId);
    setUserData('courses', JSON.stringify(filteredCourses));
    
    // Eliminar estudiantes
    const students = JSON.parse(getUserData('students') || '[]');
    const filteredStudents = students.filter(s => s.institutionId !== institutionId);
    setUserData('students', JSON.stringify(filteredStudents));
    
    console.log(`🧹 Datos relacionados eliminados para institución: ${institutionId}`);
}

// ===== FUNCIONES DE NAVEGACIÓN =====

// Ver cursos de una institución
function viewInstitutionCourses(institutionId) {
    const institution = allInstitutions.find(i => i.id === institutionId);
    if (!institution) return;
    
    console.log(`📚 Navegando a cursos de: ${institution.name}`);
    window.location.href = `cursos.html?institution=${institutionId}`;
}

// Editar institución
function editInstitution(institutionId) {
    openInstitutionModal(institutionId);
}

// ===== ACTIVIDAD RECIENTE =====

// Actualizar actividad reciente
function updateRecentActivity() {
    const container = document.getElementById('recent-activity-list');
    if (!container) return;
    
    const activities = JSON.parse(getUserData('recent_activities') || '[]');
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-description">No hay actividad reciente</div>
                    <div class="activity-time">Comienza agregando tu primera institución</div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activities
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
function addRecentActivity(type, institutionName) {
    const activities = JSON.parse(getUserData('recent_activities') || '[]');
    
    const descriptions = {
        create: `Institución "${institutionName}" creada`,
        update: `Institución "${institutionName}" actualizada`,
        delete: `Institución "${institutionName}" eliminada`
    };
    
    const newActivity = {
        id: generateId(),
        type: type,
        description: descriptions[type] || 'Actividad realizada',
        institutionName: institutionName,
        timestamp: new Date().toISOString()
    };
    
    activities.unshift(newActivity); // Agregar al inicio
    
    // Mantener solo las últimas 20 actividades
    if (activities.length > 20) {
        activities.splice(20);
    }
    
    setUserData('recent_activities', JSON.stringify(activities));
    updateRecentActivity();
}

// Obtener icono de actividad
function getActivityIcon(type) {
    const icons = {
        create: 'fa-plus-circle',
        update: 'fa-edit',
        delete: 'fa-trash',
        course: 'fa-chalkboard-teacher',
        student: 'fa-user-plus'
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

// ===== EXPORTACIÓN DE DATOS =====

// Exportar todos los datos
function exportAllData() {
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
                version: '2.0',
                type: 'complete_backup'
            },
            institutions: allInstitutions,
            courses: JSON.parse(getUserData('courses') || '[]'),
            students: JSON.parse(getUserData('students') || '[]'),
            activities: JSON.parse(getUserData('activities') || '[]'),
            recentActivities: JSON.parse(getUserData('recent_activities') || '[]'),
            stats: globalStats
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `horita-feliz-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('✅ Backup completo exportado correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error exportando datos:', error);
        showNotification('Error al exportar datos', 'error');
    }
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
    currentEditingInstitution = null;
}

// Generar ID único
function generateId() {
    return 'inst_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Guardar instituciones
function saveInstitutions() {
    const user = window.auth?.currentUser;
    if (user) {
        setUserData('institutions', JSON.stringify(allInstitutions));
        console.log('💾 Instituciones guardadas');
    }
}

// Mostrar notificación
function showNotification(message, type = 'success') {
    // Crear elemento de notificación si no existe
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
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

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
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
window.viewInstitutionCourses = viewInstitutionCourses;
window.editInstitution = editInstitution;
window.deleteInstitution = deleteInstitution;

console.log('🏛️ instituciones.js cargado correctamente');