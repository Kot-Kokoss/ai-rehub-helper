import axios, { type CreateAxiosDefaults } from 'axios';

const options: CreateAxiosDefaults = {
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
};

export const axiosFileClient = axios.create({
  baseURL: 'http://localhost:8000/api',
});

export const axiosClient = axios.create(options);
