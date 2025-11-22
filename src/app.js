import express from "expimport axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://ezeiza-actas-backend.onrender.com/api",
  timeout: 15000,
});

// ======================================================
// LOGIN
// ======================================================
export const loginAuditor = (usuario, password) =>
  api.post("/auth/login", { usuario, password });

// ======================================================
// AUDITOR
// ======================================================
export const fetchPendientesAuditor = () =>
  api.get("/auditor/pendientes");

export const fetchActaById = (id) =>
  api.get(`/auditor/${id}`);

export const validarActa = (id, payload = {}) =>
  api.post(`/auditor/${id}/aprobar`, payload);

export const rechazarActa = (id, motivo) =>
  api.post(`/auditor/${id}/rechazar`, { motivo });

// ======================================================
// PAGOS
// ======================================================
export const generarLinkPago = (id) =>
  api.post(`/pagos/generar/${id}`);

export default api;
