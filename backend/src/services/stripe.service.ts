import Stripe from 'stripe';
import prisma from '../lib/prisma';


// Inicializar Stripe solo si la clave está configurada
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY no configurada. Las funciones de pago no estarán disponibles.');
}

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-11-17.clover',
    })
  : null as any; // Type assertion para evitar errores de tipo cuando no está configurado

// Precios configurados
export const STRIPE_PRICES = {
  // 9Plus - Suscripción mensual (5€/mes)
  SUBSCRIPTION_MONTHLY: process.env.STRIPE_PRICE_ID_SUBSCRIPTION || 'price_subscription_monthly',
  
  // RoAM - Boost de 1 hora (6.49€)
  ROAM_1_HOUR: process.env.STRIPE_PRICE_ID_ROAM_1H || 'price_roam_1h',
  
  // RoAM - Boost de 2 horas (11.99€)
  ROAM_2_HOURS: process.env.STRIPE_PRICE_ID_ROAM_2H || 'price_roam_2h',
  
  // RoAM - Boost de 4 horas (19.99€)
  ROAM_4_HOURS: process.env.STRIPE_PRICE_ID_ROAM_4H || 'price_roam_4h',
};

// Crear o obtener cliente de Stripe
export const getOrCreateStripeCustomer = async (userId: string, email: string) => {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en las variables de entorno.');
  }

  // Buscar si ya tiene un customerId
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (subscription?.stripeCustomerId) {
    // Verificar que el customer existe en Stripe
    try {
      const customer = await stripe.customers.retrieve(subscription.stripeCustomerId);
      if (customer && !customer.deleted) {
        return customer as Stripe.Customer;
      }
    } catch (error) {
      console.log('Customer no existe en Stripe, creando uno nuevo');
    }
  }

  // Crear nuevo customer en Stripe
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  // Guardar customerId en la base de datos
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      stripeCustomerId: customer.id,
    },
    create: {
      userId,
      plan: '9plus',
      isActive: false,
      stripeCustomerId: customer.id,
    },
  });

  return customer;
};

// Crear sesión de checkout para suscripción
export const createSubscriptionCheckoutSession = async (
  userId: string,
  email: string,
  successUrl: string,
  cancelUrl: string
) => {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en las variables de entorno.');
  }

  const customer = await getOrCreateStripeCustomer(userId, email);

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: STRIPE_PRICES.SUBSCRIPTION_MONTHLY,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      type: 'subscription',
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });

  return session;
};

// Crear sesión de checkout para RoAM
export const createRoamCheckoutSession = async (
  userId: string,
  profileId: string,
  email: string,
  duration: number, // minutos
  successUrl: string,
  cancelUrl: string
) => {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en las variables de entorno.');
  }

  const customer = await getOrCreateStripeCustomer(userId, email);

  // Determinar precio según duración
  let priceId: string;
  let price: number;
  
  if (duration === 60) {
    priceId = STRIPE_PRICES.ROAM_1_HOUR;
    price = 6.49;
  } else if (duration === 120) {
    priceId = STRIPE_PRICES.ROAM_2_HOURS;
    price = 11.99;
  } else if (duration === 240) {
    priceId = STRIPE_PRICES.ROAM_4_HOURS;
    price = 19.99;
  } else {
    // Default: 1 hora
    priceId = STRIPE_PRICES.ROAM_1_HOUR;
    price = 6.49;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `RoAM Boost - ${duration} minutos`,
            description: `Aumenta tu visibilidad durante ${duration} minutos`,
          },
          unit_amount: Math.round(price * 100), // Convertir a céntimos
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      profileId,
      type: 'roam',
      duration: duration.toString(),
      price: price.toString(),
    },
  });

  return session;
};

// Crear Payment Intent para RoAM (pago único embebido)
export const createRoamPaymentIntent = async (
  userId: string,
  profileId: string,
  email: string,
  duration: number // minutos
) => {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en las variables de entorno.');
  }

  const customer = await getOrCreateStripeCustomer(userId, email);

  // Determinar precio según duración
  let price: number;
  
  if (duration === 60) {
    price = 6.49;
  } else if (duration === 120) {
    price = 11.99;
  } else if (duration === 240) {
    price = 19.99;
  } else {
    // Default: 1 hora
    price = 6.49;
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(price * 100), // Convertir a céntimos
    currency: 'eur',
    customer: customer.id,
    metadata: {
      userId,
      profileId,
      type: 'roam',
      duration: duration.toString(),
      price: price.toString(),
    },
  });

  return paymentIntent;
};

// Crear Setup Intent y suscripción para 9Plus (suscripción embebida)
export const createSubscriptionSetupIntent = async (
  userId: string,
  email: string
) => {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en las variables de entorno.');
  }

  const customer = await getOrCreateStripeCustomer(userId, email);

  // Crear Setup Intent para guardar método de pago
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    payment_method_types: ['card'],
    metadata: {
      userId,
      type: 'subscription',
    },
  });

  return setupIntent;
};

// Confirmar suscripción después de guardar método de pago
export const confirmSubscriptionWithPaymentMethod = async (
  userId: string,
  paymentMethodId: string
) => {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en las variables de entorno.');
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error('Cliente de Stripe no encontrado');
  }

  // Adjuntar el método de pago al cliente como método por defecto
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: subscription.stripeCustomerId,
  });

  // Establecer como método de pago por defecto
  await stripe.customers.update(subscription.stripeCustomerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  // Crear suscripción con el método de pago guardado
  const stripeSubscription = await stripe.subscriptions.create({
    customer: subscription.stripeCustomerId,
    items: [
      {
        price: STRIPE_PRICES.SUBSCRIPTION_MONTHLY,
      },
    ],
    default_payment_method: paymentMethodId,
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      userId,
    },
  });

  // Si la primera factura requiere pago inmediato, confirmarlo
  const invoice = stripeSubscription.latest_invoice as Stripe.Invoice;
  if (invoice && (invoice as any).payment_intent) {
    const paymentIntentId = (invoice as any).payment_intent;
    const paymentIntent = typeof paymentIntentId === 'string'
      ? await stripe.paymentIntents.retrieve(paymentIntentId)
      : paymentIntentId;
    
    // Si el payment intent no está confirmado, confirmarlo
    if (paymentIntent && paymentIntent.status === 'requires_confirmation') {
      await stripe.paymentIntents.confirm(paymentIntent.id);
    }
  }

  return stripeSubscription;
};

// Manejar webhook de Stripe
export const handleStripeWebhook = async (event: Stripe.Event) => {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en las variables de entorno.');
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentSucceeded(paymentIntent);
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdate(subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCanceled(subscription);
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaymentSucceeded(invoice);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaymentFailed(invoice);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

// Manejar Payment Intent exitoso (pagos embebidos)
const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
  const metadata = paymentIntent.metadata;
  if (!metadata) return;

  const type = metadata.type;

  if (type === 'roam') {
    const userId = metadata.userId;
    const profileId = metadata.profileId;
    const duration = parseInt(metadata.duration || '60');
    const price = parseFloat(metadata.price || '6.49');

    // Activar RoAM
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    // Actualizar perfil
    await prisma.profile.update({
      where: { id: profileId },
      data: {
        isRoaming: true,
        roamingUntil: endTime,
      },
    });

    // Crear sesión de RoAM
    const previousSession = await prisma.roamSession.findFirst({
      where: {
        profileId,
        isActive: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const currentViews = previousSession
      ? (previousSession.viewsBeforeRoam + (previousSession.viewsDuringRoam || 0))
      : 0;

    const currentLikes = await prisma.like.count({
      where: { toProfileId: profileId },
    });

    await prisma.roamSession.create({
      data: {
        profileId,
        startTime,
        endTime,
        viewsBeforeRoam: currentViews,
        likesBeforeRoam: currentLikes,
        isActive: true,
      },
    });

    // Crear registro de compra
    await prisma.roamPurchase.create({
      data: {
        profileId,
        duration,
        price,
        startTime,
        endTime,
        stripeSessionId: paymentIntent.id,
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    console.log(`✅ RoAM activado para perfil ${profileId} (${duration} minutos) via Payment Intent`);
  }
};

// Manejar checkout completado
const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  const metadata = session.metadata;
  if (!metadata) return;

  const userId = metadata.userId;
  const type = metadata.type;

  if (type === 'subscription') {
    // La suscripción se manejará en el evento customer.subscription.created
    console.log(`✅ Checkout de suscripción completado para usuario ${userId}`);
  } else if (type === 'roam') {
    const profileId = metadata.profileId;
    const duration = parseInt(metadata.duration || '60');
    const price = parseFloat(metadata.price || '6.49');

    // Activar RoAM
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    // Actualizar perfil
    await prisma.profile.update({
      where: { id: profileId },
      data: {
        isRoaming: true,
        roamingUntil: endTime,
      },
    });

    // Crear sesión de RoAM
    const previousSession = await prisma.roamSession.findFirst({
      where: {
        profileId,
        isActive: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const currentViews = previousSession
      ? (previousSession.viewsBeforeRoam + (previousSession.viewsDuringRoam || 0))
      : 0;

    const currentLikes = await prisma.like.count({
      where: { toProfileId: profileId },
    });

    await prisma.roamSession.create({
      data: {
        profileId,
        startTime,
        endTime,
        viewsBeforeRoam: currentViews,
        likesBeforeRoam: currentLikes,
        isActive: true,
      },
    });

    // Crear registro de compra
    await prisma.roamPurchase.create({
      data: {
        profileId,
        duration,
        price,
        startTime,
        endTime,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string || null,
      },
    });

    console.log(`✅ RoAM activado para perfil ${profileId} (${duration} minutos)`);
  }
};

// Manejar actualización de suscripción
const handleSubscriptionUpdate = async (subscription: Stripe.Subscription) => {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId en metadata de suscripción');
    return;
  }

  const isActive = subscription.status === 'active';
  // Acceder a las propiedades del periodo de facturación
  const currentPeriodStart = (subscription as any).current_period_start;
  const currentPeriodEnd = (subscription as any).current_period_end;
  const startDate = currentPeriodStart 
    ? new Date(currentPeriodStart * 1000)
    : new Date();
  const endDate = currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000)
    : new Date();

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      isActive,
      startDate,
      endDate,
      stripeSubscriptionId: subscription.id,
      stripeStatus: subscription.status,
      stripePriceId: subscription.items.data[0]?.price.id || null,
    },
    create: {
      userId,
      plan: '9plus',
      isActive,
      startDate,
      endDate,
      stripeSubscriptionId: subscription.id,
      stripeStatus: subscription.status,
      stripePriceId: subscription.items.data[0]?.price.id || null,
    },
  });

  console.log(`✅ Suscripción ${subscription.status} para usuario ${userId}`);
};

// Manejar cancelación de suscripción
const handleSubscriptionCanceled = async (subscription: Stripe.Subscription) => {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId en metadata de suscripción');
    return;
  }

  // Cuando Stripe envía customer.subscription.deleted, significa que el período terminó
  // En este punto, desactivamos la suscripción
  const currentPeriodEnd = (subscription as any).current_period_end;
  const endDate = currentPeriodEnd 
    ? new Date(currentPeriodEnd * 1000)
    : new Date();

  await prisma.subscription.update({
    where: { userId },
    data: {
      isActive: false, // Ahora sí desactivamos porque el período terminó
      stripeStatus: 'canceled',
      endDate,
    },
  });

  console.log(`❌ Suscripción cancelada y desactivada para usuario ${userId} (período terminado)`);
};

// Manejar pago de factura exitoso
const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice) => {
  // invoice.subscription puede ser string o Subscription object
  const subscriptionId = typeof (invoice as any).subscription === 'string' 
    ? (invoice as any).subscription 
    : (invoice as any).subscription?.id;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdate(subscription);
};

// Manejar pago de factura fallido
const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  // invoice.subscription puede ser string o Subscription object
  const subscriptionId = typeof (invoice as any).subscription === 'string' 
    ? (invoice as any).subscription 
    : (invoice as any).subscription?.id;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Actualizar estado a past_due
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      isActive: false,
      stripeStatus: 'past_due',
    },
  });

  console.log(`⚠️ Pago fallido para suscripción ${subscriptionId}`);
};

