import api from './axios';

export const login = async (credentials: any) => {
  const { data } = await api.post('/api/auth/login', credentials);
  return data;
};

export const register = async (userData: any) => {
  const { data } = await api.post('/api/auth/register', userData);
  return data;
};

export const logout = async () => {
  const { data } = await api.post('/api/auth/logout');
  return data;
};
