/**
 * EduCheck Pro - Configuración Firebase
 * Sistema Profesional de Gestión Educativa
 */

const firebaseConfig = {
    apiKey: "AIzaSyAC2DxR63utzR1tmnHCqzApYTraxMsH79M",
    authDomain: "educheck-pro.firebaseapp.com",
    projectId: "educheck-pro-system",
    storageBucket: "educheck-pro-system.appspot.com",
    messagingSenderId: "469162449559",
    appId: "1:469162449559:web:734e8756fd03b1388ce7d2",
    measurementId: "G-6645JXJBD6"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Configurar persistencia de autenticación
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Referencias globales
window.auth = auth;
window.db = db;

console.log('🔥 EduCheck Pro - Firebase configurado correctamente');