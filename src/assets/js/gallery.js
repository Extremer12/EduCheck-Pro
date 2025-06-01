// Variables globales para la galería
let galleryImages = [];
let currentImageIndex = 0;
let currentView = 'grid';
let currentFilter = 'all';
let slideshowInterval = null;
let isSlideshow = false;
let zoomLevel = 1;

// Inicializar la galería cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('gallery.html')) {
        initializeGallery();
    }
});

// Función para inicializar la galería
function initializeGallery() {
    console.log('🖼️ Inicializando galería...');
    
    loadGalleryData();
    setupEventListeners();
    setViewMode('grid');
    displayGalleryImages();
    
    console.log('✅ Galería inicializada correctamente');
}

// Función para cargar datos de la galería
function loadGalleryData() {
    try {
        const user = window.auth?.currentUser;
        if (!user) {
            console.log('❌ Usuario no autenticado');
            return;
        }
        
        // Cargar actividades usando el patrón UID
        const savedActivities = localStorage.getItem(`${user.uid}_activities`);
        const activities = savedActivities ? JSON.parse(savedActivities) : [];
        
        // Convertir actividades a formato de galería
        galleryImages = activities
            .filter(activity => activity.imageData) // Solo actividades con imagen
            .map((activity, index) => ({
                id: activity.id || `activity-${index}`,
                src: activity.imageData,
                title: activity.name || 'Actividad sin nombre',
                date: activity.date || new Date().toISOString().split('T')[0],
                participants: 0, // Aquí podrías calcular desde asistencias
                type: 'actividad',
                favorite: activity.favorite || false,
                timestamp: new Date(activity.date || Date.now()).getTime()
            }));
        
        console.log(`📊 Cargadas ${galleryImages.length} imágenes de la galería`);
        updateGalleryStats();
        
    } catch (error) {
        console.error('❌ Error cargando datos de galería:', error);
        galleryImages = [];
    }
}

// Función para actualizar estadísticas de la galería
function updateGalleryStats() {
    const totalImages = galleryImages.length;
    const totalActivities = new Set(galleryImages.map(img => img.title)).size;
    const dateRange = getDateRange();
    
    updateElement('total-images', totalImages);
    updateElement('total-activities', totalActivities);
    updateElement('date-range', dateRange);
}

// Función auxiliar para actualizar elementos del DOM
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Función para obtener el rango de fechas
function getDateRange() {
    if (galleryImages.length === 0) return '2024';
    
    const dates = galleryImages.map(img => new Date(img.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    const minYear = minDate.getFullYear();
    const maxYear = maxDate.getFullYear();
    
    return minYear === maxYear ? minYear.toString() : `${minYear} - ${maxYear}`;
}

// Configurar event listeners
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

// Función para manejar la búsqueda
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredImages = galleryImages.filter(img => 
        img.title.toLowerCase().includes(searchTerm) ||
        img.date.includes(searchTerm)
    );
    displayFilteredImages(filteredImages);
}

// Función para manejar filtros
function handleFilter(event) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    currentFilter = event.target.dataset.filter;
    applyCurrentFilter();
}

// Función para aplicar filtro actual
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

// Función para manejar cambio de vista
function handleViewChange(event) {
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    setViewMode(event.target.dataset.view);
}

// Función para establecer modo de vista
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

// Función principal para mostrar imágenes
function displayGalleryImages() {
    applyCurrentFilter();
}

// Función para mostrar imágenes filtradas
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

// Función para crear elemento de galería
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

// Función para formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Función para alternar favorito
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

// Función para actualizar estado de favorito en actividades
function updateActivityFavoriteStatus(imageId, isFavorite) {
    try {
        const user = window.auth?.currentUser;
        if (!user) return;
        
        const savedActivities = localStorage.getItem(`${user.uid}_activities`);
        const activities = savedActivities ? JSON.parse(savedActivities) : [];
        const activityIndex = activities.findIndex(activity => activity.id === imageId);
        
        if (activityIndex !== -1) {
            activities[activityIndex].favorite = isFavorite;
            localStorage.setItem(`${user.uid}_activities`, JSON.stringify(activities));
        }
    } catch (error) {
        console.error('Error actualizando favorito:', error);
    }
}

// Función para descargar imagen
function downloadImage(src, title) {
    const link = document.createElement('a');
    link.href = src;
    link.download = `${title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('📥 Imagen descargada');
}

// === MODAL DE IMAGEN ===
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

// === ZOOM CONTROLS ===
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

// === MODAL TABS ===
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

// === THUMBNAILS ===
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

// === SLIDESHOW ===
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

// === KEYBOARD EVENTS ===
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

// === NOTIFICACIONES ===
function showNotification(message, type = 'info') {
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
    
    // Estilos inline
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #2C3E50;
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
        border-left: 4px solid var(--gallery-primary);
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
    }, 3000);
}

// === FUNCIONES GLOBALES ===
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

console.log('📸 Gallery.js optimizado cargado correctamente');