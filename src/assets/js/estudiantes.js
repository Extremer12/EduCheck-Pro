/**
 * EduCheck Pro - Sistema de Gestión de Estudiantes
 * Módulo completo para administración de estudiantes
 * 
 * @version 2.0.0
 * @author EduCheck Pro Team
 */

// ===== FUNCIONES AUXILIARES (DEFINIR PRIMERO) =====
function getUserData(key) {
    const user = firebase.auth()?.currentUser;
    if (!user) {
        console.warn('❌ No hay usuario autenticado para obtener datos');
        return null;
    }
    
    try {
        const data = localStorage.getItem(`${user.uid}_${key}`);
        return data;
    } catch (error) {
        console.error(`❌ Error obteniendo datos para ${key}:`, error);
        return null;
    }
}

function setUserData(key, value) {
    const user = firebase.auth()?.currentUser;
    if (!user) {
        console.warn('❌ No hay usuario autenticado para guardar datos');
        return false;
    }
    
    try {
        localStorage.setItem(`${user.uid}_${key}`, value);
        return true;
    } catch (error) {
        console.error(`❌ Error guardando datos para ${key}:`, error);
        return false;
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

function getStudentInitials(student) {
    const name = student.name || '';
    const lastname = student.lastname || '';
    
    const firstInitial = name.charAt(0).toUpperCase();
    const lastInitial = lastname.charAt(0).toUpperCase();
    
    return firstInitial + lastInitial || '??';
}

function generateUniqueId() {
    return 'student_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function showLoadingState() {
    document.body.style.cursor = 'wait';
    console.log('⏳ Cargando...');
}

function hideLoadingState() {
    document.body.style.cursor = 'default';
    console.log('✅ Carga completada');
}

function showNotification(message, type = 'info') {
    // Reutilizar función del sistema principal
    if (window.showNotification && typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Crear notificación temporal si no existe el sistema principal
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        font-family: 'Quicksand', sans-serif;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
        max-width: 350px;
        font-size: 0.9rem;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function initializeTheme() {
    // Aplicar tema guardado
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// ===== VARIABLES GLOBALES =====
let currentStudents = [];
let filteredStudents = [];
let currentFilter = 'all';
let currentView = 'grid';
let selectedStudents = new Set();
let currentEditingStudent = null;

// Elementos DOM
let elements = {};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎓 EduCheck Pro - Iniciando módulo de estudiantes...');
    
    // Verificar autenticación con Firebase
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            console.log('❌ Usuario no autenticado, redirigiendo...');
            window.location.href = 'login.html';
            return;
        }
        
        console.log(`✅ Usuario autenticado: ${user.uid}`);
        
        // Solo si hay usuario, continuar con la inicialización
        initializeDOMReferences();
        setupEventListeners();
        loadInitialData();
        initializeTheme();
        
        console.log('✅ Módulo de estudiantes inicializado correctamente');
        
        // Actualizar información del usuario en header
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && user.displayName) {
            userNameElement.textContent = user.displayName;
        }
    });
});

// ===== REFERENCIAS DOM =====
function initializeDOMReferences() {
    elements = {
        // Dashboard
        totalStudentsCount: document.getElementById('total-students-count'),
        byInstitutionCount: document.getElementById('institutions-count'), // CORREGIDO
        byCoursesCount: document.getElementById('courses-count'), // CORREGIDO
        recentActivityCount: document.getElementById('recent-additions'), // CORREGIDO
        
        // Controles
        addStudentBtn: document.getElementById('add-student-btn'),
        importStudentsBtn: document.getElementById('bulk-import-btn'), // CORREGIDO
        exportStudentsBtn: document.getElementById('export-students-btn'),
        
        // Filtros
        searchInput: document.getElementById('search-students'),
        statusFilter: document.getElementById('filter-status'),
        institutionFilter: document.getElementById('filter-institution'),
        courseFilter: document.getElementById('filter-course'),
        gradeFilter: document.getElementById('filter-grade'),
        clearFiltersBtn: document.getElementById('clear-filters'),
        applyFiltersBtn: document.getElementById('apply-filters'),
        
        // Lista - ELEMENTOS PRINCIPALES QUE FALTABAN
        studentsCount: document.getElementById('students-count'),
        gridViewBtn: document.getElementById('grid-view'),
        listViewBtn: document.getElementById('list-view'),
        studentsGrid: document.getElementById('students-grid'), // ← ESTE ERA EL PROBLEMA
        emptyState: document.getElementById('empty-state'),
        
        // Acciones masivas
        selectAllBtn: document.getElementById('select-all-students'),
        bulkDeleteBtn: document.getElementById('bulk-delete'),
        bulkExportBtn: document.getElementById('bulk-export'),
        bulkMoveBtn: document.getElementById('bulk-move'),
        
        // Modal
        studentModal: document.getElementById('student-modal'),
        studentForm: document.getElementById('student-form'),
        modalTitle: document.getElementById('student-modal-title'), // CORREGIDO
        cancelBtn: document.getElementById('cancel-student'),
        
        // Menú dropdown - AGREGADOS
        profileMenu: document.getElementById('profile-menu'),
        menuDropdown: document.getElementById('menu-dropdown'),
        
        // Tema
        themeToggle: document.getElementById('theme-toggle')
    };
    
    // VERIFICAR que los elementos críticos existen
    if (!elements.studentsGrid) {
        console.error('❌ CRÍTICO: Elemento students-grid no encontrado en el DOM');
        console.log('🔍 Elementos disponibles con ID estudiantes:', 
            Array.from(document.querySelectorAll('[id*="student"]')).map(el => el.id)
        );
    }
    
    if (!elements.emptyState) {
        console.warn('⚠️ Elemento empty-state no encontrado');
    }
    
    console.log('📋 Referencias DOM inicializadas');
    console.log('🎯 Elementos críticos encontrados:', {
        studentsGrid: !!elements.studentsGrid,
        emptyState: !!elements.emptyState,
        studentModal: !!elements.studentModal,
        addButton: !!elements.addStudentBtn
    });
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    console.log('🎮 Configurando event listeners...');
    
    // Botones principales
    if (elements.addStudentBtn) {
        elements.addStudentBtn.addEventListener('click', () => openStudentModal());
    }
    
    if (elements.importStudentsBtn) {
        elements.importStudentsBtn.addEventListener('click', showImportModal);
    }
    
    if (elements.exportStudentsBtn) {
        elements.exportStudentsBtn.addEventListener('click', exportStudents);
    }
    
    // Filtros
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    if (elements.statusFilter) {
        elements.statusFilter.addEventListener('change', applyFilters);
    }
    
    if (elements.institutionFilter) {
        elements.institutionFilter.addEventListener('change', applyFilters);
    }
    
    if (elements.courseFilter) {
        elements.courseFilter.addEventListener('change', applyFilters);
    }
    
    if (elements.gradeFilter) {
        elements.gradeFilter.addEventListener('change', applyFilters);
    }
    
    if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    if (elements.applyFiltersBtn) {
        elements.applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    // Vistas
    if (elements.gridViewBtn) {
        elements.gridViewBtn.addEventListener('click', () => setView('grid'));
    }
    
    if (elements.listViewBtn) {
        elements.listViewBtn.addEventListener('click', () => setView('list'));
    }
    
    // Acciones masivas
    if (elements.selectAllBtn) {
        elements.selectAllBtn.addEventListener('click', toggleSelectAll);
    }
    
    if (elements.bulkDeleteBtn) {
        elements.bulkDeleteBtn.addEventListener('click', bulkDeleteStudents);
    }
    
    if (elements.bulkExportBtn) {
        elements.bulkExportBtn.addEventListener('click', bulkExportStudents);
    }
    
    if (elements.bulkMoveBtn) {
        elements.bulkMoveBtn.addEventListener('click', bulkMoveStudents);
    }
    
    // Modal
    if (elements.studentForm) {
        elements.studentForm.addEventListener('submit', handleStudentSubmit);
    }
    
    if (elements.cancelBtn) {
        elements.cancelBtn.addEventListener('click', closeStudentModal);
    }
    
    // Tema
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }
    
    // ===== MENÚ DROPDOWN COMPLETO =====
    const profileButton = document.getElementById('profile-menu');
    const menuDropdown = document.getElementById('menu-dropdown');
    
    if (profileButton && menuDropdown) {
        console.log('🎯 Configurando menú dropdown...');
        
        // Función para abrir el menú
        function openMenu() {
            menuDropdown.classList.add('show');
            document.body.classList.add('menu-open');
            console.log('📂 Menú abierto');
        }
        
        // Función para cerrar el menú
        function closeMenu() {
            menuDropdown.classList.remove('show');
            document.body.classList.remove('menu-open');
            console.log('📁 Menú cerrado');
        }
        
        // Toggle del menú al hacer clic en el botón de perfil
        profileButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (menuDropdown.classList.contains('show')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
        
        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!profileButton.contains(e.target) && !menuDropdown.contains(e.target)) {
                closeMenu();
            }
        });
        
        // Cerrar menú con tecla Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && menuDropdown.classList.contains('show')) {
                closeMenu();
            }
        });
        
        // Evitar que el menú se cierre al interactuar con elementos internos
        menuDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // Botón de cierre del menú
        const menuCloseBtn = document.getElementById('menu-close-btn');
        if (menuCloseBtn) {
            menuCloseBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeMenu();
            });
        }
        
        // Funciones globales para debugging
        window.openMenu = openMenu;
        window.closeMenu = closeMenu;
        
        console.log('✅ Menú dropdown configurado correctamente');
    } else {
        console.error('❌ Elementos del menú no encontrados:', {
            profileButton: !!profileButton,
            menuDropdown: !!menuDropdown
        });
    }
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                firebase.auth().signOut().then(() => {
                    window.location.href = 'login.html';
                }).catch((error) => {
                    console.error('Error al cerrar sesión:', error);
                    showNotification('Error al cerrar sesión', 'error');
                });
            }
        });
    }
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.studentModal) {
            closeStudentModal();
        }
    });
    
    console.log('✅ Event listeners configurados');
}

// ===== CARGA INICIAL =====
function loadInitialData() {
    console.log('📊 Cargando datos iniciales...');
    
    try {
        loadStudents();
        loadInstitutionsForFilters();
        loadCoursesForFilters();
        updateDashboard();
        
        console.log('✅ Datos iniciales cargados');
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        showNotification('Error cargando datos. Por favor, recarga la página.', 'error');
    }
}

// ===== GESTIÓN DE ESTUDIANTES =====
function loadStudents() {
    console.log('👥 Cargando estudiantes...');
    
    try {
        const studentsData = getUserData('students');
        currentStudents = studentsData ? JSON.parse(studentsData) : [];
        
        console.log(`📋 ${currentStudents.length} estudiantes cargados`);
        
        filteredStudents = [...currentStudents];
        renderStudents();
        updateDashboard();
        
    } catch (error) {
        console.error('❌ Error cargando estudiantes:', error);
        currentStudents = [];
        filteredStudents = [];
        renderStudents();
        showNotification('Error cargando estudiantes', 'error');
    }
}

function saveStudents() {
    console.log('💾 Guardando estudiantes...');
    
    try {
        const success = setUserData('students', JSON.stringify(currentStudents));
        
        if (success) {
            console.log('✅ Estudiantes guardados correctamente');
            return true;
        } else {
            throw new Error('No se pudo guardar en localStorage');
        }
    } catch (error) {
        console.error('❌ Error guardando estudiantes:', error);
        showNotification('Error guardando cambios', 'error');
        return false;
    }
}

function renderStudents() {
    console.log('🎨 Renderizando estudiantes...');
    
    if (!elements.studentsGrid) {
        console.error('❌ Elemento students-grid no encontrado');
        return;
    }
    
    // Actualizar contador
    if (elements.studentsCount) {
        elements.studentsCount.textContent = `${filteredStudents.length} estudiantes`;
    }
    
    // Mostrar estado vacío si no hay estudiantes
    if (filteredStudents.length === 0) {
        showEmptyState();
        return;
    }
    
    // Ocultar estado vacío
    if (elements.emptyState) {
        elements.emptyState.style.display = 'none';
    }
    
    if (elements.studentsGrid) {
        elements.studentsGrid.style.display = 'grid';
    }
    
    // Renderizar según la vista actual
    if (currentView === 'grid') {
        renderGridView();
    } else {
        renderListView();
    }
}

function renderGridView() {
    console.log('📱 Renderizando vista de tarjetas...');
    
    elements.studentsGrid.className = 'students-grid';
    elements.studentsGrid.innerHTML = filteredStudents.map(student => {
        const isSelected = selectedStudents.has(student.id);
        const initials = getStudentInitials(student);
        
        return `
            <div class="student-card ${isSelected ? 'selected' : ''}" data-student-id="${student.id}">
                <input type="checkbox" 
                       class="student-checkbox" 
                       ${isSelected ? 'checked' : ''} 
                       onchange="toggleStudentSelection('${student.id}')">
                
                <div class="student-header">
                    <div class="student-avatar">${initials}</div>
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
                    <h4>${student.fullName || `${student.name} ${student.lastname}`}</h4>
                    
                    <div class="student-details">
                        ${student.document ? `
                            <div class="student-detail">
                                <i class="fas fa-id-card"></i>
                                <span>${student.document}</span>
                            </div>
                        ` : ''}
                        
                        ${student.institutionName ? `
                            <div class="student-detail">
                                <i class="fas fa-university"></i>
                                <span>${student.institutionName}</span>
                            </div>
                        ` : ''}
                        
                        ${student.courseName ? `
                            <div class="student-detail">
                                <i class="fas fa-book"></i>
                                <span>${student.courseName}</span>
                            </div>
                        ` : ''}
                        
                        ${student.grade ? `
                            <div class="student-detail">
                                <i class="fas fa-graduation-cap"></i>
                                <span>Grado ${student.grade}</span>
                            </div>
                        ` : ''}
                        
                        ${student.phone ? `
                            <div class="student-detail">
                                <i class="fas fa-phone"></i>
                                <span>${student.phone}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="student-status ${student.status || 'active'}">
                        <i class="fas fa-circle"></i>
                        ${student.status === 'active' ? 'Activo' : 'Inactivo'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderListView() {
    console.log('📋 Renderizando vista de lista...');
    
    elements.studentsGrid.className = 'students-list-view';
    elements.studentsGrid.innerHTML = `
        <div class="students-table">
            <div class="table-header">
                <div class="table-cell checkbox-cell">
                    <input type="checkbox" id="select-all-table" onchange="toggleSelectAll()">
                </div>
                <div class="table-cell">Nombre</div>
                <div class="table-cell">Documento</div>
                <div class="table-cell">Institución</div>
                <div class="table-cell">Curso</div>
                <div class="table-cell">Estado</div>
                <div class="table-cell">Acciones</div>
            </div>
            
            ${filteredStudents.map(student => {
                const isSelected = selectedStudents.has(student.id);
                
                return `
                    <div class="table-row ${isSelected ? 'selected' : ''}" data-student-id="${student.id}">
                        <div class="table-cell checkbox-cell">
                            <input type="checkbox" 
                                   ${isSelected ? 'checked' : ''} 
                                   onchange="toggleStudentSelection('${student.id}')">
                        </div>
                        <div class="table-cell">
                            <div class="student-name">
                                <div class="student-avatar-small">${getStudentInitials(student)}</div>
                                <div>
                                    <strong>${student.fullName || `${student.name} ${student.lastname}`}</strong>
                                    ${student.phone ? `<br><small>${student.phone}</small>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="table-cell">${student.document || '-'}</div>
                        <div class="table-cell">${student.institutionName || '-'}</div>
                        <div class="table-cell">${student.courseName || '-'}</div>
                        <div class="table-cell">
                            <span class="status-badge ${student.status || 'active'}">
                                ${student.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                        <div class="table-cell">
                            <div class="table-actions">
                                <button class="action-btn-small edit" onclick="editStudent('${student.id}')" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn-small delete" onclick="deleteStudent('${student.id}')" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function showEmptyState() {
    console.log('📭 Mostrando estado vacío...');
    
    if (elements.studentsGrid) {
        elements.studentsGrid.style.display = 'none';
    }
    
    if (elements.emptyState) {
        elements.emptyState.style.display = 'block';
        elements.emptyState.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <h3>No hay estudiantes</h3>
                <p>Comienza agregando tu primer estudiante al sistema.</p>
                <button class="empty-action-btn" onclick="openStudentModal()">
                    <i class="fas fa-plus"></i>
                    Agregar Primer Estudiante
                </button>
            </div>
        `;
    }
}

// ===== FILTROS =====
function loadInstitutionsForFilters() {
    console.log('🏛️ Cargando instituciones para filtros...');
    
    try {
        const institutionsData = getUserData('establishments');
        const institutions = institutionsData ? JSON.parse(institutionsData) : [];
        
        if (elements.institutionFilter) {
            elements.institutionFilter.innerHTML = '<option value="">Todas las instituciones</option>';
            
            institutions.forEach(institution => {
                const option = document.createElement('option');
                option.value = institution.id;
                option.textContent = institution.name;
                elements.institutionFilter.appendChild(option);
            });
        }
        
        console.log(`🏛️ ${institutions.length} instituciones cargadas para filtros`);
        
    } catch (error) {
        console.error('❌ Error cargando datos para filtros:', error);
    }
}

function loadCoursesForFilters() {
    console.log('📚 Cargando cursos para filtros...');
    
    try {
        const coursesData = getUserData('courses');
        const courses = coursesData ? JSON.parse(coursesData) : [];
        
        if (elements.courseFilter) {
            elements.courseFilter.innerHTML = '<option value="">Todos los cursos</option>';
            
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                elements.courseFilter.appendChild(option);
            });
        }
        
        console.log(`📚 ${courses.length} cursos cargados para filtros`);
        
    } catch (error) {
        console.error('❌ Error cargando cursos para filtros:', error);
    }
}

function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    console.log(`🔍 Buscando: "${query}"`);
    
    if (!query) {
        filteredStudents = [...currentStudents];
    } else {
        filteredStudents = currentStudents.filter(student => {
            const fullName = `${student.name} ${student.lastname}`.toLowerCase();
            const document = (student.document || '').toLowerCase();
            const institution = (student.institutionName || '').toLowerCase();
            const course = (student.courseName || '').toLowerCase();
            
            return fullName.includes(query) ||
                   document.includes(query) ||
                   institution.includes(query) ||
                   course.includes(query);
        });
    }
    
    renderStudents();
}

function applyFilters() {
    console.log('🔧 Aplicando filtros...');
    
    let filtered = [...currentStudents];
    
    // Filtro por estado
    const statusFilter = elements.statusFilter?.value;
    if (statusFilter) {
        filtered = filtered.filter(student => student.status === statusFilter);
    }
    
    // Filtro por institución
    const institutionFilter = elements.institutionFilter?.value;
    if (institutionFilter) {
        filtered = filtered.filter(student => student.institutionId === institutionFilter);
    }
    
    // Filtro por curso
    const courseFilter = elements.courseFilter?.value;
    if (courseFilter) {
        filtered = filtered.filter(student => student.courseId === courseFilter);
    }
    
    // Filtro por grado
    const gradeFilter = elements.gradeFilter?.value;
    if (gradeFilter) {
        filtered = filtered.filter(student => student.grade === gradeFilter);
    }
    
    // Aplicar búsqueda si existe
    const searchQuery = elements.searchInput?.value?.toLowerCase().trim();
    if (searchQuery) {
        filtered = filtered.filter(student => {
            const fullName = `${student.name} ${student.lastname}`.toLowerCase();
            const document = (student.document || '').toLowerCase();
            const institution = (student.institutionName || '').toLowerCase();
            const course = (student.courseName || '').toLowerCase();
            
            return fullName.includes(searchQuery) ||
                   document.includes(searchQuery) ||
                   institution.includes(searchQuery) ||
                   course.includes(searchQuery);
        });
    }
    
    filteredStudents = filtered;
    renderStudents();
    
    console.log(`🎯 Filtros aplicados: ${filteredStudents.length}/${currentStudents.length} estudiantes`);
}

function clearFilters() {
    console.log('🧹 Limpiando filtros...');
    
    // Limpiar controles de filtro
    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.statusFilter) elements.statusFilter.value = '';
    if (elements.institutionFilter) elements.institutionFilter.value = '';
    if (elements.courseFilter) elements.courseFilter.value = '';
    if (elements.gradeFilter) elements.gradeFilter.value = '';
    
    // Restaurar lista completa
    filteredStudents = [...currentStudents];
    renderStudents();
    
    showNotification('Filtros limpiados', 'info');
}

// ===== DASHBOARD =====
function updateDashboard() {
    console.log('📊 Actualizando dashboard...');
    
    const stats = {
        total: currentStudents.length,
        active: currentStudents.filter(s => s.status === 'active').length,
        institutions: new Set(currentStudents.map(s => s.institutionId).filter(Boolean)).size,
        courses: new Set(currentStudents.map(s => s.courseId).filter(Boolean)).size
    };
    
    if (elements.totalStudentsCount) {
        elements.totalStudentsCount.textContent = stats.total;
    }
    
    if (elements.byInstitutionCount) {
        elements.byInstitutionCount.textContent = stats.institutions;
    }
    
    if (elements.byCoursesCount) {
        elements.byCoursesCount.textContent = stats.courses;
    }
    
    if (elements.recentActivityCount) {
        elements.recentActivityCount.textContent = stats.active;
    }
    
    console.log('📈 Dashboard actualizado:', stats);
}

// ===== SELECCIÓN MÚLTIPLE =====
function toggleStudentSelection(studentId) {
    console.log(`🎯 Toggle selección estudiante: ${studentId}`);
    
    if (selectedStudents.has(studentId)) {
        selectedStudents.delete(studentId);
    } else {
        selectedStudents.add(studentId);
    }
    
    updateSelectionUI();
    updateBulkActions();
}

function toggleSelectAll() {
    console.log('🎯 Toggle seleccionar todos');
    
    if (selectedStudents.size === filteredStudents.length) {
        // Deseleccionar todos
        selectedStudents.clear();
    } else {
        // Seleccionar todos los filtrados
        selectedStudents.clear();
        filteredStudents.forEach(student => selectedStudents.add(student.id));
    }
    
    updateSelectionUI();
    updateBulkActions();
    renderStudents(); // Re-renderizar para actualizar checkboxes
}

function updateSelectionUI() {
    const selectedCount = selectedStudents.size;
    
    // Actualizar checkbox "select all"
    const selectAllCheckbox = document.getElementById('select-all-table') || elements.selectAllBtn;
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = selectedCount > 0 && selectedCount === filteredStudents.length;
        selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < filteredStudents.length;
    }
    
    console.log(`✅ UI de selección actualizada: ${selectedCount} seleccionados`);
}

function updateBulkActions() {
    const selectedCount = selectedStudents.size;
    const bulkActionsVisible = selectedCount > 0;
    
    // Mostrar/ocultar botones de acciones masivas
    [elements.bulkDeleteBtn, elements.bulkExportBtn, elements.bulkMoveBtn].forEach(btn => {
        if (btn) {
            btn.style.display = bulkActionsVisible ? 'flex' : 'none';
        }
    });
    
    console.log(`🔧 Acciones masivas ${bulkActionsVisible ? 'habilitadas' : 'deshabilitadas'}`);
}

// ===== VISTAS =====
function setView(view) {
    console.log(`👁️ Cambiando vista a: ${view}`);
    
    currentView = view;
    
    // Actualizar botones de vista
    if (elements.gridViewBtn) {
        elements.gridViewBtn.classList.toggle('active', view === 'grid');
    }
    
    if (elements.listViewBtn) {
        elements.listViewBtn.classList.toggle('active', view === 'list');
    }
    
    // Re-renderizar con nueva vista
    renderStudents();
}

// ===== CRUD ESTUDIANTES =====
function openStudentModal(studentId = null) {
    console.log(`📝 Abriendo modal de estudiante: ${studentId || 'nuevo'}`);
    
    currentEditingStudent = studentId;
    
    if (elements.modalTitle) {
        elements.modalTitle.textContent = studentId ? 'Editar Estudiante' : 'Agregar Estudiante';
    }
    
    if (studentId) {
        const student = currentStudents.find(s => s.id === studentId);
        if (student) {
            fillStudentForm(student);
        }
    } else {
        resetStudentForm();
    }
    
    if (elements.studentModal) {
        elements.studentModal.style.display = 'flex';
        elements.studentModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeStudentModal() {
    console.log('❌ Cerrando modal de estudiante');
    
    if (elements.studentModal) {
        elements.studentModal.style.display = 'none';
        elements.studentModal.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    currentEditingStudent = null;
    resetStudentForm();
}

function fillStudentForm(student) {
    const form = elements.studentForm;
    if (!form) return;
    
    // Llenar campos del formulario
    const fields = {
        'student-name': student.name,
        'student-lastname': student.lastname,
        'student-document': student.document,
        'student-birthdate': student.birthdate,
        'student-gender': student.gender,
        'student-phone': student.phone,
        'student-address': student.address,
        'student-institution': student.institutionId,
        'student-course': student.courseId,
        'student-grade': student.grade,
        'student-status': student.status,
        'student-notes': student.notes
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = form.querySelector(`#${fieldId}`);
        if (field && value !== undefined) {
            field.value = value;
        }
    });
    
    console.log('📋 Formulario llenado con datos del estudiante');
}

function resetStudentForm() {
    if (elements.studentForm) {
        elements.studentForm.reset();
        console.log('🧹 Formulario de estudiante reseteado');
    }
}

function handleStudentSubmit(event) {
    event.preventDefault();
    console.log('💾 Procesando envío de formulario de estudiante');
    
    const formData = new FormData(event.target);
    const studentData = {
        name: formData.get('student-name')?.trim() || '',
        lastname: formData.get('student-lastname')?.trim() || '',
        document: formData.get('student-document')?.trim() || '',
        birthdate: formData.get('student-birthdate') || '',
        gender: formData.get('student-gender') || '',
        phone: formData.get('student-phone')?.trim() || '',
        address: formData.get('student-address')?.trim() || '',
        institutionId: formData.get('student-institution') || '',
        courseId: formData.get('student-course') || '',
        grade: formData.get('student-grade') || '',
        status: formData.get('student-status') || 'active',
        notes: formData.get('student-notes')?.trim() || ''
    };
    
    // Validaciones
    if (!studentData.name) {
        showNotification('El nombre es obligatorio', 'error');
        return;
    }
    
    if (!studentData.lastname) {
        showNotification('El apellido es obligatorio', 'error');
    }
    
    // Crear nombre completo
    studentData.fullName = `${studentData.name} ${studentData.lastname}`.trim();
    
    // Obtener nombres de institución y curso
    if (studentData.institutionId) {
        const institutionsData = getUserData('establishments');
        const institutions = institutionsData ? JSON.parse(institutionsData) : [];
        const institution = institutions.find(i => i.id === studentData.institutionId);
        studentData.institutionName = institution?.name || '';
    }
    
    if (studentData.courseId) {
        const coursesData = getUserData('courses');
        const courses = coursesData ? JSON.parse(coursesData) : [];
        const course = courses.find(c => c.id === studentData.courseId);
        studentData.courseName = course?.name || '';
    }
    
    // Agregar timestamps
    const now = new Date().toISOString();
    
    if (currentEditingStudent) {
        // Editar estudiante existente
        const studentIndex = currentStudents.findIndex(s => s.id === currentEditingStudent);
        if (studentIndex !== -1) {
            studentData.id = currentEditingStudent;
            studentData.createdAt = currentStudents[studentIndex].createdAt;
            studentData.updatedAt = now;
            
            currentStudents[studentIndex] = studentData;
            
            console.log('✏️ Estudiante actualizado');
            showNotification('Estudiante actualizado correctamente', 'success');
        }
    } else {
        // Agregar nuevo estudiante
        studentData.id = generateUniqueId();
        studentData.createdAt = now;
        studentData.updatedAt = now;
        
        currentStudents.push(studentData);
        
        console.log('➕ Nuevo estudiante agregado');
        showNotification('Estudiante agregado correctamente', 'success');
    }
    
    // Guardar cambios
    if (saveStudents()) {
        closeStudentModal();
        loadStudents(); // Recargar y renderizar
    }
}

function editStudent(studentId) {
    console.log(`✏️ Editando estudiante: ${studentId}`);
    openStudentModal(studentId);
}

function deleteStudent(studentId) {
    console.log(`🗑️ Solicitando eliminar estudiante: ${studentId}`);
    
    const student = currentStudents.find(s => s.id === studentId);
    if (!student) {
        showNotification('Estudiante no encontrado', 'error');
        return;
    }
    
    const confirmed = confirm(`¿Estás seguro de que deseas eliminar a ${student.fullName}?\n\nEsta acción no se puede deshacer.`);
    
    if (confirmed) {
        // Eliminar estudiante
        currentStudents = currentStudents.filter(s => s.id !== studentId);
        
        // Eliminar de seleccionados si estaba seleccionado
        selectedStudents.delete(studentId);
        
        // Guardar cambios
        if (saveStudents()) {
            console.log('🗑️ Estudiante eliminado correctamente');
            showNotification('Estudiante eliminado correctamente', 'success');
            loadStudents(); // Recargar y renderizar
        }
    }
}

// ===== ACCIONES MASIVAS =====
function bulkDeleteStudents() {
    console.log(`🗑️ Eliminación masiva de ${selectedStudents.size} estudiantes`);
    
    if (selectedStudents.size === 0) {
        showNotification('No hay estudiantes seleccionados', 'warning');
        return;
    }
    
    const confirmed = confirm(`¿Estás seguro de que deseas eliminar ${selectedStudents.size} estudiantes?\n\nEsta acción no se puede deshacer.`);
    
    if (confirmed) {
        // Eliminar estudiantes seleccionados
        currentStudents = currentStudents.filter(student => !selectedStudents.has(student.id));
        
        // Limpiar selección
        selectedStudents.clear();
        
        // Guardar cambios
        if (saveStudents()) {
            console.log('🗑️ Estudiantes eliminados correctamente');
            showNotification(`${selectedStudents.size} estudiantes eliminados correctamente`, 'success');
            loadStudents(); // Recargar y renderizar
            updateBulkActions();
        }
    }
}

function bulkExportStudents() {
    console.log(`📤 Exportando ${selectedStudents.size} estudiantes`);
    
    if (selectedStudents.size === 0) {
        showNotification('No hay estudiantes seleccionados', 'warning');
        return;
    }
    
    const selectedStudentsData = currentStudents.filter(student => selectedStudents.has(student.id));
    exportStudentsData(selectedStudentsData);
}

function bulkMoveStudents() {
    console.log(`📦 Moviendo ${selectedStudents.size} estudiantes`);
    showNotification('Función de mover estudiantes en desarrollo', 'info');
}

// ===== IMPORTAR/EXPORTAR =====
function showImportModal() {
    console.log('📥 Mostrando modal de importación');
    showNotification('Función de importación en desarrollo', 'info');
}

function exportStudents() {
    console.log('📤 Exportando todos los estudiantes');
    exportStudentsData(currentStudents);
}

function exportStudentsData(studentsData) {
    try {
        // Crear CSV
        const headers = ['Nombre', 'Apellido', 'Documento', 'Fecha Nacimiento', 'Género', 'Teléfono', 'Dirección', 'Institución', 'Curso', 'Grado', 'Estado', 'Notas'];
        
        const csvContent = [
            headers.join(','),
            ...studentsData.map(student => [
                student.name || '',
                student.lastname || '',
                student.document || '',
                student.birthdate || '',
                student.gender || '',
                student.phone || '',
                student.address || '',
                student.institutionName || '',
                student.courseName || '',
                student.grade || '',
                student.status || '',
                student.notes || ''
            ].map(field => `"${field}"`).join(','))
        ].join('\n');
        
        // Descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `estudiantes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('📁 Archivo CSV generado y descargado');
        showNotification(`${studentsData.length} estudiantes exportados correctamente`, 'success');
        
    } catch (error) {
        console.error('❌ Error exportando estudiantes:', error);
        showNotification('Error al exportar estudiantes', 'error');
    }
}

// ===== DEBUGGING DEL MENÚ =====
function debugMenu() {
    console.log('🔍 DEBUG: Verificando elementos del menú...');
    
    const profileButton = document.getElementById('profile-menu');
    const menuDropdown = document.getElementById('menu-dropdown');
    
    console.log('Elements found:', {
        profileButton: !!profileButton,
        menuDropdown: !!menuDropdown,
        profileButtonHTML: profileButton ? profileButton.outerHTML : 'NOT FOUND',
        menuDropdownHTML: menuDropdown ? menuDropdown.outerHTML.substring(0, 100) + '...' : 'NOT FOUND'
    });
    
    if (profileButton) {
        console.log('✅ Profile button encontrado');
        profileButton.style.border = '2px solid red'; // Resaltar temporalmente
        
        profileButton.addEventListener('click', function() {
            console.log('🖱️ Click detectado en profile button');
        });
    }
    
    if (menuDropdown) {
        console.log('✅ Menu dropdown encontrado');
        console.log('📊 Estilos actuales del menú:', {
            display: getComputedStyle(menuDropdown).display,
            opacity: getComputedStyle(menuDropdown).opacity,
            visibility: getComputedStyle(menuDropdown).visibility,
            transform: getComputedStyle(menuDropdown).transform,
            zIndex: getComputedStyle(menuDropdown).zIndex
        });
    }
    
    // Test manual del menú
    window.testMenu = function() {
        if (menuDropdown) {
            menuDropdown.classList.toggle('show');
            console.log('🧪 Test manual - Menú toggled:', menuDropdown.classList.contains('show'));
        }
    };
    
    console.log('🧪 Para probar manualmente, ejecuta: testMenu()');
}

// Ejecutar debugging después de que todo esté cargado
setTimeout(debugMenu, 1000);

// ===== FUNCIONES GLOBALES =====
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.toggleStudentSelection = toggleStudentSelection;
window.toggleSelectAll = toggleSelectAll;
window.openStudentModal = openStudentModal;
window.closeStudentModal = closeStudentModal;

console.log('📚 EduCheck Pro - Módulo de estudiantes cargado completamente');