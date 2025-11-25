// Definición global de roles del sistema

export const ROLES = {
  ADMIN: "admin",
  AUDITOR: "auditor",
  TECNICO: "tecnico",
  JUEZ: "juez",
  INSPECTOR: "inspector",
  OPERADOR_CAJA: "operador_caja",
  OPERADOR_CARGA: "operador_carga",
  OPERADOR_SOPORTE: "operador_soporte"
};

// Conjuntos de permisos según rol
export const ROLE_PERMISSIONS = {
  admin: ["*"],  // Acceso total
  auditor: ["ver_actas", "aprobar_actas", "ver_auditoria"],
  tecnico: ["procesar_eventos", "editar_ocr", "validar_imagenes"],
  juez: ["resolver_actas", "aplicar_descuentos", "ver_documentacion"],
  inspector: ["generar_actas", "ver_sus_actas"],
  operador_caja: ["ver_pagos", "registrar_pago"],
  operador_carga: ["cargar_documentos"],
  operador_soporte: ["soporte_tecnico"]
};
