// Variables globales para la gestión de alumnos
let allStudents = [];
let filteredStudents = [];
let currentView = 'cards';
let editingStudentId = null;

// Inicializar la página de alumnos
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('alumnos.html')) {
        initializeStudentsPage();
    }
});

// Función para inicializar la página
function initializeStudentsPage() {
    console.log('👥 Inicializando página de alumnos...');
    
    // Cargar datos de alumnos
    loadStudents();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Actualizar estadísticas
    updateStatistics();
    
    console.log('✅ Página de alumnos inicializada correctamente');
}

// Configurar todos los event listeners
function setupEventListeners() {
    // Formulario de agregar alumno
    const studentForm = document.getElementById('student-form');
    if (studentForm) {
        studentForm.addEventListener('submit', handleAddStudent);
    }
    
    // Búsqueda y filtros
    const searchInput = document.getElementById('student-search');
    const ageFilter = document.getElementById('age-filter');
    const genderFilter = document.getElementById('gender-filter');
    const sortSelect = document.getElementById('sort-select');
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    if (ageFilter) {
        ageFilter.addEventListener('change', applyFilters);
    }
    
    if (genderFilter) {
        genderFilter.addEventListener('change', applyFilters);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }
    
    // Controles de vista
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', handleViewChange);
    });
    
    // Botón de exportar
    const exportBtn = document.getElementById('exportStudents');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportStudentsData);
    }
    
    // Modales
    setupModalEventListeners();
}

// Configurar event listeners de modales
function setupModalEventListeners() {
    // Modal de edición
    const closeEditModal = document.getElementById('close-edit-modal');
    const editForm = document.getElementById('edit-student-form');
    
    if (closeEditModal) {
        closeEditModal.addEventListener('click', closeEditModalHandler);
    }
    
    if (editForm) {
        editForm.addEventListener('submit', handleEditStudent);
    }
    
    // Modal de confirmación de eliminación
    const confirmDeleteBtn = document.getElementById('confirm-delete-student');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteStudent);
    }
    
    // Cerrar modales al hacer clic en overlay
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
}

// Cargar alumnos desde localStorage
function loadStudents() {
    try {
        const user = window.auth?.currentUser;
        if (!user) {
            console.log('❌ Usuario no autenticado');
            return;
        }
        
        const savedStudents = getUserData('students');
        allStudents = savedStudents ? JSON.parse(savedStudents) : [];
        
        console.log(`📊 Cargados ${allStudents.length} alumnos`);
        
        // Aplicar filtros y mostrar
        applyFilters();
        
    } catch (error) {
        console.error('❌ Error cargando alumnos:', error);
        allStudents = [];
        filteredStudents = [];
        displayStudents();
    }
}

// Manejar envío del formulario de agregar alumno
function handleAddStudent(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('studentName').value.trim(),
        age: parseInt(document.getElementById('studentAge').value),
        gender: document.getElementById('studentGender').value,
        parent: document.getElementById('studentParent').value.trim(),
        notes: document.getElementById('studentNotes').value.trim(),
        id: Date.now(),
        dateAdded: new Date().toISOString()
    };
    
    // Validación
    if (!formData.name) {
        showNotification('❌ El nombre del alumno es obligatorio', 'error');
        return;
    }
    
    if (!formData.age || formData.age < 2 || formData.age > 10) {
        showNotification('❌ La edad debe estar entre 2 y 10 años', 'error');
        return;
    }
    
    // Verificar que no exista un alumno con el mismo nombre
    if (allStudents.some(student => student.name.toLowerCase() === formData.name.toLowerCase())) {
        showNotification('❌ Ya existe un alumno con este nombre', 'error');
        return;
    }
    
    // Agregar alumno
    allStudents.unshift(formData);
    saveStudents();
    
    // Limpiar formulario
    document.getElementById('student-form').reset();
    
    // Actualizar vista
    applyFilters();
    updateStatistics();
    
    showNotification(`✅ ${formData.name} agregado correctamente`);
    
    // Hacer scroll hacia la lista
    document.querySelector('.students-list-section')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// Aplicar filtros y ordenamiento
function applyFilters() {
    const searchTerm = document.getElementById('student-search')?.value.toLowerCase() || '';
    const ageFilter = document.getElementById('age-filter')?.value || '';
    const genderFilter = document.getElementById('gender-filter')?.value || '';
    const sortOrder = document.getElementById('sort-select')?.value || 'name-asc';
    
    // Filtrar alumnos
    filteredStudents = allStudents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm) ||
                            (student.parent && student.parent.toLowerCase().includes(searchTerm));
        
        const matchesAge = !ageFilter || student.age.toString() === ageFilter;
        const matchesGender = !genderFilter || student.gender === genderFilter;
        
        return matchesSearch && matchesAge && matchesGender;
    });
    
    // Ordenar alumnos
    filteredStudents.sort((a, b) => {
        switch (sortOrder) {
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'age-asc':
                return a.age - b.age;
            case 'age-desc':
                return b.age - a.age;
            case 'date-asc':
                return new Date(a.dateAdded) - new Date(b.dateAdded);
            case 'date-desc':
                return new Date(b.dateAdded) - new Date(a.dateAdded);
            default:
                return 0;
        }
    });
    
    // Actualizar contador
    updateStudentCount();
    
    // Mostrar alumnos
    displayStudents();
}

// Mostrar alumnos en la interfaz
function displayStudents() {
    const container = document.getElementById('students-container');
    const emptyState = document.getElementById('empty-students');
    
    if (!container) return;
    
    // Aplicar clase de vista
    container.className = `students-grid ${currentView}-view`;
    
    if (filteredStudents.length === 0) {
        container.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = allStudents.length === 0 ? 
                getEmptyStateHTML() : 
                getNoResultsHTML();
        }
        return;
    }
    
    container.style.display = 'grid';
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    container.innerHTML = filteredStudents.map(student => createStudentCard(student)).join('');
}

// Crear HTML para tarjeta de alumno
function createStudentCard(student) {
    const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const formattedDate = new Date(student.dateAdded).toLocaleDateString('es-ES');
    
    return `
        <div class="student-card" data-student-id="${student.id}">
            <div class="student-header">
                <div class="student-avatar">
                    ${initials}
                </div>
                <div class="student-basic-info">
                    <h4>${student.name}</h4>
                    <div class="student-age">${student.age} años</div>
                </div>
            </div>
            
            <div class="student-details">
                ${student.gender ? `
                    <div class="detail-item">
                        <i class="fas fa-${student.gender === 'femenino' ? 'venus' : 'mars'}"></i>
                        <span>${student.gender === 'femenino' ? 'Niña' : 'Niño'}</span>
                    </div>
                ` : ''}
                
                ${student.parent ? `
                    <div class="detail-item">
                        <i class="fas fa-user-friends"></i>
                        <span>${student.parent}</span>
                    </div>
                ` : ''}
                
                <div class="detail-item">
                    <i class="fas fa-calendar-plus"></i>
                    <span>Registrado: ${formattedDate}</span>
                </div>
            </div>
            
            ${student.notes ? `
                <div class="student-notes">
                    <span class="notes-label">Notas:</span>
                    <div class="notes-text">${student.notes}</div>
                </div>
            ` : ''}
            
            <div class="student-actions">
                <button class="action-btn edit-btn" onclick="openEditModal('${student.id}')" title="Editar alumno">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button class="action-btn delete-btn" onclick="openDeleteModal('${student.id}')" title="Eliminar alumno">
                    <i class="fas fa-trash"></i>
                    Eliminar
                </button>
            </div>
        </div>
    `;
}

// HTML para estado vacío
function getEmptyStateHTML() {
    return `
        <div class="empty-icon">
            <i class="fas fa-user-plus"></i>
        </div>
        <h3>No hay alumnos registrados</h3>
        <p>Comienza agregando tu primer alumno usando el formulario de arriba.</p>
        <button onclick="document.getElementById('studentName').focus()" class="add-first-student-btn">
            <i class="fas fa-plus"></i>
            Agregar Primer Alumno
        </button>
    `;
}

// HTML para sin resultados de búsqueda
function getNoResultsHTML() {
    return `
        <div class="empty-icon">
            <i class="fas fa-search"></i>
        </div>
        <h3>No se encontraron alumnos</h3>
        <p>Intenta cambiar los filtros de búsqueda o agregar un nuevo alumno.</p>
        <button onclick="clearFilters()" class="add-first-student-btn">
            <i class="fas fa-filter"></i>
            Limpiar Filtros
        </button>
    `;
}

// Limpiar filtros
function clearFilters() {
    document.getElementById('student-search').value = '';
    document.getElementById('age-filter').value = '';
    document.getElementById('gender-filter').value = '';
    applyFilters();
}

// Cambiar vista
function handleViewChange(event) {
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    currentView = event.target.dataset.view;
    displayStudents();
}

// Abrir modal de edición
function openEditModal(studentId) {
    const student = allStudents.find(s => s.id.toString() === studentId.toString());
    if (!student) return;
    
    editingStudentId = studentId;
    
    // Llenar formulario
    document.getElementById('edit-studentName').value = student.name;
    document.getElementById('edit-studentAge').value = student.age;
    document.getElementById('edit-studentGender').value = student.gender || '';
    document.getElementById('edit-studentParent').value = student.parent || '';
    document.getElementById('edit-studentNotes').value = student.notes || '';
    
    // Mostrar modal
    document.getElementById('edit-student-modal').style.display = 'flex';
}

// Manejar edición de alumno
function handleEditStudent(event) {
    event.preventDefault();
    
    const updatedData = {
        name: document.getElementById('edit-studentName').value.trim(),
        age: parseInt(document.getElementById('edit-studentAge').value),
        gender: document.getElementById('edit-studentGender').value,
        parent: document.getElementById('edit-studentParent').value.trim(),
        notes: document.getElementById('edit-studentNotes').value.trim()
    };
    
    // Validación
    if (!updatedData.name) {
        showNotification('❌ El nombre del alumno es obligatorio', 'error');
        return;
    }
    
    if (!updatedData.age || updatedData.age < 2 || updatedData.age > 10) {
        showNotification('❌ La edad debe estar entre 2 y 10 años', 'error');
        return;
    }
    
    // Verificar nombres duplicados (excluyendo el actual)
    if (allStudents.some(student => 
        student.id.toString() !== editingStudentId.toString() && 
        student.name.toLowerCase() === updatedData.name.toLowerCase())) {
        showNotification('❌ Ya existe otro alumno con este nombre', 'error');
        return;
    }
    
    // Actualizar alumno
    const studentIndex = allStudents.findIndex(s => s.id.toString() === editingStudentId.toString());
    if (studentIndex !== -1) {
        allStudents[studentIndex] = { ...allStudents[studentIndex], ...updatedData };
        saveStudents();
        
        // Cerrar modal
        closeEditModalHandler();
        
        // Actualizar vista
        applyFilters();
        
        showNotification(`✅ ${updatedData.name} actualizado correctamente`);
    }
}

// Cerrar modal de edición
function closeEditModalHandler() {
    document.getElementById('edit-student-modal').style.display = 'none';
    editingStudentId = null;
}

// Abrir modal de confirmación de eliminación
function openDeleteModal(studentId) {
    const student = allStudents.find(s => s.id.toString() === studentId.toString());
    if (!student) return;
    
    document.getElementById('delete-student-name').textContent = student.name;
    document.getElementById('confirm-delete-student').dataset.studentId = studentId;
    document.getElementById('delete-student-modal').style.display = 'flex';
}

// Confirmar eliminación de alumno
function confirmDeleteStudent() {
    const studentId = document.getElementById('confirm-delete-student').dataset.studentId;
    const studentIndex = allStudents.findIndex(s => s.id.toString() === studentId.toString());
    
    if (studentIndex !== -1) {
        const studentName = allStudents[studentIndex].name;
        allStudents.splice(studentIndex, 1);
        saveStudents();
        
        // Cerrar modal
        closeAllModals();
        
        // Actualizar vista
        applyFilters();
        updateStatistics();
        
        showNotification(`✅ ${studentName} eliminado correctamente`);
    }
}

// Cerrar todos los modales
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    editingStudentId = null;
}

// Actualizar estadísticas
function updateStatistics() {
    const totalStudents = allStudents.length;
    const avgAge = totalStudents > 0 ? 
        (allStudents.reduce((sum, student) => sum + student.age, 0) / totalStudents).toFixed(1) : 0;
    
    const genderCount = allStudents.reduce((count, student) => {
        if (student.gender === 'masculino') count.boys++;
        else if (student.gender === 'femenino') count.girls++;
        return count;
    }, { boys: 0, girls: 0 });
    
    // Actualizar elementos del DOM
    updateElement('total-students-stat', totalStudents);
    updateElement('average-age-stat', `${avgAge} años`);
    updateElement('boys-count-stat', genderCount.boys);
    updateElement('girls-count-stat', genderCount.girls);
}

// Actualizar contador de alumnos mostrados
function updateStudentCount() {
    updateElement('showing-count', filteredStudents.length);
    updateElement('total-count', allStudents.length);
}

// Exportar datos de alumnos
function exportStudentsData() {
    if (allStudents.length === 0) {
        showNotification('❌ No hay alumnos para exportar', 'error');
        return;
    }
    
    try {
        const exportData = {
            exportInfo: {
                date: new Date().toISOString(),
                totalStudents: allStudents.length,
                exportedBy: window.auth?.currentUser?.email || 'Usuario'
            },
            students: allStudents.map(student => ({
                name: student.name,
                age: student.age,
                gender: student.gender || 'No especificado',
                parent: student.parent || 'No especificado',
                notes: student.notes || 'Sin notas',
                dateAdded: new Date(student.dateAdded).toLocaleDateString('es-ES')
            }))
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `alumnos-horita-feliz-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('✅ Datos de alumnos exportados correctamente');
        
    } catch (error) {
        console.error('Error exportando datos:', error);
        showNotification('❌ Error al exportar datos', 'error');
    }
}

// Guardar alumnos en localStorage
function saveStudents() {
    const user = window.auth?.currentUser;
    if (user) {
        setUserData('students', JSON.stringify(allStudents));
    }
}

// Función auxiliar para actualizar elementos del DOM
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Estilos inline para la notificación
    notification.style.cssText = `
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
        z-index: 2000;
        max-width: 350px;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        border-left: 4px solid ${type === 'success' ? '#28a745' : '#dc3545'};
    `;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
        hideNotification(notification);
    }, 3000);
    
    // Evento para cerrar manualmente
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
        hideNotification(notification);
    });
}

// Función para ocultar notificación
function hideNotification(notification) {
    notification.style.transform = 'translateX(120%)';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Funciones auxiliares para localStorage (compatibilidad)
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

// Función global para cargar alumnos (llamada desde HTML)
window.loadStudentsPage = function() {
    loadStudents();
    updateStatistics();
};

// Exportar funciones necesarias
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.clearFilters = clearFilters;

console.log('👥 Alumnos.js cargado correctamente');