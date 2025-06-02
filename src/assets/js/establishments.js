// Variables globales
let allEstablishments = [];
let editingEstablishmentId = null;
let isInitialized = false;

// NO inicializar inmediatamente, esperar a que se llame desde profile.js
console.log('🏫 Establishments.js cargado, esperando inicialización...');

function initializeEstablishments() {
    // Prevenir múltiples inicializaciones
    if (isInitialized) {
        console.log('⚠️ Establishments ya inicializado, saltando...');
        return;
    }
    
    console.log('🏫 Inicializando gestión de establecimientos...');
    
    // Verificar que el usuario esté autenticado
    const user = window.auth?.currentUser;
    if (!user) {
        console.log('❌ Usuario no autenticado, no se puede inicializar');
        return;
    }
    
    isInitialized = true;
    loadEstablishments();
    setupEstablishmentEventListeners();
    
    console.log('✅ Gestión de establecimientos inicializada');
}

function setupEstablishmentEventListeners() {
    console.log('🎛️ Configurando event listeners...');
    
    // Botón agregar establecimiento del header
    const addBtn = document.getElementById('addEstablishmentBtn');
    if (addBtn) {
        // Remover listeners previos para evitar duplicados
        addBtn.removeEventListener('click', openEstablishmentModal);
        addBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔘 Click en botón agregar establecimiento');
            openEstablishmentModal();
        });
        console.log('✅ Listener agregado al botón principal');
    } else {
        console.warn('⚠️ No se encontró el botón addEstablishmentBtn');
    }
    
    // Formulario de establecimiento
    const form = document.getElementById('establishment-form');
    if (form) {
        form.removeEventListener('submit', handleEstablishmentSubmit);
        form.addEventListener('submit', handleEstablishmentSubmit);
        console.log('✅ Listener agregado al formulario');
    }
    
    // Cerrar modal
    const closeBtn = document.getElementById('close-establishment-modal');
    if (closeBtn) {
        closeBtn.removeEventListener('click', closeEstablishmentModal);
        closeBtn.addEventListener('click', closeEstablishmentModal);
        console.log('✅ Listener agregado al botón cerrar');
    }
    
    // Cerrar modal al hacer click fuera
    const modal = document.getElementById('establishment-modal');
    if (modal) {
        modal.removeEventListener('click', modalClickOutside);
        modal.addEventListener('click', modalClickOutside);
        console.log('✅ Listener agregado al modal');
    }
}

// Función separada para el click fuera del modal
function modalClickOutside(e) {
    if (e.target === e.currentTarget) {
        closeEstablishmentModal();
    }
}

async function loadEstablishments() {
    try {
        const user = window.auth?.currentUser;
        if (!user) {
            console.log('⏳ Usuario no autenticado, no se pueden cargar establecimientos');
            return;
        }
        
        // Cargar desde localStorage
        const savedEstablishments = getUserData('establishments');
        allEstablishments = savedEstablishments ? JSON.parse(savedEstablishments) : [];
        
        console.log('📚 Establecimientos cargados:', allEstablishments.length);
        
        // CORREGIDO: Solo crear establecimiento por defecto una vez y solo si no existe ninguno
        if (allEstablishments.length === 0) {
            const hasCreatedBefore = hasCreatedDefaultEstablishment();
            if (!hasCreatedBefore) {
                console.log('🎯 Creando establecimiento por defecto por primera vez...');
                createDefaultEstablishment();
                markDefaultEstablishmentCreated();
            } else {
                console.log('ℹ️ Ya se había creado un establecimiento por defecto anteriormente');
            }
        }
        
        displayEstablishments();
        
    } catch (error) {
        console.error('❌ Error cargando establecimientos:', error);
    }
}

// Función para verificar si ya se creó el establecimiento por defecto
function hasCreatedDefaultEstablishment() {
    const user = window.auth?.currentUser;
    if (!user) return false;
    
    const flag = localStorage.getItem(`${user.uid}_defaultEstablishmentCreated`);
    return flag === 'true';
}

// Marcar que ya se creó el establecimiento por defecto
function markDefaultEstablishmentCreated() {
    const user = window.auth?.currentUser;
    if (user) {
        localStorage.setItem(`${user.uid}_defaultEstablishmentCreated`, 'true');
        console.log('✅ Marcado como creado el establecimiento por defecto');
    }
}

function createDefaultEstablishment() {
    console.log('🏫 Creando establecimiento por defecto...');
    
    const defaultEstablishment = {
        id: 'default-' + Date.now(),
        name: 'Horita Feliz',
        type: 'escuela-dominical',
        address: '',
        isDefault: true,
        isActive: true,
        dateCreated: new Date().toISOString(),
        levels: [
            {
                id: 'nivel-infantil',
                name: 'Nivel Infantil',
                courses: [
                    {
                        id: 'curso-principal',
                        name: 'Curso Principal',
                        division: 'A',
                        subjects: [
                            {
                                id: 'actividades-biblicas',
                                name: 'Actividades Bíblicas'
                            }
                        ]
                    }
                ]
            }
        ]
    };
    
    allEstablishments.push(defaultEstablishment);
    saveEstablishments();
    
    console.log('✅ Establecimiento por defecto creado:', defaultEstablishment.name);
}

function displayEstablishments() {
    const grid = document.getElementById('establishmentsGrid');
    if (!grid) {
        console.warn('⚠️ Grid de establecimientos no encontrado');
        return;
    }
    
    console.log('🎨 Mostrando establecimientos en grid:', allEstablishments.length);
    
    // IMPORTANTE: Limpiar completamente el grid
    grid.innerHTML = '';
    
    if (allEstablishments.length === 0) {
        console.log('📭 No hay establecimientos, mostrando estado vacío');
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-school"></i>
                <p>No tienes establecimientos registrados</p>
                <p>Comienza agregando tu primer establecimiento educativo</p>
                <button class="add-establishment-btn empty-state-btn" onclick="openEstablishmentModal()">
                    <i class="fas fa-plus"></i>
                    Agregar tu primer establecimiento
                </button>
            </div>
        `;
        return;
    }
    
    // Crear las tarjetas de establecimientos
    const cardsHTML = allEstablishments.map(establishment => createEstablishmentCard(establishment)).join('');
    grid.innerHTML = cardsHTML;
    
    console.log('✅ Establecimientos mostrados correctamente:', allEstablishments.length);
}

function createEstablishmentCard(establishment) {
    const typeLabels = {
        'escuela-dominical': 'Escuela Dominical',
        'jardin': 'Jardín de Infantes',
        'primaria': 'Escuela Primaria',
        'secundaria': 'Escuela Secundaria',
        'instituto': 'Instituto',
        'universidad': 'Universidad',
        'capacitacion': 'Centro de Capacitación'
    };
    
    const isActive = establishment.isActive ? 'active' : 'inactive';
    
    return `
        <div class="establishment-card ${isActive}" data-id="${establishment.id}">
            <div class="establishment-header">
                <div class="establishment-icon">
                    <i class="fas fa-school"></i>
                </div>
                <div class="establishment-info">
                    <h4>${establishment.name}</h4>
                    <p class="establishment-type">${typeLabels[establishment.type] || establishment.type}</p>
                    ${establishment.address ? `<p class="establishment-address"><i class="fas fa-map-marker-alt"></i> ${establishment.address}</p>` : ''}
                </div>
                <div class="establishment-status">
                    <label class="toggle-switch" title="Activar/desactivar establecimiento">
                        <input type="checkbox" ${establishment.isActive ? 'checked' : ''} 
                               onchange="toggleEstablishment('${establishment.id}', this.checked)">
                        <span class="toggle-slider mini"></span>
                    </label>
                </div>
            </div>
            
            <div class="establishment-stats">
                <div class="stat-item">
                    <span class="stat-number">${establishment.levels?.length || 0}</span>
                    <span class="stat-label">Niveles</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${getTotalCourses(establishment)}</span>
                    <span class="stat-label">Cursos</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${getTotalStudents(establishment)}</span>
                    <span class="stat-label">Alumnos</span>
                </div>
            </div>
            
            <div class="establishment-actions">
                <button class="action-btn primary" onclick="manageEstablishment('${establishment.id}')" 
                        ${!establishment.isActive ? 'disabled' : ''} title="Gestionar establecimiento">
                    <i class="fas fa-cog"></i>
                    Gestionar
                </button>
                <button class="action-btn secondary" onclick="editEstablishment('${establishment.id}')" 
                        title="Editar establecimiento">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button class="action-btn danger" onclick="deleteEstablishment('${establishment.id}')" 
                        title="Eliminar establecimiento"
                        ${establishment.isDefault ? 'style="display: none;"' : ''}>
                    <i class="fas fa-trash"></i>
                    Eliminar
                </button>
            </div>
        </div>
    `;
}

function getTotalCourses(establishment) {
    if (!establishment.levels) return 0;
    return establishment.levels.reduce((total, level) => total + (level.courses?.length || 0), 0);
}

function getTotalStudents(establishment) {
    // Por ahora retornamos 0, después lo calcularemos desde los datos reales
    return 0;
}

function toggleEstablishment(establishmentId, isActive) {
    const establishment = allEstablishments.find(e => e.id === establishmentId);
    if (establishment) {
        establishment.isActive = isActive;
        saveEstablishments();
        displayEstablishments();
        showNotification(
            `Establecimiento ${isActive ? 'activado' : 'desactivado'} correctamente`,
            'success'
        );
    }
}

function openEstablishmentModal(establishmentId = null) {
    console.log('📝 Abriendo modal de establecimiento, ID:', establishmentId);
    
    const modal = document.getElementById('establishment-modal');
    if (!modal) {
        console.error('❌ Modal no encontrado');
        return;
    }
    
    const form = document.getElementById('establishment-form');
    if (!form) {
        console.error('❌ Formulario no encontrado');
        return;
    }
    
    editingEstablishmentId = establishmentId;
    
    if (establishmentId) {
        // Modo edición
        console.log('✏️ Modo edición activado');
        const establishment = allEstablishments.find(e => e.id === establishmentId);
        if (establishment) {
            document.getElementById('establishmentName').value = establishment.name;
            document.getElementById('establishmentType').value = establishment.type;
            document.getElementById('establishmentAddress').value = establishment.address || '';
            
            // Cambiar título del modal
            const modalTitle = modal.querySelector('.modal-header h3');
            if (modalTitle) {
                modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Establecimiento';
            }
        } else {
            console.error('❌ Establecimiento no encontrado para edición');
            return;
        }
    } else {
        // Modo creación
        console.log('➕ Modo creación activado');
        form.reset();
        
        // Cambiar título del modal
        const modalTitle = modal.querySelector('.modal-header h3');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-plus"></i> Agregar Establecimiento';
        }
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
    
    // Focus en el primer campo con un pequeño delay
    setTimeout(() => {
        const nameInput = document.getElementById('establishmentName');
        if (nameInput) {
            nameInput.focus();
            nameInput.select(); // Seleccionar texto si está en modo edición
        }
    }, 100);
    
    console.log('✅ Modal abierto correctamente');
}

function closeEstablishmentModal() {
    console.log('❌ Cerrando modal de establecimiento');
    
    const modal = document.getElementById('establishment-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    editingEstablishmentId = null;
    
    // Limpiar el formulario
    const form = document.getElementById('establishment-form');
    if (form) {
        form.reset();
    }
    
    console.log('✅ Modal cerrado correctamente');
}

function handleEstablishmentSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('establishmentName').value.trim(),
        type: document.getElementById('establishmentType').value,
        address: document.getElementById('establishmentAddress').value.trim()
    };
    
    if (!formData.name || !formData.type) {
        showNotification('❌ Nombre y tipo son obligatorios', 'error');
        return;
    }
    
    if (editingEstablishmentId) {
        // Actualizar existente
        const index = allEstablishments.findIndex(e => e.id === editingEstablishmentId);
        if (index !== -1) {
            allEstablishments[index] = { 
                ...allEstablishments[index], 
                ...formData,
                dateModified: new Date().toISOString()
            };
            showNotification('✅ Establecimiento actualizado correctamente');
        }
    } else {
        // Crear nuevo
        const newEstablishment = {
            ...formData,
            id: 'est-' + Date.now(),
            dateCreated: new Date().toISOString(),
            isActive: true,
            levels: []
        };
        
        allEstablishments.push(newEstablishment);
        showNotification('✅ Establecimiento creado correctamente');
    }
    
    saveEstablishments();
    displayEstablishments();
    closeEstablishmentModal();
}

function editEstablishment(establishmentId) {
    openEstablishmentModal(establishmentId);
}

function saveEstablishments() {
    const user = window.auth?.currentUser;
    if (user) {
        setUserData('establishments', JSON.stringify(allEstablishments));
        
        // También intentar sincronizar con Firebase si está disponible
        if (window.saveEstablishmentData) {
            allEstablishments.forEach(establishment => {
                window.saveEstablishmentData(establishment);
            });
        }
    }
}

function manageEstablishment(establishmentId) {
    // Por ahora redirigir a alumnos.html con parámetro
    window.location.href = `alumnos.html?establishment=${establishmentId}`;
}

function deleteEstablishment(establishmentId) {
    console.log('🗑️ Intentando eliminar establecimiento:', establishmentId);
    
    const establishment = allEstablishments.find(e => e.id === establishmentId);
    
    if (!establishment) {
        console.error('❌ Establecimiento no encontrado');
        showNotification('❌ Establecimiento no encontrado', 'error');
        return;
    }
    
    // Verificar si es el establecimiento por defecto
    if (establishment.isDefault) {
        showNotification('❌ No puedes eliminar el establecimiento por defecto', 'error');
        return;
    }
    
    // Confirmar eliminación con modal personalizado
    if (confirm(`¿Estás seguro de eliminar "${establishment.name}"?\n\nEsta acción eliminará:\n• Todos los niveles y cursos\n• Todos los alumnos asociados\n• Todo el historial de asistencia\n\nEsta acción NO se puede deshacer.`)) {
        try {
            // Filtrar y remover el establecimiento
            const initialLength = allEstablishments.length;
            allEstablishments = allEstablishments.filter(e => e.id !== establishmentId);
            
            if (allEstablishments.length < initialLength) {
                saveEstablishments();
                displayEstablishments();
                showNotification('✅ Establecimiento eliminado correctamente', 'success');
                console.log('✅ Establecimiento eliminado:', establishment.name);
            } else {
                console.error('❌ No se pudo eliminar el establecimiento');
                showNotification('❌ Error al eliminar el establecimiento', 'error');
            }
        } catch (error) {
            console.error('❌ Error eliminando establecimiento:', error);
            showNotification('❌ Error al eliminar el establecimiento', 'error');
        }
    }
}

// === FUNCIONES AUXILIARES ===

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

function showNotification(message, type = 'success') {
    // Crear notificación temporal si no existe una función global
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : '#28a745'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// === ESTILOS DINÁMICOS ===
const dynamicStyles = `
    <style>
        .establishment-card.inactive {
            opacity: 0.6;
        }
        
        .establishment-card.inactive .establishment-info h4 {
            text-decoration: line-through;
        }
        
        .toggle-slider.mini {
            width: 40px !important;
            height: 24px !important;
        }
        
        .toggle-slider.mini:before {
            width: 18px !important;
            height: 18px !important;
            left: 2px !important;
            bottom: 2px !important;
        }
        
        input:checked + .toggle-slider.mini:before {
            transform: translateX(16px) !important;
        }
        
        .establishment-status {
            margin-left: auto;
        }
        
        .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .action-btn.secondary {
            background: #6c757d;
            color: white;
        }
        
        .empty-state {
            text-align: center;
            padding: 3rem;
            color: #666;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            border: 2px dashed #dee2e6;
        }
        
        .empty-state i {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: var(--profile-primary);
        }
        
        .empty-state p {
            margin: 0.5rem 0;
            font-size: 1.1rem;
        }
        
        .empty-state-btn {
            margin-top: 1.5rem !important;
            background: var(--profile-primary) !important;
            color: white !important;
            border: none !important;
            padding: 1rem 2rem !important;
            border-radius: 10px !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 0.5rem !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            font-weight: 600 !important;
            font-size: 1rem !important;
        }
        
        .empty-state-btn:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(255, 182, 193, 0.3) !important;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .notification {
            animation: slideIn 0.3s ease;
        }
    </style>
`;

// Agregar estilos dinámicos
document.head.insertAdjacentHTML('beforeend', dynamicStyles);

// Exportar funciones para uso global
window.manageEstablishment = manageEstablishment;
window.deleteEstablishment = deleteEstablishment;
window.editEstablishment = editEstablishment;
window.toggleEstablishment = toggleEstablishment;
window.initializeEstablishments = initializeEstablishments; // IMPORTANTE: Exportar la función de inicialización
window.closeEstablishmentModal = closeEstablishmentModal;

console.log('🏫 Establishments.js cargado correctamente, funciones exportadas');