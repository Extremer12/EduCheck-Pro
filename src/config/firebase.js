/**
 * EduCheck Pro - Configuración Firebase
 * Sistema Profesional de Gestión Educativa
 */

// MANTENER configuración original que funciona
const firebaseConfig = {
    apiKey: "AIzaSyAC2DxR63utzR1tmnHCqzApYTraxMsH79M",
    authDomain: "horita-feliz-system.firebaseapp.com",
    projectId: "horita-feliz-system",
    storageBucket: "horita-feliz-system.firebasestorage.app",
    messagingSenderId: "469162449559",
    appId: "1:469162449559:web:734e8756fd03b1388ce7d2",
    measurementId: "G-6645JXJBD6"
};

// Inicializar Firebase - VERIFICAR que esté cargado
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('🔥 EduCheck Pro - Firebase inicializado correctamente');
} else if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK no cargado');
} else {
    console.log('🔥 Firebase ya estaba inicializado');
}

// Referencias globales
const auth = firebase.auth();
const db = firebase.firestore();

// Configurar persistencia
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Hacer disponibles globalmente
window.auth = auth;
window.db = db;

// Función de diagnóstico
function diagnoseFirabase() {
    console.log('🔍 EduCheck Pro - Diagnóstico Firebase:');
    console.log('Firebase disponible:', typeof firebase !== 'undefined');
    console.log('Apps inicializadas:', firebase?.apps?.length || 0);
    console.log('Auth disponible:', !!window.auth);
    console.log('DB disponible:', !!window.db);
    console.log('Usuario actual:', window.auth?.currentUser?.uid || 'No autenticado');
}

// Hacer disponible globalmente para debug
window.diagnoseFirabase = diagnoseFirabase;