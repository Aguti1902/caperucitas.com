import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import {
  createSubscriptionCheckoutSession,
  createRoamCheckoutSession,
  createRoamPaymentIntent,
  createSubscriptionSetupIntent,
  confirmSubscriptionWithPaymentMethod,
  handleStripeWebhook,
} from '../services/stripe.service';
import { stripe } from '../services/stripe.service';


// Crear sesión de checkout para suscripción 9Plus
export const createSubscriptionCheckout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // URLs de éxito y cancelación
    const frontendUrl = process.env.FRONTEND_URL || 'https://9citas.com';
    const successUrl = `${frontendUrl}/app/plus?success=true`;
    const cancelUrl = `${frontendUrl}/app/plus?canceled=true`;

    // Crear sesión de checkout
    const session = await createSubscriptionCheckoutSession(
      req.userId,
      user.email,
      successUrl,
      cancelUrl
    );

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error al crear sesión de checkout de suscripción:', error);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
};

// Crear sesión de checkout para RoAM
export const createRoamCheckout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || !req.profileId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { duration = 60 } = req.body; // minutos

    // Validar duración
    const validDurations = [60, 120, 240]; // 1h, 2h, 4h
    if (!validDurations.includes(duration)) {
      return res.status(400).json({ error: 'Duración no válida. Opciones: 60, 120, 240 minutos' });
    }

    // Verificar que el usuario tiene 9Plus
    const profile = await prisma.profile.findUnique({
      where: { id: req.profileId },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const isPremium = profile.user?.subscription?.isActive || false;
    if (!isPremium) {
      return res.status(403).json({
        error: 'Necesitas 9Plus para usar RoAM',
        requiresPremium: true,
      });
    }

    // Verificar si ya tiene un RoAM activo
    if (profile.isRoaming && profile.roamingUntil && new Date(profile.roamingUntil) > new Date()) {
      return res.status(400).json({
        error: 'Ya tienes un RoAM activo',
        roamingUntil: profile.roamingUntil,
      });
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // URLs de éxito y cancelación
    const frontendUrl = process.env.FRONTEND_URL || 'https://9citas.com';
    const successUrl = `${frontendUrl}/app?roam=success`;
    const cancelUrl = `${frontendUrl}/app?roam=canceled`;

    // Crear sesión de checkout
    const session = await createRoamCheckoutSession(
      req.userId,
      req.profileId,
      user.email,
      duration,
      successUrl,
      cancelUrl
    );

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error al crear sesión de checkout de RoAM:', error);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
};

// Webhook de Stripe
export const stripeWebhook = async (req: any, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).send('No stripe-signature header');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET no configurado');
    return res.status(500).send('Webhook secret no configurado');
  }

  if (!stripe) {
    return res.status(500).send('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en las variables de entorno.');
  }

  let event;

  try {
    // req.body es un Buffer cuando usamos express.raw()
    const body = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Error al verificar webhook de Stripe:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await handleStripeWebhook(event);
    res.json({ received: true });
  } catch (error: any) {
    console.error('Error al procesar webhook:', error);
    res.status(500).json({ error: 'Error al procesar webhook' });
  }
};

// Obtener portal de cliente de Stripe (para gestionar suscripción)
export const createCustomerPortalSession = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Obtener suscripción
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId },
    });

    if (!subscription?.stripeCustomerId) {
      return res.status(404).json({ error: 'No tienes una suscripción activa' });
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Crear sesión del portal de cliente
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en las variables de entorno.' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://9citas.com';
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${frontendUrl}/app/plus`,
    });

    res.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error al crear sesión del portal de cliente:', error);
    res.status(500).json({ error: 'Error al crear sesión del portal' });
  }
};

// Obtener clave pública de Stripe
export const getStripePublishableKey = async (req: AuthRequest, res: Response) => {
  try {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      return res.status(500).json({ error: 'Stripe publishable key no configurada' });
    }

    res.json({ publishableKey });
  } catch (error: any) {
    console.error('Error al obtener clave pública de Stripe:', error);
    res.status(500).json({ error: 'Error al obtener clave pública' });
  }
};

// Crear Payment Intent para RoAM (embebido)
export const createRoamPaymentIntentController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || !req.profileId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { duration = 60 } = req.body; // minutos

    // Validar duración
    const validDurations = [60, 120, 240]; // 1h, 2h, 4h
    if (!validDurations.includes(duration)) {
      return res.status(400).json({ error: 'Duración no válida. Opciones: 60, 120, 240 minutos' });
    }

    // Verificar que el usuario tiene 9Plus
    const profile = await prisma.profile.findUnique({
      where: { id: req.profileId },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const isPremium = profile.user?.subscription?.isActive || false;
    if (!isPremium) {
      return res.status(403).json({
        error: 'Necesitas 9Plus para usar RoAM',
        requiresPremium: true,
      });
    }

    // Verificar si ya tiene un RoAM activo
    if (profile.isRoaming && profile.roamingUntil && new Date(profile.roamingUntil) > new Date()) {
      return res.status(400).json({
        error: 'Ya tienes un RoAM activo',
        roamingUntil: profile.roamingUntil,
      });
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Crear Payment Intent
    const paymentIntent = await createRoamPaymentIntent(
      req.userId,
      req.profileId,
      user.email,
      duration
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error al crear Payment Intent de RoAM:', error);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
};

// Crear Setup Intent para suscripción (embebido)
export const createSubscriptionSetupIntentController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Crear Setup Intent
    const setupIntent = await createSubscriptionSetupIntent(req.userId, user.email);

    res.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    });
  } catch (error: any) {
    console.error('Error al crear Setup Intent de suscripción:', error);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
};

// Confirmar suscripción con método de pago guardado
export const confirmSubscriptionController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'paymentMethodId es requerido' });
    }

    // Confirmar suscripción
    const subscription = await confirmSubscriptionWithPaymentMethod(
      req.userId,
      paymentMethodId
    );

    // Si la suscripción está activa, activarla en la base de datos inmediatamente
    if (subscription.status === 'active') {
      const currentPeriodStart = (subscription as any).current_period_start;
      const currentPeriodEnd = (subscription as any).current_period_end;
      const startDate = currentPeriodStart 
        ? new Date(currentPeriodStart * 1000)
        : new Date();
      const endDate = currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000)
        : new Date();

      await prisma.subscription.upsert({
        where: { userId: req.userId },
        update: {
          isActive: true,
          startDate,
          endDate,
          stripeSubscriptionId: subscription.id,
          stripeStatus: subscription.status,
          stripePriceId: subscription.items.data[0]?.price.id || null,
        },
        create: {
          userId: req.userId,
          plan: '9plus',
          isActive: true,
          startDate,
          endDate,
          stripeSubscriptionId: subscription.id,
          stripeStatus: subscription.status,
          stripePriceId: subscription.items.data[0]?.price.id || null,
        },
      });
    }

    res.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      isActive: subscription.status === 'active',
    });
  } catch (error: any) {
    console.error('Error al confirmar suscripción:', error);
    res.status(500).json({ error: error.message || 'Error al confirmar suscripción' });
  }
};

