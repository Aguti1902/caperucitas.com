import crypto from 'crypto';
import { Resend } from 'resend';

// Generar token único
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Inicializar Resend
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    const errorMsg = '❌ ERROR CRÍTICO: RESEND_API_KEY no está configurado. Los emails NO se enviarán.';
    console.error(errorMsg);
    console.error('Configura RESEND_API_KEY en las variables de entorno');
    console.error('Obtén tu API key en: https://resend.com/api-keys');
    throw new Error(errorMsg);
  }

  console.log('📧 Resend configurado correctamente');
  return new Resend(apiKey);
};

// Enviar email de verificación
export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  console.log(`\n📧 ========================================`);
  console.log(`📧 ENVIANDO EMAIL DE VERIFICACIÓN`);
  console.log(`📧 Destinatario: ${email}`);
  console.log(`📧 ========================================`);

  const rawFrontendUrl = process.env.FRONTEND_URL || 'https://caperucitas.com';
  const frontendUrl = rawFrontendUrl.split(',')[0].trim();
  const verificationUrl = `${frontendUrl}/verify-email/${token}`;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Caperucitas <noreply@caperucitas.com>';

  console.log(`📧 URL de verificación: ${verificationUrl}`);
  console.log(`📧 From: ${fromEmail}`);

  const resend = getResendClient();

  const result = await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: 'Verifica tu cuenta en Caperucitas.com',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #c8102e; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #c8102e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐺 Caperucitas.com</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Gracias por registrarte en <strong>Caperucitas.com</strong>.</p>
            <p>Para activar tu anuncio, verifica tu cuenta haciendo clic en el botón:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verificar mi cuenta</a>
            </div>
            <p>O copia este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666; font-size: 13px;">${verificationUrl}</p>
            <p><strong>Este enlace expira en 24 horas.</strong></p>
            <p style="color: #999; font-size: 13px;">Si no creaste esta cuenta, ignora este email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Caperucitas.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  console.log('🔍 Respuesta de Resend:', JSON.stringify(result));

  if (result.error) {
    console.error('❌ Error de Resend:', JSON.stringify(result.error));
    throw new Error(`Resend error: ${JSON.stringify(result.error)}`);
  }

  console.log(`✅ Email enviado correctamente a: ${email} (ID: ${result.data?.id})`);
};

// Enviar email de bienvenida
export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  console.log(`\n🎉 Enviando email de bienvenida a: ${email}`);
  
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || '9citas <onboarding@resend.dev>';

  const result = await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: '¡Bienvenido a 9citas!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fc4d5c 0%, #ff6b7a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a 9citas!</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${name}</strong>,</p>
            <p>¡Tu cuenta ha sido verificada exitosamente!</p>
            <p>Ya puedes empezar a:</p>
            <ul>
              <li>📸 Subir tus fotos</li>
              <li>👥 Explorar perfiles cerca de ti</li>
              <li>💬 Chatear con otros usuarios</li>
              <li>❤️ Dar me gusta y hacer match</li>
            </ul>
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'https://9citas.com'}" style="display: inline-block; background: #fc4d5c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">Empezar a conectar</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2024 9citas.com - Conoce chicas y chicos cerca de ti</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  console.log(`✅ Email de bienvenida enviado exitosamente a: ${email} (ID: ${result.data?.id})\n`);
};

// Enviar email de recuperación de contraseña
export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  console.log(`\n🔑 Enviando email de recuperación de contraseña a: ${email}`);

  const frontendUrl = process.env.FRONTEND_URL || 'https://9citas.com';
  const resetUrl = `${frontendUrl}/reset-password/${token}`;
  const fromEmail = process.env.RESEND_FROM_EMAIL || '9citas <onboarding@resend.dev>';

  const resend = getResendClient();

  const result = await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: 'Recupera tu contraseña de 9citas',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fc4d5c 0%, #ff6b7a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #fc4d5c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔑 Recuperación de contraseña</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña en <strong>Caperucitas.com</strong>.</p>
            <p>Para crear una nueva contraseña, haz click en el siguiente botón:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer mi contraseña</a>
            </div>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <div class="warning">
              <p><strong>⏰ Este enlace expira en 1 hora.</strong></p>
            </div>
            <p>Si no solicitaste este cambio, puedes ignorar este email de forma segura. Tu contraseña permanecerá sin cambios.</p>
          </div>
          <div class="footer">
            <p>© 2025 Caperucitas.com - Solo para adultos</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  console.log(`✅ Email de recuperación enviado exitosamente a: ${email} (ID: ${result.data?.id})\n`);
};

/** Enviar email recordatorio de suscripción a punto de expirar */
export const sendSubscriptionReminderEmail = async (email: string, expiresAt: Date): Promise<void> => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Caperucitas <noreply@caperucitas.com>';
  const frontendUrl = (process.env.FRONTEND_URL || 'https://caperucitas.com').split(',')[0].trim();
  const resend = getResendClient();

  const diasRestantes = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: `⏰ Tu suscripción en Caperucitas.com expira en ${diasRestantes} días`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Tu suscripción expira pronto</h1>
            <p>Caperucitas.com</p>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Te avisamos que tu suscripción en <strong>Caperucitas.com</strong> expirará en <strong>${diasRestantes} días</strong> (el ${expiresAt.toLocaleDateString('es-ES')}).</p>
            <p>Para mantener tu perfil activo y visible, renueva tu suscripción antes de que expire:</p>
            <div style="text-align: center;">
              <a href="${frontendUrl}/app/plus" class="button">Renovar mi suscripción</a>
            </div>
            <p>Si no renuevas, tu perfil dejará de mostrarse en el listado.</p>
          </div>
          <div class="footer">
            <p>© 2025 Caperucitas.com - Solo para adultos</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

/** Aviso: el anuncio Sexo gratis caduca pronto */
export const sendListingExpiryReminderEmail = async (
  email: string,
  expiresAt: Date,
  profileTitle: string
): Promise<void> => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Caperucitas <noreply@caperucitas.com>';
  const frontendUrl = (process.env.FRONTEND_URL || 'https://caperucitas.com').split(',')[0].trim();
  const resend = getResendClient();
  const diasRestantes = Math.max(
    1,
    Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: `Tu perfil Sexo gratis caduca en ${diasRestantes} días`,
    html: `
      <!DOCTYPE html>
      <html><body style="font-family:Arial,sans-serif;color:#333">
        <div style="max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#059669;color:white;padding:24px;border-radius:10px 10px 0 0;text-align:center">
            <h1 style="margin:0">Tu anuncio va a caducar</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 10px 10px">
            <p>Hola${profileTitle ? `, <strong>${profileTitle}</strong>` : ''},</p>
            <p>Tu perfil de <strong>Sexo gratis</strong> dejará de aparecer en las búsquedas el
              <strong>${expiresAt.toLocaleDateString('es-ES')}</strong> (en ${diasRestantes} días).</p>
            <p>Entra y pulsa <strong>Renovar gratis</strong> para seguir activo 90 días más, sin rellenar datos.</p>
            <p style="text-align:center;margin:28px 0">
              <a href="${frontendUrl}/app/edit-profile"
                 style="background:#059669;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold">
                Renovar gratis
              </a>
            </p>
            <p style="font-size:13px;color:#666">También puedes contratar Premium (20€ / 3 meses) para mostrar teléfono/WhatsApp y salir en el carrusel.</p>
          </div>
        </div>
      </body></html>
    `,
  });
};

/** Email al recibir un mensaje de contacto sin cuenta (PDF: copy invitados) */
export const sendGuestContactMessageEmail = async (
  toEmail: string,
  profileTitle: string,
  guestName: string,
  messagePreview: string
): Promise<void> => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Caperucitas <noreply@caperucitas.com>';
  const frontendUrl = (process.env.FRONTEND_URL || 'https://caperucitas.com').split(',')[0].trim();
  const resend = getResendClient();
  const preview = messagePreview.slice(0, 180).replace(/</g, '&lt;');

  await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: `Nuevo mensaje en Caperucitas${profileTitle ? ` — ${profileTitle}` : ''}`,
    html: `
      <!DOCTYPE html>
      <html><body style="font-family:Arial,sans-serif;color:#333">
        <div style="max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#dc2626;color:white;padding:24px;border-radius:10px 10px 0 0;text-align:center">
            <h1 style="margin:0;font-size:22px">Tienes un mensaje nuevo</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 10px 10px">
            <p>Hola${profileTitle ? `, <strong>${profileTitle}</strong>` : ''},</p>
            <p><strong>${guestName}</strong> te ha escrito desde tu anuncio en Caperucitas.com.</p>
            <blockquote style="margin:16px 0;padding:12px 16px;background:#fff;border-left:4px solid #dc2626;color:#444">
              ${preview}${messagePreview.length > 180 ? '…' : ''}
            </blockquote>
            <p>Entra en tu bandeja para leerlo y responder.</p>
            <p style="text-align:center;margin:28px 0">
              <a href="${frontendUrl}/app/messages"
                 style="background:#dc2626;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold">
                Ver mensajes
              </a>
            </p>
            <p style="font-size:13px;color:#666">
              Si tu anuncio es gratis, el contacto es solo por mensaje. Con Premium (20€/mes) también puedes mostrar teléfono y WhatsApp.
            </p>
          </div>
        </div>
      </body></html>
    `,
  });
};

/** Recordatorio de inactividad: entra a tu perfil (cada ~30 días) */
export const sendInactivityReminderEmail = async (
  email: string,
  profileTitle: string,
  daysInactive: number,
  warningNearPause: boolean
): Promise<void> => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Caperucitas <noreply@caperucitas.com>';
  const frontendUrl = (process.env.FRONTEND_URL || 'https://caperucitas.com').split(',')[0].trim();
  const resend = getResendClient();

  const subject = warningNearPause
    ? `Tu anuncio puede pausarse pronto — entra a Caperucitas`
    : `Te echamos de menos en Caperucitas`;

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
      <html><body style="font-family:Arial,sans-serif;color:#333">
        <div style="max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#111827;color:white;padding:24px;border-radius:10px 10px 0 0;text-align:center">
            <h1 style="margin:0;font-size:22px">Entra a tu perfil</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 10px 10px">
            <p>Hola${profileTitle ? `, <strong>${profileTitle}</strong>` : ''},</p>
            <p>Llevas unos <strong>${daysInactive} días</strong> sin entrar en Caperucitas.</p>
            ${
              warningNearPause
                ? `<p style="color:#b45309"><strong>Aviso:</strong> si no entras pronto (cerca de 90 días de inactividad), tu anuncio podría pausarse automáticamente.</p>`
                : `<p>Entra de vez en cuando para que tu anuncio siga activo y veas mensajes nuevos.</p>`
            }
            <p style="text-align:center;margin:28px 0">
              <a href="${frontendUrl}/app/edit-profile"
                 style="background:#dc2626;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold">
                Entrar a mi perfil
              </a>
            </p>
            <p style="font-size:13px;color:#666">Mantener tu anuncio es gratis. Premium (20€/mes) muestra teléfono y WhatsApp en público.</p>
          </div>
        </div>
      </body></html>
    `,
  });
};

