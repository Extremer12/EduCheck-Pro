/**
 * EduCheck Pro - Sistema de Galería ACTUALIZADO
 * Compatible con header unificado y app.js
 */

// ===== VARIABLES GLOBALES (SIN CAMBIOS) =====
let galleryImages = [];
let currentImageIndex = 0;
let currentView = 'grid';
let currentFilter = 'all';
let slideshowInterval = null;
let isSlideshow = false;
let zoomLevel = 1;
let currentUser = null;

// ===== INICIALIZACIÓN ACTUALIZADA =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🖼️ Inicializando galería con header unificado...');
    
    // Esperar a que app.js configure Firebase y el menú
    const waitForApp = setInterval(() => {
        if (window.auth && typeof window.setupMenuToggle === 'function') {
            clearInterval(waitForApp);
            console.log('🔗 Gallery.js - App.js detectado, configurando listener...');
            
            // Configurar listener de autenticación
            window.auth.onAuthStateChanged((user) => {
                if (user) {
                    currentUser = user;
                    console.log(`👤 Gallery - Usuario autenticado: ${user.email}`);
                    
                    // Esperar un poco para que app.js termine de configurar el header
                    setTimeout(() => {
                        initializeGallery();
                    }, 1000);
                    
                } else {
                    console.log('❌ Gallery - Usuario no autenticado, redirigiendo...');
                    window.location.href = 'login.html';
                }
            });
        }
    }, 100);
    
    // Timeout de seguridad
    setTimeout(() => {
        clearInterval(waitForApp);
        if (!window.auth) {
            console.error('❌ Gallery.js - App.js no se cargó correctamente');
        }
    }, 10000);
});

// ===== FUNCIÓN PRINCIPAL DE INICIALIZACIÓN (SIMPLIFICADA) =====
function initializeGallery() {
    console.log('🎯 Inicializando sistema completo de galería...');
    
    try {
        // YA NO NECESITAMOS initializeFirebase() porque app.js lo maneja
        
        // Cargar datos
        loadGalleryData();
        
        // Configurar interfaz
        setupEventListeners();
        setViewMode('grid');
        displayGalleryImages();
        
        // YA NO NECESITAMOS initializeDarkMode() porque app.js lo maneja
        
        console.log('✅ Sistema de galería inicializado correctamente con header unificado');
        
    } catch (error) {
        console.error('❌ Error inicializando galería:', error);
        showNotification('Error al cargar la galería', 'error');
    }
}

// ===== FUNCIÓN PARA CARGAR DATOS (ACTUALIZADA) =====
function loadGalleryData() {
    try {
        if (!currentUser) {
            console.log('❌ Usuario no autenticado');
            galleryImages = [];
            return;
        }
        
        // Cargar actividades usando el patrón UID unificado
        const savedActivities = localStorage.getItem(`${currentUser.uid}_activities`);
        const activities = savedActivities ? JSON.parse(savedActivities) : [];
        
        // Filtrar solo actividades del usuario actual con imagen
        const userActivities = activities.filter(activity => 
            activity.createdBy === currentUser.uid && activity.imageData
        );
        
        // Convertir actividades a formato de galería
        galleryImages = userActivities.map((activity, index) => ({
            id: activity.id || `activity-${index}`,
            src: activity.imageData,
            title: activity.name || 'Actividad sin nombre',
            date: activity.date || new Date().toISOString().split('T')[0],
            participants: activity.participants?.length || 0,
            type: 'actividad',
            favorite: activity.favorite || false,
            timestamp: new Date(activity.date || Date.now()).getTime(),
            createdBy: activity.createdBy
        }));
        
        console.log(`📊 Cargadas ${galleryImages.length} imágenes de galería para usuario ${currentUser.uid}`);
        updateGalleryStats();
        
    } catch (error) {
        console.error('❌ Error cargando datos de galería:', error);
        galleryImages = [];
    }
}

// ===== ELIMINAR FUNCIONES DUPLICADAS =====
// Ya no necesitamos:
// - initializeFirebase() (app.js lo maneja)
// - initializeDarkMode() (app.js lo maneja)
// - updateUserInfo() (app.js lo maneja)

// ===== FUNCIÓN showNotification ACTUALIZADA =====
function showNotification(message, type = 'info') {
    // Usar la función global de app.js si existe
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback mejorado si no existe
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    const notification = document.createElement('div');
    notification.className = `gallery-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
        <button class="close-notification" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Estilos inline mejorados
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--edu-bg-primary, white);
        color: var(--edu-text-primary, #2C3E50);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        box-shadow: var(--edu-shadow-lg, 0 4px 15px rgba(0,0,0,0.1));
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 3000;
        max-width: 350px;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        border-left: 4px solid var(--edu-primary, #FFB6C1);
        font-family: 'Quicksand', sans-serif;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// ===== FUNCIÓN PARA ACTUALIZAR FAVORITOS (ACTUALIZADA) =====
function updateActivityFavoriteStatus(imageId, isFavorite) {
    try {
        if (!currentUser) return;
        
        const savedActivities = localStorage.getItem(`${currentUser.uid}_activities`);
        const activities = savedActivities ? JSON.parse(savedActivities) : [];
        const activityIndex = activities.findIndex(activity => 
            activity.id === imageId && activity.createdBy === currentUser.uid
        );
        
        if (activityIndex !== -1) {
            activities[activityIndex].favorite = isFavorite;
            localStorage.setItem(`${currentUser.uid}_activities`, JSON.stringify(activities));
            console.log(`📌 Favorito actualizado para actividad ${imageId}: ${isFavorite}`);
        }
    } catch (error) {
        console.error('❌ Error actualizando favorito:', error);
    }
}

// ===== RESTO DE FUNCIONES SIN CAMBIOS =====
function updateGalleryStats() {
    const totalImages = galleryImages.length;
    const totalActivities = new Set(galleryImages.map(img => img.title)).size;
    const dateRange = getDateRange();
    
    updateElement('total-images', totalImages);
    updateElement('total-activities', totalActivities);
    updateElement('date-range', dateRange);
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function getDateRange() {
    if (galleryImages.length === 0) return '2024';
    
    const dates = galleryImages.map(img => new Date(img.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    const minYear = minDate.getFullYear();
    const maxYear = maxDate.getFullYear();
    
    return minYear === maxYear ? minYear.toString() : `${minYear} - ${maxYear}`;
}

function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('gallery-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });
    
    // Controles de vista
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', handleViewChange);
    });
    
    // Presentación
    const slideshowBtn = document.getElementById('startSlideshow');
    if (slideshowBtn) {
        slideshowBtn.addEventListener('click', startSlideshow);
    }
    
    setupImageModal();
    setupSlideshowModal();
    
    // Eventos de teclado
    document.addEventListener('keydown', handleKeyboardEvents);
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredImages = galleryImages.filter(img => 
        img.title.toLowerCase().includes(searchTerm) ||
        img.date.includes(searchTerm)
    );
    displayFilteredImages(filteredImages);
}

function handleFilter(event) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    currentFilter = event.target.dataset.filter;
    applyCurrentFilter();
}

function applyCurrentFilter() {
    let filteredImages = [...galleryImages];
    
    switch (currentFilter) {
        case 'recent':
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            filteredImages = galleryImages.filter(img => img.timestamp > thirtyDaysAgo);
            break;
        case 'favorites':
            filteredImages = galleryImages.filter(img => img.favorite);
            break;
        case 'all':
        default:
            filteredImages = galleryImages;
            break;
    }
    
    displayFilteredImages(filteredImages);
}

function handleViewChange(event) {
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    setViewMode(event.target.dataset.view);
}

function setViewMode(view) {
    currentView = view;
    const galleryGrid = document.getElementById('gallery-grid');
    
    if (galleryGrid) {
        galleryGrid.classList.remove('list-view', 'masonry-view');
        
        if (view === 'list') {
            galleryGrid.classList.add('list-view');
        } else if (view === 'masonry') {
            galleryGrid.classList.add('masonry-view');
        }
    }
    
    displayGalleryImages();
}

function displayGalleryImages() {
    applyCurrentFilter();
}

function displayFilteredImages(images) {
    const galleryGrid = document.getElementById('gallery-grid');
    const emptyGallery = document.getElementById('empty-gallery');
    
    if (!galleryGrid) return;
    
    if (images.length === 0) {
        galleryGrid.style.display = 'none';
        if (emptyGallery) emptyGallery.style.display = 'block';
        return;
    }
    
    galleryGrid.style.display = 'grid';
    if (emptyGallery) emptyGallery.style.display = 'none';
    
    galleryGrid.innerHTML = images.map((image, index) => createGalleryItem(image, index)).join('');
}

function createGalleryItem(image, index) {
    const formattedDate = formatDate(image.date);
    
    return `
        <div class="gallery-item" data-index="${index}" onclick="openImageModal(${index})">
            <div class="image-wrapper">
                <img src="${image.src}" alt="${image.title}" loading="lazy">
                <div class="image-overlay">
                    <div class="overlay-content">
                        <h4>${image.title}</h4>
                        <p>${formattedDate}</p>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="action-btn favorite-btn ${image.favorite ? 'active' : ''}" 
                            onclick="event.stopPropagation(); toggleFavorite('${image.id}')" title="Marcar como favorita">
                        <i class="fa${image.favorite ? 's' : 'r'} fa-heart"></i>
                    </button>
                    <button class="action-btn download-btn" 
                            onclick="event.stopPropagation(); downloadImage('${image.src}', '${image.title}')" title="Descargar">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
            ${currentView !== 'masonry' ? `
                <div class="item-info">
                    <h4>${image.title}</h4>
                    <p>${formattedDate}</p>
                </div>
            ` : ''}
        </div>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function toggleFavorite(imageId) {
    const imageIndex = galleryImages.findIndex(img => img.id === imageId);
    if (imageIndex !== -1) {
        galleryImages[imageIndex].favorite = !galleryImages[imageIndex].favorite;
        
        updateActivityFavoriteStatus(imageId, galleryImages[imageIndex].favorite);
        
        if (currentFilter === 'favorites') {
            applyCurrentFilter();
        } else {
            const favoriteBtn = event.target.closest('.favorite-btn');
            const icon = favoriteBtn.querySelector('i');
            
            if (galleryImages[imageIndex].favorite) {
                favoriteBtn.classList.add('active');
                icon.className = 'fas fa-heart';
            } else {
                favoriteBtn.classList.remove('active');
                icon.className = 'far fa-heart';
            }
        }
        
        showNotification(
            galleryImages[imageIndex].favorite ? 
            '❤️ Agregado a favoritos' : 
            '💔 Removido de favoritos'
        );
    }
}

function downloadImage(src, title) {
    const link = document.createElement('a');
    link.href = src;
    link.download = `${title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('📥 Imagen descargada');
}

// ===== RESTO DE FUNCIONES DE MODAL, SLIDESHOW, ETC. SIN CAMBIOS =====
// [Todas las funciones de modal, slideshow, zoom, etc. se mantienen igual]

function setupImageModal() {
    const modal = document.getElementById('image-modal');
    const closeBtn = document.getElementById('close-modal');
    const prevBtn = document.getElementById('prev-image');
    const nextBtn = document.getElementById('next-image');
    
    if (closeBtn) closeBtn.addEventListener('click', closeImageModal);
    if (prevBtn) prevBtn.addEventListener('click', () => navigateImage(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateImage(1));
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeImageModal();
        });
    }
    
    setupZoomControls();
    setupModalTabs();
}

function openImageModal(index) {
    currentImageIndex = index;
    const modal = document.getElementById('image-modal');
    
    if (modal && galleryImages[index]) {
        updateModalContent(galleryImages[index]);
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        generateThumbnails();
    }
}

function updateModalContent(image) {
    const modalImage = document.getElementById('modal-image');
    if (modalImage) {
        modalImage.src = image.src;
        modalImage.alt = image.title;
    }
    
    updateElement('modal-activity-name', image.title);
    updateElement('modal-activity-date', formatDate(image.date));
    updateElement('info-activity', image.title);
    updateElement('info-date', formatDate(image.date));
    updateElement('info-participants', `${image.participants} participantes`);
    
    const favoriteBtn = document.getElementById('toggle-favorite');
    if (favoriteBtn) {
        const icon = favoriteBtn.querySelector('i');
        if (image.favorite) {
            favoriteBtn.classList.add('active');
            icon.className = 'fas fa-heart';
        } else {
            favoriteBtn.classList.remove('active');
            icon.className = 'far fa-heart';
        }
        
        favoriteBtn.onclick = () => toggleFavoriteInModal();
    }
    
    const downloadBtn = document.getElementById('download-image');
    if (downloadBtn) {
        downloadBtn.onclick = () => downloadImage(image.src, image.title);
    }
    
    resetZoom();
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function navigateImage(direction) {
    const newIndex = currentImageIndex + direction;
    
    if (newIndex >= 0 && newIndex < galleryImages.length) {
        currentImageIndex = newIndex;
        updateModalContent(galleryImages[currentImageIndex]);
        updateThumbnailSelection();
    }
}

function toggleFavoriteInModal() {
    const image = galleryImages[currentImageIndex];
    if (image) {
        toggleFavorite(image.id);
        updateModalContent(image);
    }
}

function setupZoomControls() {
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomResetBtn = document.getElementById('zoom-reset');
    
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => zoom(0.2));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => zoom(-0.2));
    if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetZoom);
    
    const modalImage = document.getElementById('modal-image');
    if (modalImage) {
        modalImage.addEventListener('wheel', handleWheelZoom);
    }
}

function zoom(delta) {
    zoomLevel = Math.max(0.5, Math.min(3, zoomLevel + delta));
    const modalImage = document.getElementById('modal-image');
    if (modalImage) {
        modalImage.style.transform = `scale(${zoomLevel})`;
    }
}

function resetZoom() {
    zoomLevel = 1;
    const modalImage = document.getElementById('modal-image');
    if (modalImage) {
        modalImage.style.transform = `scale(${zoomLevel})`;
    }
}

function handleWheelZoom(event) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    zoom(delta);
}

function setupModalTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.target.dataset.tab;
            switchTab(targetTab);
        });
    });
}

function switchTab(targetTab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === targetTab);
    });
    
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `${targetTab}-panel`);
    });
}

function generateThumbnails() {
    const container = document.getElementById('thumbnails-container');
    if (!container) return;
    
    container.innerHTML = galleryImages.map((image, index) => 
        `<div class="thumbnail ${index === currentImageIndex ? 'active' : ''}" onclick="selectThumbnail(${index})">
            <img src="${image.src}" alt="${image.title}">
        </div>`
    ).join('');
}

function selectThumbnail(index) {
    currentImageIndex = index;
    updateModalContent(galleryImages[index]);
    updateThumbnailSelection();
}

function updateThumbnailSelection() {
    document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentImageIndex);
    });
}

function setupSlideshowModal() {
    const pauseBtn = document.getElementById('pause-slideshow');
    const stopBtn = document.getElementById('stop-slideshow');
    
    if (pauseBtn) pauseBtn.addEventListener('click', toggleSlideshow);
    if (stopBtn) stopBtn.addEventListener('click', stopSlideshow);
}

function startSlideshow() {
    if (galleryImages.length === 0) {
        showNotification('❌ No hay imágenes para mostrar');
        return;
    }
    
    const modal = document.getElementById('slideshow-modal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        currentImageIndex = 0;
        isSlideshow = true;
        updateSlideshowContent();
        
        slideshowInterval = setInterval(nextSlideshowImage, 5000);
    }
}

function updateSlideshowContent() {
    const image = galleryImages[currentImageIndex];
    if (!image) return;
    
    const slideshowImg = document.getElementById('slideshow-img');
    if (slideshowImg) {
        slideshowImg.src = image.src;
        slideshowImg.alt = image.title;
    }
    
    updateElement('slideshow-activity', image.title);
    updateElement('slideshow-date', formatDate(image.date));
    updateElement('slideshow-progress', `${currentImageIndex + 1} de ${galleryImages.length}`);
    
    const progressFill = document.getElementById('slideshow-progress-fill');
    if (progressFill) {
        const progress = ((currentImageIndex + 1) / galleryImages.length) * 100;
        progressFill.style.width = `${progress}%`;
    }
}

function nextSlideshowImage() {
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    updateSlideshowContent();
}

function toggleSlideshow() {
    const pauseBtn = document.getElementById('pause-slideshow');
    const icon = pauseBtn.querySelector('i');
    
    if (isSlideshow) {
        clearInterval(slideshowInterval);
        isSlideshow = false;
        icon.className = 'fas fa-play';
        pauseBtn.title = 'Reanudar';
    } else {
        slideshowInterval = setInterval(nextSlideshowImage, 5000);
        isSlideshow = true;
        icon.className = 'fas fa-pause';
        pauseBtn.title = 'Pausar';
    }
}

function stopSlideshow() {
    clearInterval(slideshowInterval);
    isSlideshow = false;
    
    const modal = document.getElementById('slideshow-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function handleKeyboardEvents(event) {
    const imageModal = document.getElementById('image-modal');
    const slideshowModal = document.getElementById('slideshow-modal');
    
    if (imageModal && imageModal.style.display === 'flex') {
        switch (event.key) {
            case 'Escape': closeImageModal(); break;
            case 'ArrowLeft': navigateImage(-1); break;
            case 'ArrowRight': navigateImage(1); break;
            case '+': case '=': zoom(0.2); break;
            case '-': zoom(-0.2); break;
            case '0': resetZoom(); break;
        }
    }
    
    if (slideshowModal && slideshowModal.style.display === 'flex') {
        switch (event.key) {
            case 'Escape': stopSlideshow(); break;
            case ' ': 
                event.preventDefault();
                toggleSlideshow(); 
                break;
        }
    }
}

// ===== FUNCIONES GLOBALES =====
window.loadGallery = function() {
    loadGalleryData();
    displayGalleryImages();
};

window.toggleFavorite = toggleFavorite;
window.downloadImage = downloadImage;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.startSlideshow = startSlideshow;
window.stopSlideshow = stopSlideshow;
window.selectThumbnail = selectThumbnail;

console.log('✅ gallery.js actualizado para header unificado');