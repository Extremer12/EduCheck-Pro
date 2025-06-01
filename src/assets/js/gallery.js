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
    
    // Cargar datos de la galería
    loadGalleryData();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Configurar vista por defecto
    setViewMode('grid');
    
    // Cargar imágenes
    displayGalleryImages();
    
    console.log('✅ Galería inicializada correctamente');
}

// Función para cargar datos de la galería
function loadGalleryData() {
    try {
        // Cargar actividades desde localStorage
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        
        // Convertir actividades a formato de galería
        galleryImages = activities
            .filter(activity => activity.image) // Solo actividades con imagen
            .map((activity, index) => ({
                id: activity.id || `activity-${index}`,
                src: activity.image,
                title: activity.name || 'Actividad sin nombre',
                date: activity.date || new Date().toISOString().split('T')[0],
                participants: activity.participants || 0,
                type: activity.type || 'general',
                favorite: activity.favorite || false,
                timestamp: new Date(activity.date || Date.now()).getTime()
            }));
        
        console.log(`📊 Cargadas ${galleryImages.length} imágenes de la galería`);
        
        // Actualizar estadísticas
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
    
    // Actualizar elementos del DOM
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
    
    if (minYear === maxYear) {
        return minYear.toString();
    } else {
        return `${minYear} - ${maxYear}`;
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('gallery-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Filtros
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });
    
    // Controles de vista
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', handleViewChange);
    });
    
    // Presentación de diapositivas
    const slideshowBtn = document.getElementById('startSlideshow');
    if (slideshowBtn) {
        slideshowBtn.addEventListener('click', startSlideshow);
    }
    
    // Modal de imagen
    setupImageModal();
    
    // Modal de presentación
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
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    currentFilter = event.target.dataset.filter;
    applyCurrentFilter();
}

// Función para aplicar filtro actual
function applyCurrentFilter() {
    let filteredImages = [...galleryImages];
    
    switch (currentFilter) {
        case 'recent':
            // Últimas 30 días
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
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const newView = event.target.dataset.view;
    setViewMode(newView);
}

// Función para establecer modo de vista
function setViewMode(view) {
    currentView = view;
    const galleryGrid = document.getElementById('gallery-grid');
    
    if (galleryGrid) {
        // Remover clases existentes
        galleryGrid.classList.remove('list-view', 'masonry-view');
        
        // Agregar nueva clase
        if (view === 'list') {
            galleryGrid.classList.add('list-view');
        } else if (view === 'masonry') {
            galleryGrid.classList.add('masonry-view');
        }
    }
    
    // Actualizar la vista
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
        if (emptyGallery) {
            emptyGallery.style.display = 'block';
        }
        return;
    }
    
    galleryGrid.style.display = 'grid';
    if (emptyGallery) {
        emptyGallery.style.display = 'none';
    }
    
    galleryGrid.innerHTML = '';
    
    images.forEach((image, index) => {
        const galleryItem = createGalleryItem(image, index);
        galleryGrid.appendChild(galleryItem);
    });
}

// Función para crear elemento de galería
function createGalleryItem(image, index) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.index = index;
    
    const formattedDate = formatDate(image.date);
    
    item.innerHTML = `
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
                        onclick="toggleFavorite('${image.id}')" title="Marcar como favorita">
                    <i class="fa${image.favorite ? 's' : 'r'} fa-heart"></i>
                </button>
                <button class="action-btn download-btn" 
                        onclick="downloadImage('${image.src}', '${image.title}')" title="Descargar">
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
    `;
    
    // Agregar evento de clic para abrir modal
    item.addEventListener('click', () => openImageModal(index));
    
    return item;
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
    event.stopPropagation();
    
    const imageIndex = galleryImages.findIndex(img => img.id === imageId);
    if (imageIndex !== -1) {
        galleryImages[imageIndex].favorite = !galleryImages[imageIndex].favorite;
        
        // Actualizar en localStorage
        updateActivityFavoriteStatus(imageId, galleryImages[imageIndex].favorite);
        
        // Recargar vista si está en filtro de favoritos
        if (currentFilter === 'favorites') {
            applyCurrentFilter();
        } else {
            // Solo actualizar el botón
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
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        const activityIndex = activities.findIndex(activity => activity.id === imageId);
        
        if (activityIndex !== -1) {
            activities[activityIndex].favorite = isFavorite;
            localStorage.setItem('activities', JSON.stringify(activities));
        }
    } catch (error) {
        console.error('Error actualizando favorito:', error);
    }
}

// Función para descargar imagen
function downloadImage(src, title) {
    event.stopPropagation();
    
    const link = document.createElement('a');
    link.href = src;
    link.download = `${title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('📥 Imagen descargada');
}

// Configurar modal de imagen
function setupImageModal() {
    const modal = document.getElementById('image-modal');
    const closeBtn = document.getElementById('close-modal');
    const prevBtn = document.getElementById('prev-image');
    const nextBtn = document.getElementById('next-image');
    const toggleFavoriteBtn = document.getElementById('toggle-favorite');
    const downloadBtn = document.getElementById('download-image');
    
    // Cerrar modal
    if (closeBtn) {
        closeBtn.addEventListener('click', closeImageModal);
    }
    
    // Navegación
    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateImage(-1));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateImage(1));
    }
    
    // Cerrar al hacer clic en overlay
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeImageModal();
            }
        });
    }
    
    // Configurar controles de zoom
    setupZoomControls();
    
    // Configurar tabs
    setupModalTabs();
}

// Función para abrir modal de imagen
function openImageModal(index) {
    currentImageIndex = index;
    const modal = document.getElementById('image-modal');
    
    if (modal && galleryImages[index]) {
        updateModalContent(galleryImages[index]);
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Generar miniaturas
        generateThumbnails();
    }
}

// Función para actualizar contenido del modal
function updateModalContent(image) {
    // Actualizar imagen principal
    const modalImage = document.getElementById('modal-image');
    if (modalImage) {
        modalImage.src = image.src;
        modalImage.alt = image.title;
    }
    
    // Actualizar título y fecha
    updateElement('modal-activity-name', image.title);
    updateElement('modal-activity-date', formatDate(image.date));
    
    // Actualizar información
    updateElement('info-activity', image.title);
    updateElement('info-date', formatDate(image.date));
    updateElement('info-participants', `${image.participants} participantes`);
    
    // Actualizar botón de favorito
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
        
        // Actualizar evento
        favoriteBtn.onclick = () => toggleFavoriteInModal();
    }
    
    // Actualizar botón de descarga
    const downloadBtn = document.getElementById('download-image');
    if (downloadBtn) {
        downloadBtn.onclick = () => downloadImage(image.src, image.title);
    }
    
    // Resetear zoom
    zoomLevel = 1;
    if (modalImage) {
        modalImage.style.transform = `scale(${zoomLevel})`;
    }
}

// Función para cerrar modal de imagen
function closeImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Función para navegar entre imágenes
function navigateImage(direction) {
    const newIndex = currentImageIndex + direction;
    
    if (newIndex >= 0 && newIndex < galleryImages.length) {
        currentImageIndex = newIndex;
        updateModalContent(galleryImages[currentImageIndex]);
        updateThumbnailSelection();
    }
}

// Función para alternar favorito en modal
function toggleFavoriteInModal() {
    const image = galleryImages[currentImageIndex];
    if (image) {
        toggleFavorite(image.id);
        updateModalContent(image);
    }
}

// Configurar controles de zoom
function setupZoomControls() {
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomResetBtn = document.getElementById('zoom-reset');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => zoom(0.2));
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => zoom(-0.2));
    }
    
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', resetZoom);
    }
    
    // Zoom con rueda del mouse
    const modalImage = document.getElementById('modal-image');
    if (modalImage) {
        modalImage.addEventListener('wheel', handleWheelZoom);
    }
}

// Función de zoom
function zoom(delta) {
    zoomLevel = Math.max(0.5, Math.min(3, zoomLevel + delta));
    const modalImage = document.getElementById('modal-image');
    if (modalImage) {
        modalImage.style.transform = `scale(${zoomLevel})`;
    }
}

// Función para resetear zoom
function resetZoom() {
    zoomLevel = 1;
    const modalImage = document.getElementById('modal-image');
    if (modalImage) {
        modalImage.style.transform = `scale(${zoomLevel})`;
    }
}

// Manejar zoom con rueda del mouse
function handleWheelZoom(event) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    zoom(delta);
}

// Configurar tabs del modal
function setupModalTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.target.dataset.tab;
            switchTab(targetTab);
        });
    });
}

// Función para cambiar tab
function switchTab(targetTab) {
    // Actualizar botones
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === targetTab);
    });
    
    // Actualizar paneles
    const tabPanels = document.querySelectorAll('.tab-panel');
    tabPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === `${targetTab}-panel`);
    });
}

// Generar miniaturas
function generateThumbnails() {
    const container = document.getElementById('thumbnails-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    galleryImages.forEach((image, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = `thumbnail ${index === currentImageIndex ? 'active' : ''}`;
        thumbnail.innerHTML = `<img src="${image.src}" alt="${image.title}">`;
        thumbnail.addEventListener('click', () => {
            currentImageIndex = index;
            updateModalContent(galleryImages[index]);
            updateThumbnailSelection();
        });
        container.appendChild(thumbnail);
    });
}

// Actualizar selección de miniaturas
function updateThumbnailSelection() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentImageIndex);
    });
}

// Configurar modal de presentación
function setupSlideshowModal() {
    const pauseBtn = document.getElementById('pause-slideshow');
    const stopBtn = document.getElementById('stop-slideshow');
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', toggleSlideshow);
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', stopSlideshow);
    }
}

// Iniciar presentación
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
        
        // Iniciar intervalo
        slideshowInterval = setInterval(() => {
            nextSlideshowImage();
        }, 5000); // 5 segundos por imagen
    }
}

// Actualizar contenido de presentación
function updateSlideshowContent() {
    const image = galleryImages[currentImageIndex];
    if (!image) return;
    
    // Actualizar imagen
    const slideshowImg = document.getElementById('slideshow-img');
    if (slideshowImg) {
        slideshowImg.src = image.src;
        slideshowImg.alt = image.title;
    }
    
    // Actualizar información
    updateElement('slideshow-activity', image.title);
    updateElement('slideshow-date', formatDate(image.date));
    updateElement('slideshow-progress', `${currentImageIndex + 1} de ${galleryImages.length}`);
    
    // Actualizar barra de progreso
    const progressFill = document.getElementById('slideshow-progress-fill');
    if (progressFill) {
        const progress = ((currentImageIndex + 1) / galleryImages.length) * 100;
        progressFill.style.width = `${progress}%`;
    }
}

// Siguiente imagen en presentación
function nextSlideshowImage() {
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    updateSlideshowContent();
}

// Alternar pausa en presentación
function toggleSlideshow() {
    const pauseBtn = document.getElementById('pause-slideshow');
    const icon = pauseBtn.querySelector('i');
    
    if (isSlideshow) {
        clearInterval(slideshowInterval);
        isSlideshow = false;
        icon.className = 'fas fa-play';
        pauseBtn.title = 'Reanudar';
    } else {
        slideshowInterval = setInterval(() => {
            nextSlideshowImage();
        }, 5000);
        isSlideshow = true;
        icon.className = 'fas fa-pause';
        pauseBtn.title = 'Pausar';
    }
}

// Detener presentación
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

// Manejar eventos de teclado
function handleKeyboardEvents(event) {
    // Solo en modales
    const imageModal = document.getElementById('image-modal');
    const slideshowModal = document.getElementById('slideshow-modal');
    
    if (imageModal && imageModal.style.display === 'flex') {
        switch (event.key) {
            case 'Escape':
                closeImageModal();
                break;
            case 'ArrowLeft':
                navigateImage(-1);
                break;
            case 'ArrowRight':
                navigateImage(1);
                break;
            case '+':
            case '=':
                zoom(0.2);
                break;
            case '-':
                zoom(-0.2);
                break;
            case '0':
                resetZoom();
                break;
        }
    }
    
    if (slideshowModal && slideshowModal.style.display === 'flex') {
        switch (event.key) {
            case 'Escape':
                stopSlideshow();
                break;
            case ' ':
                event.preventDefault();
                toggleSlideshow();
                break;
        }
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
        <button class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
        notification.classList.add('show');
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
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Función global para cargar galería (llamada desde HTML)
window.loadGallery = function() {
    loadGalleryData();
    displayGalleryImages();
};

// Exportar funciones necesarias
window.toggleFavorite = toggleFavorite;
window.downloadImage = downloadImage;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.startSlideshow = startSlideshow;
window.stopSlideshow = stopSlideshow;

console.log('📸 Gallery.js cargado correctamente');