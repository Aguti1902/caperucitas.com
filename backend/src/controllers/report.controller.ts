import { Response } from 'express';
import prisma from '../lib/prisma';
import nodemailer from 'nodemailer';
import { AuthRequest } from '../middleware/auth.middleware';


// Configurar el transporter de nodemailer (usa las credenciales del .env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Umbrales para enviar emails
const EMAIL_THRESHOLDS = [15, 30, 45, 60];

/**
 * Crear una denuncia
 */
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const reporterProfileId = req.profileId;
    const { reportedProfileId, reason } = req.body;

    if (!reporterProfileId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Validar que el motivo sea válido
    const validReasons = ['scam', 'inappropriate_photos', 'money_request', 'fake_photos', 'underage', 'hate_speech'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Motivo de denuncia inválido' });
    }

    // No puede denunciarse a sí mismo
    if (reporterProfileId === reportedProfileId) {
      return res.status(400).json({ error: 'No puedes denunciarte a ti mismo' });
    }

    // Verificar que el perfil denunciado existe
    const reportedProfile = await prisma.profile.findUnique({
      where: { id: reportedProfileId },
    });

    if (!reportedProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // Verificar si ya denunció a este perfil
    const existingReport = await prisma.report.findUnique({
      where: {
        reporterProfileId_reportedProfileId: {
          reporterProfileId,
          reportedProfileId,
        },
      },
    });

    if (existingReport) {
      return res.status(400).json({ error: 'Ya has denunciado este perfil' });
    }

    // Crear la denuncia
    const report = await prisma.report.create({
      data: {
        reporterProfileId,
        reportedProfileId,
        reason,
      },
    });

    // Contar total de denuncias para este perfil
    const totalReports = await prisma.report.count({
      where: {
        reportedProfileId,
      },
    });

    // Enviar email si alcanza un umbral
    if (EMAIL_THRESHOLDS.includes(totalReports)) {
      await sendReportEmail(reportedProfileId, totalReports);
    }

    res.status(201).json({
      message: 'Denuncia enviada correctamente',
      report,
    });
  } catch (error) {
    console.error('Error al crear denuncia:', error);
    res.status(500).json({ error: 'Error al crear denuncia' });
  }
};

/**
 * Obtener número de denuncias de un perfil (total y por motivo)
 */
export const getReportCount = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;

    // Contar total
    const totalCount = await prisma.report.count({
      where: {
        reportedProfileId: profileId,
      },
    });

    // Contar por motivo
    const reports = await prisma.report.findMany({
      where: {
        reportedProfileId: profileId,
      },
      select: {
        reason: true,
      },
    });

    const countsByReason: Record<string, number> = {
      scam: 0,
      inappropriate_photos: 0,
      money_request: 0,
      fake_photos: 0,
      underage: 0,
      hate_speech: 0,
    };

    reports.forEach((report) => {
      if (countsByReason.hasOwnProperty(report.reason)) {
        countsByReason[report.reason]++;
      }
    });

    res.json({
      total: totalCount,
      byReason: countsByReason,
    });
  } catch (error) {
    console.error('Error al obtener denuncias:', error);
    res.status(500).json({ error: 'Error al obtener denuncias' });
  }
};

/**
 * Verificar si el usuario actual ya denunció un perfil
 */
export const checkIfReported = async (req: AuthRequest, res: Response) => {
  try {
    const reporterProfileId = req.profileId;
    const { profileId } = req.params;

    if (!reporterProfileId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const report = await prisma.report.findUnique({
      where: {
        reporterProfileId_reportedProfileId: {
          reporterProfileId,
          reportedProfileId: profileId,
        },
      },
    });

    res.json({ hasReported: !!report });
  } catch (error) {
    console.error('Error al verificar denuncia:', error);
    res.status(500).json({ error: 'Error al verificar denuncia' });
  }
};

/**
 * Enviar email de alerta cuando se alcanza un umbral
 */
async function sendReportEmail(reportedProfileId: string, totalReports: number) {
  try {
    // Obtener info del perfil denunciado
    const profile = await prisma.profile.findUnique({
      where: { id: reportedProfileId },
      include: {
        user: true,
        photos: {
          where: { type: 'cover' },
          take: 1,
        },
        reportsReceived: {
          include: {
            reporterProfile: true,
          },
        },
      },
    });

    if (!profile) return;

    // Contar denuncias por motivo
    const reportsByReason: Record<string, number> = {};
    profile.reportsReceived.forEach((report) => {
      reportsByReason[report.reason] = (reportsByReason[report.reason] || 0) + 1;
    });

    const reasonLabels: Record<string, string> = {
      scam: 'Engaño o estafa',
      inappropriate_photos: 'Fotos públicas inapropiadas',
      money_request: 'Pide dinero a cambio de sexo',
      fake_photos: 'Fotos falsas',
      underage: 'Es menor de edad',
      hate_speech: 'Mensajes ofensivos o discriminatorios',
    };

    const reasonsList = Object.entries(reportsByReason)
      .map(([reason, count]) => `- ${reasonLabels[reason] || reason}: ${count} vez/veces`)
      .join('\n');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ff4444; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">⚠️ ALERTA DE DENUNCIAS - 9citas.com</h2>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px;">
          <p><strong>Un perfil ha alcanzado ${totalReports} denuncias.</strong></p>
          
          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <h3 style="margin-top: 0;">📋 Información del perfil denunciado:</h3>
            <p><strong>ID:</strong> ${profile.id}</p>
            <p><strong>Email:</strong> ${profile.user?.email || 'No disponible'}</p>
            <p><strong>Título:</strong> ${profile.title}</p>
            <p><strong>Edad:</strong> ${profile.age} años</p>
            <p><strong>Ciudad:</strong> ${profile.city}</p>
            <p><strong>Orientación:</strong> ${profile.orientation}</p>
          </div>

          <div style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <h3 style="margin-top: 0;">🚨 Motivos de las denuncias:</h3>
            <pre style="white-space: pre-line; font-family: inherit;">${reasonsList}</pre>
          </div>

          <p style="margin-top: 20px;">
            <strong>Acción recomendada:</strong> Revisar el perfil y tomar las medidas necesarias.
          </p>

          <a href="https://9citas.com/admin/perfil/${profile.id}" 
             style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            Ver perfil en administración
          </a>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>Este es un email automático de 9citas.com</p>
          <p>Se envían alertas en los umbrales: 15, 30, 45 y 60 denuncias</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"9citas - Sistema de Denuncias" <${process.env.SMTP_USER}>`,
      to: process.env.REPORTS_EMAIL || process.env.SMTP_USER, // Email de denuncias
      subject: `⚠️ ALERTA: Perfil con ${totalReports} denuncias - Revisar urgente`,
      html: emailContent,
    });

    console.log(`✅ Email de denuncia enviado para perfil ${reportedProfileId} (${totalReports} denuncias)`);
  } catch (error) {
    console.error('Error al enviar email de denuncia:', error);
  }
}

