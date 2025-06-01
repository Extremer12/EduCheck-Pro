document.addEventListener('DOMContentLoaded', () => {
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
        auth.onAuthStateChanged(user => {
            if (user) {
                teacherNameElement.textContent = user.displayName || user.email.split('@')[0];
            }
        });
    }
});

function updateProfileStats() {
    try {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');

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
        const user = auth.currentUser;
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
    
    // Cargar preferencia guardada
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    }
    
    // Event listener para el toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }
}

// Llamar la función al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    initializeDarkMode();
    // ... resto del código de inicialización
});