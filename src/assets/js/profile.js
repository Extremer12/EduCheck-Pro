/**
 * EduCheck Pro - Sistema de Gestión de Perfil ACTUALIZADO
 * Compatible con header unificado
 */

// ===== ELIMINAR FUNCIONES DE MENÚ DUPLICADAS =====
// Ya no necesitamos las funciones de menú porque app.js las maneja

// ===== FUNCIONES AUXILIARES (SIN CAMBIOS) =====
function getUserData(key) {
    const user = window.auth?.currentUser;
    if (!user) return null;
    return localStorage.getItem(`${user.uid}_${key}`);
}

function setUserData(key, value) {
    const user = window.auth?.currentUser;
    if (!user) return false;
    localStorage.setItem(`${user.uid}_${key}`, value);
    return true;
}

function showNotification(message, type = 'success') {
    // Usar la función global de app.js si existe
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback si no existe
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'info' ? '#17a2b8' : '#28a745'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 10000;
        animation: slideInNotification 0.3s ease;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        font-family: 'Quicksand', sans-serif;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutNotification 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== FUNCIONES DE PERFIL (ACTUALIZADAS PARA NUEVO HEADER) =====
function loadProfilePhoto() {
    const user = window.auth?.currentUser;
    if (!user) return;
    
    const savedPhoto = localStorage.getItem(`${user.uid}_profilePhoto`);
    if (savedPhoto) {
        // Actualizar tanto el header unificado como el perfil específico
        const profileImgs = [
            document.getElementById('userAvatar'),          // Header unificado
            document.getElementById('menuUserAvatar'),      // Menú unificado
            document.getElementById('profileAvatar')        // Perfil específico
        ];
        
        profileImgs.forEach(img => {
            if (img) img.src = savedPhoto;
        });
    }
}

function setupPhotoUpload() {
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const photoInput = document.getElementById('photoInput');
    
    if (!changePhotoBtn || !photoInput) return;
    
    changePhotoBtn.addEventListener('click', function(e) {
        e.preventDefault();
        photoInput.click();
    });
    
    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            showNotification('Por favor selecciona una imagen válida', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showNotification('La imagen debe ser menor a 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            
            // Actualizar TODAS las imágenes (header unificado + perfil)
            const profileImgs = [
                document.getElementById('userAvatar'),          // Header unificado
                document.getElementById('menuUserAvatar'),      // Menú unificado
                document.getElementById('profileAvatar')        // Perfil específico
            ];
            
            profileImgs.forEach(img => {
                if (img) img.src = imageData;
            });
            
            // Guardar en localStorage
            const user = window.auth?.currentUser;
            if (user) {
                localStorage.setItem(`${user.uid}_profilePhoto`, imageData);
                showNotification('Foto de perfil actualizada correctamente');
            }
        };
        
        reader.readAsDataURL(file);
    });
}

function setupEditNameFunction() {
    const editNameBtn = document.getElementById('editNameBtn');
    const profileNameDisplay = document.getElementById('profileNameDisplay');
    
    if (!editNameBtn || !profileNameDisplay) return;
    
    editNameBtn.addEventListener('click', function() {
        const currentName = profileNameDisplay.textContent;
        const newName = prompt('Ingresa tu nuevo nombre:', currentName);
        
        if (newName && newName.trim() !== '' && newName !== currentName) {
            // Actualizar en Firebase Auth
            const user = window.auth?.currentUser;
            if (user) {
                user.updateProfile({
                    displayName: newName.trim()
                }).then(() => {
                    // Actualizar TODOS los elementos de nombre (header unificado + perfil)
                    const teacherNameElements = [
                        document.getElementById('teacherName'),         // Header unificado
                        document.getElementById('menuTeacherName'),     // Menú unificado
                        document.getElementById('profileNameDisplay')   // Perfil específico
                    ];
                    
                    teacherNameElements.forEach(element => {
                        if (element) {
                            element.textContent = newName.trim();
                        }
                    });
                    
                    showNotification('Nombre actualizado correctamente');
                }).catch((error) => {
                    console.error('Error al actualizar nombre:', error);
                    showNotification('Error al actualizar el nombre', 'error');
                });
            }
        }
    });
}

// ===== FUNCIÓN PRINCIPAL DE INICIALIZACIÓN (ACTUALIZADA) =====
function initializeProfile() {
    console.log('🚀 Profile.js - Inicializando perfil con header unificado...');
    
    const user = window.auth?.currentUser;
    if (!user) {
        console.log('❌ Usuario no autenticado');
        return;
    }
    
    // Actualizar nombre del docente en TODOS los elementos
    const displayName = user.displayName || user.email.split('@')[0];
    
    const teacherNameElements = [
        document.getElementById('teacherName'),         // Header unificado
        document.getElementById('menuTeacherName'),     // Menú unificado
        document.getElementById('profileNameDisplay')   // Perfil específico
    ];
    
    teacherNameElements.forEach(element => {
        if (element) {
            element.textContent = displayName;
        }
    });
    
    // Actualizar fecha de registro
    const joinDateElement = document.getElementById('joinDate');
    if (joinDateElement && user.metadata?.creationTime) {
        const joinDate = new Date(user.metadata.creationTime).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long'
        });
        joinDateElement.textContent = joinDate;
    }
    
    // Cargar foto de perfil
    loadProfilePhoto();
    
    // YA NO NECESITAMOS initializeDarkMode() porque app.js lo maneja
    
    // YA NO NECESITAMOS initializeMenuToggle() porque app.js lo maneja
    
    // Configurar subida de fotos
    setupPhotoUpload();
    
    // Configurar edición de nombre
    setupEditNameFunction();
    
    // Cargar estadísticas
    updateProfileStatistics();
    
    // Inicializar logros
    initializeAchievements();
    
    // Configurar botón de estadísticas
    const viewStatsBtn = document.getElementById('viewStatsBtn');
    if (viewStatsBtn) {
        viewStatsBtn.addEventListener('click', function() {
            showNotification('Página de estadísticas en desarrollo', 'info');
        });
    }
    
    // YA NO NECESITAMOS configurar estadísticas link ni logout porque app.js lo maneja
    
    console.log('✅ Profile.js - Perfil inicializado correctamente con header unificado');
}

// ===== RESTO DE FUNCIONES SIN CAMBIOS =====
function updateProfileStatistics() {
    const user = window.auth?.currentUser;
    if (!user) return;
    
    // Obtener datos del usuario
    const students = JSON.parse(getUserData('students') || '[]');
    const institutions = JSON.parse(getUserData('institutions') || '[]');
    
    // Calcular cursos totales
    let totalCourses = 0;
    institutions.forEach(institution => {
        if (institution.courses) {
            totalCourses += institution.courses.length;
        }
    });
    
    // Actualizar elementos de la UI
    const totalStudentsQuick = document.getElementById('totalStudentsQuick');
    const totalInstitutionsQuick = document.getElementById('totalInstitutionsQuick');
    const totalCoursesQuick = document.getElementById('totalCoursesQuick');
    
    if (totalStudentsQuick) {
        totalStudentsQuick.textContent = `${students.length} Estudiantes`;
    }
    
    if (totalInstitutionsQuick) {
        totalInstitutionsQuick.textContent = `${institutions.length} Instituciones`;
    }
    
    if (totalCoursesQuick) {
        totalCoursesQuick.textContent = `${totalCourses} Cursos`;
    }
}

function initializeAchievements() {
    const user = window.auth?.currentUser;
    if (!user) return;
    
    const students = JSON.parse(getUserData('students') || '[]');
    const activities = JSON.parse(getUserData('activities') || '[]');
    const institutions = JSON.parse(getUserData('institutions') || '[]');
    
    const achievements = [
        {
            id: 'first-activity',
            title: 'Primera Actividad',
            description: 'Registraste tu primera actividad',
            icon: 'fas fa-star',
            earned: activities.length > 0
        },
        {
            id: 'five-students',
            title: '5 Estudiantes',
            description: 'Tienes 5 estudiantes registrados',
            icon: 'fas fa-users',
            earned: students.length >= 5
        },
        {
            id: 'first-institution',
            title: 'Primera Institución',
            description: 'Creaste tu primera institución',
            icon: 'fas fa-university',
            earned: institutions.length > 0
        },
        {
            id: 'ten-activities',
            title: '10 Actividades',
            description: 'Has realizado 10 actividades',
            icon: 'fas fa-clipboard-check',
            earned: activities.length >= 10
        },
        {
            id: 'dedication',
            title: 'Dedicación Total',
            description: '25 actividades registradas',
            icon: 'fas fa-heart',
            earned: activities.length >= 25
        },
        {
            id: 'community-builder',
            title: 'Constructor de Comunidad',
            description: '15 estudiantes activos',
            icon: 'fas fa-hands-helping',
            earned: students.length >= 15
        }
    ];
    
    const earnedCount = achievements.filter(a => a.earned).length;
    
    // Actualizar progreso
    const progressElement = document.getElementById('achievementsProgress');
    const progressFill = document.getElementById('progressFill');
    
    if (progressElement) {
        progressElement.textContent = `${earnedCount} de ${achievements.length} logros obtenidos`;
    }
    
    if (progressFill) {
        const percentage = (earnedCount / achievements.length) * 100;
        progressFill.style.width = `${percentage}%`;
    }
    
    // Renderizar logros
    const achievementsGrid = document.getElementById('achievementsGrid');
    if (achievementsGrid) {
        achievementsGrid.innerHTML = achievements.map(achievement => `
            <div class="achievement-card ${achievement.earned ? 'earned' : ''}">
                <div class="achievement-icon">
                    <i class="${achievement.icon}"></i>
                </div>
                <h4>${achievement.title}</h4>
                <p>${achievement.description}</p>
            </div>
        `).join('');
    }
}

// ===== CONFIGURACIÓN FIREBASE Y AUTENTICACIÓN (SIMPLIFICADA) =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Profile.js - DOM cargado con header unificado');
    
    // Esperar a que app.js configure todo
    const waitForApp = setInterval(() => {
        if (window.auth && typeof window.setupMenuToggle === 'function') {
            clearInterval(waitForApp);
            console.log('🔗 Profile.js - App.js detectado, configurando listener...');
            
            // Configurar listener de autenticación
            window.auth.onAuthStateChanged((user) => {
                if (user) {
                    console.log(`👤 Profile.js - Usuario autenticado: ${user.email}`);
                    
                    // Esperar un poco más para que app.js termine de configurar el header
                    setTimeout(() => {
                        initializeProfile();
                    }, 1000);
                    
                } else {
                    console.log('❌ Profile.js - Usuario no autenticado, redirigiendo...');
                    window.location.href = 'login.html';
                }
            });
        }
    }, 100);
    
    // Timeout de seguridad
    setTimeout(() => {
        clearInterval(waitForApp);
        if (!window.auth) {
            console.error('❌ Profile.js - App.js no se cargó correctamente');
        }
    }, 10000);
});