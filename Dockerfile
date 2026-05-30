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

# Instalar cliente de PostgreSQL para respaldos
RUN apk add --no-cache postgresql-client

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000
ENV FRONTEND_PATH=/app/dist/vertice-frontend/dist

# Copiar el backend compilado
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/prisma ./prisma

# Copiar el frontend compilado a una ruta FIJA y conocida
# Lo ponemos dentro de la carpeta /app para que no haya dudas
RUN mkdir -p /app/vertice-frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/vertice-frontend/dist

# Exponer el puerto
EXPOSE 3000

# Comando para ejecutar migraciones, seed y arrancar
CMD npx prisma db push --accept-data-loss && npx prisma db seed && node dist/index.js
