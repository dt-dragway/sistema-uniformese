# Informe de Auditoría de Seguridad - Sistema Vértice

## 1. Vulnerabilidades Identificadas

### 1.1 Credenciales "Hardcoded" (Crítico)
- **Ubicación:** `src/services/AuthService.ts`
- **Problema:** El usuario `superadmin` con contraseña `superadmin` está codificado directamente en la lógica del servicio.
- **Riesgo:** Cualquier persona con acceso al código o conocimiento de esta práctica común puede tomar control total del sistema sin dejar rastro en la base de datos de usuarios.

### 1.2 Configuración de JWT Débil (Medio)
- **Ubicación:** `src/middleware/authMiddleware.ts` y `src/services/AuthService.ts`
- **Problema:** Los tokens JWT no tienen tiempo de expiración definido.
- **Riesgo:** Si un token es interceptado, es válido indefinidamente (eterno), lo que aumenta drásticamente el impacto de un robo de sesión.

### 1.3 Falta de Control de Acceso Basado en Roles (RBAC) (Alto)
- **Ubicación:** `src/index.ts`
- **Problema:** Casi todas las rutas usan `authMiddleware`, que solo verifica que el token sea válido, pero no si el usuario tiene permiso (ej. Cajero borrando usuarios o viendo reportes financieros).
- **Riesgo:** Escalación de privilegios horizontal y vertical. Los cajeros podrían realizar acciones administrativas.

### 1.4 CORS Permisivo (Medio)
- **Ubicación:** `src/index.ts`
- **Problema:** `origin: '*'` permite que cualquier sitio web realice peticiones a la API.
- **Riesgo:** Facilita ataques de Cross-Site Request Forgery (CSRF) y robo de datos si no se manejan bien los headers.

---

## 2. Plan de Mitigación (Propuesto)

### Fase 1: Mejoras en Infraestructura de Seguridad
1.  **JWT Dinámico:** Añadir `expiresIn: '8h'` a la generación de tokens.
2.  **Middleware de Roles:** Crear `roleMiddleware(allowedRoles: string[])` para proteger rutas administrativas.
3.  **Sanitización de AuthService:** Mover credenciales críticas a variables de entorno o eliminarlas tras crear el primer Admin real.

### Fase 2: Implementación de RBAC en Rutas
1.  **Usuarios:** Solo `ADMIN` puede listar, crear, editar o borrar usuarios.
2.  **Reportes/Mantenimiento:** Solo `ADMIN` puede descargar backups o ver reportes financieros internos.
3.  **Ventas/Caja:** Permitir `CASHIER` y `ADMIN`, pero restringir cierres por admin o cancelaciones a roles superiores si se requiere.

### Fase 3: Hardening
1.  **CORS:** Restringir orígenes permitidos (ej. solo localhost o la IP del servidor).
2.  **Passwords:** Forzar longitud mínima en validaciones (Zod).

---

## 3. Próximos Pasos

¿Deseas que proceda con la implementación de estas mejoras? Empezaría por el middleware de roles y la protección de las rutas de gestión de usuarios y backups.
