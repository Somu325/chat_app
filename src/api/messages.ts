import api from './axios';

export const getMessages = async (roomId: string, page = 1, limit = 30) => {
  const { data } = await api.get(`/api/messages/${roomId}?page=${page}&limit=${limit}`);
  return data;
};
