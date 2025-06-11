/**
 * Script para migrar todos los CSS a usar variables centralizadas
 */
const fs = require('fs');
const path = require('path');

const cssFiles = [
    'src/assets/css/styles.css',
    'src/assets/css/ajustes.css',
    'src/assets/css/asistencia.css',
    'src/assets/css/actividades.css',
    'src/assets/css/estudiantes.css',
    'src/assets/css/instituciones.css',
    'src/assets/css/gallery.css',
    'src/assets/css/profile.css',
    'src/assets/css/cursos.css',
    'src/assets/css/responsive.css'
];

// Mapeo de colores antiguos a variables nuevas
const colorMappings = {
    '#FFB6C1': 'var(--educheck-primary)',
    '#ff69b4': 'var(--educheck-primary-dark)',
    '#ffd1dc': 'var(--educheck-primary-light)',
    '#B0E0E6': 'var(--educheck-secondary)',
    '#87ceeb': 'var(--educheck-secondary-dark)',
    '#e0f6ff': 'var(--educheck-secondary-light)',
    '#98FB98': 'var(--educheck-accent)',
    '#DDA0DD': 'var(--educheck-accent-secondary)',
    '#28A745': 'var(--educheck-success)',
    '#DC3545': 'var(--educheck-danger)',
    '#FFC107': 'var(--educheck-warning)',
    '#17A2B8': 'var(--educheck-info)',
    '#2C3E50': 'var(--educheck-text-primary)',
    '#7F8C8D': 'var(--educheck-text-tertiary)',
    '#FFFFFF': 'var(--educheck-bg-primary)',
    '#F8F9FA': 'var(--educheck-bg-secondary)',
    '#E9ECEF': 'var(--educheck-border-primary)'
};

// Mapeo de espaciado a variables
const spacingMappings = {
    '0.25rem': 'var(--educheck-space-1)',
    '0.5rem': 'var(--educheck-space-2)',
    '0.75rem': 'var(--educheck-space-3)',
    '1rem': 'var(--educheck-space-4)',
    '1.25rem': 'var(--educheck-space-5)',
    '1.5rem': 'var(--educheck-space-6)',
    '2rem': 'var(--educheck-space-8)',
    '2.5rem': 'var(--educheck-space-10)',
    '3rem': 'var(--educheck-space-12)',
    '4rem': 'var(--educheck-space-16)'
};

// Mapeo de border-radius
const radiusMappings = {
    '4px': 'var(--educheck-radius-base)',
    '6px': 'var(--educheck-radius-md)',
    '8px': 'var(--educheck-radius-lg)',
    '12px': 'var(--educheck-radius-xl)',
    '16px': 'var(--educheck-radius-2xl)',
    '0.25rem': 'var(--educheck-radius-base)',
    '0.375rem': 'var(--educheck-radius-md)',
    '0.5rem': 'var(--educheck-radius-lg)',
    '0.75rem': 'var(--educheck-radius-xl)',
    '1rem': 'var(--educheck-radius-2xl)',
    '50%': 'var(--educheck-radius-full)',
    '9999px': 'var(--educheck-radius-full)'
};

function migrateCSSFile(filePath) {
    console.log(`🔄 Migrando ${filePath}...`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Archivo no encontrado: ${filePath}`);
        return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Crear backup
    fs.writeFileSync(`${filePath}.backup`, content);
    
    // 1. Agregar import de variables si no existe
    if (!content.includes('@import url(\'./variables.css\')') && 
        !content.includes('@import "./variables.css"')) {
        content = `@import url('./variables.css');\n\n${content}`;
        modified = true;
        console.log('✅ Agregado import de variables');
    }
    
    // 2. Reemplazar colores hardcodeados
    Object.entries(colorMappings).forEach(([oldColor, newVar]) => {
        const oldColorRegex = new RegExp(oldColor.replace('#', '#'), 'gi');
        if (content.match(oldColorRegex)) {
            content = content.replace(oldColorRegex, newVar);
            modified = true;
            console.log(`🎨 Reemplazado ${oldColor} → ${newVar}`);
        }
    });
    
    // 3. Reemplazar espaciado
    Object.entries(spacingMappings).forEach(([oldSpacing, newVar]) => {
        const spacingRegex = new RegExp(`\\b${oldSpacing.replace('.', '\\.')}\\b`, 'g');
        if (content.match(spacingRegex)) {
            content = content.replace(spacingRegex, newVar);
            modified = true;
            console.log(`📏 Reemplazado espaciado ${oldSpacing} → ${newVar}`);
        }
    });
    
    // 4. Reemplazar border-radius
    Object.entries(radiusMappings).forEach(([oldRadius, newVar]) => {
        const radiusRegex = new RegExp(`border-radius:\\s*${oldRadius.replace('.', '\\.')}`, 'g');
        if (content.match(radiusRegex)) {
            content = content.replace(radiusRegex, `border-radius: ${newVar}`);
            modified = true;
            console.log(`🔲 Reemplazado radio ${oldRadius} → ${newVar}`);
        }
    });
    
    // 5. Reemplazar font-family común
    const fontFamilyRegex = /font-family:\s*'Quicksand',\s*[^;]+;/g;
    if (content.match(fontFamilyRegex)) {
        content = content.replace(fontFamilyRegex, 'font-family: var(--educheck-font-family);');
        modified = true;
        console.log('🔤 Reemplazada font-family');
    }
    
    // 6. Reemplazar transiciones comunes
    const transitionRegex = /transition:\s*all\s+0\.3s\s+ease/g;
    if (content.match(transitionRegex)) {
        content = content.replace(transitionRegex, 'transition: all var(--educheck-transition-base)');
        modified = true;
        console.log('🔄 Reemplazadas transiciones');
    }
    
    // 7. Eliminar variables CSS duplicadas
    const variableRegex = /:root\s*\{[^}]+\}/g;
    const existingVariables = content.match(variableRegex);
    if (existingVariables && existingVariables.length > 1) {
        // Mantener solo la primera declaración :root
        content = content.replace(variableRegex, (match, index) => {
            return index === 0 ? '' : match; // Eliminar duplicados
        });
        modified = true;
        console.log('🗑️  Eliminadas variables duplicadas');
    }
    
    // Guardar si se modificó
    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`💾 Archivo migrado: ${filePath}\n`);
        return true;
    } else {
        console.log(`ℹ️  Sin cambios: ${filePath}\n`);
        return false;
    }
}

// Ejecutar migración
console.log('🎨 ===== MIGRACIÓN CSS EDUCHECK PRO =====\n');

const results = {
    total: cssFiles.length,
    migrated: 0,
    skipped: 0,
    errors: 0
};

cssFiles.forEach(file => {
    try {
        if (migrateCSSFile(file)) {
            results.migrated++;
        } else {
            results.skipped++;
        }
    } catch (error) {
        console.error(`💥 Error migrando ${file}:`, error.message);
        results.errors++;
    }
});

console.log('📊 ===== RESUMEN DE MIGRACIÓN =====');
console.log(`📁 Total archivos: ${results.total}`);
console.log(`✅ Migrados: ${results.migrated}`);
console.log(`⏭️  Sin cambios: ${results.skipped}`);
console.log(`❌ Errores: ${results.errors}`);
console.log(`📈 Porcentaje migrado: ${(results.migrated / results.total * 100).toFixed(1)}%`);

if (results.migrated > 0) {
    console.log('\n💡 Se crearon backups con extensión .backup');
    console.log('🎯 Para revertir cambios: rename *.backup to *.css');
}

console.log('\n🚀 Migración CSS completada');