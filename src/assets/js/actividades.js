/**
 * EduCheck Pro - Sistema de Actividades v2.2 COMPLETO
 * Con funcionalidad de crear actividades e imágenes
 */

// ===== VARIABLES GLOBALES =====
let currentUser = null;
let activitiesData = [];
let filteredActivities = [];
let currentView = 'feed';
let currentEditingActivity = null;
let imageFile = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Inicializando sistema de actividades...');
    
    // Esperar a Firebase con múltiples métodos
    const waitForFirebase = () => {
        // Método 1: Evento personalizado
        const handleFirebaseReady = () => {
            console.log('📅 Firebase ready event recibido');
            clearTimeout(timeoutId);
            window.removeEventListener('firebaseReady', handleFirebaseReady);
            initializeActivitiesSystem();
        };
        
        // Método 2: Polling cada 100ms
        const checkFirebase = setInterval(() => {
            if (window.auth && window.db && window.storage) {
                clearInterval(checkFirebase);
                clearTimeout(timeoutId);
                window.removeEventListener('firebaseReady', handleFirebaseReady);
                console.log('📅 Firebase detectado por polling');
                initializeActivitiesSystem();
            }
        }, 100);
        
        // Método 3: Timeout de seguridad
        const timeoutId = setTimeout(() => {
            clearInterval(checkFirebase);
            window.removeEventListener('firebaseReady', handleFirebaseReady);
            
            if (window.auth && window.db) {
                console.warn('⚠️ Firebase parcialmente disponible, continuando sin Storage');
                initializeActivitiesSystem();
            } else {
                console.error('❌ Firebase no se inicializó correctamente');
                showNotificationFallback('Error: Firebase no disponible', 'error');
            }
        }, 12000); // Aumentado a 12 segundos
        
        // Escuchar evento
        window.addEventListener('firebaseReady', handleFirebaseReady);
        
        // Si Firebase ya está disponible
        if (window.firebaseInitialized && window.auth && window.db) {
            handleFirebaseReady();
        }
    };
    
    waitForFirebase();
});

// ===== FUNCIÓN PRINCIPAL DE INICIALIZACIÓN =====
function initializeActivitiesSystem() {
    console.log('🎯 Inicializando sistema completo de actividades...');
    
    try {
        // Verificar Storage primero
        if (!checkFirebaseStorage()) {
            return;
        }
        
        setupAuthListener();
        initializeDOMElements();
        setupEventListeners();
        setupModalEventListeners();
        console.log('✅ Sistema de actividades inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando actividades:', error);
        showNotification('Error al inicializar el sistema de actividades', 'error');
    }
}

// ===== VERIFICAR STORAGE MEJORADO Y SIN CORS =====
function checkFirebaseStorage() {
    console.log('🔍 Verificando Firebase Storage...');
    
    // Verificaciones básicas primero
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK no disponible');
        return false;
    }
    
    if (!firebase.apps || firebase.apps.length === 0) {
        console.error('❌ Firebase app no inicializada');
        return false;
    }
    
    if (typeof firebase.storage !== 'function') {
        console.error('❌ Firebase Storage no disponible');
        return false;
    }
    
    // Inicializar storage si no existe
    if (!window.storage) {
        try {
            window.storage = firebase.storage();
            console.log('✅ Storage inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Storage:', error);
            return false;
        }
    }
    
    // ⭐ NO HACER TEST DE CONEXIÓN QUE CAUSA CORS
    console.log('✅ Storage disponible - Test CORS omitido');
    return true;
}

// ===== CONFIGURACIÓN DE AUTENTICACIÓN =====
function setupAuthListener() {
    if (window.auth) {
        window.auth.onAuthStateChanged(user => {
            currentUser = user;
            if (user) {
                console.log('👤 Usuario autenticado:', user.email);
                loadActivitiesData();
                loadCoursesForSelect();
            } else {
                console.log('👤 Usuario no autenticado');
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
        'activitiesFeed',
        'emptyFeed',
        'activityModal',
        'activityForm'
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
    
    // Búsqueda de actividades
    const searchInput = document.getElementById('activitiesSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Filtros de fecha
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', handleDateFilter);
    }
    
    // Filtros de curso
    const courseFilter = document.getElementById('courseFilter');
    if (courseFilter) {
        courseFilter.addEventListener('change', handleCourseFilter);
    }
    
    // Botón limpiar filtros
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllFilters);
    }
    
    // Botón nueva actividad
    const newActivityBtn = document.getElementById('newActivityBtn');
    if (newActivityBtn) {
        newActivityBtn.addEventListener('click', () => openNewActivityModal());
    }
    
    // Botón crear primera actividad (estado vacío)
    const createFirstActivity = document.getElementById('createFirstActivity');
    if (createFirstActivity) {
        createFirstActivity.addEventListener('click', () => openNewActivityModal());
    }
    
    console.log('✅ Event listeners configurados');
}

// ===== CONFIGURACIÓN DE EVENTOS DEL MODAL =====
function setupModalEventListeners() {
    // Cerrar modales al hacer clic en el overlay o botón cerrar
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') || e.target.classList.contains('close-modal')) {
            closeAllModals();
        }
    });
    
    // Cerrar modales con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Formulario de nueva actividad
    const activityForm = document.getElementById('activityForm');
    if (activityForm) {
        // Remover listeners anteriores
        activityForm.removeEventListener('submit', handleActivitySubmit);
        // Agregar nuevo listener
        activityForm.addEventListener('submit', handleActivitySubmit);
    }
    
    // Botón cancelar
    const cancelBtn = document.getElementById('cancelActivity');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
        });
    }
    
    // Input de imagen
    const imageInput = document.getElementById('activityImage');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageSelection);
    }
    
    // Botón remover imagen
    const removeImageBtn = document.getElementById('removeImage');
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', removeSelectedImage);
    }
    
    console.log('✅ Event listeners del modal configurados');
}

// ===== CARGAR CURSOS PARA EL SELECT =====
function loadCoursesForSelect() {
    const courseSelect = document.getElementById('activityCourse');
    if (!courseSelect) return;

    const savedCourses = getUserData('courses');
    const courses = savedCourses ? JSON.parse(savedCourses) : [];
    
    courseSelect.innerHTML = '<option value="">Seleccionar curso</option>';
    
    courses.forEach(course => {
        if (course.createdBy === currentUser?.uid) {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            courseSelect.appendChild(option);
        }
    });
}

// ===== ABRIR MODAL NUEVA ACTIVIDAD =====
function openNewActivityModal() {
    console.log('➕ Abriendo modal nueva actividad');
    
    currentEditingActivity = null;
    imageFile = null;
    
    // Limpiar formulario
    const form = document.getElementById('activityForm');
    if (form) {
        form.reset();
    }
    
    // Actualizar título del modal
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.innerHTML = `
            <i class="fas fa-calendar-plus"></i>
            Nueva Actividad
        `;
    }
    
    // Ocultar preview de imagen
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.style.display = 'none';
    }
    
    // Establecer fecha actual
    const dateInput = document.getElementById('activityDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Mostrar modal
    const modal = document.getElementById('activityModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Focus en el primer input
        setTimeout(() => {
            const titleInput = document.getElementById('activityTitle');
            if (titleInput) titleInput.focus();
        }, 100);
    }
}

// ===== MANEJAR SELECCIÓN DE IMAGEN MEJORADA =====
function handleImageSelection(e) {
    const file = e.target.files[0];
    
    if (!file) {
        imageFile = null;
        return;
    }
    
    // Validaciones mejoradas
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Solo se permiten archivos JPG, PNG o WebP', 'error');
        e.target.value = '';
        return;
    }
    
    // Tamaño máximo 2MB para evitar problemas
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification('La imagen no debe superar los 2MB', 'error');
        e.target.value = '';
        return;
    }
    
    imageFile = file;
    
    // Mostrar preview
    showImagePreview(file);
    
    console.log('✅ Archivo válido seleccionado:', {
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
        type: file.type
    });
}

function showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.style.display = 'block';
            imagePreview.innerHTML = `
                <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <p style="margin: 0.5rem 0; font-size: 14px; color: #666;">${file.name}</p>
                    <button type="button" onclick="removeSelectedImage()" style="background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-times"></i> Remover imagen
                    </button>
                </div>
            `;
        }
    };
    reader.readAsDataURL(file);
}

function removeSelectedImage() {
    imageFile = null;
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    
    if (imageInput) imageInput.value = '';
    if (imagePreview) {
        imagePreview.style.display = 'none';
        imagePreview.innerHTML = '';
    }
    
    console.log('🗑️ Imagen removida');
}

// ===== SUBIR IMAGEN CORREGIDA PARA EVITAR CORS =====
async function uploadImage(file, activityId) {
    if (!file) return null;

    try {
        console.log('📤 Iniciando subida de imagen:', file.name);

        // Verificar autenticación
        if (!window.auth?.currentUser) {
            throw new Error('Debes estar autenticado para subir imágenes');
        }

        // Verificar que Storage esté disponible
        if (!window.storage) {
            console.log('🔄 Inicializando Storage...');
            window.storage = firebase.storage();
        }

        // 🔧 CREAR NOMBRE DE ARCHIVO LIMPIO Y ÚNICO
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const cleanFileName = `img_${timestamp}_${randomString}.${fileExtension}`;

        console.log('🔧 Archivo limpio:', cleanFileName);

        // Crear referencia con path específico
        const storagePath = `activities/${activityId}/${cleanFileName}`;
        const storageRef = window.storage.ref(storagePath);

        // 🚀 SUBIR USANDO putString (MÉTODO ALTERNATIVO)
        return new Promise((resolve, reject) => {
            // Convertir archivo a base64
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const base64String = e.target.result.split(',')[1]; // Remover prefijo data:
                    
                    console.log('📤 Subiendo como base64...');
                    
                    // Subir como string base64
                    const uploadTask = storageRef.putString(base64String, 'base64', {
                        contentType: file.type,
                        customMetadata: {
                            originalName: file.name,
                            uploadedBy: window.auth.currentUser.email,
                            uploadedAt: new Date().toISOString()
                        }
                    });

                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            console.log(`📊 Progreso: ${progress.toFixed(1)}%`);
                            
                            // Actualizar barra de progreso si existe
                            const progressBar = document.querySelector('.upload-progress');
                            if (progressBar) {
                                progressBar.style.width = `${progress}%`;
                            }
                        },
                        (error) => {
                            console.error('❌ Error en subida:', error);
                            
                            // Si putString falla, intentar método directo
                            console.log('🔄 Intentando método directo...');
                            uploadDirectly(file, storageRef, resolve, reject);
                        },
                        async () => {
                            try {
                                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                                console.log('✅ Imagen subida exitosamente:', downloadURL);
                                
                                resolve({
                                    url: downloadURL,
                                    path: storagePath,
                                    name: cleanFileName,
                                    originalName: file.name,
                                    size: file.size,
                                    type: file.type
                                });
                            } catch (urlError) {
                                console.error('❌ Error obteniendo URL:', urlError);
                                reject(new Error('Error obteniendo URL de descarga'));
                            }
                        }
                    );

                } catch (error) {
                    console.error('❌ Error procesando base64:', error);
                    
                    // Fallback: intentar subida directa
                    uploadDirectly(file, storageRef, resolve, reject);
                }
            };
            
            reader.onerror = (error) => {
                console.error('❌ Error leyendo archivo:', error);
                reject(new Error('Error leyendo el archivo'));
            };
            
            reader.readAsDataURL(file);
        });

    } catch (error) {
        console.error('❌ Error en uploadImage:', error);
        throw new Error(`Error preparando subida: ${error.message}`);
    }
}

// ===== FUNCIÓN AUXILIAR PARA SUBIDA DIRECTA =====
function uploadDirectly(file, storageRef, resolve, reject) {
    console.log('📤 Intentando subida directa...');
    
    const uploadTask = storageRef.put(file);
    
    uploadTask.on('state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`📊 Progreso directo: ${progress.toFixed(1)}%`);
        },
        (error) => {
            console.error('❌ Error en subida directa:', error);
            
            // Último fallback: guardar en Firestore
            console.log('🔄 Último recurso: guardando en Firestore...');
            saveImageToFirestore(file, resolve, reject);
        },
        async () => {
            try {
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                console.log('✅ Subida directa exitosa:', downloadURL);
                
                resolve({
                    url: downloadURL,
                    name: file.name,
                    type: file.type,
                    method: 'direct'
                });
            } catch (error) {
                console.error('❌ Error obteniendo URL directa:', error);
                saveImageToFirestore(file, resolve, reject);
            }
        }
    );
}

// ===== FALLBACK: GUARDAR EN FIRESTORE =====
async function saveImageToFirestore(file, resolve, reject) {
    try {
        console.log('💾 Guardando imagen en Firestore como fallback...');
        
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const base64Data = e.target.result;
                
                // Comprimir si es muy grande
                let finalData = base64Data;
                if (file.size > 1024 * 1024) { // Si es mayor a 1MB
                    console.log('🗜️ Comprimiendo imagen...');
                    finalData = await compressImage(base64Data, 0.7);
                }
                
                const imageDoc = {
                    data: finalData,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    uploadedBy: window.auth.currentUser.email,
                    method: 'firestore-fallback'
                };
                
                const docRef = await window.db.collection('activity_images').add(imageDoc);
                
                console.log('✅ Imagen guardada en Firestore:', docRef.id);
                
                resolve({
                    url: finalData, // Base64 para mostrar
                    firestoreId: docRef.id,
                    name: file.name,
                    type: 'firestore',
                    method: 'firestore'
                });
                
            } catch (error) {
                console.error('❌ Error guardando en Firestore:', error);
                reject(new Error('Error guardando imagen: ' + error.message));
            }
        };
        
        reader.onerror = () => reject(new Error('Error leyendo archivo para Firestore'));
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('❌ Error en saveImageToFirestore:', error);
        reject(new Error('Error en método de respaldo: ' + error.message));
    }
}

// ===== FUNCIÓN AUXILIAR PARA COMPRIMIR IMÁGENES =====
function compressImage(base64, quality = 0.7) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Calcular nuevas dimensiones
            const maxWidth = 1200;
            const maxHeight = 1200;
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Dibujar imagen redimensionada
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir a base64 comprimido
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        
        img.src = base64;
    });
}

// ===== CARGA DE DATOS =====
function loadActivitiesData() {
    try {
        const savedActivities = getUserData('activities');
        activitiesData = savedActivities ? JSON.parse(savedActivities) : [];
        
        // Ordenar por fecha de creación (más recientes primero)
        activitiesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        filteredActivities = [];
        displayActivities();
        console.log(`📊 ${activitiesData.length} actividades cargadas`);
    } catch (error) {
        console.error('❌ Error cargando actividades:', error);
        activitiesData = [];
        displayActivities();
        showNotificationFallback('Error al cargar actividades', 'error');
    }
}

// ===== MOSTRAR ACTIVIDADES =====
function displayActivities() {
    const activitiesFeed = document.getElementById('activitiesFeed');
    const emptyFeed = document.getElementById('emptyFeed');
    
    if (!activitiesFeed || !emptyFeed) {
        console.error('❌ Elementos del feed no encontrados');
        return;
    }
    
    const activitiesToShow = filteredActivities.length > 0 ? filteredActivities : activitiesData;
    
    if (activitiesToShow.length === 0) {
        showEmptyState();
        return;
    }
    
    // Ocultar estado vacío
    emptyFeed.style.display = 'none';
    activitiesFeed.style.display = 'block';
    
    // Generar HTML de actividades
    activitiesFeed.innerHTML = activitiesToShow.map(activity => 
        createActivityPost(activity)
    ).join('');
    
    console.log(`📋 ${activitiesToShow.length} actividades mostradas`);
}

// ===== CREAR POST DE ACTIVIDAD =====
function createActivityPost(activity) {
    const formattedDate = formatDate(activity.date);
    const timeAgo = getTimeAgo(activity.createdAt);
    
    return `
        <div class="activity-post" data-activity-id="${activity.id}">
            <div class="post-header">
                <div class="post-info">
                    <div class="post-avatar">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="post-details">
                        <h4>${activity.title || 'Actividad sin título'}</h4>
                        <div class="post-meta">
                            <span class="post-date">
                                <i class="fas fa-clock"></i>
                                ${formattedDate} • ${timeAgo}
                            </span>
                            ${activity.courseName ? `
                                <span class="post-course">
                                    <i class="fas fa-chalkboard-teacher"></i>
                                    ${activity.courseName}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="post-actions-header">
                    <button class="post-action-btn" onclick="editActivity('${activity.id}')" title="Editar actividad">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="post-action-btn" onclick="deleteActivity('${activity.id}')" title="Eliminar actividad">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            ${activity.image ? `
                <div class="post-image">
                    <img src="${activity.image}" alt="${activity.title}" loading="lazy">
                    <div class="image-overlay">
                        <button class="view-full-btn" onclick="viewFullImage('${activity.image}')">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
            ` : ''}
            
            <div class="post-content">
                ${activity.description ? `
                    <p class="post-description">${activity.description}</p>
                ` : ''}
                
                ${activity.location ? `
                    <div class="post-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${activity.location}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="post-actions">
                <div class="post-stats">
                    <span class="post-stat">
                        <i class="fas fa-calendar"></i>
                        ${formatDate(activity.date)}
                    </span>
                </div>
                <div class="post-interaction-btns">
                    <button class="interaction-btn" onclick="toggleLike('${activity.id}')">
                        <i class="fas fa-heart"></i>
                        <span>Me gusta</span>
                    </button>
                    <button class="interaction-btn" onclick="shareActivity('${activity.id}')">
                        <i class="fas fa-share"></i>
                        <span>Compartir</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===== CERRAR MODALES =====
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    
    // Limpiar datos del formulario
    currentEditingActivity = null;
    imageFile = null;
}

// ===== ESTADO VACÍO =====
function showEmptyState() {
    const activitiesFeed = document.getElementById('activitiesFeed');
    const emptyFeed = document.getElementById('emptyFeed');
    
    if (activitiesFeed) activitiesFeed.style.display = 'none';
    if (emptyFeed) emptyFeed.style.display = 'block';
}

// ===== FUNCIÓN MANEJAR ENVÍO DEL FORMULARIO =====
async function handleActivitySubmit(e) {
    e.preventDefault();
    
    console.log('📝 Procesando formulario de actividad...');
    
    try {
        // Obtener datos del formulario
        const formData = new FormData(e.target);
        const activityData = {
            title: formData.get('title'),
            description: formData.get('description'),
            course: formData.get('course'),
            date: formData.get('date'),
            location: formData.get('location'),
            createdBy: currentUser.uid,
            createdAt: new Date(),
            id: currentEditingActivity ? currentEditingActivity.id : generateUniqueId('activity')
        };
        
        // Validar datos requeridos
        if (!activityData.title || !activityData.description) {
            showNotificationFallback('Por favor completa todos los campos requeridos', 'warning');
            return;
        }
        
        // Mostrar estado de carga
        const submitBtn = document.getElementById('saveActivity');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }
        
        // Subir imagen si existe
        if (imageFile) {
            console.log('📤 Subiendo imagen...');
            showNotificationFallback('Subiendo imagen...', 'info');
            
            try {
                const imageResult = await uploadImage(imageFile, activityData.id);
                if (imageResult && imageResult.url) {
                    activityData.imageUrl = imageResult.url;
                    activityData.imagePath = imageResult.path || imageResult.name;
                    activityData.imageType = imageResult.type || 'uploaded';
                    console.log('✅ Imagen subida exitosamente');
                }
            } catch (imageError) {
                console.error('⚠️ Error subiendo imagen:', imageError);
                showNotificationFallback('Error subiendo imagen, pero se guardará la actividad', 'warning');
            }
        }
        
        // Guardar actividad
        if (currentEditingActivity) {
            await updateActivity(activityData);
            showNotificationFallback('Actividad actualizada correctamente', 'success');
        } else {
            await createActivity(activityData);
            showNotificationFallback('Actividad creada correctamente', 'success');
        }
        
        // Limpiar formulario y cerrar modal
        resetActivityForm();
        closeAllModals();
        
        // Recargar actividades
        loadActivitiesData();
        
        console.log('✅ Actividad procesada correctamente');
        
    } catch (error) {
        console.error('❌ Error procesando actividad:', error);
        showNotificationFallback('Error al guardar la actividad: ' + error.message, 'error');
    } finally {
        // Restaurar botón
        const submitBtn = document.getElementById('saveActivity');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Actividad';
        }
    }
}

// ===== CREAR NUEVA ACTIVIDAD =====
async function createActivity(activityData) {
    console.log('➕ Creando nueva actividad...');
    
    try {
        // Agregar a la lista local
        activitiesData.unshift(activityData);
        
        // Guardar en localStorage
        setUserData('recent_activities', JSON.stringify(activitiesData));
        
        // Sincronizar con Firebase si está disponible
        if (window.db && currentUser) {
            try {
                await window.db.collection('users')
                    .doc(currentUser.uid)
                    .collection('activities')
                    .doc(activityData.id)
                    .set(activityData);
                
                console.log('✅ Actividad sincronizada con Firebase');
            } catch (firebaseError) {
                console.warn('⚠️ Error sincronizando con Firebase:', firebaseError);
                // No es crítico, ya está guardado localmente
            }
        }
        
        console.log('✅ Actividad creada correctamente');
        
    } catch (error) {
        console.error('❌ Error creando actividad:', error);
        throw error;
    }
}

// ===== ACTUALIZAR ACTIVIDAD EXISTENTE =====
async function updateActivity(activityData) {
    console.log('✏️ Actualizando actividad...');
    
    try {
        // Encontrar y actualizar en la lista local
        const index = activitiesData.findIndex(a => a.id === activityData.id);
        if (index !== -1) {
            activitiesData[index] = { ...activitiesData[index], ...activityData };
        }
        
        // Guardar en localStorage
        setUserData('recent_activities', JSON.stringify(activitiesData));
        
        // Sincronizar con Firebase si está disponible
        if (window.db && currentUser) {
            try {
                await window.db.collection('users')
                    .doc(currentUser.uid)
                    .collection('activities')
                    .doc(activityData.id)
                    .update(activityData);
                
                console.log('✅ Actividad actualizada en Firebase');
            } catch (firebaseError) {
                console.warn('⚠️ Error actualizando en Firebase:', firebaseError);
            }
        }
        
        console.log('✅ Actividad actualizada correctamente');
        
    } catch (error) {
        console.error('❌ Error actualizando actividad:', error);
        throw error;
    }
}

// ===== RESETEAR FORMULARIO =====
function resetActivityForm() {
    const form = document.getElementById('activityForm');
    if (form) {
        form.reset();
    }
    
    // Limpiar imagen
    imageFile = null;
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.style.display = 'none';
        imagePreview.innerHTML = '';
    }
    
    // Limpiar input de imagen
    const imageInput = document.getElementById('activityImage');
    if (imageInput) {
        imageInput.value = '';
    }
    
    // Resetear variables
    currentEditingActivity = null;
    
    console.log('🧹 Formulario reseteado');
}

// ===== FUNCIONES AUXILIARES =====
function getUserData(key) {
    if (!currentUser) return null;
    return localStorage.getItem(`${currentUser.uid}_${key}`);
}

function setUserData(key, value) {
    if (!currentUser) return false;
    localStorage.setItem(`${currentUser.uid}_${key}`, value);
    return true;
}

function generateUniqueId(prefix = 'item') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}

function getTimeAgo(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Hace 1 día';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
        return `Hace ${Math.ceil(diffDays / 30)} meses`;
    } catch (error) {
        return 'Hace un momento';
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

// ===== FUNCIÓN showNotification CORREGIDA (SIN RECURSIÓN) =====
function showNotificationFallback(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Crear o reutilizar notificación
    let notification = document.querySelector('.activities-notification');
    
    if (notification) {
        notification.remove();
    }
    
    notification = document.createElement('div');
    notification.className = 'activities-notification';
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        color: #2C3E50;
        border-radius: 12px;
        padding: 1rem 1.5rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 3000;
        max-width: 350px;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        border-left: 4px solid #FFB6C1;
        font-family: 'Quicksand', sans-serif;
        font-weight: 500;
    `;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icons[type] || icons.info}" style="margin-right: 0.5rem; color: #FFB6C1;"></i>
            <span>${message}</span>
        </div>
        <button class="close-notification" style="background: none; border: none; color: #7F8C8D; cursor: pointer; padding: 0.25rem;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Configurar cierre
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.onclick = () => {
            notification.style.transform = 'translateX(120%)';
            setTimeout(() => notification.remove(), 300);
        };
    }
    
    // Auto-ocultar
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(120%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

// ===== MANEJADORES DE EVENTOS =====
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (!query) {
        filteredActivities = [];
    } else {
        filteredActivities = activitiesData.filter(activity => 
            activity.title.toLowerCase().includes(query) ||
            (activity.description && activity.description.toLowerCase().includes(query)) ||
            (activity.courseName && activity.courseName.toLowerCase().includes(query))
        );
    }
    
    displayActivities();
}

function handleDateFilter(e) {
    const filterValue = e.target.value;
    
    if (!filterValue) {
        filteredActivities = [];
    } else {
        const now = new Date();
        let startDate;
        
        switch (filterValue) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                filteredActivities = [];
                displayActivities();
                return;
        }
        
        filteredActivities = activitiesData.filter(activity => {
            const activityDate = new Date(activity.date);
            return activityDate >= startDate;
        });
    }
    
    displayActivities();
}

function handleCourseFilter(e) {
    const courseId = e.target.value;
    
    if (!courseId) {
        filteredActivities = [];
    } else {
        filteredActivities = activitiesData.filter(activity => 
            activity.course === courseId
        );
    }
    
    displayActivities();
}

function clearAllFilters() {
    filteredActivities = [];
    
    // Limpiar inputs de filtros
    const searchInput = document.getElementById('activitiesSearch');
    if (searchInput) searchInput.value = '';
    
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) dateFilter.value = '';
    
    const courseFilter = document.getElementById('courseFilter');
    if (courseFilter) courseFilter.value = '';
    
    displayActivities();
}

// ===== FUNCIONES GLOBALES =====
window.editActivity = function(activityId) {
    console.log('✏️ Editar actividad:', activityId);
    
    const activity = activitiesData.find(a => a.id === activityId);
    if (!activity) {
        showNotificationFallback('Actividad no encontrada', 'error');
        return;
    }
    
    currentEditingActivity = activity;
    
    // Llenar el formulario con los datos de la actividad
    const form = document.getElementById('activityForm');
    if (form) {
        document.getElementById('activityTitle').value = activity.title || '';
        document.getElementById('activityDescription').value = activity.description || '';
        document.getElementById('activityDate').value = activity.date || '';
        document.getElementById('activityCourse').value = activity.course || '';
        document.getElementById('activityLocation').value = activity.location || '';
    }
    
    // Actualizar título del modal
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.innerHTML = `
            <i class="fas fa-edit"></i>
            Editar Actividad
        `;
    }
    
    // Mostrar imagen si existe
    if (activity.image) {
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        
        if (imagePreview && previewImg) {
            previewImg.src = activity.image;
            imagePreview.style.display = 'block';
        }
    }
    
    // Mostrar modal
    const modal = document.getElementById('activityModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
};

window.deleteActivity = function(activityId) {
    console.log('🗑️ Eliminar actividad:', activityId);
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
        return;
    }
    
    try {
        // Eliminar de la lista local
        activitiesData = activitiesData.filter(a => a.id !== activityId);
        
        // Guardar en localStorage
        setUserData('activities', JSON.stringify(activitiesData));
        
        // Eliminar de Firebase si está disponible
        if (window.db) {
            window.db.collection('activities').doc(activityId).delete()
                .then(() => console.log('✅ Actividad eliminada de Firebase'))
                .catch(error => console.warn('⚠️ Error eliminando de Firebase:', error));
        }
        
        // Actualizar vista
        displayActivities();
        showNotificationFallback('Actividad eliminada correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error eliminando actividad:', error);
        showNotificationFallback('Error al eliminar la actividad', 'error');
    }
};

window.toggleLike = function(activityId) {
    console.log('❤️ Toggle like:', activityId);
    showNotificationFallback('Función de likes en desarrollo', 'info');
};

window.shareActivity = function(activityId) {
    console.log('📤 Compartir actividad:', activityId);
    
    if (navigator.share) {
        const activity = activitiesData.find(a => a.id === activityId);
        if (activity) {
            navigator.share({
                title: activity.title,
                text: activity.description,
                url: window.location.href
            }).catch(console.error);
        }
    } else {
        showNotificationFallback('Función de compartir no disponible en este navegador', 'info');
    }
};

window.viewFullImage = function(imageSrc) {
    console.log('🖼️ Ver imagen completa:', imageSrc);
    
    // Crear modal simple para ver imagen completa
    const imageModal = document.createElement('div');
    imageModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4000;
        cursor: pointer;
    `;
    
    imageModal.innerHTML = `
        <img src="${imageSrc}" style="max-width: 90%; max-height: 90%; object-fit: contain;" alt="Imagen completa">
    `;
    
    imageModal.onclick = () => imageModal.remove();
    document.body.appendChild(imageModal);
};

window.openNewActivityModal = openNewActivityModal;

// ===== FUNCIÓN DE DIAGNÓSTICO SIN CORS =====
window.diagnoseStorage = function() {
    console.log('🔍 ===== DIAGNÓSTICO DE STORAGE SIN CORS =====');
    
    console.log('📦 Firebase SDK:', typeof firebase !== 'undefined');
    console.log('📱 Firebase Apps:', firebase?.apps?.length || 0);
    console.log('💾 Storage function:', typeof firebase?.storage === 'function');
    console.log('🔗 Storage instance:', !!window.storage);
    console.log('👤 Usuario autenticado:', !!window.auth?.currentUser);
    console.log('📧 Email usuario:', window.auth?.currentUser?.email || 'No disponible');
    
    if (window.storage) {
        try {
            const testRef = window.storage.ref('test/dummy.txt');
            console.log('✅ Storage ref creado correctamente:', testRef.name);
        } catch (error) {
            console.error('❌ Error creando referencia:', error);
        }
    }
    
    console.log('🔍 ===== FIN DIAGNÓSTICO =====');
};

console.log('✅ actividades.js v2.3 cargado con correcciones de Storage');