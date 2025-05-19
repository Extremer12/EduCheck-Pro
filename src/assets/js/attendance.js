// This file handles attendance tracking, including marking students as present or absent and managing the points system.

const attendanceData = [];

// Function to add attendance record
function addAttendance(studentId, date, status, points, completion) {
    const record = {
        studentId,
        date,
        status,
        points,
        completion
    };
    attendanceData.push(record);
}

// Function to get attendance records for a specific student
function getAttendanceByStudent(studentId) {
    return attendanceData.filter(record => record.studentId === studentId);
}

// Function to get all attendance records
function getAllAttendance() {
    return attendanceData;
}

// Function to mark a student as present
function markPresent(studentId, date, points, completion) {
    addAttendance(studentId, date, 'Present', points, completion);
}

// Function to mark a student as absent
function markAbsent(studentId, date) {
    addAttendance(studentId, date, 'Absent', 0, 'Incomplete');
}

// Modificar la función openAttendanceModal para usar importaciones correctamente
function openAttendanceModal(activityId) {
    if (!activityId) return;

    // Usar importaciones dinámicas con then() en lugar de import estático
    import('../../utils/database.js')
        .then(module => {
            const { getStudentData, getAttendanceData } = module;
            
            // Obtener actividades del localStorage específico del usuario
            const activities = JSON.parse(getUserData('activities') || '[]');
            
            // Obtener estudiantes y asistencia de Firebase
            getStudentData().then(students => {
                getAttendanceData().then(attendance => {
                    const activity = activities.find(a => String(a.id) === String(activityId));
                    const savedAttendance = attendance.find(a => String(a.activityId) === String(activityId));
                    
                    if (!activity) return;
            
                    const modal = document.getElementById('attendance-modal');
                    if (!modal) return;
                    
                    modal.innerHTML = `
                        <div class="modal-content">
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
                                        ${students.map(student => {
                                            const studentAttendance = savedAttendance?.attendanceData?.find(
                                                a => String(a.studentId) === String(student.id)
                                            ) || { attendance: 'present', points: '0', completion: 'incomplete' };
                                            
                                            return `
                                                <tr data-student-id="${student.id}">
                                                    <td>${student.name}</td>
                                                    <td>
                                                        <select class="attendance-select" data-original="${studentAttendance.attendance}">
                                                            <option value="present" ${studentAttendance.attendance === 'present' ? 'selected' : ''}>Presente</option>
                                                            <option value="absent" ${studentAttendance.attendance === 'absent' ? 'selected' : ''}>Ausente</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <select class="points-select" data-original="${studentAttendance.points}">
                                                            <option value="0" ${studentAttendance.points === '0' ? 'selected' : ''}>0</option>
                                                            <option value="1" ${studentAttendance.points === '1' ? 'selected' : ''}>+1</option>
                                                            <option value="2" ${studentAttendance.points === '2' ? 'selected' : ''}>+2</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <select class="completion-select" data-original="${studentAttendance.completion}">
                                                            <option value="completed" ${studentAttendance.completion === 'completed' ? 'selected' : ''}>Completada</option>
                                                            <option value="incomplete" ${studentAttendance.completion === 'incomplete' ? 'selected' : ''}>Incompleta</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                                <button class="save-attendance-btn">
                                    <i class="fas fa-save"></i> Guardar Asistencia
                                </button>
                            </div>
                        </div>
                    `;

                    modal.style.display = 'block';

                    // Event listeners
                    const closeBtn = modal.querySelector('.close-modal');
                    const saveBtn = modal.querySelector('.save-attendance-btn');

                    closeBtn.addEventListener('click', () => {
                        if (checkForChanges()) {
                            if (confirm('Hay cambios sin guardar. ¿Seguro que deseas cerrar sin guardar?')) {
                                modal.style.display = 'none';
                            }
                        } else {
                            modal.style.display = 'none';
                        }
                    });

                    saveBtn.addEventListener('click', () => {
                        if (checkForChanges()) {
                            if (confirm('¿Estás seguro de guardar los cambios en la asistencia?')) {
                                saveAttendance(activityId);
                            }
                        } else {
                            showNotification('No hay cambios para guardar');
                        }
                    });

                    // Cerrar modal al hacer clic fuera
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            if (checkForChanges()) {
                                if (confirm('Hay cambios sin guardar. ¿Seguro que deseas cerrar sin guardar?')) {
                                    modal.style.display = 'none';
                                }
                            } else {
                                modal.style.display = 'none';
                            }
                        }
                    });
                });
            });
        })
        .catch(error => {
            console.error('Error al cargar módulos:', error);
            showNotification('Error al cargar datos de asistencia', 'error');
        });
}

function checkForChanges() {
    const rows = document.querySelectorAll('.attendance-table tbody tr');
    let hasChanges = false;

    rows.forEach(row => {
        ['attendance-select', 'points-select', 'completion-select'].forEach(className => {
            const select = row.querySelector(`.${className}`);
            if (select.value !== select.dataset.original) {
                hasChanges = true;
            }
        });
    });

    return hasChanges;
}

// Modificar la función saveAttendance para usar importaciones correctamente
function saveAttendance(activityId) {
    try {
        const rows = document.querySelectorAll('.attendance-table tbody tr');
        const attendanceData = [];
        
        rows.forEach(row => {
            const studentId = row.dataset.studentId;
            const attendance = row.querySelector('.attendance-select').value;
            const points = row.querySelector('.points-select').value;
            const completion = row.querySelector('.completion-select').value;
            
            attendanceData.push({
                studentId,
                attendance,
                points,
                completion
            });
        });
        
        const attendanceRecord = {
            activityId,
            date: new Date().toISOString(),
            attendanceData
        };
        
        // Usar importación dinámica con then()
        import('../../utils/database.js')
            .then(module => {
                const { saveAttendanceData } = module;
                saveAttendanceData(attendanceRecord).then(success => {
                    if (success) {
                        showNotification('Asistencia guardada correctamente');
                        document.getElementById('attendance-modal').style.display = 'none';
                    } else {
                        showNotification('Error al guardar asistencia', 'error');
                    }
                });
            })
            .catch(error => {
                console.error('Error al cargar módulos:', error);
                showNotification('Error al guardar asistencia', 'error');
            });
        
    } catch (error) {
        console.error('Error al guardar asistencia:', error);
        showNotification('Error al guardar asistencia', 'error');
    }
}

