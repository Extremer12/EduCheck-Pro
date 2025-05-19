const firebaseConfig = {
    // Tus credenciales de Firebase aquí
    apiKey: "AIzaSyAC2DxR63utzR1tmnHCqzApYTraxMsH79M",
    authDomain: "horita-feliz-system.firebaseapp.com",
    projectId: "horita-feliz-system",
    storageBucket: "horita-feliz-system.firebasestorage.app",
    messagingSenderId: "469162449559",
    appId: "1:469162449559:web:734e8756fd03b1388ce7d2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();