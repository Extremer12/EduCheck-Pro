/**
 * EduCheck Pro - Gestión de Instituciones
 * Sistema de administración de instituciones educativas
 * 
 * @description Módulo para crear, editar y gestionar instituciones educativas
 * @version 2.1.0
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
    
    // Verificar Firebase
    if (!window.auth) {
        console.error('❌ Firebase Auth no disponible');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
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
        // Eliminar esta línea:
        // initializeMenuToggle();
        
        // El menú toggle ya se maneja desde app.js
        initializeDarkMode();
        updateUserInfo();
        
        // Cargar datos
        loadInstitutions();
        calculateGlobalStats();
        
        // Configurar interfaz
        setupEventListeners();
        
        // Actualizar interfaz
        updateDashboard();
        displayInstitutions();
        
        console.log('✅ Sistema de instituciones inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando sistema:', error);
        showNotification('Error al cargar el sistema', 'error');
    }
}

// ===== GESTIÓN DE DATOS CON SEPARACIÓN POR USUARIO =====
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

// ===== CARGAR Y GUARDAR INSTITUCIONES =====
function loadInstitutions() {
    try {
        if (!currentUser) {
            console.log('❌ Usuario no autenticado');
            allInstitutions = [];
            return;
        }
        
        const savedInstitutions = getUserData('institutions');
        allInstitutions = savedInstitutions ? JSON.parse(savedInstitutions) : [];
        
        // Filtrar solo las instituciones del usuario actual
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

function saveInstitutions() {
    if (!currentUser) {
        console.error('❌ No hay usuario para guardar instituciones');
        return;
    }
    
    const userInstitutions = allInstitutions.filter(i => i.createdBy === currentUser.uid);
    setUserData('institutions', JSON.stringify(userInstitutions));
    console.log(`💾 ${userInstitutions.length} instituciones guardadas para usuario ${currentUser.uid}`);
}

// ===== MIGRAR DATOS ANTIGUOS =====
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
                createdBy: currentUser.uid,
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

// ===== CALCULAR ESTADÍSTICAS =====
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
        
        console.log('📊 Estadísticas calculadas:', globalStats);
        
    } catch (error) {
        console.error('❌ Error calculando estadísticas:', error);
        globalStats = { institutions: 0, courses: 0, students: 0, attendance: 0 };
    }
}

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

// ===== ACTUALIZAR DASHBOARD =====
function updateDashboard() {
    // Actualizar estadísticas compactas
    updateElement('total-institutions', globalStats.institutions);
    updateElement('total-courses', globalStats.courses);
    updateElement('total-students', globalStats.students);
    
    // Actualizar contador de instituciones
    const institutionCount = document.getElementById('institution-count');
    if (institutionCount) {
        const count = allInstitutions.length;
        institutionCount.textContent = `(${count} institución${count !== 1 ? 'es' : ''})`;
    }
}

// ===== MOSTRAR INSTITUCIONES =====
function displayInstitutions() {
    const container = document.getElementById('institutions-container');
    const emptyState = document.getElementById('empty-institutions');
    
    if (!container || !emptyState) {
        console.error('❌ Elementos de contenedor no encontrados');
        return;
    }
    
    if (allInstitutions.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    container.innerHTML = allInstitutions.map(institution => 
        createInstitutionCard(institution)
    ).join('');
    
    console.log(`📋 ${allInstitutions.length} instituciones renderizadas`);
}

// ===== CREAR TARJETA DE INSTITUCIÓN =====
function createInstitutionCard(institution) {
    const typeLabel = getTypeLabel(institution.type);
    
    return `
        <div class="institution-card ${institution.isDefault ? 'default' : ''}" data-institution-id="${institution.id}">
            ${institution.isDefault ? '<div class="default-badge"><i class="fas fa-star"></i></div>' : ''}
            
            <div class="institution-header">
                <div class="institution-info">
                    <h3 class="institution-name">${institution.name}</h3>
                    <span class="institution-type">${typeLabel}</span>
                </div>
                ${institution.isDefault ? '<div class="institution-badge"><i class="fas fa-star"></i></div>' : ''}
            </div>
            
            <div class="institution-stats">
                <div class="stat-mini">
                    <span class="stat-mini-number">${institution.stats?.totalCourses || 0}</span>
                    <span class="stat-mini-label">Cursos</span>
                </div>
                <div class="stat-mini">
                    <span class="stat-mini-number">${institution.stats?.totalStudents || 0}</span>
                    <span class="stat-mini-label">Estudiantes</span>
                </div>
                <div class="stat-mini">
                    <span class="stat-mini-number">${institution.stats?.averageAttendance || 0}%</span>
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
            
            <div class="institution-actions">
                <button class="action-btn view-courses-btn" onclick="viewInstitutionCourses('${institution.id}')">
                    <i class="fas fa-chalkboard-teacher"></i>
                    Cursos
                </button>
                <button class="action-btn edit-institution-btn" onclick="editInstitution('${institution.id}')">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button class="action-btn delete-institution-btn" onclick="deleteInstitution('${institution.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function getTypeLabel(type) {
    const types = {
        universidad: 'Universidad',
        instituto: 'Instituto',
        escuela: 'Escuela',
        colegio: 'Colegio',
        jardin: 'Jardín',
        capacitacion: 'Capacitación',
        iglesia: 'Iglesia',
        otro: 'Otro'
    };
    return types[type] || 'Institución';
}

// ===== MODAL DE INSTITUCIÓN =====
function openInstitutionModal(institutionId = null) {
    const modal = document.getElementById('institution-modal');
    const modalTitle = document.getElementById('modal-title');
    const saveButtonText = document.getElementById('save-btn-text');
    const form = document.getElementById('institution-form');
    
    if (!modal || !form) {
        console.error('❌ Modal o formulario no encontrado');
        return;
    }
    
    // Limpiar formulario
    form.reset();
    
    if (institutionId) {
        // Modo edición
        const institution = allInstitutions.find(i => i.id === institutionId);
        if (!institution) {
            showNotification('Institución no encontrada', 'error');
            return;
        }
        
        currentEditingInstitution = institution;
        modalTitle.textContent = 'Editar Institución';
        saveButtonText.textContent = 'Actualizar Institución';
        
        // Llenar formulario con datos existentes
        fillForm(institution);
        
    } else {
        // Modo creación
        currentEditingInstitution = null;
        modalTitle.textContent = 'Agregar Institución';
        saveButtonText.textContent = 'Guardar Institución';
    }
    
    modal.classList.add('show');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    console.log(`📝 Modal abierto: ${institutionId ? 'Editar' : 'Crear'}`);
}

function fillForm(institution) {
    document.getElementById('institutionName').value = institution.name || '';
    document.getElementById('institutionType').value = institution.type || '';
    document.getElementById('institutionAddress').value = institution.address || '';
    document.getElementById('institutionPhone').value = institution.phone || '';
    document.getElementById('institutionNotes').value = institution.notes || '';
    document.getElementById('setAsDefault').checked = institution.isDefault || false;
}

function closeInstitutionModal() {
    const modal = document.getElementById('institution-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    currentEditingInstitution = null;
    console.log('📝 Modal cerrado');
}

// ===== MANEJAR GUARDADO - FUNCIÓN FALTANTE CORREGIDA =====
function handleSaveInstitution(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const institutionData = {
        name: formData.get('name')?.trim(),
        type: formData.get('type'),
        address: formData.get('address')?.trim() || '',
        phone: formData.get('phone')?.trim() || '',
        notes: formData.get('notes')?.trim() || '',
        isDefault: formData.has('isDefault')
    };
    
    // Validaciones
    if (!institutionData.name) {
        showNotification('El nombre de la institución es obligatorio', 'error');
        return;
    }
    
    if (!institutionData.type) {
        showNotification('Debe seleccionar un tipo de institución', 'error');
        return;
    }
    
    try {
        if (currentEditingInstitution) {
            updateInstitution(currentEditingInstitution.id, institutionData);
        } else {
            createInstitution(institutionData, currentUser);
        }
        
        closeInstitutionModal();
        
    } catch (error) {
        console.error('❌ Error guardando institución:', error);
        showNotification('Error al guardar la institución', 'error');
    }
}

// ===== CREAR INSTITUCIÓN =====
function createInstitution(formData, user) {
    // Si se marca como default, quitar default de las demás
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
    
    showNotification(`✅ Institución "${newInstitution.name}" creada correctamente`, 'success');
    console.log(`🏛️ Institución creada: ${newInstitution.name} (ID: ${newInstitution.id})`);
}

// ===== ACTUALIZAR INSTITUCIÓN =====
function updateInstitution(institutionId, formData) {
    const institutionIndex = allInstitutions.findIndex(i => i.id === institutionId);
    
    if (institutionIndex === -1) {
        showNotification('Institución no encontrada', 'error');
        return;
    }
    
    const institution = allInstitutions[institutionIndex];
    
    // Verificar permisos
    if (institution.createdBy !== currentUser.uid) {
        showNotification('No tienes permisos para editar esta institución', 'error');
        return;
    }
    
    // Si se marca como default, quitar default de las demás
    if (formData.isDefault) {
        allInstitutions.forEach(i => {
            if (i.createdBy === currentUser.uid && i.id !== institutionId) {
                i.isDefault = false;
            }
        });
    }
    
    // Actualizar datos
    allInstitutions[institutionIndex] = {
        ...institution,
        ...formData,
        lastModified: new Date().toISOString()
    };
    
    saveInstitutions();
    
    // Actualizar interfaz
    calculateGlobalStats();
    updateDashboard();
    displayInstitutions();
    
    showNotification(`✅ Institución "${formData.name}" actualizada correctamente`, 'success');
    console.log(`🏛️ Institución actualizada: ${formData.name} (ID: ${institutionId})`);
}

// ===== ELIMINAR INSTITUCIÓN =====
function deleteInstitution(institutionId) {
    const institution = allInstitutions.find(i => i.id === institutionId);
    if (!institution) {
        console.error(`❌ Institución no encontrada: ${institutionId}`);
        showNotification('Institución no encontrada', 'error');
        return;
    }
    
    // Verificar permisos
    if (institution.createdBy !== currentUser.uid) {
        console.error(`❌ Usuario no autorizado para eliminar institución: ${institutionId}`);
        showNotification('No tienes permisos para eliminar esta institución', 'error');
        return;
    }
    
    console.log(`🗑️ Solicitando eliminación de: ${institution.name} (${institutionId})`);
    
    document.getElementById('delete-institution-name').textContent = institution.name;
    
    const modal = document.getElementById('delete-institution-modal');
    modal.dataset.institutionId = institutionId;
    modal.classList.add('show');
    modal.style.display = 'flex';
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-institution-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        delete modal.dataset.institutionId;
    }
    console.log('🗑️ Modal de eliminación cerrado');
}

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
        
        showNotification(`✅ Institución "${institutionName}" eliminada correctamente`, 'success');
        console.log(`🗑️ Institución eliminada: ${institutionName} (${institutionId})`);
        
    } catch (error) {
        console.error('❌ Error eliminando institución:', error);
        showNotification('Error al eliminar la institución', 'error');
    }
}

function deleteRelatedData(institutionId) {
    // Eliminar cursos relacionados
    const courses = JSON.parse(getUserData('courses') || '[]');
    const filteredCourses = courses.filter(c => 
        c.institutionId !== institutionId || c.createdBy !== currentUser.uid
    );
    setUserData('courses', JSON.stringify(filteredCourses));
    
    // Eliminar estudiantes relacionados
    const students = JSON.parse(getUserData('students') || '[]');
    const filteredStudents = students.filter(s => 
        s.institutionId !== institutionId || s.createdBy !== currentUser.uid
    );
    setUserData('students', JSON.stringify(filteredStudents));
    
    console.log(`🧹 Datos relacionados eliminados para institución: ${institutionId}`);
}

// ===== MENÚ TOGGLE =====
// function initializeMenuToggle() {
//     console.log('🔧 Instituciones: Inicializando menú toggle...');
    
//     const profileButton = document.getElementById('profileButton');
//     const menuDropdown = document.getElementById('menuDropdown');
//     const menuCloseBtn = document.getElementById('menu-close-btn');
    
//     if (!profileButton || !menuDropdown) {
//         console.error('❌ Elementos del menú no encontrados');
//         return;
//     }
    
//     function openMenu() {
//         menuDropdown.classList.add('show', 'active');
//         document.body.style.overflow = 'hidden';
//     }
    
//     function closeMenu() {
//         menuDropdown.classList.remove('show', 'active');
//         document.body.style.overflow = '';
//     }
    
//     profileButton.addEventListener('click', function(e) {
//         e.preventDefault();
//         e.stopPropagation();
//         openMenu();
//     });
    
//     if (menuCloseBtn) {
//         menuCloseBtn.addEventListener('click', function(e) {
//             e.preventDefault();
//             e.stopPropagation();
//             closeMenu();
//         });
//     }
    
//     document.addEventListener('click', function(e) {
//         if (menuDropdown.classList.contains('show') && 
//             !menuDropdown.contains(e.target) && 
//             !profileButton.contains(e.target)) {
//             closeMenu();
//         }
//     });
    
//     document.addEventListener('keydown', function(e) {
//         if (e.key === 'Escape' && menuDropdown.classList.contains('show')) {
//             closeMenu();
//         }
//     });
    
//     // Configurar logout
//     const logoutBtn = document.getElementById('logout');
//     if (logoutBtn) {
//         logoutBtn.addEventListener('click', function(e) {
//             e.preventDefault();
//             if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
//                 window.auth.signOut().then(() => {
//                     window.location.href = 'login.html';
//                 }).catch((error) => {
//                     console.error('Error al cerrar sesión:', error);
//                     showNotification('Error al cerrar sesión', 'error');
//                 });
//             }
//         });
//     }
    
//     console.log('✅ Menú toggle inicializado');
// }

// ===== MODO OSCURO =====
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Cargar preferencia guardada
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

// ===== CONFIGURAR EVENT LISTENERS =====
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
            if (e.target === modal || e.target.classList.contains('modal-overlay')) {
                closeAllModals();
            }
        });
    });
    
    console.log('🎛️ Event listeners configurados (sin duplicar menú)');
}

// ===== FUNCIONES AUXILIARES =====
function generateId() {
    return 'inst_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

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
    document.body.style.overflow = '';
    console.log('📝 Todos los modales cerrados');
}

// ===== NOTIFICACIONES =====
function showNotification(message, type = 'success') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
        
        // Agregar estilos CSS
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                padding: 1rem;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                justify-content: space-between;
                z-index: 3000;
                max-width: 350px;
                transform: translateX(120%);
                transition: transform 0.3s ease;
            }
            .notification.show { transform: translateX(0); }
            .notification-content { display: flex; align-items: center; gap: 0.8rem; }
            .notification i { font-size: 1.5rem; }
            .notification.success i { color: #28a745; }
            .notification.error i { color: #dc3545; }
            .notification.info i { color: #17a2b8; }
            .close-notification { background: none; border: none; color: #888; cursor: pointer; padding: 0.5rem; }
            .close-notification:hover { color: #333; }
            body.dark-mode .notification { background: #2d2d2d; color: #e0e0e0; }
        `;
        document.head.appendChild(style);
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

// ===== FUNCIONES GLOBALES CORREGIDAS - SIN RECURSIÓN =====
window.openAddInstitutionModal = function() {
    openInstitutionModal();
};

window.editInstitution = function(institutionId) {
    openInstitutionModal(institutionId);
};

window.viewInstitutionCourses = function(institutionId) {
    const institution = allInstitutions.find(i => i.id === institutionId);
    if (!institution) return;
    
    console.log(`📚 Navegando a cursos de: ${institution.name}`);
    window.location.href = `cursos.html?institution=${institutionId}`;
};

window.scrollToInstitutions = function() {
    const element = document.getElementById('institutions-section');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
};

// ===== SOLO UNA DEFINICIÓN DE CADA FUNCIÓN =====
window.closeInstitutionModal = closeInstitutionModal;
window.deleteInstitution = deleteInstitution;
window.confirmDeleteInstitution = confirmDeleteInstitution;
window.closeDeleteModal = closeDeleteModal;

console.log('✅ instituciones.js cargado correctamente - SIN RECURSIÓN');