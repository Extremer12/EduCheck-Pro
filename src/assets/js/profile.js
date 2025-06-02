document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Profile.js - DOM cargado');
    
    // Esperar a que Firebase esté listo
    if (window.auth) {
        window.auth.onAuthStateChanged((user) => {
            if (user) {
                console.log(`👤 Usuario autenticado: ${user.uid} (${user.email})`);
                
                // Pequeño delay para asegurar que todo esté listo
                setTimeout(() => {
                    initializeProfile();
                    
                    // Inicializar establecimientos después de que el usuario esté autenticado
                    if (window.initializeEstablishments && window.location.pathname.includes('profile.html')) {
                        setTimeout(() => {
                            window.initializeEstablishments();
                        }, 500);
                    }
                }, 100);
                
            } else {
                console.log('❌ Usuario no autenticado, redirigiendo...');
                window.location.href = 'login.html';
            }
        });
    } else {
        console.error('❌ Firebase Auth no disponible');
    }
});

function initializeProfile() {
    const user = window.auth?.currentUser;
    if (!user) {
        console.log('❌ Usuario no autenticado en initializeProfile');
        return;
    }
    
    console.log(`🚀 Inicializando perfil para usuario: ${user.uid}`);
    
    const profileBtn = document.getElementById('profile');
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = document.getElementById('profile-modal');
            if (modal) {
                modal.style.display = 'block';
                updateProfileStats();
            }
        });
    }

    // Actualizar nombre del docente en el perfil
    const teacherNameElement = document.querySelector('.teacher-name');
    if (teacherNameElement) {
        teacherNameElement.textContent = user.displayName || user.email.split('@')[0];
    }
    
    // Cargar datos del perfil
    loadProfileData();
    
    // Inicializar modo oscuro
    initializeDarkMode();
    
    console.log(`✅ Perfil inicializado correctamente para: ${user.uid}`);
}

function updateProfileStats() {
    try {
        const students = JSON.parse(getUserData('students') || '[]');
        const activities = JSON.parse(getUserData('activities') || '[]');
        const attendance = JSON.parse(getUserData('attendance') || '[]');

        // Update total students
        const studentsElement = document.getElementById('profile-total-students');
        if (studentsElement) {
            studentsElement.textContent = students.length;
        }

        // Update total activities
        const activitiesElement = document.getElementById('profile-total-activities');
        if (activitiesElement) {
            activitiesElement.textContent = activities.length;
        }

        // Calculate attendance rate
        const attendanceElement = document.getElementById('profile-attendance-rate');
        if (attendanceElement) {
            if (attendance.length && students.length) {
                const totalAttendance = attendance.reduce((acc, curr) => {
                    if (!curr.attendanceData) return acc;
                    const presentCount = curr.attendanceData.filter(a => a?.attendance === 'present').length || 0;
                    return acc + (presentCount / (curr.attendanceData.length || 1));
                }, 0);
                const rate = Math.round((totalAttendance / (attendance.length || 1)) * 100);
                attendanceElement.textContent = `${rate}%`;
            } else {
                attendanceElement.textContent = '0%';
            }
        }
    } catch (error) {
        console.error('Error updating profile stats:', error);
    }
}

async function updateProfile(newDisplayName) {
    try {
        const user = window.auth.currentUser;
        if (user) {
            await updateProfile(user, {
                displayName: newDisplayName
            });
            
            // Actualizar todos los elementos que muestran el nombre
            const teacherNameElements = document.querySelectorAll('#teacher-name, .menu-header h3, .teacher-name');
            teacherNameElements.forEach(element => {
                if (element) {
                    element.textContent = newDisplayName;
                }
            });
            
            showNotification('Perfil actualizado correctamente');
        }
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        showNotification('Error al actualizar perfil', 'error');
    }
}

// Función para inicializar el modo oscuro
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // CORREGIDO: Usar datos específicos del usuario
    const user = window.auth?.currentUser;
    if (!user) {
        console.log('⚠️ Usuario no autenticado, no se puede cargar modo oscuro');
        return;
    }
    
    // Cargar preferencia guardada específica del usuario
    const savedDarkMode = localStorage.getItem(`${user.uid}_darkMode`) === 'true';
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    }
    
    // Event listener para el toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem(`${user.uid}_darkMode`, 'true');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem(`${user.uid}_darkMode`, 'false');
            }
        });
    }
    
    console.log(`✅ Modo oscuro inicializado para usuario: ${user.uid}`);
}

async function loadProfileData() {
    try {
        const user = window.auth?.currentUser;
        if (!user) {
            console.log('❌ Usuario no autenticado');
            return;
        }
        
        console.log(`📊 Cargando datos del perfil para usuario: ${user.uid}`);
        
        // Actualizar nombre del docente
        const teacherNameElement = document.getElementById('teacherName');
        if (teacherNameElement) {
            teacherNameElement.textContent = user.displayName || user.email.split('@')[0];
        }
        
        // Cargar foto de perfil
        loadProfilePhoto();
        
        // Configurar subida de fotos
        setupPhotoUpload();
        
        // Cargar estadísticas
        await updateProfileStatistics();
        
        // Cargar fecha de registro
        const joinDateElement = document.getElementById('joinDate');
        if (joinDateElement && user.metadata?.creationTime) {
            const joinDate = new Date(user.metadata.creationTime).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long'
            });
            joinDateElement.textContent = joinDate;
        }
        
        // Inicializar gráfico de distribución
        initializeActivityDistributionChart();
        
        // Inicializar sistema de logros
        initializeAchievements();
        
        // Inicializar botón volver arriba
        initializeBackToTop();
        
        console.log(`✅ Datos del perfil cargados correctamente para: ${user.uid}`);
        
    } catch (error) {
        console.error('❌ Error cargando datos del perfil:', error);
    }
}

// === CORREGIR FUNCIÓN DE ESTADÍSTICAS ===
async function updateProfileStatistics() {
    try {
        const user = window.auth?.currentUser;
        if (!user) {
            console.log('❌ Usuario no autenticado, no se pueden actualizar estadísticas');
            return;
        }
        
        console.log(`📊 Actualizando estadísticas del perfil para usuario: ${user.uid}`);
        
        // Obtener datos específicos del usuario
        const students = JSON.parse(getUserData('students') || '[]');
        const activities = JSON.parse(getUserData('activities') || '[]');
        const attendance = JSON.parse(getUserData('attendance') || '[]');
        
        console.log(`📊 Datos obtenidos para ${user.uid}:`, { 
            students: students.length, 
            activities: activities.length, 
            attendance: attendance.length 
        });
        
        // Actualizar estadísticas principales
        updateElement('totalStudents', students.length);
        updateElement('totalStudentsQuick', `${students.length} Alumnos`);
        updateElement('totalActivities', activities.length);
        updateElement('totalActivitiesQuick', `${activities.length} Actividades`);
        
        // Calcular tasa de asistencia
        const attendanceRate = calculateAttendanceRate(attendance, students.length);
        updateElement('attendanceRate', `${attendanceRate}%`);
        
        // Calcular tasa de finalización
        const completionRate = calculateCompletionRate(activities);
        updateElement('completionRate', `${completionRate}%`);
        
        // Actualizar cambios mensuales (simulados por ahora)
        updateElement('studentsChange', `+${Math.floor(students.length * 0.1)} este mes`);
        updateElement('activitiesChange', `+${Math.floor(activities.length * 0.15)} este mes`);
        updateElement('attendanceChange', `+${Math.floor(attendanceRate * 0.05)}% este mes`);
        updateElement('completionChange', `+${Math.floor(completionRate * 0.02)}% este mes`);
        
        console.log(`✅ Estadísticas actualizadas correctamente para: ${user.uid}`);
        
    } catch (error) {
        console.error('❌ Error actualizando estadísticas:', error);
    }
}

// === CORREGIR FUNCIÓN DE GRÁFICO DE DISTRIBUCIÓN ===
function initializeActivityDistributionChart() {
    const user = window.auth?.currentUser;
    if (!user) {
        console.log('❌ Usuario no autenticado, no se puede inicializar gráfico');
        return;
    }
    
    console.log(`📊 Inicializando gráfico de distribución para usuario: ${user.uid}`);
    
    const activities = JSON.parse(getUserData('activities') || '[]');
    console.log(`📊 Actividades encontradas para ${user.uid}:`, activities.length);
    
    // Contar tipos de actividades
    const activityTypes = {
        'biblicas': 0,
        'creatividad': 0,
        'juegos': 0,
        'musica': 0,
        'otros': 0
    };
    
    activities.forEach(activity => {
        const type = activity.type?.toLowerCase() || 'otros';
        if (activityTypes.hasOwnProperty(type)) {
            activityTypes[type]++;
        } else {
            activityTypes.otros++;
        }
    });
    
    console.log(`📊 Distribución de tipos para ${user.uid}:`, activityTypes);
    
    const total = Object.values(activityTypes).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
        console.log(`📊 No hay actividades para ${user.uid}, mostrando gráfico vacío`);
        updatePieChart({
            'Sin actividades': 100
        });
        return;
    }
    
    // Calcular porcentajes - solo incluir tipos que tienen actividades
    const percentages = {};
    Object.entries(activityTypes).forEach(([type, count]) => {
        if (count > 0) {
            percentages[type] = Math.round((count / total) * 100);
        }
    });
    
    console.log(`📊 Porcentajes calculados para ${user.uid}:`, percentages);
    updatePieChart(percentages);
}

// === CORREGIR FUNCIÓN DE LOGROS ===
function calculateAchievements() {
    const user = window.auth?.currentUser;
    if (!user) {
        console.log('❌ Usuario no autenticado, no se pueden calcular logros');
        return [];
    }
    
    console.log(`🏆 Calculando logros para usuario: ${user.uid}`);
    
    const students = JSON.parse(getUserData('students') || '[]');
    const activities = JSON.parse(getUserData('activities') || '[]');
    const attendance = JSON.parse(getUserData('attendance') || '[]');
    
    console.log(`🏆 Datos para logros de ${user.uid}:`, {
        students: students.length,
        activities: activities.length,
        attendance: attendance.length
    });
    
    const achievements = [
        {
            id: 'first-activity',
            title: 'Primera Actividad',
            description: 'Registraste tu primera actividad',
            icon: 'fas fa-star',
            earned: activities.length > 0,
            date: activities.length > 0 ? new Date(activities[0].date || Date.now()).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : null
        },
        {
            id: 'five-students',
            title: '5 Alumnos',
            description: 'Tienes 5 alumnos registrados',
            icon: 'fas fa-users',
            earned: students.length >= 5,
            date: students.length >= 5 ? new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : null
        },
        {
            id: 'ten-activities',
            title: '10 Actividades',
            description: 'Has realizado 10 actividades',
            icon: 'fas fa-clipboard-check',
            earned: activities.length >= 10,
            date: activities.length >= 10 ? new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : null
        },
        {
            id: 'attendance-master',
            title: 'Maestro de Asistencia',
            description: 'Registro perfecto de asistencia',
            icon: 'fas fa-calendar-check',
            earned: attendance.length >= 5,
            date: attendance.length >= 5 ? new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : null
        },
        {
            id: 'dedication',
            title: 'Dedicación Total',
            description: '25 actividades registradas',
            icon: 'fas fa-heart',
            earned: activities.length >= 25,
            date: activities.length >= 25 ? new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : null
        },
        {
            id: 'community-builder',
            title: 'Constructor de Comunidad',
            description: '15 alumnos activos',
            icon: 'fas fa-hands-helping',
            earned: students.length >= 15,
            date: students.length >= 15 ? new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : null
        }
    ];
    
    const earnedCount = achievements.filter(a => a.earned).length;
    console.log(`🏆 Logros ganados para ${user.uid}: ${earnedCount}/${achievements.length}`);
    
    return achievements;
}

// === AGREGAR FUNCIÓN PARA LIMPIAR DATOS AL CERRAR SESIÓN ===
function clearUserData() {
    const user = window.auth?.currentUser;
    if (!user) return;
    
    // Limpiar datos específicos del usuario al cerrar sesión
    const keysToRemove = [
        'students', 'activities', 'attendance', 'establishments',
        'profilePhoto', 'darkMode', 'defaultEstablishmentCreated'
    ];
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(`${user.uid}_${key}`);
    });
    
    console.log(`🧹 Datos limpiados para usuario: ${user.uid}`);
}

// === FUNCIÓN PARA DEBUGGING - Ver todos los datos del usuario ===
function debugUserData() {
    const user = window.auth?.currentUser;
    if (!user) {
        console.log('❌ Usuario no autenticado');
        return;
    }
    
    console.log(`🔍 DEBUGGING - Datos del usuario: ${user.uid}`);
    console.log('📧 Email:', user.email);
    console.log('👤 Display Name:', user.displayName);
    
    // Mostrar todos los datos guardados
    const userData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(user.uid + '_')) {
            const cleanKey = key.replace(user.uid + '_', '');
            userData[cleanKey] = localStorage.getItem(key);
        }
    }
    
    console.log('💾 Datos guardados:', userData);
    
    return userData;
}

// Exportar funciones para debugging
window.debugUserData = debugUserData;
window.clearUserData = clearUserData;
window.setUserData = setUserData;
window.removeUserData = removeUserData;

console.log('✅ Funciones auxiliares agregadas - datos por usuario separados correctamente');

// FUNCIÓN FALTANTE: updateProfileStatistics
async function updateProfileStatistics() {
    try {
        console.log('📊 Actualizando estadísticas del perfil...');
        
        // Obtener datos
        const students = JSON.parse(getUserData('students') || '[]');
        const activities = JSON.parse(getUserData('activities') || '[]');
        const attendance = JSON.parse(getUserData('attendance') || '[]');
        
        console.log('📊 Datos obtenidos:', { students: students.length, activities: activities.length, attendance: attendance.length });
        
        // Actualizar estadísticas principales
        updateElement('totalStudents', students.length);
        updateElement('totalStudentsQuick', `${students.length} Alumnos`);
        updateElement('totalActivities', activities.length);
        updateElement('totalActivitiesQuick', `${activities.length} Actividades`);
        
        // Calcular tasa de asistencia
        const attendanceRate = calculateAttendanceRate(attendance, students.length);
        updateElement('attendanceRate', `${attendanceRate}%`);
        
        // Calcular tasa de finalización
        const completionRate = calculateCompletionRate(activities);
        updateElement('completionRate', `${completionRate}%`);
        
        // Actualizar cambios mensuales (simulados por ahora)
        updateElement('studentsChange', `+${Math.floor(students.length * 0.1)} este mes`);
        updateElement('activitiesChange', `+${Math.floor(activities.length * 0.15)} este mes`);
        updateElement('attendanceChange', `+${Math.floor(attendanceRate * 0.05)}% este mes`);
        updateElement('completionChange', `+${Math.floor(completionRate * 0.02)}% este mes`);
        
        console.log('✅ Estadísticas actualizadas correctamente');
        
    } catch (error) {
        console.error('❌ Error actualizando estadísticas:', error);
    }
}

// FUNCIÓN FALTANTE: updateElement
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
        console.log(`✅ Elemento ${id} actualizado: ${value}`);
    } else {
        console.warn(`⚠️ Elemento ${id} no encontrado`);
    }
}

// FUNCIÓN FALTANTE: calculateAttendanceRate
function calculateAttendanceRate(attendance, totalStudents) {
    if (!attendance.length || !totalStudents) return 0;
    
    const totalAttendance = attendance.reduce((acc, curr) => {
        if (!curr.attendanceData) return acc;
        const presentCount = curr.attendanceData.filter(a => a?.attendance === 'present').length;
        return acc + (presentCount / totalStudents);
    }, 0);
    
    return Math.round((totalAttendance / attendance.length) * 100);
}

// FUNCIÓN FALTANTE: calculateCompletionRate
function calculateCompletionRate(activities) {
    if (!activities.length) return 0;
    // Por ahora asumimos que todas las actividades se completan
    // En el futuro esto podría calcularse basado en datos reales de finalización
    return Math.min(100, Math.round(activities.length * 2.5)); // Fórmula temporal
}

// FUNCIÓN FALTANTE: getUserData
function getUserData(key) {
    const user = window.auth?.currentUser;
    if (!user) return null;
    return localStorage.getItem(`${user.uid}_${key}`);
}

function setupPhotoUpload() {
    console.log('📷 Configurando subida de foto...');
    
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const photoInput = document.getElementById('photoInput');
    const profileAvatar = document.getElementById('profileAvatar');
    
    if (changePhotoBtn && photoInput && profileAvatar) {
        // Limpiar listeners previos
        changePhotoBtn.removeEventListener('click', triggerPhotoInput);
        photoInput.removeEventListener('change', handlePhotoUpload);
        
        // Agregar listeners
        changePhotoBtn.addEventListener('click', triggerPhotoInput);
        photoInput.addEventListener('change', handlePhotoUpload);
        
        console.log('✅ Event listeners configurados para foto de perfil');
    } else {
        console.warn('⚠️ Elementos de foto no encontrados:', {
            changePhotoBtn: !!changePhotoBtn,
            photoInput: !!photoInput,
            profileAvatar: !!profileAvatar
        });
    }
}

function triggerPhotoInput(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('📷 Activando selector de foto...');
    
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.click();
    }
}

function handlePhotoUpload(event) {
    console.log('📷 Procesando cambio de foto...');
    
    const file = event.target.files[0];
    if (!file) {
        console.log('❌ No se seleccionó archivo');
        return;
    }
    
    console.log('📷 Archivo seleccionado:', file.name, file.type, file.size);
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
        showNotification('❌ Por favor selecciona una imagen válida', 'error');
        return;
    }
    
    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('❌ La imagen debe ser menor a 5MB', 'error');
        return;
    }
    
    // Mostrar indicador de carga
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    if (changePhotoBtn) {
        changePhotoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        changePhotoBtn.disabled = true;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        console.log('📷 Imagen cargada correctamente');
        
        const imageData = e.target.result;
        
        // Actualizar la imagen del perfil
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            profileAvatar.src = imageData;
            
            // Guardar en localStorage
            const user = window.auth?.currentUser;
            if (user) {
                localStorage.setItem(`${user.uid}_profilePhoto`, imageData);
                showNotification('✅ Foto de perfil actualizada correctamente', 'success');
                console.log('✅ Foto guardada en localStorage');
            }
        }
        
        // Restaurar botón
        if (changePhotoBtn) {
            changePhotoBtn.innerHTML = '<i class="fas fa-camera"></i>';
            changePhotoBtn.disabled = false;
        }
        
        // Limpiar el input para permitir seleccionar la misma imagen nuevamente
        event.target.value = '';
    };
    
    reader.onerror = function() {
        console.error('❌ Error al leer el archivo');
        showNotification('❌ Error al procesar la imagen', 'error');
        
        // Restaurar botón
        if (changePhotoBtn) {
            changePhotoBtn.innerHTML = '<i class="fas fa-camera"></i>';
            changePhotoBtn.disabled = false;
        }
        
        // Limpiar el input
        event.target.value = '';
    };
    
    reader.readAsDataURL(file);
}

function loadProfilePhoto() {
    console.log('📷 Cargando foto de perfil guardada...');
    
    const user = window.auth?.currentUser;
    if (!user) {
        console.log('❌ Usuario no autenticado');
        return;
    }
    
    // CORREGIDO: Ya estaba bien, pero agregar más logging
    const savedPhoto = localStorage.getItem(`${user.uid}_profilePhoto`);
    if (savedPhoto) {
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            profileAvatar.src = savedPhoto;
            console.log(`✅ Foto de perfil cargada para usuario: ${user.uid}`);
        }
    } else {
        console.log(`ℹ️ No hay foto guardada para usuario: ${user.uid}, usando imagen por defecto`);
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
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
        border-radius: 10px;
        z-index: 10000;
        animation: slideInNotification 0.3s ease;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutNotification 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Gráfico de distribución de actividades funcional
function initializeActivityDistributionChart() {
    console.log('📊 Inicializando gráfico de distribución...');
    
    const activities = JSON.parse(getUserData('activities') || '[]');
    console.log('📊 Actividades encontradas:', activities.length);
    
    // Contar tipos de actividades
    const activityTypes = {
        'biblicas': 0,
        'creatividad': 0,
        'juegos': 0,
        'musica': 0,
        'otros': 0
    };
    
    activities.forEach(activity => {
        const type = activity.type?.toLowerCase() || 'otros';
        if (activityTypes.hasOwnProperty(type)) {
            activityTypes[type]++;
        } else {
            activityTypes.otros++;
        }
    });
    
    console.log('📊 Distribución de tipos:', activityTypes);
    
    const total = Object.values(activityTypes).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
        console.log('📊 No hay actividades, mostrando gráfico vacío');
        updatePieChart({
            'Sin actividades': 100
        });
        return;
    }
    
    // Calcular porcentajes - solo incluir tipos que tienen actividades
    const percentages = {};
    Object.entries(activityTypes).forEach(([type, count]) => {
        if (count > 0) {
            percentages[type] = Math.round((count / total) * 100);
        }
    });
    
    console.log('📊 Porcentajes calculados:', percentages);
    updatePieChart(percentages);
}

function updatePieChart(data) {
    const chartContainer = document.getElementById('activitiesDistribution');
    if (!chartContainer) {
        console.error('❌ Contenedor del gráfico no encontrado');
        return;
    }
    
    console.log('📊 Actualizando gráfico con datos:', data);
    
    const colors = {
        'biblicas': '#FFB6C1',
        'creatividad': '#B0E0E6', 
        'juegos': '#98FB98',
        'musica': '#DDA0DD',
        'otros': '#F0E68C',
        'Sin actividades': '#E0E0E0'
    };
    
    const labels = {
        'biblicas': 'Bíblicas',
        'creatividad': 'Creatividad',
        'juegos': 'Juegos',
        'musica': 'Música',
        'otros': 'Otros',
        'Sin actividades': 'Sin actividades'
    };
    
    let currentAngle = 0;
    let segments = '';
    let legendHTML = '';
    
    // Ajustar porcentajes para que sumen 100%
    const totalPercentage = Object.values(data).reduce((sum, val) => sum + val, 0);
    
    Object.entries(data).forEach(([type, percentage]) => {
        const adjustedPercentage = totalPercentage > 0 ? Math.round((percentage / totalPercentage) * 100) : 0;
        const angle = (adjustedPercentage / 100) * 360;
        const color = colors[type] || '#CCCCCC';
        const label = labels[type] || type;
        
        if (adjustedPercentage > 0) {
            segments += `${color} ${currentAngle}deg ${currentAngle + angle}deg, `;
            currentAngle += angle;
            
            legendHTML += `
                <div class="legend-item" onclick="highlightSegment('${type}')">
                    <div class="legend-color" style="background: ${color}"></div>
                    <span>${label} (${adjustedPercentage}%)</span>
                </div>
            `;
        }
    });
    
    // Si no hay segmentos, mostrar un círculo completo gris
    if (segments === '') {
        segments = '#E0E0E0 0deg 360deg';
        legendHTML = `
            <div class="legend-item">
                <div class="legend-color" style="background: #E0E0E0"></div>
                <span>Sin datos (100%)</span>
            </div>
        `;
    }
    
    const totalActivities = Object.values(data).reduce((sum, val) => sum + (val > 0 ? 1 : 0), 0);
    
    chartContainer.innerHTML = `
        <div class="pie-chart-interactive" style="background: conic-gradient(${segments.slice(0, -2)});">
            <div class="pie-chart-center">
                <div class="center-content">
                    <span class="center-number">${totalActivities}</span>
                    <span class="center-label">Tipos</span>
                </div>
            </div>
        </div>
        <div class="pie-legend">
            ${legendHTML}
        </div>
    `;
    
    console.log('✅ Gráfico actualizado correctamente');
}

// FUNCIÓN PARA DESTACAR SEGMENTOS DEL GRÁFICO
function highlightSegment(type) {
    console.log(`🎯 Destacando segmento: ${type}`);
    // Funcionalidad para destacar un segmento específico del gráfico
    const legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(item => {
        if (item.textContent.toLowerCase().includes(type)) {
            item.style.transform = 'scale(1.1)';
            item.style.fontWeight = 'bold';
            setTimeout(() => {
                item.style.transform = 'scale(1)';
                item.style.fontWeight = '600';
            }, 1000);
        }
    });
}

// Sistema de logros funcional
function initializeAchievements() {
    const achievements = calculateAchievements();
    updateAchievementsDisplay(achievements);
}

function calculateAchievements() {
    const students = JSON.parse(getUserData('students') || '[]');
    const activities = JSON.parse(getUserData('activities') || '[]');
    const attendance = JSON.parse(getUserData('attendance') || '[]');
    
    const achievements = [
        {
            id: 'first-activity',
            title: 'Primera Actividad',
            description: 'Registraste tu primera actividad',
            icon: 'fas fa-star',
            earned: activities.length > 0,
            date: activities.length > 0 ? new Date(activities[0].date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : null
        },
        {
            id: 'five-students',
            title: '5 Alumnos',
            description: 'Tienes 5 alumnos registrados',
            icon: 'fas fa-users',
            earned: students.length >= 5,
            date: students.length >= 5 ? new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : null
        },
        {
            id: 'ten-activities',
            title: '10 Actividades',
            description: 'Has realizado 10 actividades',
            icon: 'fas fa-clipboard-check',
            earned: activities.length >= 10,
            date: activities.length >= 10 ? new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : null
        },
        {
            id: 'attendance-master',
            title: 'Maestro de Asistencia',
            description: 'Registro perfecto de asistencia',
            icon: 'fas fa-calendar-check',
            earned: attendance.length >= 5,
            date: attendance.length >= 5 ? new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : null
        },
        {
            id: 'dedication',
            title: 'Dedicación Total',
            description: '25 actividades registradas',
            icon: 'fas fa-heart',
            earned: activities.length >= 25,
            date: activities.length >= 25 ? new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : null
        },
        {
            id: 'community-builder',
            title: 'Constructor de Comunidad',
            description: '15 alumnos activos',
            icon: 'fas fa-hands-helping',
            earned: students.length >= 15,
            date: students.length >= 15 ? new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : null
        }
    ];
    
    return achievements;
}

function updateAchievementsDisplay(achievements) {
    const container = document.querySelector('.achievements-grid');
    if (!container) return;
    
    container.innerHTML = achievements.map(achievement => `
        <div class="achievement-card ${achievement.earned ? 'earned' : ''}">
            <div class="achievement-icon">
                <i class="${achievement.icon}"></i>
            </div>
            <h4>${achievement.title}</h4>
            <p>${achievement.description}</p>
            <span class="achievement-date">
                ${achievement.earned ? achievement.date : 'Próximamente'}
            </span>
        </div>
    `).join('');
}

// Botón volver arriba
function initializeBackToTop() {
    // Crear botón volver arriba
    const backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopBtn.title = 'Volver arriba';
    document.body.appendChild(backToTopBtn);
    
    // Mostrar/ocultar según scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    // Scroll suave al hacer click
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Agregar estilos para animaciones
const additionalStyles = `
    <style>
        @keyframes slideInNotification {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutNotification {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .pie-chart-interactive:hover {
            transform: scale(1.05);
        }
        
        .legend-item:hover {
            background: var(--profile-primary) !important;
            color: white !important;
        }
        
        .achievement-card.earned:hover {
            transform: translateY(-8px) scale(1.05) !important;
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);

// Funciones de utilidad adicionales
window.getUserData = getUserData;
window.updateElement = updateElement;
window.highlightSegment = highlightSegment;

console.log('✅ Profile.js cargado completamente con todas las funciones');