import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const adminApi = axios.create({
  baseURL: `${API_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT a todas las peticiones
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expirado o inválido
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Login
export const loginAdmin = async (password: string) => {
  const response = await axios.post(`${API_URL}/admin/login`, { password });
  const { token } = response.data;
  localStorage.setItem('adminToken', token);
  return response.data;
};

// Logout
export const logoutAdmin = () => {
  localStorage.removeItem('adminToken');
};

// Verificar si está autenticado
export const isAdminAuthenticated = (): boolean => {
  return !!localStorage.getItem('adminToken');
};

// Estadísticas
export const getStats = async () => {
  const response = await adminApi.get('/stats');
  return response.data;
};

// Perfiles
export const getAllProfiles = async () => {
  const response = await adminApi.get('/profiles');
  return response.data;
};

// Denuncias
export const getAllReports = async () => {
  const response = await adminApi.get('/reports');
  return response.data;
};

// Eliminar usuario
export const deleteUser = async (userId: string) => {
  const response = await adminApi.delete(`/users/${userId}`);
  return response.data;
};

// Eliminar denuncia
export const deleteReport = async (reportId: string) => {
  const response = await adminApi.delete(`/reports/${reportId}`);
  return response.data;
};

// Regenerar perfiles falsos
export const regenerateFakeProfiles = async () => {
  const response = await adminApi.post('/regenerate-fakes');
  return response.data;
};

// Eliminar perfiles falsos
export const deleteFakeProfiles = async () => {
  const response = await adminApi.post('/delete-fakes');
  return response.data;
};

// Exportar emails de todos los usuarios
export const exportEmails = async (): Promise<string> => {
  const response = await adminApi.get('/export-emails');
  return response.data.emails;
};

// Verificar manualmente el email de un usuario
export const verifyUserEmail = async (userId: string) => {
  const response = await adminApi.post(`/verify-user/${userId}`);
  return response.data;
};

// --- WhatsApp / Evolution API ---

export const getWhatsAppStats = async () => {
  const response = await adminApi.get('/whatsapp/stats');
  return response.data;
};

export const getWhatsAppCampaigns = async () => {
  const response = await adminApi.get('/whatsapp/campaigns');
  return response.data;
};

export const getWhatsAppCampaign = async (id: string) => {
  const response = await adminApi.get(`/whatsapp/campaigns/${id}`);
  return response.data;
};

export const uploadWhatsAppCampaignImage = async (file: File) => {
  const fd = new FormData();
  fd.append('image', file);
  const response = await adminApi.post('/whatsapp/campaigns/upload-image', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data as { url: string; filename: string; size: number; mimetype: string };
};

export const createWhatsAppCampaign = async (data: {
  name?: string;
  message: string;
  imageUrl?: string;
  source: string;
  phones?: string;
  delayMs?: number;
  instanceName?: string;
}) => {
  const response = await adminApi.post('/whatsapp/campaigns', data);
  return response.data;
};

export const cancelWhatsAppCampaign = async (id: string) => {
  const response = await adminApi.post(`/whatsapp/campaigns/${id}/cancel`);
  return response.data;
};

export const importWhatsAppContacts = async (phones: string) => {
  const response = await adminApi.post('/whatsapp/contacts/import', { phones });
  return response.data;
};

export const syncWhatsAppProfileContacts = async () => {
  const response = await adminApi.post('/whatsapp/contacts/sync-profiles');
  return response.data;
};

export const getWhatsAppContacts = async (page = 1, limit = 50) => {
  const response = await adminApi.get('/whatsapp/contacts', { params: { page, limit } });
  return response.data;
};

export const getWhatsAppInstances = async () => {
  const response = await adminApi.get('/whatsapp/instances');
  return response.data;
};

export const getWhatsAppRecipientCount = async (source: string, phones?: string) => {
  const response = await adminApi.get('/whatsapp/recipient-count', { params: { source, phones } });
  return response.data;
};

export const deleteWhatsAppContact = async (id: string) => {
  const response = await adminApi.delete(`/whatsapp/contacts/${id}`);
  return response.data;
};

export const sendWhatsAppTest = async (
  phone: string,
  message: string,
  instanceName?: string,
  imageUrl?: string
) => {
  const response = await adminApi.post('/whatsapp/test', { phone, message, instanceName, imageUrl });
  return response.data;
};

export const getWhatsAppSetupStatus = async () => {
  const response = await adminApi.get('/whatsapp/setup/status');
  return response.data;
};

export const createWhatsAppInstance = async (instanceName?: string) => {
  const response = await adminApi.post('/whatsapp/setup/create-instance', { instanceName });
  return response.data;
};

export const getWhatsAppQrCode = async (instanceName: string) => {
  const response = await adminApi.get('/whatsapp/setup/qrcode', { params: { instanceName } });
  return response.data;
};

export const getWhatsAppConnectionStatus = async (instanceName: string) => {
  const response = await adminApi.get('/whatsapp/setup/qrcode', {
    params: { instanceName, statusOnly: 'true' },
  });
  return response.data as {
    connected: boolean;
    owner?: string;
    state?: string;
    pairing?: boolean;
  };
};

export const restartWhatsAppInstance = async (instanceName: string) => {
  const response = await adminApi.post('/whatsapp/setup/restart', { instanceName });
  return response.data;
};

export default adminApi;

