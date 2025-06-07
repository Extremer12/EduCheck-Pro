/**
 * EduCheck Pro - Constantes del Sistema v1.0
 * Centraliza todas las constantes y configuraciones
 */

// ===== CLAVES DE DATOS EN LOCALSTORAGE =====
window.DATA_KEYS = {
    ESTABLISHMENTS: 'establishments',
    STUDENTS: 'students',
    COURSES: 'courses',
    ACTIVITIES: 'recent_activities',
    ATTENDANCE: 'attendance_records',
    GALLERY: 'gallery_images',
    SETTINGS: 'user_settings',
    PROFILE: 'user_profile'
};

// ===== ROLES DE USUARIO =====
window.USER_ROLES = {
    TEACHER: 'teacher',
    ADMIN: 'admin',
    STUDENT: 'student',
    GUEST: 'guest'
};

// ===== TIPOS DE INSTITUCIONES =====
window.INSTITUTION_TYPES = {
    ESCUELA: 'escuela',
    COLEGIO: 'colegio',
    UNIVERSIDAD: 'universidad',
    INSTITUTO: 'instituto',
    OTRO: 'otro'
};

// ===== ESTADOS DE ASISTENCIA =====
window.ATTENDANCE_STATUS = {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    EXCUSED: 'excused'
};

// ===== TIPOS DE NOTIFICACIÓN =====
window.NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// ===== CONFIGURACIONES DEL SISTEMA =====
window.SYSTEM_CONFIG = {
    MAX_ACTIVITIES: 50,
    MAX_STUDENTS_PER_COURSE: 100,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    AUTO_SAVE_INTERVAL: 30000, // 30 segundos
    MAX_INSTITUTIONS: 10
};

// ===== MENSAJES DEL SISTEMA =====
window.SYSTEM_MESSAGES = {
    LOADING: 'Cargando...',
    SAVING: 'Guardando...',
    SAVED: 'Guardado correctamente',
    ERROR_SAVE: 'Error al guardar',
    ERROR_LOAD: 'Error al cargar datos',
    CONFIRM_DELETE: '¿Estás seguro de que quieres eliminar este elemento?',
    LOGIN_REQUIRED: 'Debes iniciar sesión para continuar',
    NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
    UNAUTHORIZED: 'No tienes permisos para realizar esta acción'
};

// ===== SELECTORES DOM COMUNES =====
window.DOM_SELECTORS = {
    MENU_TOGGLE: '#menuToggle',
    DROPDOWN_MENU: '#dropdownMenu',
    MENU_CLOSE: '#menuClose',
    MENU_OVERLAY: '#menuOverlay',
    DARK_MODE_TOGGLE: '#darkModeToggle',
    LOGOUT_OPTION: '#logoutOption',
    TEACHER_NAME: '#teacherName',
    CURRENT_DATE: '#currentDate',
    ACTIVITIES_GRID: '#activities-grid',
    INSTITUTIONS_GRID: '#institutionsGrid',
    RECENT_CAROUSEL: '#recentCarousel'
};

// ===== RUTAS DE LA APLICACIÓN =====
window.APP_ROUTES = {
    LOGIN: 'login.html',
    DASHBOARD: 'index.html',
    STUDENTS: 'estudiantes.html',
    COURSES: 'cursos.html',
    INSTITUTIONS: 'instituciones.html',
    ACTIVITIES: 'actividades.html',
    GALLERY: 'galeria.html',
    ATTENDANCE: 'asistencia.html',
    PROFILE: 'perfil.html',
    REPORTS: 'reportes.html'
};

// ===== CONFIGURACIÓN DE FECHA Y HORA =====
window.DATE_CONFIG = {
    LOCALE: 'es-ES',
    TIMEZONE: 'America/Bogota',
    DATE_FORMAT: {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    },
    TIME_FORMAT: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }
};

// ===== CONFIGURACIÓN DE VALIDACIÓN =====
window.VALIDATION_RULES = {
    NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 50,
        PATTERN: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
    },
    EMAIL: {
        PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    PHONE: {
        PATTERN: /^[\+]?[0-9\s\-\(\)]{7,15}$/
    },
    PASSWORD: {
        MIN_LENGTH: 6,
        REQUIRE_UPPERCASE: false,
        REQUIRE_LOWERCASE: false,
        REQUIRE_NUMBERS: false,
        REQUIRE_SYMBOLS: false
    }
};

// ===== EVENTOS PERSONALIZADOS =====
window.CUSTOM_EVENTS = {
    USER_AUTHENTICATED: 'user:authenticated',
    USER_LOGGED_OUT: 'user:logged-out',
    DATA_UPDATED: 'data:updated',
    THEME_CHANGED: 'theme:changed',
    MENU_OPENED: 'menu:opened',
    MENU_CLOSED: 'menu:closed'
};

// ===== FUNCIONES DE UTILIDAD =====
window.UTILS = {
    /**
     * Genera un ID único
     */
    generateId: (prefix = 'item') => {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    /**
     * Formatea fecha de manera legible
     */
    formatDate: (date, options = DATE_CONFIG.DATE_FORMAT) => {
        return new Date(date).toLocaleDateString(DATE_CONFIG.LOCALE, options);
    },
    
    /**
     * Formatea fecha y hora
     */
    formatDateTime: (date) => {
        const dateOptions = { ...DATE_CONFIG.DATE_FORMAT, ...DATE_CONFIG.TIME_FORMAT };
        return new Date(date).toLocaleDateString(DATE_CONFIG.LOCALE, dateOptions);
    },
    
    /**
     * Valida un campo según las reglas
     */
    validateField: (value, type) => {
        const rules = VALIDATION_RULES[type.toUpperCase()];
        if (!rules) return { valid: true };
        
        if (rules.MIN_LENGTH && value.length < rules.MIN_LENGTH) {
            return { valid: false, message: `Mínimo ${rules.MIN_LENGTH} caracteres` };
        }
        
        if (rules.MAX_LENGTH && value.length > rules.MAX_LENGTH) {
            return { valid: false, message: `Máximo ${rules.MAX_LENGTH} caracteres` };
        }
        
        if (rules.PATTERN && !rules.PATTERN.test(value)) {
            return { valid: false, message: `Formato inválido` };
        }
        
        return { valid: true };
    },
    
    /**
     * Sanitiza texto para evitar XSS
     */
    sanitizeText: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Debounce para eventos
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// ===== LOG DE CARGA =====
console.log('✅ Constants.js v1.0 cargado correctamente');
console.log('📋 Constantes disponibles:', {
    DATA_KEYS: Object.keys(window.DATA_KEYS).length,
    USER_ROLES: Object.keys(window.USER_ROLES).length,
    SYSTEM_CONFIG: Object.keys(window.SYSTEM_CONFIG).length,
    DOM_SELECTORS: Object.keys(window.DOM_SELECTORS).length,
    APP_ROUTES: Object.keys(window.APP_ROUTES).length,
    UTILS: Object.keys(window.UTILS).length
});