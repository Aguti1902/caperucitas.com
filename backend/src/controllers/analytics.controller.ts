import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  fetchGa4Dashboard,
  isGoogleAnalyticsConfigured,
  getGa4SetupInstructions,
  formatGa4Error,
  getServiceAccountEmail,
  runGa4Diagnostics,
} from '../services/google-analytics.service';

export const getAnalyticsDashboard = async (_req: AuthRequest, res: Response) => {
  try {
    if (!isGoogleAnalyticsConfigured()) {
      return res.json(getGa4SetupInstructions());
    }

    const data = await fetchGa4Dashboard();
    res.json(data);
  } catch (error: unknown) {
    console.error('Error getAnalyticsDashboard:', error);
    res.status(500).json({
      configured: false,
      error: formatGa4Error(error),
      serviceAccountEmail: getServiceAccountEmail(),
      propertyId: process.env.GA4_PROPERTY_ID || null,
      setup: getGa4SetupInstructions(),
    });
  }
};

export const getAnalyticsDiagnostics = async (_req: AuthRequest, res: Response) => {
  try {
    const diagnostics = await runGa4Diagnostics();
    res.json(diagnostics);
  } catch (error: unknown) {
    res.status(500).json({ error: formatGa4Error(error) });
  }
};

export const getAnalyticsStatus = async (_req: AuthRequest, res: Response) => {
  res.json({
    configured: isGoogleAnalyticsConfigured(),
    propertyId: process.env.GA4_PROPERTY_ID || null,
    hasCredentials: Boolean(process.env.GA4_SERVICE_ACCOUNT_JSON?.trim()),
    measurementId: process.env.GA4_MEASUREMENT_ID || null,
    serviceAccountEmail: getServiceAccountEmail(),
  });
};
