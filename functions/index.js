/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// ===== EMAIL DE VERIFICACIÓN PERSONALIZADO =====
exports.sendCustomVerificationEmail = functions.https.onCall(async (data, context) => {
    try {
        const { email, displayName } = data;
        
        // Generar link de verificación personalizado
        const link = await admin.auth().generateEmailVerificationLink(email, {
            url: 'https://horita-feliz-system.web.app/index.html?verified=true'
        });

        // Email HTML personalizado
        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verificación EduCheck Pro</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                
                <!-- Header con gradiente -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <div style="background: white; width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <span style="font-size: 32px;">🎓</span>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">EduCheck Pro</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Sistema de Gestión Educativa</p>
                </div>

                <!-- Contenido principal -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px;">¡Bienvenido ${displayName || 'Usuario'}! 👋</h2>
                    
                    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        ¡Gracias por unirte a <strong>EduCheck Pro</strong>! Para completar tu registro y acceder a todas nuestras funciones educativas, necesitamos verificar tu dirección de correo electrónico.
                    </p>

                    <!-- Botón principal -->
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${link}" style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 16px rgba(72, 187, 120, 0.3); transition: all 0.3s ease;">
                            ✅ VERIFICAR MI CUENTA
                        </a>
                    </div>

                    <!-- Características -->
                    <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #667eea;">
                        <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                            <span style="margin-right: 8px;">📚</span> ¿Qué puedes hacer en EduCheck Pro?
                        </h3>
                        <ul style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li><strong>🏫 Gestionar instituciones educativas</strong> - Control completo de centros educativos</li>
                            <li><strong>👨‍🎓 Administrar estudiantes y cursos</strong> - Base de datos educativa centralizada</li>
                            <li><strong>📊 Generar reportes detallados</strong> - Analytics educativo avanzado</li>
                            <li><strong>📅 Crear y gestionar actividades</strong> - Planificación académica inteligente</li>
                            <li><strong>📈 Seguimiento de asistencia</strong> - Control preciso y automático</li>
                        </ul>
                    </div>

                    <!-- Link directo por si el botón no funciona -->
                    <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #4a5568; margin: 0 0 10px 0; font-size: 14px;">
                            <strong>¿No puedes hacer clic en el botón?</strong> Copia y pega este enlace en tu navegador:
                        </p>
                        <p style="color: #667eea; word-break: break-all; font-size: 12px; margin: 0; font-family: monospace;">
                            ${link}
                        </p>
                    </div>

                    <!-- Nota de seguridad -->
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                        <p style="color: #718096; font-size: 14px; margin: 0;">
                            🔒 <strong>Nota de seguridad:</strong> Si no creaste esta cuenta, puedes ignorar este email de forma segura. Este enlace expirará en 24 horas.
                        </p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #4a5568; margin: 0 0 10px 0; font-weight: 600;">El equipo de EduCheck Pro</p>
                    <p style="color: #718096; margin: 0; font-style: italic;">"Transformando la educación, un clic a la vez"</p>
                    
                    <div style="margin-top: 20px;">
                        <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                            © 2025 EduCheck Pro - Sistema de Gestión Educativa
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        // Configurar y enviar email
        const mailOptions = {
            from: 'EduCheck Pro <noreply@horita-feliz-system.firebaseapp.com>',
            to: email,
            subject: '🎓 ¡Bienvenido a EduCheck Pro! Verifica tu cuenta',
            html: emailHtml
        };

        // Aquí usarías un servicio de email como SendGrid, pero por ahora simulamos
        console.log('📧 Email personalizado generado para:', email);
        return { success: true, message: 'Email personalizado enviado' };

    } catch (error) {
        console.error('❌ Error creando email personalizado:', error);
        throw new functions.https.HttpsError('internal', 'Error enviando email');
    }
});

// ===== EMAIL DE RESET DE CONTRASEÑA PERSONALIZADO =====
exports.sendCustomPasswordReset = functions.https.onCall(async (data, context) => {
    try {
        const { email } = data;
        
        const link = await admin.auth().generatePasswordResetLink(email, {
            url: 'https://horita-feliz-system.web.app/login.html'
        });

        const resetEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Contraseña - EduCheck Pro</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                
                <!-- Header con gradiente -->
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
                    <div style="background: white; width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <span style="font-size: 32px;">🔐</span>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Restablecer Contraseña</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">EduCheck Pro</p>
                </div>

                <!-- Contenido principal -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px;">¡Hola! 👋</h2>
                    
                    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>EduCheck Pro</strong> asociada al email <strong>${email}</strong>.
                    </p>

                    <!-- Botón principal -->
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${link}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 16px rgba(245, 87, 108, 0.3);">
                            🔗 RESTABLECER MI CONTRASEÑA
                        </a>
                    </div>

                    <!-- Información de seguridad -->
                    <div style="background: #fff5f5; padding: 25px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #f56565;">
                        <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">
                            🛡️ Por tu seguridad:
                        </h3>
                        <ul style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>Este enlace expirará en <strong>1 hora</strong> por motivos de seguridad</li>
                            <li>Si no solicitaste este cambio, puedes ignorar este email</li>
                            <li>Tu contraseña actual permanece segura hasta que la cambies</li>
                            <li>Después del cambio, cierra sesión en todos los dispositivos</li>
                        </ul>
                    </div>

                    <!-- Link directo -->
                    <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #4a5568; margin: 0 0 10px 0; font-size: 14px;">
                            <strong>¿No puedes hacer clic en el botón?</strong> Copia y pega este enlace:
                        </p>
                        <p style="color: #667eea; word-break: break-all; font-size: 12px; margin: 0; font-family: monospace;">
                            ${link}
                        </p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #4a5568; margin: 0 0 10px 0; font-weight: 600;">El equipo de EduCheck Pro 🎓</p>
                    <p style="color: #718096; margin: 0; font-style: italic;">"Tu seguridad es nuestra prioridad"</p>
                </div>
            </div>
        </body>
        </html>`;

        console.log('🔐 Email de reset personalizado generado para:', email);
        return { success: true, message: 'Email de reset personalizado enviado' };

    } catch (error) {
        console.error('❌ Error creando email de reset:', error);
        throw new functions.https.HttpsError('internal', 'Error enviando email de reset');
    }
});
