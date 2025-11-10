import { axiosFileClient } from '../interceptors';

class BaseService {
  async processVideo(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axiosFileClient.post('/process-video', formData, {
        responseType: 'blob',
      });
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }
}

export const baseService = new BaseService();
