// lib/axios.js
import axios from "axios";

const api = axios.create({
  baseURL:
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api` || "http://localhost:1337/api",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_TOKEN}`,
  },
});

export default api;
