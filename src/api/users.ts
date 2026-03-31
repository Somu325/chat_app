import api from './axios';

export const searchUsers = async (query: string) => {
  const { data } = await api.get(`/api/users/search?q=${query}`);
  return data;
};

export const getOnlineUsers = async () => {
  const { data } = await api.get('/api/users/online');
  return data;
};
