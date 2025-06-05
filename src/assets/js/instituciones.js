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
let currentUser = null;
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
    if (!window.auth) {
        console.error('❌ Firebase Auth no disponible');
        return;
    }
    
    window.auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            console.log(`👤 Usuario autenticado: ${user.uid} (${user.email})`);
            initializeInstitutionsSystem();
        } else {
            console.log('❌ Usuario no autenticado, redirigiendo...');
            window.location.href = 'login.html';
        }
    });
});

// ===== FUNCIÓN PRINCIPAL DE INICIALIZACIÓN =====
function initializeInstitutionsSystem() {
    console.log('🎯 Inicializando sistema completo...');
    
    try {
        // Inicializar menú toggle
        initializeMenuToggle();
        
        // Cargar datos del usuario actual
        loadInstitutions();
        calculateGlobalStats();
        
        // Configurar interfaz
        setupEventListeners();
        initializeDarkMode();
        updateUserInfo();
        
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

// ===== FUNCIONES DEL MENÚ TOGGLE =====
function initializeMenuToggle() {
    console.log('🔧 Instituciones: Inicializando menú toggle...');
    
    const profileButton = document.getElementById('profileButton');
    const menuDropdown = document.getElementById('menuDropdown');
    const menuCloseBtn = document.getElementById('menu-close-btn');
    
    if (!profileButton || !menuDropdown) {
        console.error('❌ Elementos del menú no encontrados');
        return;
    }
    
    // Función para abrir menú
    function openMenu() {
        menuDropdown.classList.add('show');
        menuDropdown.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Función para cerrar menú
    function closeMenu() {
        menuDropdown.classList.remove('show');
        menuDropdown.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Event listeners
    profileButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openMenu();
    });
    
    if (menuCloseBtn) {
        menuCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeMenu();
        });
    }
    
    // Cerrar con click fuera
    document.addEventListener('click', function(e) {
        if (menuDropdown.classList.contains('show') && 
            !menuDropdown.contains(e.target) && 
            !profileButton.contains(e.target)) {
            closeMenu();
        }
    });
    
    // Cerrar con Escape
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
    
    // Actualizar nombre en todos los elementos
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

// ===== GESTIÓN DE DATOS CON SEPARACIÓN POR USUARIO =====

// Obtener datos específicos del usuario
function getUserData(key) {
    if (!currentUser) {
        console.error('❌ No hay usuario autenticado');
        return null;
    }
    
    const userKey = `${currentUser.uid}_${key}`;
    const data = localStorage.getItem(userKey);
    console.log(`📊 Obteniendo datos: ${userKey} = ${data ? 'encontrado' : 'no encontrado'}`);
    return data;
}

// Guardar datos específicos del usuario
function setUserData(key, data) {
    if (!currentUser) {
        console.error('❌ No hay usuario autenticado');
        return false;
    }
    
    const userKey = `${currentUser.uid}_${key}`;
    localStorage.setItem(userKey, data);
    console.log(`💾 Guardando datos: ${userKey}`);
    return true;
}

// Cargar instituciones del usuario actual
function loadInstitutions() {
    try {
        if (!currentUser) {
            console.log('❌ Usuario no autenticado');
            allInstitutions = [];
            return;
        }
        
        const savedInstitutions = getUserData('institutions');
        allInstitutions = savedInstitutions ? JSON.parse(savedInstitutions) : [];
        
        // Filtrar solo las instituciones del usuario actual (seguridad adicional)
        allInstitutions = allInstitutions.filter(inst => 
            inst.createdBy === currentUser.uid
        );
        
        console.log(`📊 Cargadas ${allInstitutions.length} instituciones para usuario ${currentUser.uid}`);
        
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
                createdBy: currentUser.uid, // IMPORTANTE: Asignar al usuario actual
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

// Calcular estadísticas globales del usuario actual
function calculateGlobalStats() {
    try {
        const courses = JSON.parse(getUserData('courses') || '[]')
            .filter(c => c.createdBy === currentUser.uid);
        const students = JSON.parse(getUserData('students') || '[]')
            .filter(s => s.createdBy === currentUser.uid);
        
        globalStats = {
            institutions: allInstitutions.length,
            courses: courses.length,
            students: students.length,
            attendance: calculateGlobalAttendance(students)
        };
        
        console.log('📊 Estadísticas calculadas para usuario actual:', globalStats);
        
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

// ===== FUNCIONES DE MODAL CORREGIDAS =====

// Abrir modal de confirmación de eliminación
function deleteInstitution(institutionId) {
    const institution = allInstitutions.find(i => i.id === institutionId);
    if (!institution) {
        console.error(`❌ Institución no encontrada: ${institutionId}`);
        showNotification('Institución no encontrada', 'error');
        return;
    }
    
    // Verificar que pertenece al usuario actual
    if (institution.createdBy !== currentUser.uid) {
        console.error(`❌ Usuario no autorizado para eliminar institución: ${institutionId}`);
        showNotification('No tienes permisos para eliminar esta institución', 'error');
        return;
    }
    
    console.log(`🗑️ Solicitando eliminación de: ${institution.name} (${institutionId})`);
    
    document.getElementById('delete-institution-name').textContent = institution.name;
    
    // Importante: Almacenar el ID en el modal
    const modal = document.getElementById('delete-institution-modal');
    modal.dataset.institutionId = institutionId;
    
    modal.classList.add('show');
    modal.style.display = 'flex';
}

// Cerrar modal de eliminación
function closeDeleteModal() {
    const modal = document.getElementById('delete-institution-modal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    delete modal.dataset.institutionId;
}

// Confirmar eliminación - CORREGIDO
function confirmDeleteInstitution() {
    const modal = document.getElementById('delete-institution-modal');
    const institutionId = modal.dataset.institutionId;
    
    console.log(`🗑️ Confirmando eliminación de institución: ${institutionId}`);
    
    if (!institutionId) {
        console.error('❌ No se encontró ID de institución para eliminar');
        showNotification('Error: No se puede identificar la institución a eliminar', 'error');
        return;
    }
    
    const institutionIndex = allInstitutions.findIndex(i => i.id === institutionId);
    
    if (institutionIndex === -1) {
        console.error(`❌ Institución no encontrada en el array: ${institutionId}`);
        showNotification('Error: Institución no encontrada', 'error');
        return;
    }
    
    const institution = allInstitutions[institutionIndex];
    
    // Verificar permisos nuevamente
    if (institution.createdBy !== currentUser.uid) {
        console.error(`❌ Usuario no autorizado: ${currentUser.uid} vs ${institution.createdBy}`);
        showNotification('No tienes permisos para eliminar esta institución', 'error');
        return;
    }
    
    try {
        const institutionName = institution.name;
        
        // Eliminar cursos y estudiantes relacionados
        deleteRelatedData(institutionId);
        
        // Eliminar institución
        allInstitutions.splice(institutionIndex, 1);
        saveInstitutions();
        
        // Cerrar modal
        closeDeleteModal();
        
        // Actualizar interfaz
        calculateGlobalStats();
        updateDashboard();
        displayInstitutions();
        addRecentActivity('delete', institutionName);
        
        showNotification(`✅ Institución "${institutionName}" eliminada correctamente`, 'success');
        console.log(`🗑️ Institución eliminada: ${institutionName} (${institutionId})`);
        
    } catch (error) {
        console.error('❌ Error eliminando institución:', error);
        showNotification('Error al eliminar la institución', 'error');
    }
}

// Eliminar datos relacionados del usuario actual
function deleteRelatedData(institutionId) {
    // Eliminar cursos del usuario actual
    const courses = JSON.parse(getUserData('courses') || '[]');
    const filteredCourses = courses.filter(c => 
        c.institutionId !== institutionId || c.createdBy !== currentUser.uid
    );
    setUserData('courses', JSON.stringify(filteredCourses));
    
    // Eliminar estudiantes del usuario actual
    const students = JSON.parse(getUserData('students') || '[]');
    const filteredStudents = students.filter(s => 
        s.institutionId !== institutionId || s.createdBy !== currentUser.uid
    );
    setUserData('students', JSON.stringify(filteredStudents));
    
    console.log(`🧹 Datos relacionados eliminados para institución: ${institutionId}`);
}

// ===== RESTO DE FUNCIONES EXISTENTES =====
// (Mantener todas las demás funciones como están, pero agregar las correcciones de separación de datos)

// Crear nueva institución - CORREGIDO
function createInstitution(formData, user) {
    // Si se marca como default, quitar default de las demás del usuario actual
    if (formData.isDefault) {
        allInstitutions.forEach(i => {
            if (i.createdBy === user.uid) {
                i.isDefault = false;
            }
        });
    }
    
    const newInstitution = {
        id: generateId(),
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: user.uid, // IMPORTANTE: Asignar al usuario actual
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

// Guardar instituciones del usuario actual
function saveInstitutions() {
    if (!currentUser) {
        console.error('❌ No hay usuario para guardar instituciones');
        return;
    }
    
    // Filtrar solo las instituciones del usuario actual antes de guardar
    const userInstitutions = allInstitutions.filter(i => i.createdBy === currentUser.uid);
    setUserData('institutions', JSON.stringify(userInstitutions));
    console.log(`💾 ${userInstitutions.length} instituciones guardadas para usuario ${currentUser.uid}`);
}

// ===== MANTENER TODAS LAS DEMÁS FUNCIONES EXISTENTES =====
// (setupEventListeners, displayInstitutions, createInstitutionCard, etc.)
// Solo agregar las validaciones de currentUser.uid donde sea necesario

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
        closeDeleteModal();
    };
}

// ===== CONTINUAR CON EL RESTO DE FUNCIONES... =====
// (Por brevedad, incluyo solo las funciones clave corregidas)

// Generar ID único
function generateId() {
    return 'inst_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Mostrar notificación
function showNotification(message, type = 'success') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
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

// ===== MODO OSCURO =====
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Cargar preferencia guardada del usuario actual
    const savedDarkMode = getUserData('darkMode') === 'true';
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    }
    
    // Event listener para el toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                setUserData('darkMode', 'true');
                showNotification('🌙 Modo oscuro activado', 'success');
            } else {
                document.body.classList.remove('dark-mode');
                setUserData('darkMode', 'false');
                showNotification('☀️ Modo claro activado', 'success');
            }
        });
    }
}

// ===== FUNCIONES AUXILIARES =====
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
        modal.style.display = 'none';
    });
    currentEditingInstitution = null;
}

// Hacer funciones disponibles globalmente
window.viewInstitutionCourses = function(institutionId) {
    const institution = allInstitutions.find(i => i.id === institutionId);
    if (!institution) return;
    
    console.log(`📚 Navegando a cursos de: ${institution.name}`);
    window.location.href = `cursos.html?institution=${institutionId}`;
};

window.editInstitution = function(institutionId) {
    openInstitutionModal(institutionId);
};

window.deleteInstitution = deleteInstitution;
window.confirmDeleteInstitution = confirmDeleteInstitution;

console.log('🏛️ instituciones.js cargado correctamente con separación de datos por usuario');