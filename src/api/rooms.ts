import api from './axios';

export const getGroups = async () => {
  const { data } = await api.get('/api/rooms/groups');
  return data;
};

export const getDms = async () => {
  const { data } = await api.get('/api/rooms/dms');
  return data;
};

export const createGroup = async (groupData: any) => {
  const { data } = await api.post('/api/rooms/group', groupData);
  return data;
};

export const startDm = async (targetUserId: string) => {
  const { data } = await api.post('/api/rooms/dm', { targetUserId });
  return data;
};
