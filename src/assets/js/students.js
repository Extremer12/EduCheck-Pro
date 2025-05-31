// Remover la línea de import problemática y usar solo funciones locales

// Función para agregar estudiante
function addStudent(name, age) {
    const user = window.auth?.currentUser;
    if (!user) {
        showNotification('Debes estar autenticado para agregar estudiantes', 'error');
        return;
    }

    const student = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        age: parseInt(age),
        dateAdded: new Date().toISOString(),
        userId: user.uid
    };

    try {
        // Obtener estudiantes existentes del usuario actual
        let students = [];
        const storedStudents = getUserData('students');
        
        if (storedStudents) {
            students = typeof storedStudents === 'string' 
                ? JSON.parse(storedStudents) 
                : storedStudents;
        }

        // Verificar si ya existe un estudiante con el mismo nombre
        const existingStudent = students.find(s => 
            s.name.toLowerCase() === name.toLowerCase().trim()
        );

        if (existingStudent) {
            showNotification('Ya existe un estudiante con ese nombre', 'error');
            return;
        }

        // Agregar el nuevo estudiante
        students.push(student);

        // Guardar en localStorage con clave específica del usuario
        setUserData('students', JSON.stringify(students));

        console.log(`Estudiante agregado para usuario ${user.uid}:`, student);
        showNotification('Estudiante agregado exitosamente', 'success');

        // Actualizar la lista si está visible
        loadStudentsList();

        return student;
    } catch (error) {
        console.error('Error al agregar estudiante:', error);
        showNotification('Error al agregar estudiante', 'error');
    }
}

// Función para cargar lista de estudiantes
function loadStudentsList() {
    const container = document.getElementById('students-list-container');
    if (!container) {
        console.warn('Container students-list-container no encontrado');
        return;
    }

    const user = window.auth?.currentUser;
    if (!user) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-user-slash"></i><p>Debes estar autenticado para ver los estudiantes</p></div>';
        return;
    }

    try {
        const storedStudents = getUserData('students');
        let students = [];

        if (storedStudents) {
            students = typeof storedStudents === 'string' 
                ? JSON.parse(storedStudents) 
                : storedStudents;
        }

        console.log(`Cargando estudiantes para usuario ${user.uid}:`, students);

        if (students.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-plus"></i>
                    <p>No tienes estudiantes registrados</p>
                    <p>Agrega estudiantes usando el formulario de la página principal</p>
                </div>
            `;
            return;
        }

        container.innerHTML = students.map(student => `
            <div class="student-card" data-id="${student.id}">
                <div class="student-info">
                    <div class="student-avatar">
                        <i class="fas fa-child"></i>
                    </div>
                    <div class="student-details">
                        <h4>${student.name}</h4>
                        <p>${student.age} años</p>
                        <small>Agregado: ${new Date(student.dateAdded).toLocaleDateString()}</small>
                    </div>
                </div>
                <button class="delete-student" onclick="deleteStudent('${student.id}')" title="Eliminar estudiante">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar estudiantes</p></div>';
    }
}

// Función para eliminar estudiante
function deleteStudent(studentId) {
    const user = window.auth?.currentUser;
    if (!user) {
        showNotification('Debes estar autenticado para eliminar estudiantes', 'error');
        return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar este estudiante?')) {
        return;
    }

    try {
        let students = [];
        const storedStudents = getUserData('students');
        
        if (storedStudents) {
            students = typeof storedStudents === 'string' 
                ? JSON.parse(storedStudents) 
                : storedStudents;
        }

        // Filtrar para eliminar el estudiante
        students = students.filter(student => student.id !== studentId);

        // Guardar la lista actualizada
        setUserData('students', JSON.stringify(students));

        console.log(`Estudiante eliminado para usuario ${user.uid}. Estudiantes restantes:`, students.length);
        
        showNotification('Estudiante eliminado exitosamente', 'success');
        loadStudentsList();

    } catch (error) {
        console.error('Error al eliminar estudiante:', error);
        showNotification('Error al eliminar estudiante', 'error');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎓 Students.js cargado');

    // Formulario para agregar estudiantes
    const studentForm = document.querySelector('.student-form');
    if (studentForm) {
        studentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById('studentName');
            const ageInput = document.getElementById('studentAge');
            
            if (nameInput && ageInput) {
                const name = nameInput.value.trim();
                const age = parseInt(ageInput.value);
                
                if (name && age > 0 && age <= 15) {
                    addStudent(name, age);
                    nameInput.value = '';
                    ageInput.value = '';
                } else {
                    showNotification('Por favor, completa todos los campos correctamente', 'error');
                }
            }
        });
        console.log('✅ Formulario de estudiantes configurado');
    }

    // Botón para mostrar lista de estudiantes
    const studentsListBtn = document.getElementById('students-list');
    if (studentsListBtn) {
        studentsListBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('📋 Abriendo modal de estudiantes...');
            const modal = document.getElementById('students-modal');
            if (modal) {
                modal.style.display = 'block';
                loadStudentsList();
                console.log('✅ Modal de estudiantes abierto');
            } else {
                console.error('❌ Modal students-modal no encontrado');
            }
        });
        console.log('✅ Botón "Mis alumnos" configurado');
    } else {
        console.error('❌ Botón students-list no encontrado');
    }

    // Cerrar modal de estudiantes
    const closeModalBtns = document.querySelectorAll('#students-modal .close-modal');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = document.getElementById('students-modal');
            if (modal) {
                modal.style.display = 'none';
                console.log('🔒 Modal de estudiantes cerrado');
            }
        });
    });

    // Cerrar modal al hacer clic fuera
    const studentsModal = document.getElementById('students-modal');
    if (studentsModal) {
        studentsModal.addEventListener('click', (e) => {
            if (e.target === studentsModal) {
                studentsModal.style.display = 'none';
                console.log('🔒 Modal cerrado por click fuera');
            }
        });
    }
});

// Exportar funciones para uso global
window.addStudent = addStudent;
window.loadStudentsList = loadStudentsList;
window.deleteStudent = deleteStudent;

console.log('📚 Students.js completamente cargado');