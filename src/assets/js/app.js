// Añadir esta función al inicio del archivo
function updateUserInfo(user) {
    const teacherNameElements = document.querySelectorAll('#teacher-name, .menu-header h3');
    const displayName = user.displayName || user.email.split('@')[0];
    
    teacherNameElements.forEach(element => {
        if (element) {
            element.textContent = displayName;
        }
    });
}

// Variables para la instalación de la PWA
let deferredPrompt;

// Agregar al inicio del archivo o después de DOMContentLoaded
function setupToggleMenu() {
    const profileButton = document.querySelector('.profile-button');
    const menuDropdown = document.querySelector('.menu-dropdown');
    
    if (profileButton && menuDropdown) {
        // Toggle del menú solo con el botón
        profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('active');
        });

        // Cerrar el menú si se hace clic fuera
        document.addEventListener('click', (e) => {
            if (!menuDropdown.contains(e.target) && !profileButton.contains(e.target)) {
                menuDropdown.classList.remove('active');
            }
        });

        // Evitar que el menú se cierre al hacer clic dentro de él
        menuDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// Función para manejar la instalación de la PWA
function setupInstallApp() {
    const installButton = document.getElementById('installApp');
    
    // Mostrar el botón inicialmente (cambiamos esto para que siempre sea visible)
    if (installButton) {
        installButton.style.display = 'flex';
    }
    
    // Variable para controlar si la app puede ser instalada
    let canInstall = false;
    
    // Capturar el evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevenir que Chrome muestre automáticamente el diálogo
        e.preventDefault();
        // Guardar el evento para usarlo más tarde
        deferredPrompt = e;
        // Indicar que la app puede ser instalada
        canInstall = true;
    });
    
    // Agregar evento al botón
    if (installButton) {
        installButton.addEventListener('click', async (e) => {
            e.preventDefault();
            // Ocultar el menú desplegable
            const menuDropdown = document.querySelector('.menu-dropdown');
            if (menuDropdown) {
                menuDropdown.classList.remove('active');
            }
            
            // Si no hay evento guardado o no se puede instalar
            if (!deferredPrompt || !canInstall) {
                showNotification('La aplicación ya está instalada o no es compatible con este navegador', 'info');
                return;
            }
            
            // Mostrar el diálogo de instalación
            deferredPrompt.prompt();
            
            // Esperar a que el usuario responda
            const { outcome } = await deferredPrompt.userChoice;
            
            // Mostrar mensaje según la respuesta
            if (outcome === 'accepted') {
                showNotification('¡Gracias por instalar nuestra aplicación!');
            } else {
                showNotification('Puedes instalar la aplicación más tarde desde el menú', 'info');
            }
            
            // Limpiar el evento guardado
            deferredPrompt = null;
            canInstall = false;
        });
    }
    
    // Detectar cuando la app ya está instalada
    window.addEventListener('appinstalled', () => {
        // Limpiar el evento guardado
        deferredPrompt = null;
        canInstall = false;
        showNotification('¡Aplicación instalada correctamente!');
    });
}

// Agregar después de setupToggleMenu
function setupAuthButtons() {
    const logoutButton = document.getElementById('logout');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await auth.signOut();
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                showNotification('Error al cerrar sesión', 'error');
            }
        });
    }

    // Verificar estado de autenticación
    auth.onAuthStateChanged((user) => {
        if (!user && !window.location.pathname.includes('login.html')) {
            // Si no hay usuario y no estamos en login.html, redirigir al login
            window.location.href = 'login.html';
        } else if (user && window.location.pathname.includes('login.html')) {
            // Si hay usuario y estamos en login.html, redirigir al index
            window.location.href = 'index.html';
        }

        if (user) {
            // Actualizar la interfaz con la información del usuario
            updateUserInfo(user);
        }
    });
}

// Función para manejar la previsualización de imágenes
function initializeImagePreview() {
    const imageInput = document.getElementById('activityImage');
    const imagePreview = document.querySelector('.image-preview');
    const previewImg = document.getElementById('imagePreview');
    const removeButton = document.querySelector('.remove-image');
    const placeholder = document.querySelector('.upload-placeholder');

    if (imageInput && imagePreview && previewImg) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    imagePreview.style.display = 'block';
                    previewImg.style.display = 'block';
                    if (removeButton) removeButton.style.display = 'flex';
                    if (placeholder) placeholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });

        if (removeButton) {
            removeButton.addEventListener('click', function() {
                imageInput.value = '';
                previewImg.src = '#';
                imagePreview.style.display = 'none';
                previewImg.style.display = 'none';
                removeButton.style.display = 'none';
                if (placeholder) placeholder.style.display = 'flex';
            });
        }
    }
}

// Función para guardar actividades con imágenes
function addActivity(event) {
    event.preventDefault();
    
    // Obtener los valores del formulario
    const activityName = document.getElementById('activityName').value;
    const activityDate = document.getElementById('activityDate').value;
    
    try {
        const imageInput = document.getElementById('activityImage');
        let imageData = null;
        
        if (imageInput && imageInput.files && imageInput.files[0]) {
            // Leer la imagen como promesa
            readFileAsDataURL(imageInput.files[0]).then(data => {
                imageData = data;
                
                const activityId = Date.now();
                const activity = {
                    id: activityId,
                    name: activityName,
                    date: activityDate,
                    imageData: imageData
                };

                // Guardar en localStorage
            let activities = [];
            const savedActivities = getUserData('activities');
            
            if (savedActivities) {
                // Verificar si savedActivities es un string o un objeto
                if (typeof savedActivities === 'string') {
                    try {
                        activities = JSON.parse(savedActivities);
                    } catch (e) {
                        console.error('Error al parsear actividades:', e);
                        activities = [];
                    }
                } else if (Array.isArray(savedActivities)) {
                    activities = savedActivities;
                }
            }
                
                activities.unshift(activity);
                setUserData('activities', JSON.stringify(activities)); // Añadimos JSON.stringify aquí

                // Limpiar el formulario
                document.querySelector('.activity-form').reset();
                const preview = document.getElementById('imagePreview');
                if (preview) {
                    preview.src = '#';
                    preview.style.display = 'none';
                }
                document.querySelector('.remove-image').style.display = 'none';
                document.querySelector('.upload-placeholder').style.display = 'flex';

                // Actualizar la vista
                loadActivities();
                showNotification('Actividad agregada correctamente');
            });
        } else {
            // Si no hay imagen, crear la actividad sin imagen
            const activityId = Date.now();
            const activity = {
                id: activityId,
                name: activityName,
                date: activityDate,
                imageData: null
            };

            // Guardar en localStorage
            let activities = [];
            const savedActivities = getUserData('activities');
            
            if (savedActivities) {
                // Verificar si savedActivities es un string o un objeto
                if (typeof savedActivities === 'string') {
                    try {
                        activities = JSON.parse(savedActivities);
                    } catch (e) {
                        console.error('Error al parsear actividades:', e);
                        activities = [];
                    }
                } else if (Array.isArray(savedActivities)) {
                    activities = savedActivities;
                }
            }
            
            activities.unshift(activity);
            setUserData('activities', JSON.stringify(activities)); // Añadimos JSON.stringify aquí

            // Limpiar el formulario
            document.querySelector('.activity-form').reset();
            const preview = document.getElementById('imagePreview');
            if (preview) {
                preview.src = '#';
                preview.style.display = 'none';
            }
            document.querySelector('.remove-image').style.display = 'none';
            document.querySelector('.upload-placeholder').style.display = 'flex';

            // Actualizar la vista
            loadActivities();
            showNotification('Actividad agregada correctamente');
        }
    } catch (error) {
        console.error('Error al agregar actividad:', error);
        showNotification('Error al agregar la actividad: ' + error.message, 'error');
    }
}

// Función para manejar el botón de volver arriba
function setupScrollToTop() {
    const scrollButton = document.getElementById('scroll-to-top');
    
    if (scrollButton) {
        // Mostrar/ocultar el botón según el scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollButton.classList.add('visible');
            } else {
                scrollButton.classList.remove('visible');
            }
        });
        
        // Acción al hacer clic en el botón
        scrollButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Función para manejar el modo oscuro
function setupDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Verificar si hay una preferencia guardada
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // Aplicar el modo oscuro si está guardado
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) {
            darkModeToggle.checked = true;
        }
    }
    
    // Escuchar cambios en el toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }
}

// Función para manejar la eliminación de cuenta
function setupDeleteAccount() {
    const deleteAccountBtn = document.getElementById('deleteAccount');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    
    if (deleteAccountBtn && deleteConfirmModal) {
        // Mostrar el modal de confirmación
        deleteAccountBtn.addEventListener('click', (e) => {
            e.preventDefault();
            deleteConfirmModal.classList.add('active');
            
            // Cerrar el menú desplegable
            const menuDropdown = document.querySelector('.menu-dropdown');
            if (menuDropdown) {
                menuDropdown.classList.remove('active');
            }
        });
        
        // Cancelar la eliminación
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                deleteConfirmModal.classList.remove('active');
            });
        }
        
        // Confirmar la eliminación
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', async () => {
                try {
                    const user = auth.currentUser;
                    if (user) {
                        // Eliminar el usuario
                        await user.delete();
                        // Redirigir al login
                        window.location.href = 'login.html';
                        showNotification('Cuenta eliminada correctamente');
                    }
                } catch (error) {
                    console.error('Error al eliminar la cuenta:', error);
                    
                    // Si el error es por autenticación reciente, mostrar mensaje específico
                    if (error.code === 'auth/requires-recent-login') {
                        showNotification('Por seguridad, debes volver a iniciar sesión antes de eliminar tu cuenta', 'error');
                        // Cerrar sesión y redirigir al login
                        await auth.signOut();
                        window.location.href = 'login.html';
                    } else {
                        showNotification('Error al eliminar la cuenta: ' + error.message, 'error');
                    }
                } finally {
                    deleteConfirmModal.classList.remove('active');
                }
            });
        }
        
        // Cerrar el modal si se hace clic fuera
        deleteConfirmModal.addEventListener('click', (e) => {
            if (e.target === deleteConfirmModal) {
                deleteConfirmModal.classList.remove('active');
            }
        });
    }
}

// Función para manejar el botón de donación
function setupDonationButton() {
    const donationBtn = document.getElementById('donationBtn');
    
    if (donationBtn) {
        donationBtn.addEventListener('click', () => {
            // Por ahora solo mostramos una notificación
            showNotification('¡Gracias por tu interés en donar! Esta función estará disponible próximamente.');
            
            // Cerrar el menú desplegable
            const menuDropdown = document.querySelector('.menu-dropdown');
            if (menuDropdown) {
                menuDropdown.classList.remove('active');
            }
        });
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    // Verificar si ya existe una notificación
    let notification = document.querySelector('.notification');
    
    // Si no existe, crearla
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Establecer el tipo y mensaje
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
    
    // Mostrar la notificación
    notification.classList.add('show');
    
    // Configurar el botón de cierre
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    }
    
    // Ocultar automáticamente después de 5 segundos
    setTimeout(() => {
        if (notification.classList.contains('show')) {
            notification.classList.remove('show');
        }
    }, 5000);
}

// Función para agregar estilos CSS para las notificaciones
function addNotificationStyles() {
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
            z-index: 2000;
            max-width: 350px;
            transform: translateX(120%);
            transition: transform 0.3s ease;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.8rem;
        }
        
        .notification i {
            font-size: 1.5rem;
        }
        
        .notification.success i {
            color: #28a745;
        }
        
        .notification.error i {
            color: #dc3545;
        }
        
        .notification.info i {
            color: #17a2b8;
        }
        
        .close-notification {
            background: none;
            border: none;
            color: #888;
            cursor: pointer;
            padding: 0.5rem;
        }
        
        .close-notification:hover {
            color: #333;
        }
    `;
    document.head.appendChild(style);
}

// Modificar el event listener DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar componentes
    setupToggleMenu();
    setupAuthButtons();
    setupInstallApp();
    setupScrollToTop();
    initializeImagePreview();
    setupDarkMode();
    setupDeleteAccount();
    setupDonationButton();
    addNotificationStyles();
    
    // Configurar formularios
    const activityForm = document.querySelector('.activity-form');
    if (activityForm) {
        activityForm.addEventListener('submit', addActivity);
    }
    
    // Cargar actividades
    loadActivities();
    
    // Configurar eventos
    setupEventListeners();
    
    // Event listeners para filtros
    const searchInput = document.getElementById('activity-search');
    const dateFilter = document.getElementById('activity-date-filter');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            loadActivities();
        });
    }

    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            loadActivities();
        });
    }

    // Agregar el observer para el estado de autenticación
    auth.onAuthStateChanged(user => {
        if (user) {
            updateUserInfo(user);
        } else {
            // Redirigir al login si no hay usuario autenticado
            window.location.href = 'login.html';
        }
    });
}); // Cierre del DOMContentLoaded que faltaba

function setupEventListeners() {
    // Event listener para editar título y fecha
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-title-btn')) {
            const activityCard = e.target.closest('.activity-card');
            const titleSpan = activityCard.querySelector('.title-text');
            makeEditable(titleSpan, 'text');
        }
        
        if (e.target.classList.contains('edit-date-btn')) {
            const activityCard = e.target.closest('.activity-card');
            const dateSpan = activityCard.querySelector('.date-text');
            makeEditable(dateSpan, 'date');
        }

        if (e.target.classList.contains('attendance-btn')) {
            const activityId = e.target.closest('.activity-card').dataset.id;
            openAttendanceModal(activityId);
        }
    });

    // Event listener para el botón de galería
    const galleryButton = document.getElementById('gallery');
    if (galleryButton) {
        galleryButton.addEventListener('click', (e) => {
            e.preventDefault();
            openGallery();
            // Cerrar el menú dropdown después de abrir la galería
            const menuDropdown = document.querySelector('.menu-dropdown');
            if (menuDropdown) {
                menuDropdown.classList.remove('active');
            }
        });
    }
}

function makeEditable(element, type) {
    const currentValue = element.textContent;
    const input = document.createElement(type === 'date' ? 'input' : 'input');
    input.type = type === 'date' ? 'date' : 'text';
    input.value = type === 'date' ? formatDateForInput(currentValue) : currentValue;
    input.className = 'edit-input';

    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = '<i class="fas fa-check"></i>';
    saveBtn.className = 'save-edit-btn';

    const cancelBtn = document.createElement('button');
    cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
    cancelBtn.className = 'cancel-edit-btn';

    const editingContainer = document.createElement('div');
    editingContainer.className = 'editing-field';
    editingContainer.appendChild(input);
    editingContainer.appendChild(saveBtn);
    editingContainer.appendChild(cancelBtn);

    element.parentNode.appendChild(editingContainer);
    element.style.display = 'none';
    input.focus();

    saveBtn.onclick = () => saveEdit(element, input.value, type);
    cancelBtn.onclick = () => cancelEdit(element, editingContainer);
}

function saveEdit(element, newValue, type) {
    const activityCard = element.closest('.activity-card');
    const activityId = activityCard.dataset.id;
    const activities = JSON.parse(getUserData('activities') || '[]');
    const activityIndex = activities.findIndex(a => a.id.toString() === activityId);

    if (activityIndex !== -1) {
        if (type === 'date') {
            activities[activityIndex].date = newValue;
            element.textContent = formatDate(newValue);
        } else {
            activities[activityIndex].name = newValue;
            element.textContent = newValue;
        }
        setUserData('activities', activities);
        showNotification('Actividad actualizada correctamente');
    }

    element.style.display = '';
    element.parentNode.querySelector('.editing-field').remove();
}

function cancelEdit(element, editingContainer) {
    element.style.display = '';
    editingContainer.remove();
}

function openAttendanceModal(activityId) {
    const activities = JSON.parse(getUserData('activities') || '[]');
    const students = JSON.parse(getUserData('students') || '[]');
    const activity = activities.find(a => a.id.toString() === activityId.toString());

    if (!activity) return;

    const modal = document.getElementById('attendance-modal');
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3><i class="fas fa-clipboard-check"></i> Tomar Asistencia</h3>
            <button class="close-modal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
            <h4>${activity.name} - ${formatDate(activity.date)}</h4>
            <table class="attendance-table">
                <thead>
                    <tr>
                        <th>Alumno</th>
                        <th>Asistencia</th>
                        <th>Puntos</th>
                        <th>Tarea</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(student => `
                        <tr data-student-id="${student.id}">
                            <td>${student.name}</td>
                            <td>
                                <select class="attendance-select">
                                    <option value="present">Presente</option>
                                    <option value="absent">Ausente</option>
                                </select>
                            </td>
                            <td>
                                <select class="points-select">
                                    ${[1,2,3,4,5].map(num => 
                                        `<option value="${num}">${num}</option>`
                                    ).join('')}
                                </select>
                            </td>
                            <td>
                                <select class="completion-select">
                                    <option value="completed">Completada</option>
                                    <option value="incomplete">Incompleta</option>
                                </select>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <button class="save-attendance-btn">
                <i class="fas fa-save"></i> Guardar Asistencia
            </button>
        </div>
    `;

    modal.innerHTML = '';
    modal.appendChild(modalContent);
    modal.style.display = 'block';

    // Event listeners para el modal
    modalContent.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
    modalContent.querySelector('.save-attendance-btn').onclick = () => saveAttendance(activityId);
}

function saveAttendance(activityId) {
    const rows = document.querySelectorAll('.attendance-table tbody tr');
    const attendanceData = Array.from(rows).map(row => ({
        studentId: row.dataset.studentId,
        attendance: row.querySelector('.attendance-select').value,
        points: row.querySelector('.points-select').value,
        completion: row.querySelector('.completion-select').value
    }));

    const attendance = JSON.parse(getUserData('attendance') || '[]');
    const existingIndex = attendance.findIndex(a => a.activityId === activityId);

    if (existingIndex !== -1) {
        attendance[existingIndex].attendanceData = attendanceData;
    } else {
        attendance.push({
            activityId,
            attendanceData
        });
    }

    setUserData('attendance', attendance);
    document.getElementById('attendance-modal').style.display = 'none';
    showNotification('Asistencia guardada correctamente');
}

// Funciones auxiliares
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Reemplazar la función existente
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toISOString().split('T')[0];
}

// Crear corazones cada cierto tiempo
setInterval(createHeart, 1000);

function createHeart() {
    const heart = document.createElement('i');
    heart.classList.add('fas', 'fa-heart', 'floating-heart');
    
    // Posición aleatoria en X
    heart.style.left = Math.random() * 100 + 'vw';
    // Comenzar desde abajo
    heart.style.bottom = '-20px';
    // Tamaño aleatorio
    const size = Math.random() * 15 + 10;
    heart.style.fontSize = size + 'px';
    // Duración aleatoria
    const duration = Math.random() * 10 + 5;
    heart.style.animationDuration = duration + 's';
    
    document.body.appendChild(heart);
    
    // Eliminar el corazón después de la animación
    setTimeout(() => {
        heart.remove();
    }, duration * 1000);
}

// Función para leer archivo como DataURL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Función para cargar actividades
function loadActivities() {
    const activitiesGrid = document.getElementById('activities-grid');
    if (!activitiesGrid) return;

    let activities = [];
    
    try {
        const savedActivities = getUserData('activities');
        
        if (savedActivities) {
            activities = JSON.parse(savedActivities);
        }
        
        // Aplicar filtros si existen
        const searchTerm = document.getElementById('activity-search')?.value.toLowerCase();
        const dateFilter = document.getElementById('activity-date-filter')?.value;

        if (searchTerm) {
            activities = activities.filter(activity => 
                activity.name.toLowerCase().includes(searchTerm)
            );
        }

        if (dateFilter) {
            activities = activities.filter(activity => {
                const activityDate = new Date(activity.date);
                const filterDate = new Date(dateFilter);
                return activityDate.toDateString() === filterDate.toDateString();
            });
        }

        // Renderizar actividades
        activitiesGrid.innerHTML = activities.length ? activities.map(activity => `
            <div class="activity-card" data-id="${activity.id}">
                <div class="activity-header">
                    <div class="activity-title">
                        <h3>
                            <span class="title-text">${activity.name}</span>
                            <button class="edit-inline-btn" onclick="editField('title', '${activity.id}')" title="Editar título">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                        </h3>
                    </div>
                    
                    <div class="activity-date">
                        <i class="fas fa-calendar"></i>
                        <span class="date-text">${formatDate(activity.date)}</span>
                        <button class="edit-inline-btn" onclick="editField('date', '${activity.id}')" title="Editar fecha">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                    </div>
                    
                    <button class="delete-activity-icon" onclick="deleteActivity('${activity.id}')" title="Eliminar actividad">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                ${activity.imageData ? `
                    <div class="activity-image" onclick="openGallery('${activity.id}')">
                        <img src="${activity.imageData}" alt="${activity.name}">
                        <div class="image-actions">
                            <button class="image-action-btn" onclick="event.stopPropagation(); handleImage('${activity.id}')" title="Opciones de imagen">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                ` : `
                    <label class="add-image-placeholder" for="image-${activity.id}">
                        <input type="file" id="image-${activity.id}" class="image-input" accept="image/*" onchange="addImage('${activity.id}', event)" hidden>
                        <div class="upload-content">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <span>Agregar imagen</span>
                        </div>
                    </label>
                `}

                <button class="attendance-btn" onclick="openAttendanceModal('${activity.id}')">
                    <i class="fas fa-clipboard-check"></i>
                    Tomar Asistencia
                </button>
            </div>
        `).join('') : `
            <div class="empty-state">
                <i class="fas fa-calendar-plus"></i>
                <p>No hay actividades registradas</p>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar actividades:', error);
        activitiesGrid.innerHTML = `
            <div class="empty-state error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al cargar actividades</p>
            </div>
        `;
    }
} // Fin de la función loadActivities

// Función para editar campos
function editField(type, activityId) {
    const card = document.querySelector(`.activity-card[data-id="${activityId}"]`);
    const element = card.querySelector(`.${type}-text`);
    const currentValue = element.textContent.trim();
    
    // Si ya está en modo edición, no hacer nada
    if (element.querySelector('.edit-input')) return;
    
    const container = document.createElement('div');
    container.className = 'edit-container';
    
    if (type === 'title') {
        container.innerHTML = `
            <input type="text" class="edit-input" value="${currentValue}">
            <button class="save-edit" onclick="saveEdit('${type}', '${activityId}')">
                <i class="fas fa-check"></i>
            </button>
        `;
    } else if (type === 'date') {
        const dateValue = formatDateForInput(currentValue);
        container.innerHTML = `
            <input type="date" class="edit-input" value="${dateValue}">
            <button class="save-edit" onclick="saveEdit('${type}', '${activityId}')">
                <i class="fas fa-check"></i>
            </button>
        `;
    }
    
    element.innerHTML = '';
    element.appendChild(container);
    const input = container.querySelector('input');
    input.focus();
    
    // Cerrar al presionar Escape
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            loadActivities();
        }
        if (e.key === 'Enter') {
            saveEdit(type, activityId);
        }
    });
}

function saveEdit(type, activityId) {
    const card = document.querySelector(`.activity-card[data-id="${activityId}"]`);
    const input = card.querySelector(`.${type}-text .edit-input`);
    const newValue = input.value.trim();

    if (!newValue) {
        showNotification('El campo no puede estar vacío', 'error');
        return;
    }

    if (confirm('¿Estás seguro de que deseas guardar los cambios?')) {
        const activities = JSON.parse(getUserData('activities') || '[]');
        const index = activities.findIndex(a => a.id.toString() === activityId.toString());

        if (index !== -1) {
            if (type === 'title') {
                activities[index].name = newValue;
            } else if (type === 'date') {
                activities[index].date = newValue;
            }

            setUserData('activities', activities);
            showNotification('Cambios guardados correctamente');
            loadActivities();
        }
    } else {
        loadActivities();
    }
}

// Función para manejar la imagen
function handleImage(activityId) {
    if (confirm('¿Qué deseas hacer con la imagen?')) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => updateImage(activityId, e.target.files[0]);
        input.click();
    } else {
        if (confirm('¿Deseas eliminar la imagen?')) {
            removeImage(activityId);
        }
    }
}

// Funciones auxiliares para manejar imágenes
function addImage(activityId, event) {
    const file = event.target.files[0];
    if (file) {
        updateImage(activityId, file);
    }
}

function updateImage(activityId, file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const activities = JSON.parse(getUserData('activities') || '[]');
        const index = activities.findIndex(a => a.id.toString() === activityId.toString());
        if (index !== -1) {
            activities[index].imageData = e.target.result;
            setUserData('activities', activities);
            loadActivities();
            showNotification('Imagen actualizada correctamente');
        }
    };
    reader.readAsDataURL(file);
}

function removeImage(activityId) {
    const activities = JSON.parse(getUserData('activities') || '[]');
    const index = activities.findIndex(a => a.id.toString() === activityId.toString());
    if (index !== -1) {
        activities[index].imageData = null;
        setUserData('activities', activities);
        loadActivities();
        showNotification('Imagen eliminada correctamente');
    }
}

// Agregar la función deleteActivity
function deleteActivity(activityId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta actividad?')) {
        try {
            let activities = JSON.parse(getUserData('activities') || '[]');
            activities = activities.filter(activity => activity.id.toString() !== activityId.toString());
            setUserData('activities', activities);
            
            // Recargar la lista de actividades
            loadActivities();
            
            showNotification('Actividad eliminada correctamente');
        } catch (error) {
            console.error('Error al eliminar la actividad:', error);
            showNotification('Error al eliminar la actividad', 'error');
        }
    }
}

// Función para configurar los event listeners de la tarjeta
function setupActivityCardListeners(card) {
    const attendanceBtn = card.querySelector('.attendance-btn');
    const deleteBtn = card.querySelector('.delete-activity-btn');
    const editTitleBtn = card.querySelector('.edit-title-btn');
    const editDateBtn = card.querySelector('.edit-date-btn');

    attendanceBtn?.addEventListener('click', () => {
        const activity = attendanceBtn.dataset.activity;
        const date = attendanceBtn.dataset.date;
        openAttendanceModal(activity, date);
    });

    deleteBtn?.addEventListener('click', () => {
        const activityId = deleteBtn.dataset.id;
        deleteActivity(activityId);
    });

    editTitleBtn?.addEventListener('click', () => makeEditable(card, 'title', 'text'));
    editDateBtn?.addEventListener('click', () => makeEditable(card, 'date', 'date'));
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    // Verificar si ya existe una notificación
    let notification = document.querySelector('.notification');
    
    // Si no existe, crearla
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Establecer el tipo y mensaje
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
    
    // Mostrar la notificación
    notification.classList.add('show');
    
    // Configurar el botón de cierre
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    }
    
    // Ocultar automáticamente después de 5 segundos
    setTimeout(() => {
        if (notification.classList.contains('show')) {
            notification.classList.remove('show');
        }
    }, 5000);
}

// Hacer accesible la función deleteActivityImage globalmente
window.editField = editField;
window.saveEdit = saveEdit;
window.deleteActivity = deleteActivity;
window.handleImage = handleImage;
window.addImage = addImage;
window.openGallery = openGallery;
window.openAttendanceModal = openAttendanceModal;

function openGallery(startingImageId = null) {
    const activities = JSON.parse(getUserData('activities') || '[]')
        .filter(activity => activity.imageData);
    
    if (activities.length === 0) {
        showNotification('No hay imágenes en la galería', 'info');
        return;
    }

    let currentIndex = startingImageId ? 
        activities.findIndex(a => a.id.toString() === startingImageId.toString()) : 0;
    
    if (currentIndex === -1) currentIndex = 0;

    // Usar el modal existente
    const modal = document.getElementById('gallery-modal');
    const container = modal.querySelector('.carousel-slide');
    const search = modal.querySelector('#gallery-search');
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');
    const closeBtn = modal.querySelector('.close-modal');
    let filteredActivities = [...activities];

    function updateGalleryView() {
        const activity = filteredActivities[currentIndex];
        container.innerHTML = `
            <img src="${activity.imageData}" alt="${activity.name}">
            <div class="image-info">
                <h4 class="activity-name">${activity.name}</h4>
                <p class="activity-date">${formatDate(activity.date)}</p>
            </div>
        `;
    }

    // Inicializar la vista
    updateGalleryView();
    modal.style.display = 'block';

    // Event listeners
    search.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filteredActivities = activities.filter(activity => 
            activity.name.toLowerCase().includes(searchTerm)
        );
        if (filteredActivities.length > 0) {
            currentIndex = 0;
            updateGalleryView();
        }
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + filteredActivities.length) % filteredActivities.length;
        updateGalleryView();
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % filteredActivities.length;
        updateGalleryView();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        search.value = '';
        filteredActivities = [...activities];
    });

    // Navegación con teclado
    function galleryKeyHandler(e) {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
            document.removeEventListener('keydown', galleryKeyHandler);
        } else if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        }
    }

    document.addEventListener('keydown', galleryKeyHandler);
}

// Función para guardar datos del usuario
function setUserData(key, data) {
    try {
        // Si data ya es un string, no lo convertimos de nuevo
        const dataToStore = typeof data === 'string' ? data : JSON.stringify(data);
        localStorage.setItem(key, dataToStore);
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        return false;
    }
}

// Función para obtener datos del usuario
function getUserData(key) {
    try {
        const data = localStorage.getItem(key);
        return data;
    } catch (error) {
        console.error('Error al obtener datos:', error);
        return null;
    }
}



// Exponer estas funciones globalmente
window.setUserData = setUserData;
window.getUserData = getUserData;

function setupActivityCardListeners(card) {
    const attendanceBtn = card.querySelector('.attendance-btn');
    const deleteBtn = card.querySelector('.delete-activity-btn');
    const editTitleBtn = card.querySelector('.edit-title-btn');
    const editDateBtn = card.querySelector('.edit-date-btn');

    attendanceBtn?.addEventListener('click', () => {
        const activity = attendanceBtn.dataset.activity;
        const date = attendanceBtn.dataset.date;
        openAttendanceModal(activity, date);
    });

    deleteBtn?.addEventListener('click', () => {
        const activityId = deleteBtn.dataset.id;
        deleteActivity(activityId);
    });

    editTitleBtn?.addEventListener('click', () => makeEditable(card, 'title', 'text'));
    editDateBtn?.addEventListener('click', () => makeEditable(card, 'date', 'date'));
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    // Verificar si ya existe una notificación
    let notification = document.querySelector('.notification');
    
    // Si no existe, crearla
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Establecer el tipo y mensaje
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
    
    // Mostrar la notificación
    notification.classList.add('show');
    
    // Configurar el botón de cierre
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    }
    
    // Ocultar automáticamente después de 5 segundos
    setTimeout(() => {
        if (notification.classList.contains('show')) {
            notification.classList.remove('show');
        }
    }, 5000);
}

// Hacer accesible la función deleteActivityImage globalmente
window.editField = editField;
window.saveEdit = saveEdit;
window.deleteActivity = deleteActivity;
window.handleImage = handleImage;
window.addImage = addImage;
window.openGallery = openGallery;
window.openAttendanceModal = openAttendanceModal;

function openGallery(startingImageId = null) {
    const activities = JSON.parse(getUserData('activities') || '[]')
        .filter(activity => activity.imageData);
    
    if (activities.length === 0) {
        showNotification('No hay imágenes en la galería', 'info');
        return;
    }

    let currentIndex = startingImageId ? 
        activities.findIndex(a => a.id.toString() === startingImageId.toString()) : 0;
    
    if (currentIndex === -1) currentIndex = 0;

    // Usar el modal existente
    const modal = document.getElementById('gallery-modal');
    const container = modal.querySelector('.carousel-slide');
    const search = modal.querySelector('#gallery-search');
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');
    const closeBtn = modal.querySelector('.close-modal');
    let filteredActivities = [...activities];

    function updateGalleryView() {
        const activity = filteredActivities[currentIndex];
        container.innerHTML = `
            <img src="${activity.imageData}" alt="${activity.name}">
            <div class="image-info">
                <h4 class="activity-name">${activity.name}</h4>
                <p class="activity-date">${formatDate(activity.date)}</p>
            </div>
        `;
    }

    // Inicializar la vista
    updateGalleryView();
    modal.style.display = 'block';

    // Event listeners
    search.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filteredActivities = activities.filter(activity => 
            activity.name.toLowerCase().includes(searchTerm)
        );
        if (filteredActivities.length > 0) {
            currentIndex = 0;
            updateGalleryView();
        }
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + filteredActivities.length) % filteredActivities.length;
        updateGalleryView();
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % filteredActivities.length;
        updateGalleryView();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        search.value = '';
        filteredActivities = [...activities];
    });

    // Navegación con teclado
    function galleryKeyHandler(e) {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
            document.removeEventListener('keydown', galleryKeyHandler);
        } else if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        }
    }

    document.addEventListener('keydown', galleryKeyHandler);
}

// Función para guardar datos del usuario
function setUserData(key, data) {
    try {
        // Si data ya es un string, no lo convertimos de nuevo
        const dataToStore = typeof data === 'string' ? data : JSON.stringify(data);
        localStorage.setItem(key, dataToStore);
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        return false;
    }
}

// Función para obtener datos del usuario
function getUserData(key) {
    try {
        const data = localStorage.getItem(key);
        return data;
    } catch (error) {
        console.error('Error al obtener datos:', error);
        return null;
    }
}



// Exponer estas funciones globalmente
window.setUserData = setUserData;
window.getUserData = getUserData;

function setupActivityCardListeners(card) {
    const attendanceBtn = card.querySelector('.attendance-btn');
    const deleteBtn = card.querySelector('.delete-activity-btn');
    const editTitleBtn = card.querySelector('.edit-title-btn');
    const editDateBtn = card.querySelector('.edit-date-btn');

    attendanceBtn?.addEventListener('click', () => {
        const activity = attendanceBtn.dataset.activity;
        const date = attendanceBtn.dataset.date;
        openAttendanceModal(activity, date);
    });

    deleteBtn?.addEventListener('click', () => {
        const activityId = deleteBtn.dataset.id;
        deleteActivity(activityId);
    });

    editTitleBtn?.addEventListener('click', () => makeEditable(card, 'title', 'text'));
    editDateBtn?.addEventListener('click', () => makeEditable(card, 'date', 'date'));
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    // Verificar si ya existe una notificación
    let notification = document.querySelector('.notification');
    
    // Si no existe, crearla
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Establecer el tipo y mensaje
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
    
    // Mostrar la notificación
    notification.classList.add('show');
    
    // Configurar el botón de cierre
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    }
    
    // Ocultar automáticamente después de 5 segundos
    setTimeout(() => {
        if (notification.classList.contains('show')) {
            notification.classList.remove('show');
        }
    }, 5000);
}

// Hacer accesible la función deleteActivityImage globalmente
window.editField = editField;
window.saveEdit = saveEdit;
window.deleteActivity = deleteActivity;
window.handleImage = handleImage;
window.addImage = addImage;
window.openGallery = openGallery;
window.openAttendanceModal = openAttendanceModal;

function openGallery(startingImageId = null) {
    const activities = JSON.parse(getUserData('activities') || '[]')
        .filter(activity => activity.imageData);
    
    if (activities.length === 0) {
        showNotification('No hay imágenes en la galería', 'info');
        return;
    }

    let currentIndex = startingImageId ? 
        activities.findIndex(a => a.id.toString() === startingImageId.toString()) : 0;
    
    if (currentIndex === -1) currentIndex = 0;

    // Usar el modal existente
    const modal = document.getElementById('gallery-modal');
    const container = modal.querySelector('.carousel-slide');
    const search = modal.querySelector('#gallery-search');
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');
    const closeBtn = modal.querySelector('.close-modal');
    let filteredActivities = [...activities];

    function updateGalleryView() {
        const activity = filteredActivities[currentIndex];
        container.innerHTML = `
            <img src="${activity.imageData}" alt="${activity.name}">
            <div class="image-info">
                <h4 class="activity-name">${activity.name}</h4>
                <p class="activity-date">${formatDate(activity.date)}</p>
            </div>
        `;
    }

    // Inicializar la vista
    updateGalleryView();
    modal.style.display = 'block';

    // Event listeners
    search.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filteredActivities = activities.filter(activity => 
            activity.name.toLowerCase().includes(searchTerm)
        );
        if (filteredActivities.length > 0) {
            currentIndex = 0;
            updateGalleryView();
        }
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + filteredActivities.length) % filteredActivities.length;
        updateGalleryView();
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % filteredActivities.length;
        updateGalleryView();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        search.value = '';
        filteredActivities = [...activities];
    });

    // Navegación con teclado
    function galleryKeyHandler(e) {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
            document.removeEventListener('keydown', galleryKeyHandler);
        } else if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        }
    }

    document.addEventListener('keydown', galleryKeyHandler);
}

// Función para guardar datos del usuario
function setUserData(key, data) {
    try {
        // Si data ya es un string, no lo convertimos de nuevo
        const dataToStore = typeof data === 'string' ? data : JSON.stringify(data);
        localStorage.setItem(key, dataToStore);
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        return false;
    }
}

// Función para obtener datos del usuario
function getUserData(key) {
    try {
        const data = localStorage.getItem(key);
        return data;
    } catch (error) {
        console.error('Error al obtener datos:', error);
        return null;
    }
}



// Exponer estas funciones globalmente
window.setUserData = setUserData;
window.getUserData = getUserData;

function setupActivityCardListeners(card) {
    const attendanceBtn = card.querySelector('.attendance-btn');
    const deleteBtn = card.querySelector('.delete-activity-btn');
    const editTitleBtn = card.querySelector('.edit-title-btn');
    const editDateBtn = card.querySelector('.edit-date-btn');

    attendanceBtn?.addEventListener('click', () => {
        const activity = attendanceBtn.dataset.activity;
        const date = attendanceBtn.dataset.date;
        openAttendanceModal(activity, date);
    });

    deleteBtn?.addEventListener('click', () => {
        const activityId = deleteBtn.dataset.id;
        deleteActivity(activityId);
    });

    editTitleBtn?.addEventListener('click', () => makeEditable(card, 'title', 'text'));
    editDateBtn?.addEventListener('click', () => makeEditable(card, 'date', 'date'));
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    // Verificar si ya existe una notificación
    let notification = document.querySelector('.notification');
    
    // Si no existe, crearla
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Establecer el tipo y mensaje
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
    
    // Mostrar la notificación
    notification.classList.add('show');
    
    // Configurar el botón de cierre
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    }
    
    // Ocultar automáticamente después de 5 segundos
    setTimeout(() => {
        if (notification.classList.contains('show')) {
            notification.classList.remove('show');
        }
    }, 5000);
}

// Hacer accesible la función deleteActivityImage globalmente
window.editField = editField;
window.saveEdit = saveEdit;
window.deleteActivity = deleteActivity;
window.handleImage = handleImage;
window.addImage = addImage;
window.openGallery = openGallery;
window.openAttendanceModal = openAttendanceModal;

function openGallery(startingImageId = null) {
    const activities = JSON.parse(getUserData('activities') || '[]')
        .filter(activity => activity.imageData);
    
    if (activities.length === 0) {
        showNotification('No hay imágenes en la galería', 'info');
        return;
    }

    let currentIndex = startingImageId ? 
        activities.findIndex(a => a.id.toString() === startingImageId.toString()) : 0;
    
    if (currentIndex === -1) currentIndex = 0;

    // Usar el modal existente
    const modal = document.getElementById('gallery-modal');
    const container = modal.querySelector('.carousel-slide');
    const search = modal.querySelector('#gallery-search');
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');
    const closeBtn = modal.querySelector('.close-modal');
    let filteredActivities = [...activities];

    function updateGalleryView() {
        const activity = filteredActivities[currentIndex];
        container.innerHTML = `
            <img src="${activity.imageData}" alt="${activity.name}">
            <div class="image-info">
                <h4 class="activity-name">${activity.name}</h4>
                <p class="activity-date">${formatDate(activity.date)}</p>
            </div>
        `;
    }

    // Inicializar la vista
    updateGalleryView();
    modal.style.display = 'block';

    // Event listeners
    search.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filteredActivities = activities.filter(activity => 
            activity.name.toLowerCase().includes(searchTerm)
        );
        if (filteredActivities.length > 0) {
            currentIndex = 0;
            updateGalleryView();
        }
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + filteredActivities.length) % filteredActivities.length;
        updateGalleryView();
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % filteredActivities.length;
        updateGalleryView();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        search.value = '';
        filteredActivities = [...activities];
    });

    // Navegación con teclado
    function galleryKeyHandler(e) {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
            document.removeEventListener('keydown', galleryKeyHandler);
        } else if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        }
    }

    document.addEventListener('keydown', galleryKeyHandler);
}

// Función para guardar datos del usuario
function setUserData(key, data) {
    try {
        // Si data ya es un string, no lo convertimos de nuevo
        const dataToStore = typeof data === 'string' ? data : JSON.stringify(data);
        localStorage.setItem(key, dataToStore);
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        return false;
    }
}

// Función para obtener datos del usuario
function getUserData(key) {
    try {
        const data = localStorage.getItem(key);
        return data;
    } catch (error) {
        console.error('Error al obtener datos:', error);
        return null;
    }
}



// Exponer estas funciones globalmente
window.setUserData = setUserData;
window.getUserData = getUserData;

function setupActivityCardListeners(card) {
    const attendanceBtn = card.querySelector('.attendance-btn');
    const deleteBtn = card.querySelector('.delete-activity-btn');
    const editTitleBtn = card.querySelector('.edit-title-btn');
    const editDateBtn = card.querySelector('.edit-date-btn');

    attendanceBtn?.addEventListener('click', () => {
        const activity = attendanceBtn.dataset.activity;
        const date = attendanceBtn.dataset.date;
        openAttendanceModal(activity, date);
    });

    deleteBtn?.addEventListener('click', () => {
        const activityId = deleteBtn.dataset.id;
        deleteActivity(activityId);
    });

    editTitleBtn?.addEventListener('click', () => makeEditable(card, 'title', 'text'));
    editDateBtn?.addEventListener('click', () => makeEditable(card, 'date', 'date'));
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    // Verificar si ya existe una notificación
    let notification = document.querySelector('.notification');
    
    // Si no existe, crearla
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Establecer el tipo y mensaje
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
    
    // Mostrar la notificación
    notification.classList.add('show');
    
    // Configurar el botón de cierre
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    }
    
    // Ocultar automáticamente después de 5 segundos
    setTimeout(() => {
        if (notification.classList.contains('show')) {
            notification.classList.remove('show');
        }
    }, 5000);
}

// Hacer accesible la función deleteActivityImage globalmente
window.editField = editField;
window.saveEdit = saveEdit;
window.deleteActivity = deleteActivity;
window.handleImage = handleImage;
window.addImage = addImage;
window.openGallery = openGallery;
window.openAttendanceModal = openAttendanceModal;

function openGallery(startingImageId = null) {
    const activities = JSON.parse(getUserData('activities') || '[]')
        .filter(activity => activity.imageData);
    
    if (activities.length === 0) {
        showNotification('No hay imágenes en la galería', 'info');
        return;
    }

    let currentIndex = startingImageId ? 
        activities.findIndex(a => a.id.toString() === startingImageId.toString()) : 0;
    
    if (currentIndex === -1) currentIndex = 0;

    // Usar el modal existente
    const modal = document.getElementById('gallery-modal');
    const container = modal.querySelector('.carousel-slide');
    const search = modal.querySelector('#gallery-search');
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');
    const closeBtn = modal.querySelector('.close-modal');
    let filteredActivities = [...activities];

    function updateGalleryView() {
        const activity = filteredActivities[currentIndex];
        container.innerHTML = `
            <img src="${activity.imageData}" alt="${activity.name}">
            <div class="image-info">
                <h4 class="activity-name">${activity.name}</h4>
                <p class="activity-date">${formatDate(activity.date)}</p>
            </div>
        `;
    }

    // Inicializar la vista
    updateGalleryView();
    modal.style.display = 'block';

    // Event listeners
    search.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filteredActivities = activities.filter(activity => 
            activity.name.toLowerCase().includes(searchTerm)
        );
        if (filteredActivities.length > 0) {
            currentIndex = 0;
            updateGalleryView();
        }
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + filteredActivities.length) % filteredActivities.length;
        updateGalleryView();
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % filteredActivities.length;
        updateGalleryView();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        search.value = '';
        filteredActivities = [...activities];
    });

    // Navegación con teclado
    function galleryKeyHandler(e) {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
            document.removeEventListener('keydown', galleryKeyHandler);
        } else if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        }
    }

    document.addEventListener('keydown', galleryKeyHandler);
}

// Función para guardar datos del usuario
function setUserData(key, data) {
    try {
        // Si data ya es un string, no lo convertimos de nuevo
        const dataToStore = typeof data === 'string' ? data : JSON.stringify(data);
        localStorage.setItem(key, dataToStore);
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        return false;
    }
}

// Función para obtener datos del usuario
function getUserData(key) {
    try {
        const data = localStorage.getItem(key);
        return data;
    } catch (error) {
        console.error('Error al obtener datos:', error);
        return null;
    }
}



// Exponer estas funciones globalmente
window.setUserData = setUserData;
window.getUserData = getUserData;

function setupActivityCardListeners(card) {
    const attendanceBtn = card.querySelector('.attendance-btn');
    const deleteBtn = card.querySelector('.delete-activity-btn');
    const editTitleBtn = card.querySelector('.edit-title-btn');
    const editDateBtn = card.querySelector('.edit-date-btn');

    attendanceBtn?.addEventListener('click', () => {
        const activity = attendanceBtn.dataset.activity;
        const date = attendanceBtn.dataset.date;
        openAttendanceModal(activity, date);
    });

    deleteBtn?.addEventListener('click', () => {
        const activityId = deleteBtn.dataset.id;
        deleteActivity(activityId);
    });

    editTitleBtn?.addEventListener('click', () => makeEditable(card, 'title', 'text'));
    editDateBtn?.addEventListener('click', () => makeEditable(card, 'date', 'date'));
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    // Verificar si ya existe una notificación
    let notification = document.querySelector('.notification');
    
    // Si no existe, crearla
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Establecer el tipo y mensaje
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
    
    // Mostrar la notificación
    notification.classList.add('show');
    
    // Configurar el botón de cierre
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    }
    
    // Ocultar automáticamente después de 5 segundos
    setTimeout(() => {
        if (notification.classList.contains('show')) {
            notification.classList.remove('show');
        }
    }, 5000);
}

// Hacer accesible la función deleteActivityImage globalmente
window.editField = editField;
window.saveEdit = saveEdit;
window.deleteActivity = deleteActivity;
window.handleImage = handleImage;
window.addImage = addImage;
window.openGallery = openGallery;
window.openAttendanceModal = openAttendanceModal;

function openGallery(startingImageId = null) {
    const activities = JSON.parse(getUserData('activities') || '[]')
        .filter(activity => activity.imageData);
    
    if (activities.length === 0) {
        showNotification('No hay imágenes en la galería', 'info');
        return;
    }

    let currentIndex = startingImageId ? 
        activities.findIndex(a => a.id.toString() === startingImageId.toString()) : 0;
    
    if (currentIndex === -1) currentIndex = 0;

    // Usar el modal existente
    const modal = document.getElementById('gallery-modal');
    const container = modal.querySelector('.carousel-slide');
    const search = modal.querySelector('#gallery-search');
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');
    const closeBtn = modal.querySelector('.close-modal');
    let filteredActivities = [...activities];

    function updateGalleryView() {
        const activity = filteredActivities[currentIndex];
        container.innerHTML = `
            <img src="${activity.imageData}" alt="${activity.name}">
            <div class="image-info">
                <h4 class="activity-name">${activity.name}</h4>
                <p class="activity-date">${formatDate(activity.date)}</p>
            </div>
        `;
    }

    // Inicializar la vista
    updateGalleryView();
    modal.style.display = 'block';

    // Event listeners
    search.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filteredActivities = activities.filter(activity => 
            activity.name.toLowerCase().includes(searchTerm)
        );
        if (filteredActivities.length > 0) {
            currentIndex = 0;
            updateGalleryView();
        }
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + filteredActivities.length) % filteredActivities.length;
        updateGalleryView();
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % filteredActivities.length;
        updateGalleryView();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        search.value = '';
        filteredActivities = [...activities];
    });

    // Navegación con teclado
    function galleryKeyHandler(e) {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
            document.removeEventListener('keydown', galleryKeyHandler);
        } else if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        }
    }

    document.addEventListener('keydown', galleryKeyHandler);
}

// Función para guardar datos del usuario
function setUserData(key, data) {
    try {
        // Si data ya es un string, no lo convertimos de nuevo
        const dataToStore = typeof data === 'string' ? data : JSON.stringify(data);
        localStorage.setItem(key, dataToStore);
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        return false;
    }
}

// Función para obtener datos del usuario
function getUserData(key) {
    try {
        const data = localStorage.getItem(key);
        return data;
    } catch (error) {
        console.error('Error al obtener datos:', error);
        return null;
    }
}



// Exponer estas funciones globalmente
window.setUserData = setUserData;
window.getUserData = getUserData;

function setupActivityCardListeners(card) {
    const attendanceBtn = card.querySelector('.attendance-btn');
    const deleteBtn = card.querySelector('.delete-activity-btn');
    const editTitleBtn = card.querySelector('.edit-title-btn');
    const editDateBtn = card.querySelector('.edit-date-btn');

    attendanceBtn?.addEventListener('click', () => {
        const activity = attendanceBtn.dataset.activity;
        const date = attendanceBtn.dataset.date;
        openAttendanceModal(activity, date);
    });

    deleteBtn?.addEventListener('click', () => {
        const activityId = deleteBtn.dataset.id;
        deleteActivity(activityId);
    });

    editTitleBtn?.addEventListener('click', () => makeEditable(card, 'title', 'text'));
    editDateBtn?.addEventListener('click', () => makeEditable(card, 'date', 'date'));
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    // Verificar si ya existe una notificación
    let notification = document.querySelector('.notification');
    
    // Si no existe, crearla
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Establecer el tipo y mensaje
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
    
    // Mostrar la notificación
    notification.classList.add('show');
    
    // Configurar el botón de cierre
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    }
    
    // Ocultar automáticamente después de 5 segundos
    setTimeout(() => {
        if (notification.classList.contains('show')) {
            notification.classList.remove('show');
        }
    }, 5000);
}

// Hacer accesible la función deleteActivityImage globalmente
window.editField = editField;
window.saveEdit = saveEdit;
window.deleteActivity = deleteActivity;
window.handleImage = handleImage;
window.addImage = addImage;
window.openGallery = openGallery;
window.openAttendanceModal = openAttendanceModal;

function openGallery(startingImageId = null) {
    const activities = JSON.parse(getUserData('activities') || '[]')
        .filter(activity => activity.imageData);
    
    if (activities.length === 0) {
        showNotification('No hay imágenes en la galería', 'info');
        return;
    }

    let currentIndex = startingImageId ? 
        activities.findIndex(a => a.id.toString() === startingImageId.toString()) : 0;
    
    if (currentIndex === -1) currentIndex = 0;

    // Usar el modal existente
    const modal = document.getElementById('gallery-modal');
    const container = modal.querySelector('.carousel-slide');
    const search = modal.querySelector('#gallery-search');
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');
    const closeBtn = modal.querySelector('.close-modal');
    let filteredActivities = [...activities];

    function updateGalleryView() {
        const activity = filteredActivities[currentIndex];
        container.innerHTML = `
            <img src="${activity.imageData}" alt="${activity.name}">
            <div class="image-info">
                <h4 class="activity-name">${activity.name}</h4>
                <p class="activity-date">${formatDate(activity.date)}</p>
            </div>
        `;
    }

    // Inicializar la vista
    updateGalleryView();
    modal.style.display = 'block';

    // Event listeners
    search.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filteredActivities = activities.filter(activity => 
            activity.name.toLowerCase().includes(searchTerm)
        );
        if (filteredActivities.length > 0) {
            currentIndex = 0;
            updateGalleryView();
        }
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + filteredActivities.length) % filteredActivities.length;
        updateGalleryView();
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % filteredActivities.length;
        updateGalleryView();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        search.value = '';
        filteredActivities = [...activities];
    });

    // Navegación con teclado
    function galleryKeyHandler(e) {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
            document.removeEventListener('keydown', galleryKeyHandler);
        } else if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        }
    }

    document.addEventListener('keydown', galleryKeyHandler);
}
