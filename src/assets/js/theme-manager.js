/**
 * EduCheck Pro - Gestor de Temas Global
 * Aplica y mantiene el modo oscuro en todas las páginas
 */

(function() {
    'use strict';

    // Función para aplicar tema inmediatamente (sin parpadeo)
    function applyThemeImmediately() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        const body = document.body;
        const html = document.documentElement;
        
        if (isDarkMode) {
            body.classList.add('dark-mode');
            html.setAttribute('data-theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            html.removeAttribute('data-theme');
        }
    }

    // Aplicar tema inmediatamente al cargar
    applyThemeImmediately();

    // Escuchar cambios de otras pestañas
    window.addEventListener('storage', (e) => {
        if (e.key === 'darkMode') {
            applyThemeImmediately();
        }
    });

    // Función global para cambiar tema
    window.toggleDarkMode = function(force = null) {
        const currentDark = localStorage.getItem('darkMode') === 'true';
        const newDark = force !== null ? force : !currentDark;
        
        localStorage.setItem('darkMode', newDark);
        applyThemeImmediately();
        
        // Actualizar toggle si existe
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            toggle.checked = newDark;
        }
    };

    console.log('✅ Theme Manager cargado');
})();