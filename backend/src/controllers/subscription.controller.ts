import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { stripe } from '../services/stripe.service';


// Obtener suscripción actual
export const getSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId! },
    });

    res.json({
      subscription: subscription || null,
      isActive: subscription?.isActive || false,
    });
  } catch (error) {
    console.error('Error al obtener suscripción:', error);
    res.status(500).json({ error: 'Error al obtener suscripción' });
  }
};

// Activar suscripción 9Plus (simulado - en producción integrar con pasarela de pago)
export const activateSubscription = async (req: AuthRequest, res: Response) => {
  try {
    // TODO: Integrar con pasarela de pago real (Stripe, PayPal, etc.)
    // Por ahora simulamos la activación

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 mes

    const subscription = await prisma.subscription.upsert({
      where: { userId: req.userId! },
      update: {
        plan: '9plus',
        isActive: true,
        startDate,
        endDate,
      },
      create: {
        userId: req.userId!,
        plan: '9plus',
        isActive: true,
        startDate,
        endDate,
      },
    });

    res.json({
      message: 'Suscripción 9Plus activada exitosamente',
      subscription,
    });
  } catch (error) {
    console.error('Error al activar suscripción:', error);
    res.status(500).json({ error: 'Error al activar suscripción' });
  }
};

// Cancelar suscripción
export const cancelSubscription = async (req: AuthRequest, res: Response) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe no está configurado' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId! },
    });

    if (!subscription || !subscription.isActive) {
      return res.status(400).json({ error: 'No tienes una suscripción activa' });
    }

    // Si hay una suscripción de Stripe activa, cancelarla al final del período
    if (subscription.stripeSubscriptionId) {
      try {
        // Cancelar la suscripción en Stripe al final del período actual
        // Esto mantiene la suscripción activa hasta que termine el período de facturación
        const canceledSubscription = await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            cancel_at_period_end: true,
          }
        );
        
        // Actualizar estado: mantener isActive como true hasta que termine el período
        // El stripeStatus puede ser 'active' pero cancel_at_period_end será true
        await prisma.subscription.update({
          where: { userId: req.userId! },
          data: {
            // Mantener isActive en true - el usuario seguirá teniendo acceso
            stripeStatus: canceledSubscription.status,
            // Guardar el endDate del período actual
            endDate: canceledSubscription.current_period_end 
              ? new Date(canceledSubscription.current_period_end * 1000)
              : subscription.endDate,
          },
        });
      } catch (stripeError: any) {
        console.error('Error al cancelar suscripción en Stripe:', stripeError);
        // Si falla en Stripe, aún así marcamos como cancelada pero mantenemos acceso
        await prisma.subscription.update({
          where: { userId: req.userId! },
          data: {
            stripeStatus: 'canceled',
            // Mantener isActive hasta que expire el endDate
          },
        });
      }
    } else {
      // Si no hay suscripción de Stripe, mantener acceso hasta el endDate
      await prisma.subscription.update({
        where: { userId: req.userId! },
        data: {
          stripeStatus: 'canceled',
          // Mantener isActive: true hasta que expire endDate
        },
      });
    }

    res.json({ 
      message: 'Suscripción cancelada exitosamente',
      canceled: true,
    });
  } catch (error: any) {
    console.error('Error al cancelar suscripción:', error);
    res.status(500).json({ error: error.message || 'Error al cancelar suscripción' });
  }
};

