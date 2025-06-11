/**
 * Script para validar y corregir HTML en todas las páginas
 */
const fs = require('fs');
const path = require('path');

const htmlFiles = [
    'index.html',
    'ajustes.html', 
    'asistencia.html',
    'actividades.html',
    'estudiantes.html',
    'instituciones.html',
    'cursos.html',
    'gallery.html',
    'profile.html',
    'login.html'
];

function validateHTML(filePath) {
    console.log(`🔍 Validando ${filePath}...`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const errors = [];
    const fixes = [];
    
    // 1. Buscar tags malformados (duplicados)
    const malformedTags = content.match(/\<(\w+)\1/g);
    if (malformedTags) {
        errors.push(`❌ Tags duplicados: ${malformedTags.join(', ')}`);
        fixes.push('Eliminar duplicación de tags');
    }
    
    // 2. Verificar DOCTYPE
    if (!content.includes('<!DOCTYPE html>')) {
        errors.push('❌ Falta declaración DOCTYPE');
        fixes.push('Agregar <!DOCTYPE html>');
    }
    
    // 3. Verificar lang attribute
    if (!content.includes('<html lang="es">')) {
        errors.push('❌ Falta atributo lang en HTML');
        fixes.push('Agregar lang="es" al tag HTML');
    }
    
    // 4. Verificar meta charset
    if (!content.includes('<meta charset="UTF-8">')) {
        errors.push('❌ Falta meta charset UTF-8');
        fixes.push('Agregar <meta charset="UTF-8">');
    }
    
    // 5. Verificar viewport
    if (!content.includes('name="viewport"')) {
        errors.push('❌ Falta meta viewport');
        fixes.push('Agregar meta viewport responsive');
    }
    
    // 6. Verificar title
    if (!content.includes('<title>') || content.includes('<title></title>')) {
        errors.push('❌ Title vacío o faltante');
        fixes.push('Agregar title descriptivo');
    }
    
    // 7. Verificar estructura básica
    const requiredTags = ['<head>', '<body>', '</head>', '</body>', '</html>'];
    requiredTags.forEach(tag => {
        if (!content.includes(tag)) {
            errors.push(`❌ Falta tag requerido: ${tag}`);
            fixes.push(`Agregar ${tag}`);
        }
    });
    
    // 8. Verificar scripts Firebase en orden correcto
    if (content.includes('firebase') && content.includes('<script')) {
        const firebaseOrder = [
            'firebase-app.js',
            'firebase-auth.js', 
            'firebase-firestore.js',
            'firebase-storage.js'
        ];
        
        let lastIndex = -1;
        firebaseOrder.forEach(script => {
            const index = content.indexOf(script);
            if (index !== -1 && index < lastIndex) {
                errors.push(`❌ Scripts Firebase en orden incorrecto: ${script}`);
                fixes.push('Reordenar scripts Firebase');
            }
            if (index !== -1) lastIndex = index;
        });
    }
    
    return { errors, fixes, isValid: errors.length === 0 };
}

function fixHTML(filePath) {
    console.log(`🔧 Corrigiendo ${filePath}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Corregir buttonbutton específicamente
    if (content.includes('<buttonbutton')) {
        content = content.replace(/<buttonbutton/g, '<button');
        modified = true;
        console.log('✅ Corregido: buttonbutton → button');
    }
    
    // Corregir otros tags duplicados comunes
    const duplicatedTags = ['divdiv', 'spanspan', 'aa', 'hh1', 'hh2', 'hh3'];
    duplicatedTags.forEach(tag => {
        const match = tag.match(/(\w+)\1/);
        if (match && content.includes(`<${tag}`)) {
            content = content.replace(new RegExp(`<${tag}`, 'g'), `<${match[1]}`);
            modified = true;
            console.log(`✅ Corregido: ${tag} → ${match[1]}`);
        }
    });
    
    // Agregar DOCTYPE si falta
    if (!content.includes('<!DOCTYPE html>')) {
        content = '<!DOCTYPE html>\n' + content;
        modified = true;
        console.log('✅ Agregado: DOCTYPE html');
    }
    
    // Corregir lang attribute
    if (content.includes('<html>')) {
        content = content.replace('<html>', '<html lang="es">');
        modified = true;
        console.log('✅ Agregado: lang="es"');
    }
    
    // Guardar si se modificó
    if (modified) {
        // Crear backup
        fs.writeFileSync(`${filePath}.backup`, fs.readFileSync(filePath));
        fs.writeFileSync(filePath, content);
        console.log(`💾 Archivo corregido y guardado: ${filePath}`);
        return true;
    }
    
    return false;
}

// Ejecutar validación y corrección
console.log('🔍 ===== AUDITORÍA HTML EDUCHECK PRO =====\n');

const results = {
    total: htmlFiles.length,
    valid: 0,
    errors: 0,
    fixed: 0
};

htmlFiles.forEach(file => {
    try {
        if (fs.existsSync(file)) {
            const validation = validateHTML(file);
            
            if (validation.isValid) {
                console.log(`✅ ${file}: HTML válido\n`);
                results.valid++;
            } else {
                console.log(`❌ ${file}:`);
                validation.errors.forEach(error => console.log(`   ${error}`));
                console.log(`🔧 Correcciones sugeridas:`);
                validation.fixes.forEach(fix => console.log(`   • ${fix}`));
                console.log('');
                results.errors++;
                
                // Intentar corrección automática
                if (fixHTML(file)) {
                    results.fixed++;
                    console.log(`🎯 ${file}: Corregido automáticamente\n`);
                }
            }
        } else {
            console.log(`⚠️  ${file}: Archivo no encontrado\n`);
        }
    } catch (error) {
        console.error(`💥 Error procesando ${file}:`, error.message);
    }
});

console.log('📊 ===== RESUMEN DE AUDITORÍA =====');
console.log(`📁 Total archivos: ${results.total}`);
console.log(`✅ Válidos: ${results.valid}`);
console.log(`❌ Con errores: ${results.errors}`);
console.log(`🔧 Corregidos: ${results.fixed}`);
console.log(`📈 Porcentaje válido: ${((results.valid + results.fixed) / results.total * 100).toFixed(1)}%`);

if (results.fixed > 0) {
    console.log('\n💡 Se crearon backups con extensión .backup');
}

module.exports = { validateHTML, fixHTML };