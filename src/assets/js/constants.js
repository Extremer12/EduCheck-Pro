/**
 * EduCheck Pro - Constantes Globales
 * Estandarización de nombres de datos
 */

// NOMBRES ESTANDARIZADOS DE COLECCIONES
window.DATA_KEYS = {
    // Firebase Collections
    FIREBASE_INSTITUTIONS: 'institutions',
    FIREBASE_COURSES: 'courses', 
    FIREBASE_STUDENTS: 'students',
    FIREBASE_ACTIVITIES: 'activities',
    
    // LocalStorage Keys (mantener compatibilidad)
    LOCAL_INSTITUTIONS: 'establishments', // ⚠️ Por compatibilidad
    LOCAL_COURSES: 'courses',
    LOCAL_STUDENTS: 'students', 
    LOCAL_ACTIVITIES: 'recent_activities' // ⚠️ Por compatibilidad
};

// MAPEO PARA MIGRACIÓN
window.DATA_MAPPING = {
    // Firebase -> LocalStorage
    'institutions': 'establishments',
    'courses': 'courses',
    'students': 'students',
    'activities': 'recent_activities'
};

console.log('📋 Constantes de datos cargadas');