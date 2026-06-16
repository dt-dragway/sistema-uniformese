# Guía de Despliegue en Producción - Vertice POS

Esta guía explica el proceso para compilar y empaquetar **Vertice POS** en un único instalador `.exe` autónomo para Windows, diseñado para instalarse y configurarse de forma completamente automatizada en los equipos de los clientes.

---

## 🛠️ Requisitos de Desarrollo

Para compilar el instalador, el equipo de desarrollo debe contar con:
1. **Node.js** (versión 18 o superior).

---

## 📦 Proceso de Compilación y Empaquetado (Método Integrado: Electron-Builder + NSIS)

Este método utiliza el mismo flujo de empaquetado que ya tienes configurado en **Vertice POS** a través de `electron-builder`.

### Paso 1: Limpiar la Base de Datos (Opcional, para empezar de cero)
Si deseas vaciar la base de datos de desarrollo para empezar desde cero, ejecuta en PowerShell:
```bash
cd vertice-nodejs-api
$env:DATABASE_URL="postgresql://postgres:admin2425@localhost:5432/uniformese_bd?schema=public"; npx prisma db push --force-reset
```
Esto limpiará las tablas e inicializará el esquema Prisma. A continuación, siembra la base de datos con los datos por defecto y el usuario administrador:
```bash
$env:DATABASE_URL="postgresql://postgres:admin2425@localhost:5432/uniformese_bd?schema=public"; npx prisma db seed
node create-superadmin.js
```

### Paso 2: Compilar el Frontend y el Backend
Compila todos los recursos para producción:
1. **Frontend**: Generará los archivos estáticos en `vertice-frontend/dist`.
   ```bash
   cd vertice-frontend
   npm run build
   ```
2. **Backend**: Compilará el código de TypeScript a Javascript.
   ```bash
   cd vertice-nodejs-api
   npm run build
   ```

### Paso 3: Generar el Instalador de Windows (`.exe` de instalación)
En la raíz del proyecto, ejecuta el script de distribución:
```bash
npm run dist:win
```
Esto iniciará `electron-builder`, el cual empaquetará la aplicación de escritorio y creará el instalador `Vertice POS Setup 1.12.0.exe` en la carpeta `release/`.

Durante la compilación, se incluye la macro personalizada en [build/installer.nsh](file:///c:/Users/dragway/Documents/uniformese/build/installer.nsh), la cual se encargará de ejecutar el script de configuración del servicio en segundo plano cuando el cliente instale el programa.

---

## 🚀 Instalación en el Servidor del Cliente

Lleva el instalador generado (`release/Vertice POS Setup 1.12.0.exe`) al equipo del cliente y ejecútalo. El instalador realizará todo lo siguiente de forma nativa y automática:

1. **Instalación de archivos**: Copiará los archivos a la carpeta del programa.
2. **Estructuración de Base de Datos**: Creará las tablas e inicializará el esquema automáticamente usando Prisma Client y creará el usuario administrador `admin` con contraseña `admin2425*`.
3. **Instalación de Tareas de Fondo**: Creará tareas en el programador de tareas de Windows para arrancar automáticamente la API (puerto `4000`) y el servidor de impresión (puerto `3001`) al arrancar el sistema, corriendo en segundo plano bajo la cuenta `SYSTEM` sin mostrar molestas ventanas de consola.

---

## 📈 Administración y Diagnóstico

El instalador crea accesos directos en el menú de Inicio y el Escritorio para administrar los servicios:

- **Iniciar Servicios**: Ejecuta `INICIAR.bat` (o ejecuta la tarea programada).
- **Detener Servicios**: Ejecuta `stop-server.bat` para detener los procesos en segundo plano.
- **Acceso Web**: Abre un navegador y accede a `http://localhost:4000` (o desde la red local usando `http://[IP-DEL-SERVIDOR]:4000`).
