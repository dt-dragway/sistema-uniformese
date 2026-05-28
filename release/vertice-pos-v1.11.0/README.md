# Vertice POS

Sistema de Punto de Venta profesional y completo para comercializadoras y negocios.

![Version](https://img.shields.io/badge/version-1.8.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

---

## 🌟 Características Destacadas

### 💰 Sistema de Ventas Avanzado
- ✅ **Ventas por unidad, peso y volumen** - Soporte completo para kg, litros y unidades
- ✅ **Entrada dual para peso/volumen** - Ingresa en Bs. o en unidad de medida
- ✅ **Múltiples ventas simultáneas** - Tabs independientes por venta
- ✅ **Cliente por venta independiente** - Cada venta tiene su propio cliente
- ✅ **Calculadora integrada** - Cálculo automático de cambio
- ✅ **Descuentos y promociones** - Flexibilidad en precios

### 📦 Gestión de Inventario
- ✅ **Control completo de productos** - Categorías, precios, stock
- ✅ **Entrada de mercancía** - Control de ingresos con proveedores
- ✅ **Retiros internos** - Movimientos de inventario
- ✅ **Alertas de stock bajo** - Notificaciones automáticas
- ✅ **Historial de movimientos** - Trazabilidad completa

### 💵 Caja Registradora Profesional
- ✅ **Apertura y cierre de caja** - Control por usuario
- ✅ **Corte X y Corte Z** - Reportes parciales y finales
- ✅ **Avances de efectivo** - Préstamos con comisión
- ✅ **Múltiples métodos de pago** - Efectivo, transferencia, POS, etc.
- ✅ **Gestión de créditos** - Sistema completo de cuentas por cobrar

### 📱 Recargas Electrónicas
- ✅ **Recargas telefónicas** - Movistar, Digitel, Movilnet, CANTV
- ✅ **Servicios de internet/TV** - Inter, SimpleTV
- ✅ **Comisiones configurables** - Define tu margen por servicio
- ✅ **Historial completo** - Tracking de todas las recargas

### 🎨 Interfaz de Usuario Premium
- ✅ **Diseño moderno** - Dark theme profesional
- ✅ **Responsive** - Funciona en tablets y PCs
- ✅ **Mensajes en español** - UX completamente localizada
- ✅ **Error boundaries** - Nunca se rompe la aplicación

---

## 🏆 Nivel Empresarial - v1.8.0

### 🛡️ Seguridad Profesional
- ✅ **Rate Limiting** - 500 requests por IP cada 15 minutos
- ✅ **Validación con Zod** - Datos siempre válidos en 8 endpoints críticos
- ✅ **JWT Authentication** - Sistema de autenticación robusto
- ✅ **Roles de usuario** - Admin y Cajero

### 📊 Observabilidad
- ✅ **Winston Logger** - Logs estructurados en archivos
- ✅ **Health Check Endpoints** - `/health` y `/api/health`
- ✅ **Error tracking** - Logs detallados de errores
- ✅ **PM2 Integration** - Monitoreo de procesos

### 💾 Protección de Datos
- ✅ **Backups automáticos diarios** - Al iniciar el servidor
- ✅ **Limpieza automática** - Mantiene últimos 7 días
- ✅ **Backup manual** - Desde panel de administración
- ✅ **Restauración simple** - Upload de archivo SQL

### 🚀 Alta Disponibilidad
- ✅ **PM2 Auto-restart** - Reinicio automático en crashes
- ✅ **Graceful shutdown** - Cierre controlado sin pérdida de datos
- ✅ **Request timeouts** - 30 segundos máximo
- ✅ **Memory management** - Restart si excede 500MB
- ✅ **Scheduled restart** - Diario a las 3 AM

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18 + TypeScript + Material-UI v5 + Vite 7 |
| **Backend API** | Node.js 18+ + Express 5 + Prisma 6 |
| **Base de Datos** | PostgreSQL 14+ |
| **Desktop** | Electron (opcional) |
| **Print Server** | Node.js + Escpos |
| **Process Manager** | PM2 |
| **Logging** | Winston |
| **Validation** | Zod |

---

## 📋 Requisitos del Sistema

### Servidor (PC1)
- **OS:** Windows 10/11 (64-bit)
- **Node.js:** 18 o superior
- **PostgreSQL:** 14 o superior
- **RAM:** 4GB mínimo, 8GB recomendado
- **Disco:** 10GB libres
- **Red:** IP estática recomendada

### Cliente (PC2+)
- **OS:** Windows 10/11 (64-bit)
- **Conexión:** Red LAN al servidor
- **RAM:** 2GB mínimo

---

## 🚀 Instalación para Desarrollo

### 1. Prerrequisitos
```bash
# Verificar Node.js
node --version  # Debe ser 18+

# Verificar PostgreSQL
psql --version  # Debe ser 14+
```

### 2. Clonar repositorio
```bash
git clone https://github.com/tu-usuario/vertice_pos.git
cd vertice_pos
```

### 3. Configurar Base de Datos
```bash
# Crear base de datos
createdb vertice_pos_db

# Crear .env en vertice-nodejs-api/
DATABASE_URL="postgresql://usuario:password@localhost:5432/vertice_pos_db"
JWT_SECRET="supersecretjwtkey"
PORT=3000
HOST=0.0.0.0
```

### 4. Instalar dependencias
```bash
# API
cd vertice-nodejs-api
npm install
npx prisma generate
npx prisma db push

# Frontend
cd ../vertice-frontend
npm install

# Print Server (opcional)
cd ../vertice-print-server
npm install
```

### 5. Ejecutar en desarrollo
```bash
# Terminal 1 - API
cd vertice-nodejs-api
npm run dev

# Terminal 2 - Frontend
cd vertice-frontend
npm run dev
```

Acceder a: `http://localhost:5173`

---

## 📦 Despliegue en Producción

Ver documentación completa:
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guía de despliegue con PM2
- **[BACKUPS.md](BACKUPS.md)** - Sistema de backups automáticos

### Quick Start Producción

```bash
# 1. Build Frontend
cd vertice-frontend
npm run build

# 2. Build API
cd ../vertice-nodejs-api
npm run build

# 3. Iniciar con PM2
npm run pm2:start

# 4. Verificar
npm run pm2:status
```

---

## 📁 Estructura del Proyecto

```
vertice_pos/
├── vertice-frontend/           # Cliente React + TypeScript
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/            # Páginas principales
│   │   ├── store/            # Redux state management
│   │   ├── api/              # Servicios API
│   │   └── models/           # TypeScript interfaces
│   └── dist/                 # Build de producción
│
├── vertice-nodejs-api/         # API REST
│   ├── src/
│   │   ├── controllers/      # Controladores de rutas
│   │   ├── services/         # Lógica de negocio
│   │   ├── middleware/       # Rate limit, auth, validation
│   │   ├── schemas/          # Zod validation schemas
│   │   └── utils/            # Winston logger, helpers
│   ├── prisma/               # Schema de base de datos
│   ├── logs/                 # Logs de Winston
│   └── ecosystem.config.json # Configuración PM2
│
├── vertice-print-server/       # Servidor de impresión
├── vertice-electron/           # App de escritorio
├── backups/                    # Backups automáticos SQL
├── release/                    # Builds finales
└── docs/                       # Documentación adicional
```

---

## 🔧 Comandos Útiles

### Desarrollo
```bash
npm run dev          # Modo desarrollo
npm run build        # Build producción
npm run lint         # Linting
```

### Producción (PM2)
```bash
npm run pm2:start    # Iniciar servidor
npm run pm2:stop     # Detener servidor
npm run pm2:restart  # Reiniciar servidor
npm run pm2:logs     # Ver logs en tiempo real
npm run pm2:status   # Estado del servidor
```

### Base de Datos
```bash
npx prisma studio    # UI visual de la BD
npx prisma generate  # Regenerar Prisma Client
npx prisma db push   # Sincronizar schema
```

---

## 📊 Endpoints API Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Health check rápido |
| GET | `/api/health` | Health check con BD |
| POST | `/api/auth/login` | Login de usuario |
| GET | `/api/products` | Listar productos |
| POST | `/api/sales` | Crear venta |
| GET | `/api/cash-register/status` | Estado de caja |

Ver documentación API completa en `/api/swagger` (próximamente).

---

## 🐛 Troubleshooting

### PC2 queda en blanco
**Solución:** El servidor se reinicia automáticamente con PM2 en 4 segundos.

### Servidor no inicia
```bash
# Verificar logs
npm run pm2:logs

# Reiniciar
npm run pm2:restart
```

### Error de conexión
1. Verificar firewall en PC1 (puerto 3000)
2. Verificar IP del servidor en configuración
3. Verificar `npm run pm2:status` = online

Ver **[DEPLOYMENT.md](DEPLOYMENT.md)** para troubleshooting completo.

---

## 📝 Changelog v1.8.0

### 🚀 Mejoras Profesionales
- ✅ Rate Limiting (500 req/15min)
- ✅ Winston Logging estructurado
- ✅ Zod Validation (8 endpoints)
- ✅ Error Boundaries globales
- ✅ Backups automáticos diarios
- ✅ PM2 auto-restart
- ✅ Health check endpoints
- ✅ Graceful shutdown

### 🎨 UX/UI
- ✅ Cliente independiente por venta
- ✅ Unidades inteligentes (L/Kg vs ml/g)
- ✅ Scroll inteligente en carrito
- ✅ Mensajes en español
- ✅ Modal crear cliente mejorado

### 🔧 Técnicas
- ✅ Request timeouts (30s)
- ✅ Memory management
- ✅ Restart programado (3 AM)
- ✅ Logs en archivos
- ✅ .gitignore actualizado

Ver **[CHANGELOG.md](CHANGELOG.md)** completo.

---

## 🤝 Contribuir

Este es un proyecto propietario privado. Para contribuir:

1. Leer **[CONTRIBUTING.md](CONTRIBUTING.md)**
2. Seguir convenciones de código
3. Escribir mensajes de commit descriptivos
4. Testing antes de commit

---

## 📄 Licencia

**Licencia Propietaria** - Todos los derechos reservados.

Este software es propiedad de **DT Dragway** y no puede ser redistribuido, modificado o usado comercialmente sin autorización explícita.

---

## 👥 Equipo

**Desarrollado por:** DT Dragway  
**Contacto:** [Tu email/contacto]

---

## 📚 Documentación Adicional

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guía de despliegue profesional
- **[BACKUPS.md](BACKUPS.md)** - Sistema de backups automáticos
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitectura técnica del sistema
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guía para desarrolladores
- **[CHANGELOG.md](CHANGELOG.md)** - Historial completo de versiones

---

<div align="center">

**Vertice POS v1.8.0** - Sistema de Punto de Venta Profesional

*Construido con ❤️ por DT Dragway*

</div>
