// This file manages the functionality related to adding and managing student information, including names and ages.

document.addEventListener('DOMContentLoaded', () => {
    const studentForm = document.querySelector('.student-form');
    const studentsList = document.getElementById('students-list-container');

    // Función para mostrar notificaciones
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            ${message}
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Manejar agregar estudiante
    studentForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('studentName').value;
        const age = document.getElementById('studentAge').value;
        
        const newStudent = {
            id: Date.now(),
            name,
            age
        };
        
        // Importar la función desde database.js
const { saveStudentData } = await import('../../utils/database.js');
        
        // Guardar estudiante
        const success = await saveStudentData(newStudent);
        
        if (success) {
            // Mostrar notificación
            showNotification('Alumno agregado exitosamente');
            
            // Limpiar formulario
            studentForm.reset();
            
            // Actualizar lista
            loadStudentsList();
        } else {
            showNotification('Error al agregar alumno', 'error');
        }
    });

    // Función para cargar lista de estudiantes
    async function loadStudentsList() {
        if (!studentsList) return;
        
        // Importar la función desde database.js
const { getStudentData } = await import('../../utils/database.js');
        
        // Obtener estudiantes
        const students = await getStudentData();
        
        if (students.length === 0) {
            studentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-plus"></i>
                    <p>No hay alumnos registrados</p>
                </div>
            `;
            return;
        }

        studentsList.innerHTML = students.map(student => `
            <div class="student-card">
                <div class="student-info">
                    <div class="student-avatar">
                        ${student.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="student-details">
                        <h4>${student.name}</h4>
                        <p>${student.age} años</p>
                    </div>
                </div>
                <button class="delete-student" onclick="deleteStudent(${student.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');
    }

    // Función para eliminar estudiante
    window.deleteStudent = async function(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este alumno?')) {
            try {
                const user = auth.currentUser;
                if (!user) return;
                
                // Importar la función doc de Firestore y la instancia db
                const { doc, deleteDoc, getFirestore } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
                const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js");
                
                // Configuración de Firebase
                const firebaseConfig = {
                    apiKey: "AIzaSyAC2DxR63utzR1tmnHCqzApYTraxMsH79M",
                    authDomain: "horita-feliz-system.firebaseapp.com",
                    projectId: "horita-feliz-system",
                    storageBucket: "horita-feliz-system.firebasestorage.app",
                    messagingSenderId: "469162449559",
                    appId: "1:469162449559:web:734e8756fd03b1388ce7d2",
                    measurementId: "G-6645JXJBD6"
                };
                
                // Inicializar Firebase y obtener db
                const app = initializeApp(firebaseConfig);
                const db = getFirestore(app);
                
                // Eliminar de Firestore
                const studentRef = doc(db, `users/${user.uid}/students/${id}`);
                await deleteDoc(studentRef);
                
                // Actualizar localStorage
                let students = JSON.parse(localStorage.getItem('students') || '[]');
                students = students.filter(student => student.id !== id);
                localStorage.setItem('students', JSON.stringify(students));
                
                loadStudentsList();
                showNotification('Alumno eliminado exitosamente');
            } catch (error) {
                console.error('Error al eliminar alumno:', error);
                showNotification('Error al eliminar alumno: ' + error.message, 'error');
            }
        }
    };

    // Cargar estudiantes al iniciar
    loadStudentsList();
});

// Mostrar modal de estudiantes
document.getElementById('students-list')?.addEventListener('click', (e) => {
    e.preventDefault();
    const modal = document.getElementById('students-modal');
    modal.style.display = 'block';
});

// Cerrar modales
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').style.display = 'none';
    });
});