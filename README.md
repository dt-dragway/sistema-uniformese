# Vertice POS

<div align="center">

**Sistema de Punto de Venta Profesional para Comercializadoras**

![Version](https://img.shields.io/badge/version-1.11.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_14%2B-blue.svg)
![License](https://img.shields.io/badge/license-GPL--2.0-red.svg)
![Platform](https://img.shields.io/badge/platform-Windows_10%2F11-blue.svg)

*Sistema POS completo, moderno y escalable con arquitectura cliente-servidor*

</div>

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Stack Tecnológico](#️-stack-tecnológico)
- [Requisitos del Sistema](#-requisitos-del-sistema)
- [Instalación Rápida](#-instalación-rápida)
- [Guía de Uso](#-guía-de-uso)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Administración con PM2](#-administración-con-pm2)
- [Desarrollo](#-desarrollo)
- [Seguridad y Backups](#-seguridad-y-backups)
- [Troubleshooting](#-troubleshooting)
- [Documentación Adicional](#-documentación-adicional)
- [Licencia](#-licencia)

---

## 🌟 Características Principales

### 💰 Sistema de Ventas Completo

- ✅ **Ventas multiunidad** - Soporte para kg, litros y unidades
- ✅ **Entrada dual inteligente** - Ingresa montos en Bs. o en unidad de medida
- ✅ **Múltiples ventas simultáneas** - Sistema de pestañas independientes
- ✅ **Gestión de clientes** - Cliente por venta con historial completo
- ✅ **Calculadora integrada** - Cálculo automático de cambio y vuelto
- ✅ **Descuentos flexibles** - Promociones y ajustes de precio
- ✅ **Múltiples métodos de pago** - Efectivo, transferencia, tarjeta, crédito
- ✅ **Impresión térmica** - Tickets automáticos con Escpos

### 📦 Gestión de Inventario Avanzada

- ✅ **Control total de productos** - Categorías, precios, stock, códigos de barra
- ✅ **Entrada de mercancía** - Registros de compras y proveedores
- ✅ **Retiros de inventario** - Movimientos internos documentados
- ✅ **Alertas de stock bajo** - Notificaciones automáticas configurables
- ✅ **Historial de movimientos** - Trazabilidad completa del inventario
- ✅ **Importación masiva** - Carga de productos desde Excel/CSV

### 💵 Caja Registradora Profesional

- ✅ **Apertura y cierre de caja** - Control individual por usuario y turno
- ✅ **Corte X y Corte Z** - Reportes parciales y finales con totales
- ✅ **Avances de efectivo** - Sistema de préstamos con comisión configurable
- ✅ **Gestión de créditos** - Cuentas por cobrar con seguimiento
- ✅ **Reembolsos y devoluciones** - Manejo completo de reversos
- ✅ **Auditoría completa** - Registro detallado de todas las operaciones

### 📱 Recargas Electrónicas

- ✅ **Recargas telefónicas** - Movistar, Digitel, Movilnet, CANTV
- ✅ **Servicios de internet/TV** - Inter, SimpleTV y más
- ✅ **Comisiones configurables** - Define márgenes por operadora
- ✅ **Historial detallado** - Tracking completo de transacciones
- ✅ **Conciliación automática** - Reportes de recargas por período

### 📊 Reportes y Estadísticas

- ✅ **Dashboard empresarial** - Métricas en tiempo real
- ✅ **Reportes de ventas** - Por día, semana, mes, producto, vendedor
- ✅ **Análisis de inventario** - Productos más vendidos, rotación de stock
- ✅ **Reportes financieros** - Cuentas por cobrar, flujo de caja
- ✅ **Exportación a PDF/Excel** - Todos los reportes descargables
- ✅ **Gráficos interactivos** - Visualización de datos con Recharts

### 🎨 Interfaz de Usuario Premium

- ✅ **Diseño moderno** - Dark theme profesional con Material-UI 5
- ✅ **100% Responsive** - Funciona perfectamente en tablets y PCs
- ✅ **Totalmente en español** - UX completamente localizada
- ✅ **Error boundaries** - Sistema nunca se rompe completamente
- ✅ **Navegación intuitiva** - Flujos optimizados para velocidad
- ✅ **Atajos de teclado** - Operación rápida sin mouse

### 🔐 Seguridad de Nivel Empresarial

- ✅ **Autenticación JWT** - Sistema de tokens seguro
- ✅ **Control de roles** - Permisos granulares (Admin, Cajero, Supervisor)
- ✅ **Rate Limiting** - Protección contra ataques (500 req/15min)
- ✅ **Validación con Zod** - Datos siempre válidos en endpoints críticos
- ✅ **Logging estructurado** - Winston para auditoría completa
- ✅ **Backup automático** - Respaldos diarios de base de datos
- ✅ **Cifrado de contraseñas** - Bcrypt para seguridad de credenciales

### 🚀 Alta Disponibilidad con PM2

- ✅ **Auto-restart** - Reinicio automático en caso de fallos
- ✅ **Graceful shutdown** - Cierre controlado sin pérdida de datos
- ✅ **Request timeouts** - Límite de 30 segundos por petición
- ✅ **Memory management** - Restart automático si excede 500MB
- ✅ **Restart programado** - Reinicio diario a las 3 AM
- ✅ **Health checks** - Endpoints `/health` y `/api/health`
- ✅ **Monitoreo en tiempo real** - Dashboard de procesos

---

## 🛠️ Stack Tecnológico

### Frontend
```
React 18.2          - Biblioteca UI moderna
TypeScript 5       - Tipado estático para menos errores
Material-UI v5     - Componentes premium y consistentes
Redux Toolkit      - State management predecible
Vite 7             - Build ultrarrápido y HMR
Axios              - Cliente HTTP robusto
Recharts           - Gráficos y visualizaciones
React Router v7    - Navegación SPA
jsPDF              - Generación de PDFs
```

### Backend API
```
Node.js 18+        - Runtime JavaScript del lado servidor
Express 5          - Framework web minimalista y flexible
Prisma 6           - ORM moderno con tipado
PostgreSQL 14+     - Base de datos relacional robusta
Winston            - Logging estructurado a archivos
Zod                - Validación de schemas y datos
JWT                - Autenticación stateless segura
Bcrypt             - Hashing de contraseñas
PM2                - Process manager para producción
```

### Print Server
```
Node.js            - Servidor de impresión independiente
Escpos             - Protocolo para impresoras térmicas
Express            - API REST para comandos de impresión
```

### Desktop (Opcional)
```
Electron 39        - Wrapper para app de escritorio
Electron Builder   - Empaquetador para Windows
```

### DevOps & Tools
```
Git                - Control de versiones
PM2                - Gestión de procesos en producción
pg_dump / pg_restore - Backups de PostgreSQL
```

---

## 📋 Requisitos del Sistema

### 🖥️ Servidor (PC Principal)

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| **OS** | Windows 10 (64-bit) | Windows 11 (64-bit) |
| **Procesador** | Intel Core i3 | Intel Core i5 o superior |
| **RAM** | 4 GB | 8 GB |
| **Disco Duro** | 20 GB libres | 50 GB libres (SSD) |
| **Red** | Ethernet 100 Mbps | Ethernet 1 Gbps + IP estática |
| **Node.js** | v18.0.0 | v18.x o v20.x LTS |
| **PostgreSQL** | v14.0 | v14.x o v15.x |

### 💻 Clientes (PCs Secundarios)

| Componente | Requisito |
|------------|-----------|
| **OS** | Windows 10/11 o cualquier SO moderno |
| **RAM** | 2 GB mínimo |
| **Navegador** | Chrome 90+, Firefox 88+, o Edge 90+ |
| **Red** | Conexión LAN al servidor |

### 🖨️ Impresora Térmica (Opcional)

- Compatible con protocolo **ESC/POS**
- Conexión USB o Red
- Papel térmico de 80mm recomendado
- Ejemplos: Epson TM-T20, Star TSP100, Bixolon SRP-350

---

## 🚀 Instalación Rápida

### Instalación Automática (Recomendada)

1. **Verificar prerrequisitos instalados:**
   ```bash
   node --version    # Debe mostrar v18.x o superior
   psql --version    # Debe mostrar v14.x o superior
   ```

2. **Crear base de datos PostgreSQL:**
   ```sql
   -- Abre pgAdmin o psql y ejecuta:
   CREATE DATABASE vertice_pos_db;
   ```

3. **Ejecutar instalador:**
   ```bash
   # Navega a la carpeta del proyecto
   cd e:\Desarrollos\vertice_pos
   
   # Ejecuta el instalador (doble click o desde terminal)
   INSTALAR.bat
   ```
   
   El instalador te pedirá:
   - Contraseña de PostgreSQL
   - JWT Secret (se genera automáticamente si se omite)
   
   Luego instalará automáticamente:
   - ✅ Todas las dependencias (API, Frontend, Print Server)
   - ✅ Configurará archivos `.env`
   - ✅ Generará Prisma Client
   - ✅ Sincronizará el schema de BD
   - ✅ Compilará frontend y API
   - ✅ Instalará PM2 globalmente

4. **Iniciar el sistema:**
   ```bash
   INICIAR.bat
   ```

5. **Acceder a la aplicación:**
   - Desde el servidor: `http://localhost:3000`
   - Desde otros PCs: `http://[IP-del-servidor]:3000`

6. **Credenciales por defecto:**
   - Usuario: `admin`
   - Contraseña: `admin123`
   
   > ⚠️ **IMPORTANTE:** Cambia la contraseña inmediatamente desde el panel de administración.

### Instalación Manual

Para instalación manual detallada, consulta: **[INSTALACION.md](INSTALACION.md)**

---

## 🎯 Guía de Uso

### Comandos de Gestión del Sistema

El sistema incluye scripts batch para facilitar la administración:

```bash
INICIAR.bat      # Inicia todos los servicios con PM2
DETENER.bat      # Detiene todos los servicios
REINICIAR.bat    # Reinicia los servicios sin downtime
ESTADO.bat       # Muestra el estado de todos los servicios
LOGS.bat         # Ver logs en tiempo real
```

### Configuración de Auto-Inicio

Para que el sistema inicie automáticamente con Windows:

```bash
CONFIGURAR-AUTO-INICIO.bat
```

### Acceso desde Clientes en Red

1. **Obtén la IP del servidor:**
   ```bash
   ipconfig
   # Busca la "Dirección IPv4" (ej: 192.168.1.100)
   ```

2. **Configura el Firewall:**
   - Permite el puerto 3000 (API)
   - Permite el puerto 3001 (Print Server)

3. **Accede desde el navegador del cliente:**
   ```
   http://192.168.1.100:3000
   ```

---

## 📁 Arquitectura del Proyecto

```
vertice_pos/
├── 📂 vertice-frontend/          # Cliente React + TypeScript
│   ├── 📂 src/
│   │   ├── 📂 components/        # Componentes reutilizables
│   │   │   ├── sales/           # CheckoutModal, SaleCard, etc.
│   │   │   ├── products/        # ProductForm, ProductList, etc.
│   │   │   ├── cash-register/   # CashDrawer, CashReport, etc.
│   │   │   └── common/          # ErrorBoundary, Loading, etc.
│   │   ├── 📂 pages/             # Páginas principales
│   │   │   ├── Sales.tsx        # Pantalla de ventas
│   │   │   ├── Products.tsx     # Gestión de productos
│   │   │   ├── Dashboard.tsx    # Panel de control
│   │   │   └── Reports.tsx      # Reportes y estadísticas
│   │   ├── 📂 store/             # Redux state management
│   │   │   ├── slices/
│   │   │   └── store.ts
│   │   ├── 📂 api/               # Servicios API (Axios)
│   │   ├── 📂 models/            # TypeScript interfaces
│   │   └── 📂 utils/             # Helpers y utilidades
│   ├── 📂 dist/                  # Build de producción
│   └── package.json
│
├── 📂 vertice-nodejs-api/        # API REST Backend
│   ├── 📂 src/
│   │   ├── 📂 controllers/       # Controladores de endpoints
│   │   ├── 📂 services/          # Lógica de negocio
│   │   ├── 📂 middleware/        # Auth, rate limit, validation
│   │   ├── 📂 schemas/           # Zod validation schemas
│   │   ├── 📂 utils/             # Winston logger, helpers
│   │   └── index.ts              # Entry point
│   ├── 📂 prisma/
│   │   └── schema.prisma         # Schema de base de datos
│   ├── 📂 dist/                  # JavaScript compilado
│   ├── 📂 logs/                  # Logs de Winston
│   │   ├── api-error.log
│   │   └── api-out.log
│   ├── .env                      # Variables de entorno
│   └── package.json
│
├── 📂 vertice-print-server/      # Servidor de impresión térmica
│   ├── index.js
│   ├── prisma/schema.prisma
│   └── package.json
│
├── 📂 backups/                   # Backups automáticos SQL
│   └── db_backup_*.sql
│
├── 📂 logs/                      # Logs de PM2
│
├── 📂 release/                   # Builds finales y paquetes
│
├── 📂 assets/                    # Íconos y recursos
│   └── icon.ico
│
├── 📄 ecosystem.config.js        # Configuración PM2
├── 📄 package.json               # Proyecto principal (Electron)
├── 📄 main.js                    # Electron main process
├── 📄 preload.js                 # Electron preload script
│
├── 📜 INSTALAR.bat               # Instalador automático
├── 📜 INICIAR.bat                # Iniciar sistema
├── 📜 DETENER.bat                # Detener sistema
├── 📜 REINICIAR.bat              # Reiniciar sistema
├── 📜 ESTADO.bat                 # Estado de servicios
├── 📜 LOGS.bat                   # Ver logs
├── 📜 EMPAQUETAR.bat             # Crear paquete de distribución
├── 📜 CONFIGURAR-AUTO-INICIO.bat # Auto-inicio con Windows
│
├── 📖 README.md                  # Este archivo
├── 📖 INSTALACION.md             # Guía de instalación detallada
├── 📖 PM2-GUIA.md                # Guía de administración PM2
└── 📖 LICENSE                    # Licencia GPL-2.0
```

### Flujo de Datos

```
┌─────────────┐         HTTP          ┌──────────────┐         SQL          ┌──────────────┐
│   Cliente   │ ◄───────────────────► │   API REST   │ ◄──────────────────► │  PostgreSQL  │
│  (Browser)  │   (axios/fetch)       │  (Express)   │      (Prisma)        │   Database   │
└─────────────┘                       └──────────────┘                      └──────────────┘
                                              │
                                              │ HTTP
                                              ▼
                                      ┌──────────────┐
                                      │ Print Server │
                                      │   (Escpos)   │
                                      └──────────────┘
                                              │
                                              ▼
                                      ┌──────────────┐
                                      │   Impresora  │
                                      │   Térmica    │
                                      └──────────────┘
```

---

## 🔧 Administración con PM2

PM2 gestiona los procesos del sistema en producción con auto-restart, monitoreo y logs centralizados.

### Comandos Principales

```bash
# Ver estado de todos los procesos
pm2 status

# Ver logs en tiempo real
pm2 logs

# Ver logs solo de errores
pm2 logs --err

# Reiniciar un servicio específico
pm2 restart vertice-api
pm2 restart vertice-print

# Detener/Iniciar servicios
pm2 stop vertice-api
pm2 start vertice-api

# Monitor de CPU y memoria en tiempo real
pm2 monit

# Información detallada de un proceso
pm2 show vertice-api

# Limpiar logs antiguos
pm2 flush

# Guardar configuración actual
pm2 save

# Configurar auto-inicio con Windows
pm2 startup
pm2 save
```

### Configuración PM2 (ecosystem.config.js)

El sistema está configurado con:
- **Auto-restart:** Se reinicia automáticamente si crashea
- **Memory limit:** Restart si excede 500MB (API) o 300MB (Print)
- **Cron restart:** Reinicio diario a las 3:00 AM
- **Max restarts:** Máximo 10 reinicios consecutivos
- **Logs:** Almacenados en `logs/api-*.log` y `logs/print-*.log`

Para más detalles, consulta: **[PM2-GUIA.md](PM2-GUIA.md)**

---

## 💻 Desarrollo

### Configuración del Entorno de Desarrollo

1. **Clonar repositorio:**
   ```bash
   git clone <repository-url>
   cd vertice_pos
   ```

2. **Configurar variables de entorno:**
   
   Crea `vertice-nodejs-api/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/vertice_pos_db?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-this"
   PORT=3000
   HOST=0.0.0.0
   NODE_ENV=development
   ```

3. **Instalar dependencias:**
   ```bash
   # API
   cd vertice-nodejs-api
   npm install
   npx prisma generate
   npx prisma db push
   
   # Frontend
   cd ../vertice-frontend
   npm install
   
   # Print Server
   cd ../vertice-print-server
   npm install
   npx prisma generate
   ```

### Ejecutar en Modo Desarrollo

```bash
# Terminal 1 - API (con hot reload)
cd vertice-nodejs-api
npm run dev

# Terminal 2 - Frontend (con HMR de Vite)
cd vertice-frontend
npm run dev

# Terminal 3 - Print Server (opcional)
cd vertice-print-server
node index.js
```

Acceder a:
- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`
- Print Server: `http://localhost:3001`

### Scripts de Desarrollo

#### API (vertice-nodejs-api)
```bash
npm run dev          # Modo desarrollo con nodemon + ts-node
npm run build        # Compilar TypeScript a JavaScript
npm start            # Ejecutar versión compilada
npm run lint         # Linting con ESLint
npm run format       # Formatear código con Prettier
```

#### Frontend (vertice-frontend)
```bash
npm run dev          # Servidor de desarrollo Vite
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linting con ESLint
npm run format       # Formatear código con Prettier
```

### Gestión de Base de Datos con Prisma

```bash
# Ver base de datos en interfaz visual
npx prisma studio

# Generar Prisma Client después de cambiar schema
npx prisma generate

# Aplicar cambios del schema a la BD
npx prisma db push

# Crear migración (opcional)
npx prisma migrate dev --name nombre_migracion

# Resetear base de datos (¡CUIDADO!)
npx prisma migrate reset
```

### Build para Producción

```bash
# Build completo
npm run build:all

# O step by step:
cd vertice-frontend && npm run build
cd ../vertice-nodejs-api && npm run build
```

### Crear Paquete de Distribución

```bash
# Crea un paquete completo en release/
EMPAQUETAR.bat
```

Esto genera una carpeta `vertice-pos-v1.11.0` con:
- API compilada + `.env` + Prisma
- Frontend compilado (dist)
- Print Server + Prisma
- Todos los scripts .bat
- Documentación

---

## 🔐 Seguridad y Backups

### Sistema de Backups Automáticos

El sistema crea backups automáticos diarios de PostgreSQL:

- **Ubicación:** `backups/`
- **Formato:** `db_backup_YYYY-MM-DD.sql`
- **Retención:** Últimos 7 días
- **Programación:** Al iniciar el servidor y cada 24 horas

### Backup Manual

Desde el panel de administración:
1. Ve a **Mantenimiento** → **Respaldo y Restauración**
2. Click en **Crear Backup**
3. Descarga el archivo `.sql`

O desde línea de comandos:
```bash
pg_dump -U postgres -d vertice_pos_db > backup_manual.sql
```

### Restaurar Backup

Desde el panel de administración:
1. Ve a **Mantenimiento** → **Respaldo y Restauración**
2. Click en **Restaurar**
3. Selecciona el archivo `.sql`
4. Confirma

O desde línea de comandos:
```bash
psql -U postgres -d vertice_pos_db < backup_manual.sql
```

### Seguridad

- **Autenticación:** JWT con tokens que expiran
- **Contraseñas:** Hasheadas con Bcrypt (10 rounds)
- **Rate Limiting:** 500 peticiones por IP cada 15 minutos
- **Validación:** Zod valida todos los inputs en endpoints críticos
- **CORS:** Configurado para permitir solo orígenes autorizados
- **Logs:** Todas las acciones se registran en Winston

### Recomendaciones de Seguridad

1. ✅ Cambia la contraseña de `admin` inmediatamente
2. ✅ Usa un `JWT_SECRET` fuerte y único
3. ✅ Usa contraseña segura para PostgreSQL
4. ✅ Configura IP estática para el servidor
5. ✅ Habilita Firewall de Windows y permite solo puertos necesarios
6. ✅ Realiza backups regulares fuera del servidor
7. ✅ No expongas el servidor a internet público sin VPN/proxy

---

## 🐛 Troubleshooting

### El servidor no inicia

```bash
# Verificar estado de PM2
pm2 status

# Ver logs de errores
pm2 logs --err

# Reiniciar servicios
pm2 restart all

# Si persiste, eliminar y recrear
pm2 delete all
pm2 start ecosystem.config.js
```

### Error de conexión a base de datos

1. Verifica que PostgreSQL esté corriendo:
   - Abre `services.msc`
   - Busca "postgresql" y verifica que esté "Iniciado"

2. Verifica credenciales en `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/vertice_pos_db?schema=public"
   ```

3. Regenera Prisma Client:
   ```bash
   cd vertice-nodejs-api
   npx prisma generate
   npx prisma db push
   ```

### Los clientes no pueden conectar desde la red

1. **Verifica la IP del servidor:**
   ```bash
   ipconfig
   ```

2. **Configura el Firewall:**
   - Panel de Control → Firewall de Windows → Configuración avanzada
   - Reglas de entrada → Nueva regla
   - Puerto → TCP → 3000 (y 3001 si usas print server)
   - Permitir conexión → Aplicar a todos los perfiles

3. **Verifica que la API escuche en `0.0.0.0`:**
   - En `vertice-nodejs-api/.env` debe tener `HOST=0.0.0.0`

4. **Prueba la conexión:**
   ```bash
   # Desde el cliente, haz ping al servidor
   ping 192.168.1.100
   
   # Intenta acceder a la API
   curl http://192.168.1.100:3000/health
   ```

### PM2 no reconoce comandos

```bash
# Reinstalar PM2 globalmente
npm install -g pm2

# Verificar instalación
pm2 --version

# Si no funciona, agregar a PATH de Windows
```

### Frontend no carga / pantalla en blanco

1. Verifica que la API esté corriendo:
   ```bash
   curl http://localhost:3000/health
   ```

2. Revisa la consola del navegador (F12) para errores

3. Verifica la configuración de API URL en el frontend

4. Limpia caché del navegador y recarga (Ctrl+Shift+R)

### Error de permisos en PowerShell

Ejecuta los scripts `.bat` desde el Explorador de Windows (doble click) en lugar de desde PowerShell.

### Impresora no imprime

1. Verifica que el Print Server esté corriendo:
   ```bash
   pm2 status
   ```

2. Verifica la configuración de impresora en el panel de administración

3. Asegúrate de que la impresora esté conectada y encendida

4. Revisa logs del print server:
   ```bash
   pm2 logs vertice-print
   ```

---

## 📚 Documentación Adicional

- **[INSTALACION.md](INSTALACION.md)** - Guía detallada de instalación paso a paso
- **[PM2-GUIA.md](PM2-GUIA.md)** - Guía completa de administración con PM2
- **[LICENSE](LICENSE)** - Licencia GPL-2.0

---

## 🔄 Actualización del Sistema

Para actualizar a una nueva versión:

1. **Detén los servicios:**
   ```bash
   DETENER.bat
   ```

2. **Crea backup de la base de datos:**
   ```bash
   pg_dump -U postgres -d vertice_pos_db > backup_pre_update.sql
   ```

3. **Descarga la nueva versión** del sistema

4. **Ejecuta el instalador:**
   ```bash
   INSTALAR.bat
   ```

5. **Reinicia el sistema:**
   ```bash
   INICIAR.bat
   ```

---

## 🔗 Recursos Útiles

- **Node.js:** https://nodejs.org
- **PostgreSQL:** https://www.postgresql.org
- **PM2 Docs:** https://pm2.keymetrics.io
- **Prisma Docs:** https://www.prisma.io/docs
- **React Docs:** https://react.dev
- **Material-UI:** https://mui.com

---

## 📝 Changelog

### v1.11.0 (Actual)
- ✨ Cliente se limpia automáticamente después de completar venta
- 🔧 Mejoras en la gestión de memoria
- 📦 Proceso de empaquetado optimizado
- 🐛 Correcciones menores de bugs

### v1.10.2
- 📦 Sistema de empaquetado profesional
- 🔧 Mejoras en scripts de instalación
- 📖 Documentación actualizada

### v1.10.1
- 🖼️ Corrección de íconos en Electron
- 🔐 Mejoras en configuración de seguridad
- 🐛 Fixes de conexión externa

### v1.8.0
- 🛡️ Rate Limiting profesional
- 📊 Winston Logging estructurado
- ✅ Validación con Zod
- 💾 Backups automáticos
- 🚀 PM2 auto-restart mejorado
- 🎨 UX/UI refinada

Para historial completo de cambios, contacta al equipo de desarrollo.

---

## 📄 Licencia

Este proyecto está licenciado bajo **GPL-2.0** - ver archivo [LICENSE](LICENSE) para más detalles.

**Copyright © 2025 - Jesus Diaz | DT Dragway**

Este software es de código abierto bajo GPL-2.0. Puedes usar, modificar y distribuir este software bajo los términos de la licencia.

Para uso comercial o soporte profesional, contacta al equipo de desarrollo.

---

## 👤 Autor

**Jesus Diaz**  
DT Dragway  

---

## 🙏 Agradecimientos

- Material-UI por los componentes premium
- Prisma por el ORM extraordinario
- PM2 por la gestión de procesos robusta
- La comunidad de React y Node.js

---

<div align="center">

**Vertice POS v1.11.0**

*Sistema de Punto de Venta Profesional*

Construido con ❤️ por DT Dragway

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue.svg)](https://www.postgresql.org)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![License](https://img.shields.io/badge/license-GPL--2.0-red.svg)](LICENSE)

</div>
