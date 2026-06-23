# Guía de Despliegue en Producción - Vertice POS

Esta guía explica el proceso para compilar y empaquetar **Vertice POS** en un único instalador `.exe` autónomo para Windows, diseñado para instalarse y configurarse de forma completamente automatizada en los equipos de los clientes.

---

## 🛠️ Requisitos de Desarrollo

Para compilar el instalador, el equipo de desarrollo debe contar con:
1. **Node.js** (versión 18 o superior).

---

## 📦 Proceso de Compilación y Empaquetado (Método: Inno Setup + Scripts)

Este método prepara la API en Node.js y el Frontend en Vite (PWA) como un servidor autónomo.

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

### Paso 2: Generar los binarios y empaquetado inicial
En la raíz del proyecto, ejecuta el script de distribución:
```bash
EMPAQUETAR.bat
```
Este script se encargará de:
1. Compilar el Frontend (Vite PWA) y el Backend (TypeScript).
2. Crear un empaquetado completo en la carpeta `release/vertice-pos-vX.X.X` que contiene únicamente los recursos del servidor.

### Paso 3: Generar el Instalador de Windows (`.exe` de instalación)
Una vez que `EMPAQUETAR.bat` haya finalizado, abre el archivo `installer.iss` en el programa **Inno Setup Compiler**.
Presiona **Compile** para que Inno Setup empaquete los archivos compilados en un único archivo instalador dentro de la carpeta `release/`.

Durante la instalación en el cliente, el ejecutable usará los scripts de servicio para registrar el arranque en segundo plano.

---

## 🚀 Instalación en el Servidor del Cliente

Lleva el instalador generado (`release/Vertice POS Setup 1.14.0.exe`) al equipo del cliente y ejecútalo. El instalador realizará todo lo siguiente de forma nativa y automática:

1. **Instalación de archivos**: Copiará los archivos a la carpeta del programa.
2. **Estructuración de Base de Datos**: Creará las tablas e inicializará el esquema automáticamente usando Prisma Client y creará el usuario administrador `admin` con contraseña `admin2425*`.
3. **Instalación de Tareas de Fondo**: Creará tareas en el programador de tareas de Windows para arrancar automáticamente la API (puerto `4000`) y el servidor de impresión (puerto `3001`) al arrancar el sistema, corriendo en segundo plano bajo la cuenta `SYSTEM` sin mostrar molestas ventanas de consola.

---

## 📈 Administración y Diagnóstico

El instalador crea accesos directos en el menú de Inicio y el Escritorio para administrar los servicios:

- **Iniciar Servicios**: Ejecuta `INICIAR.bat` (o ejecuta la tarea programada).
- **Detener Servicios**: Ejecuta `stop-server.bat` para detener los procesos en segundo plano.
- **Acceso Web**: Abre un navegador y accede a `http://localhost:4000` (o desde la red local usando `http://[IP-DEL-SERVIDOR]:4000`).
