# Guía de Instalación - Vertice POS v1.11.0

## 📋 Requisitos Previos

Antes de instalar Vertice POS, asegúrate de tener instalado:

### Software Requerido

1. **Node.js 18 o superior**
   - Descarga: https://nodejs.org
   - Verificar: `node --version`

2. **PostgreSQL 14 o superior**
   - Descarga: https://www.postgresql.org/download/windows/
   - Verificar: `psql --version`
   - Durante la instalación, recuerda la contraseña del usuario `postgres`

3. **Git** (opcional, para clonar el repositorio)
   - Descarga: https://git-scm.com/download/win

### Hardware Recomendado

- **Servidor (PC principal)**:
  - RAM: 8GB mínimo
  - Procesador: Intel i5 o equivalente
  - Disco: 20GB libres
  - Sistema Operativo: Windows 10/11 (64-bit)
  - Red: IP estática recomendada

- **Clientes (PCs secundarios)**:
  - RAM: 4GB mínimo
  - Navegador moderno (Chrome, Firefox, Edge)
  - Conexión a la red local del servidor

---

## 🚀 Instalación Paso a Paso

### 1. Preparar la Base de Datos

Abre **pgAdmin** o la consola `psql` y ejecuta:

```sql
-- Crear la base de datos
CREATE DATABASE vertice_pos_db;

-- Verificar que se creó correctamente
\l
```

**Nota**: Si PostgreSQL usa un puerto diferente al 5432, o un usuario diferente a `postgres`, necesitarás ajustar el archivo `.env` después de la instalación.

### 2. Obtener el Código Fuente

**Opción A: Si tienes el código fuente en una carpeta**
```bash
# Navega a la carpeta del proyecto
cd E:\Desarrollos\vertice_pos
```

**Opción B: Si tienes un paquete ZIP de distribución**
```bash
# Descomprime el archivo en una ubicación
# Por ejemplo: C:\vertice_pos
```

### 3. Ejecutar el Instalador

Abre el Explorador de Windows, navega a la carpeta del proyecto y ejecuta:

```
INSTALAR.bat
```

El instalador realizará automáticamente los siguientes pasos:
- ✅ Verificar que Node.js y PostgreSQL estén instalados
- ✅ Solicitar configuración de base de datos (password)
- ✅ Instalar todas las dependencias (API, Frontend, Print Server)
- ✅ Crear archivos de configuración (`.env`)
- ✅ Generar Prisma Client
- ✅ Sincronizar el schema con la base de datos
- ✅ Compilar el frontend y la API
- ✅ Instalar PM2 globalmente para gestión de procesos
- ✅ Crear carpeta de logs

**Importante**: Este proceso puede tomar entre 5-10 minutos dependiendo de tu conexión a internet.

### 4. Verificar la Instalación

Al finalizar, el instalador mostrará un resumen. Verifica que no haya errores.

---

## 🎯 Iniciar el Sistema

Una vez instalado, hay dos formas de iniciar Vertice POS:

### Opción 1: Con PM2 (Recomendado para Producción)

PM2 gestiona los procesos automáticamente, reiniciándolos en caso de fallos.

```bash
# Iniciar todos los servicios
INICIAR.bat
```

Esto iniciará:
- API en `http://0.0.0.0:3000`
- Print Server en `http://0.0.0.0:3001`

### Opción 2: Modo Desarrollo (solo para desarrolladores)

```bash
# Terminal 1 - API
cd vertice-nodejs-api
npm run dev

# Terminal 2 - Frontend (si estás desarrollando)
cd vertice-frontend
npm run dev
```

---

## 📊 Comandos Útiles

Una vez iniciado el sistema, puedes usar estos comandos:

| Script | Descripción |
|--------|-------------|
| `INICIAR.bat` | Inicia todos los servicios con PM2 |
| `DETENER.bat` | Detiene todos los servicios |
| `REINICIAR.bat` | Reinicia los servicios sin downtime |
| `ESTADO.bat` | Muestra el estado de todos los servicios |
| `LOGS.bat` | Ver logs en tiempo real de todos los servicios |

### Comandos PM2 Avanzados

```bash
# Ver estado detallado
pm2 status

# Ver logs de un servicio específico
pm2 logs vertice-api
pm2 logs vertice-print

# Monitor en tiempo real (CPU, memoria)
pm2 monit

# Reiniciar un servicio específico
pm2 restart vertice-api

# Detener un servicio específico
pm2 stop vertice-api

# Ver información detallada
pm2 show vertice-api

# Guardar configuración actual
pm2 save

# Configurar PM2 para iniciar en booteo del sistema
pm2 startup
```

---

## 🌐 Acceso a la Aplicación

### En el Servidor

Abre un navegador y accede a:
```
http://localhost:3000
```

### Desde Otros Computadores en la Red

1. **Obtén la IP del servidor**:
   ```bash
   ipconfig
   ```
   Busca la `Dirección IPv4` (por ejemplo: `192.168.1.100`)

2. **Configura el Firewall de Windows**:
   - Abre "Firewall de Windows Defender"
   - Click en "Configuración avanzada"
   - Click en "Reglas de entrada" → "Nueva regla"
   - Selecciona "Puerto" → "TCP" → "3000"
   - Permite la conexión y aplica a todos los perfiles

3. **Accede desde el cliente**:
   ```
   http://[IP-DEL-SERVIDOR]:3000
   
   Ejemplo: http://192.168.1.100:3000
   ```

---

## 👤 Credenciales por Defecto

Al iniciar el sistema por primera vez, se crea un usuario administrador:

- **Usuario**: `admin`
- **Contraseña**: `admin2425*`

**⚠️ IMPORTANTE**: Cambia esta contraseña inmediatamente después del primer login desde el panel de administración → Usuarios.

---

## 🔧 Configuración Avanzada

### Cambiar Puerto de la API

Edita el archivo `vertice-nodejs-api/.env`:

```bash
PORT=3000  # Cambia esto al puerto deseado
```

Luego reinicia los servicios:
```bash
REINICIAR.bat
```

### Configurar IP Estática del Servidor

Para que los clientes siempre puedan acceder sin problemas:

1. Abre "Panel de control" → "Centro de redes y recursos compartidos"
2. Click en tu conexión de red
3. Click en "Propiedades" → "Protocolo de Internet versión 4 (TCP/IPv4)"
4. Selecciona "Usar la siguiente dirección IP"
5. Ingresa:
   - IP: `192.168.1.100` (o la que prefieras)
   - Máscara: `255.255.255.0`
   - Puerta de enlace: `192.168.1.1` (depende de tu router)
   - DNS: `8.8.8.8` y `8.8.4.4`

###{#} Backups Automáticos

El sistema crea backups automáticos diarios de la base de datos en:
```
E:\Desarrollos\vertice_pos\backups\
```

Los backups se nombran como: `db_backup_YYYY-MM-DD.sql`

**Retención**: El sistema mantiene los últimos 7 días automáticamente.

### Restaurar un Backup

Desde el panel de administración:
1. Ve a "Mantenimiento" → "Respaldo y Restauración"
2. Click en "Restaurar"
3. Selecciona el archivo `.sql`
4. Confirma la restauración

---

## 🐛 Solución de Problemas

### El servidor no inicia

```bash
# Ver logs de PM2
pm2 logs

# Verificar estado
pm2 status

# Reiniciar
pm2 restart all
```

### Error de conexión a base de datos

1. Verifica que PostgreSQL esté corriendo:
   ```bash
   # En Services.msc busca "postgresql"
   ```

2. Verifica las credenciales en `vertice-nodejs-api/.env`:
   ```bash
   DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/vertice_pos_db?schema=public"
   ```

3. Regenera Prisma Client:
   ```bash
   cd vertice-nodejs-api
   npx prisma generate
   npx prisma db push
   ```

### Los clientes no pueden conectar desde la red

1. Verifica el firewall de Windows
2. Verifica que la API esté escuchando en `0.0.0.0` (no en `127.0.0.1`)
3. Haz ping desde el cliente al servidor:
   ```bash
   ping 192.168.1.100
   ```

### PM2 no reconoce los comandos

Instala PM2 globalmente:
```bash
npm install -g pm2
```

### Errores de permisos en PowerShell

Ejecuta los scripts desde el Explorador de Windows (doble click) en lugar de PowerShell.

---

## 📞 Soporte

Para soporte adicional:
- Revisa los logs en: `vertice_pos/logs/`
- Revisa la documentación en: `README.md`
- Contacta al equipo de desarrollo

---

## 🔄 Actualización del Sistema

Para actualizar a una nueva versión:

1. Detén los servicios:
   ```bash
   DETENER.bat
   ```

2. Haz backup de tu base de datos

3. Descarga la nueva versión

4. Ejecuta:
   ```bash
   INSTALAR.bat
   ```

5. Reinicia:
   ```bash
   INICIAR.bat
   ```

---

**¡Listo! Ahora tienes Vertice POS corriendo de manera profesional con PM2 🎉**
