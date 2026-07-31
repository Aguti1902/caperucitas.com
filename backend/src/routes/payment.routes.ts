import { Router } from 'express';
import { authenticateToken, requireProfile } from '../middleware/auth.middleware';
import {
  createSubscriptionCheckout,
  createRoamCheckout,
  stripeWebhook,
  createCustomerPortalSession,
  getStripePublishableKey,
  createRoamPaymentIntentController,
  createSexoGratisPremiumPaymentIntentController,
  createSubscriptionSetupIntentController,
  confirmSubscriptionController,
} from '../controllers/payment.controller';

const router = Router();

// Webhook de Stripe (NO requiere autenticación, usa firma de Stripe)
router.post('/webhook', stripeWebhook);

// Rutas protegidas
router.use(authenticateToken);

// Obtener clave pública de Stripe (para inicializar Stripe.js)
router.get('/publishable-key', getStripePublishableKey);

// Crear checkout para suscripción (método antiguo - redirige a Stripe)
router.post('/subscription/checkout', createSubscriptionCheckout);

// Crear checkout para RoAM (método antiguo - redirige a Stripe)
router.post('/roam/checkout', requireProfile, createRoamCheckout);

// Nuevos endpoints para checkout embebido
// Crear Setup Intent para suscripción (embebido)
router.post('/subscription/setup-intent', createSubscriptionSetupIntentController);

// Confirmar suscripción con método de pago guardado (embebido)
router.post('/subscription/confirm', confirmSubscriptionController);

// Crear Payment Intent para RoAM (embebido)
router.post('/roam/payment-intent', requireProfile, createRoamPaymentIntentController);

// Premium Sexo gratis 20€ / 3 meses
router.post('/sexo-gratis-premium/payment-intent', requireProfile, createSexoGratisPremiumPaymentIntentController);

// Crear sesión del portal de cliente (gestionar suscripción)
router.post('/customer-portal', createCustomerPortalSession);

export default router;

