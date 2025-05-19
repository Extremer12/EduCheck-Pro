import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    query, 
    where,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Función para conectar a la base de datos
async function connectToDatabase() {
    try {
        // Verificar si el usuario está autenticado
        const user = auth.currentUser;
        if (!user) {
            console.error("Usuario no autenticado");
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error al conectar a la base de datos:", error);
        return false;
    }
}

// Función para guardar datos de estudiantes
async function saveStudentData(student) {
    try {
        const user = auth.currentUser;
        if (!user) return false;
        
        // Guardar en Firestore
        const studentRef = doc(db, `users/${user.uid}/students/${student.id}`);
        await setDoc(studentRef, student);
        
        // También guardar en localStorage como respaldo
        let students = [];
        const storedStudents = getUserData('students');
        
        if (storedStudents) {
            students = typeof storedStudents === 'string' 
                ? JSON.parse(storedStudents) 
                : storedStudents;
        }
        
        const existingIndex = students.findIndex(s => s.id === student.id);
        
        if (existingIndex >= 0) {
            students[existingIndex] = student;
        } else {
            students.push(student);
        }
        
        setUserData('students', JSON.stringify(students));
        return true;
    } catch (error) {
        console.error("Error al guardar datos del estudiante:", error);
        return false;
    }
}

// Función para obtener datos de estudiantes
async function getStudentData() {
    try {
        const user = auth.currentUser;
        if (!user) return [];
        
        // Intentar obtener de Firestore
        const studentsRef = collection(db, `users/${user.uid}/students`);
        const querySnapshot = await getDocs(studentsRef);
        
        const students = [];
        querySnapshot.forEach((doc) => {
            students.push(doc.data());
        });
        
        // Actualizar localStorage con los datos más recientes
        setUserData('students', students);
        
        return students;
    } catch (error) {
        console.error("Error al obtener datos de estudiantes:", error);
        
        // Si falla Firestore, intentar obtener del localStorage
        return JSON.parse(getUserData('students') || '[]');
    }
}

// Función para guardar datos de asistencia
async function saveAttendanceData(attendance) {
    try {
        const user = auth.currentUser;
        if (!user) return false;
        
        // Guardar en Firestore
        const attendanceRef = doc(db, `users/${user.uid}/attendance/${attendance.activityId}`);
        await setDoc(attendanceRef, attendance);
        
        // También guardar en localStorage como respaldo
        const attendanceList = JSON.parse(getUserData('attendance') || '[]');
        const existingIndex = attendanceList.findIndex(a => a.activityId === attendance.activityId);
        
        if (existingIndex >= 0) {
            attendanceList[existingIndex] = attendance;
        } else {
            attendanceList.push(attendance);
        }
        
        setUserData('attendance', attendanceList);
        return true;
    } catch (error) {
        console.error("Error al guardar datos de asistencia:", error);
        return false;
    }
}

// Función para obtener datos de asistencia
async function getAttendanceData() {
    try {
        const user = auth.currentUser;
        if (!user) return [];
        
        // Intentar obtener de Firestore
        const attendanceRef = collection(db, `users/${user.uid}/attendance`);
        const querySnapshot = await getDocs(attendanceRef);
        
        const attendance = [];
        querySnapshot.forEach((doc) => {
            attendance.push(doc.data());
        });
        
        // Actualizar localStorage con los datos más recientes
        setUserData('attendance', attendance);
        
        return attendance;
    } catch (error) {
        console.error("Error al obtener datos de asistencia:", error);
        
        // Si falla Firestore, intentar obtener del localStorage
        return JSON.parse(getUserData('attendance') || '[]');
    }
}

// Exportar las funciones
export {
    connectToDatabase,
    saveStudentData,
    getStudentData,
    saveAttendanceData,
    getAttendanceData
};