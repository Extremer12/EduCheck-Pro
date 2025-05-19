// This file handles user authentication, including login and session management.

import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    deleteUser
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";

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

async function handleLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Actualizar el nombre del usuario en el toggle
        updateUserInfo(user);
        
        // Redirigir al dashboard
        window.location.href = 'index.html';
    } catch (error) {
        showNotification('Error al iniciar sesión: ' + error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return; // Exit if form doesn't exist

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = e.target.querySelector('.auth-btn');
        
        try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
            submitBtn.disabled = true;
            
            await handleLogin(email, password);
            showNotification('¡Bienvenido!');
        } catch (error) {
            let errorMessage = 'Error al iniciar sesión';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Usuario no encontrado';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Contraseña incorrecta';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
                    break;
            }
            showNotification(errorMessage, 'error');
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
            submitBtn.disabled = false;
        }
    });

    const logoutButton = document.getElementById('logoutButton');
    const deleteAccountBtn = document.getElementById('deleteAccount');

    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                window.location.href = 'login.html';
                showNotification('Sesión cerrada exitosamente');
            } catch (error) {
                showNotification('Error al cerrar sesión', 'error');
            }
        });
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Mostrar diálogo de confirmación personalizado
            if (confirm('⚠️ ADVERTENCIA ⚠️\n\n¿Estás completamente seguro de que deseas eliminar tu cuenta?\n\nEsta acción:\n- Eliminará todos tus datos\n- No se puede deshacer\n- Perderás acceso inmediatamente\n\n¿Deseas continuar?')) {
                try {
                    const user = auth.currentUser;
                    await deleteUser(user);
                    showNotification('Cuenta eliminada exitosamente');
                    window.location.href = 'login.html';
                } catch (error) {
                    if (error.code === 'auth/requires-recent-login') {
                        showNotification('Por seguridad, necesitas volver a iniciar sesión antes de eliminar tu cuenta', 'error');
                        setTimeout(() => {
                            signOut(auth).then(() => {
                                window.location.href = 'login.html';
                            });
                        }, 3000);
                    } else {
                        showNotification('Error al eliminar la cuenta: ' + error.message, 'error');
                    }
                }
            }
        });
    }

    checkAuth();

    document.getElementById('createAccount').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('authDescription').textContent = 'Crear una nueva cuenta';
    });

    document.getElementById('backToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('authDescription').textContent = 'Inicia sesión para continuar';
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const name = document.getElementById('registerName').value;
        const submitBtn = e.target.querySelector('.auth-btn');
        
        try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
            submitBtn.disabled = true;
            
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await userCredential.user.updateProfile({
                displayName: name
            });
            
            showNotification('¡Cuenta creada exitosamente!');
            window.location.href = 'index.html';
        } catch (error) {
            let errorMessage = 'Error al crear la cuenta';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este correo ya está registrado';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'La contraseña debe tener al menos 6 caracteres';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Correo electrónico inválido';
                    break;
            }
            showNotification(errorMessage, 'error');
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Crear Cuenta';
            submitBtn.disabled = false;
        }
    });

    document.getElementById('forgotPassword').addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        
        if (!email) {
            showNotification('Por favor, ingresa tu correo electrónico', 'error');
            return;
        }
        
        try {
            await sendPasswordResetEmail(auth, email);
            showNotification('Se ha enviado un correo para restablecer tu contraseña');
        } catch (error) {
            let errorMessage = 'Error al enviar el correo';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No existe una cuenta con este correo';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Correo electrónico inválido';
                    break;
            }
            showNotification(errorMessage, 'error');
        }
    });
});

// Función para verificar autenticación
function checkAuth() {
    auth.onAuthStateChanged(user => {
        if (!user && !window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    });
}

export { auth, showNotification };