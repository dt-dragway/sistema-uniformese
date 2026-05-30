# Multi-stage Dockerfile para Vértice POS (Retail Edition)

# STAGE 1: Construcción del Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY vertice-frontend/package*.json ./
RUN npm install
COPY vertice-frontend/ ./
RUN npm run build

# STAGE 2: Construcción del Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY vertice-nodejs-api/package*.json ./
RUN npm install
COPY vertice-nodejs-api/ ./
RUN npx prisma generate
RUN npm run build

# STAGE 3: Imagen Final de Producción
FROM node:18-alpine
WORKDIR /app

# Instalar cliente de PostgreSQL para respaldos (pg_dump)
RUN apk add --no-cache postgresql-client

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Copiar el backend compilado y dependencias
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/prisma ./prisma

# Copiar el frontend compilado a la carpeta que el backend espera
COPY --from=frontend-builder /app/frontend/dist ./vertice-frontend/dist

# Exponer el puerto
EXPOSE 3000

# Comando para ejecutar migraciones, poblar datos iniciales y arrancar el servidor
# Se usa npx prisma db push para asegurar que la DB esté lista antes del seed
CMD npx prisma db push --accept-data-loss && npx prisma db seed && node dist/index.js
