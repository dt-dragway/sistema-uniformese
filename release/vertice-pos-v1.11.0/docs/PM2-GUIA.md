# Guía de Administración con PM2 - Vertice POS

PM2 es un gestor de procesos de producción para aplicaciones Node.js. Proporciona:
- ✅ Auto-restart en caso de fallos
- ✅ Balanceo de carga
- ✅ Monitoreo en tiempo real
- ✅ Gestión de logs centralizada
-  Restart programado

---

## 🚀 Comandos Básicos

### Iniciar Servicios

```bash
# Iniciar todos los servicios definidos en ecosystem.config.js
pm2 start ecosystem.config.js

# O usa el script predefinido
INICIAR.bat
```

### Detener Servicios

```bash
# Detener todos los servicios
pm2 stop all

# Detener un servicio específico
pm2 stop vertice-api
pm2 stop vertice-print

# O usa el script predefinido
DETENER.bat
```

### Reiniciar Servicios

```bash
# Reiniciar todos los servicios
pm2 restart all

# Reiniciar un servicio específico
pm2 restart vertice-api

# O usa el script predefinido
REINICIAR.bat
```

### Eliminar Servicios

```bash
# Eliminar todos los servicios de PM2
pm2 delete all

# Eliminar un servicio específico
pm2 delete vertice-api
```

---

## 📊 Monitoreo

### Ver Estado

```bash
# Ver lista de procesos
pm2 status

# O usa el script predefinido
ESTADO.bat
```

Salida típica:
```
┌────┬────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬─────┬───────────┬──────────┐
│ id │ name           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺   │ status    │ cpu      │
├────┼────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼─────┼───────────┼──────────┤
│ 0  │ vertice-api    │ default     │ 1.10.2  │ fork    │ 12345    │ 3h     │ 0   │ online    │ 0.2%     │
│ 1  │ vertice-print  │ default     │ 1.10.2  │ fork    │ 12346    │ 3h     │ 0   │ online    │ 0.1%     │
└────┴────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴─────┴───────────┴──────────┘
```

### Ver Información Detallada

```bash
# Ver información completa de un proceso
pm2 show vertice-api

# Incluye: uptime, restarts, memoria, CPU, paths, logs, etc.
```

### Monitor en Tiempo Real

```bash
# Dashboard interactivo con CPU y memoria
pm2 monit
```

---

## 📝 Logs

### Ver Logs

```bash
# Ver logs de todos los servicios en tiempo real
pm2 logs

# Ver logs de un servicio específico
pm2 logs vertice-api
pm2 logs vertice-print

# Ver las últimas N líneas
pm2 logs --lines 100

# O usa el script predefinido
LOGS.bat
```

### Limpiar Logs

```bash
# Vaciar todos los logs
pm2 flush

# Los logs también están en archivos:
# - logs/api-error.log
# - logs/api-out.log
# - logs/print-error.log
# - logs/print-out.log
```

---

## ⚙️ Configuración Avanzada

### Archivo ecosystem.config.js

Ubicación: `e:\Desarrollos\vertice_pos\ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'vertice-api',
      script: 'dist/index.js',
      cwd: './vertice-nodejs-api',
      instances: 1,
      autorestart: true,
      max_restarts: 10,              // Máximo de reinicios consecutivos
      min_uptime: '10s',             // Tiempo mínimo de ejecución
      max_memory_restart: '500M',    // Restart si excede 500MB
      restart_delay: 4000,           // Espera 4s antes de reiniciar
      cron_restart: '0 3 * * *',     // Restart diario a las 3 AM
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      }
    },
    {
      name: 'vertice-print',
      script: 'index.js',
      cwd: './vertice-print-server',
      // ... configuración similar
    }
  ]
};
```

### Modificar Configuración

1. Edita `ecosystem.config.js`
2. Reinicia los servicios:
   ```bash
   pm2 delete all
   pm2 start ecosystem.config.js
   pm2 save
   ```

---

## 🔄 Auto-Restart en Fallos

PM2 reiniciará automáticamente los servicios si:
- La aplicación crashea
- Supera el límite de memoria (500MB para API, 300MB para Print)
- No completa el tiempo mínimo de ejecución (10s)

### Políticas de Restart

```bash
# Ver número de reinicios
pm2 status

# Si un servicio se reinicia más de 10 veces en poco tiempo, PM2 lo detendrá
# Puedes ajustar esto en ecosystem.config.js: max_restarts
```

---

## ⏰ Restart Programado

Los servicios se reinician automáticamente todos los días a las 3 AM para:
- Liberar memoria acumulada
- Aplicar cambios de configuración
- Mantener el sistema fresco

Para cambiar el horario, edita en `ecosystem.config.js`:
```javascript
cron_restart: '0 3 * * *'  // Formato: minuto hora día mes día_semana
```

Ejemplos:
- `'0 3 * * *'` - Diario a las 3:00 AM
- `'0 2 * * 0'` - Domingos a las 2:00 AM
- `'0 0 1 * *'` - Primer día de cada mes a medianoche

---

## 💾 Persistencia

### Guardar Configuración Actual

```bash
# Guarda el estado actual de PM2
pm2 save

# Esto crea: C:\Users\TU_USUARIO\.pm2\dump.pm2
```

### Auto-start en Inicio del Sistema

Para que PM2 inicie automáticamente al arrancar Windows:

```bash
# Configurar
pm2 startup

# Seguir las instrucciones que muestra
# Luego guardar la configuración
pm2 save
```

---

## 🔍 Troubleshooting con PM2

### Servicio en estado "errored"

```bash
# Ver el error exacto
pm2 logs vertice-api --err --lines 50

# Revisar el archivo de error
type logs\api-error.log

# Reiniciar
pm2 restart vertice-api
```

### Servicio usa demasiada memoria

```bash
# Ver uso de memoria
pm2 monit

# Si es necesario, aumentar el límite en ecosystem.config.js:
max_memory_restart: '1G'  // Antes era 500M
```

### Servicio se reinicia constantemente

```bash
# Ver logs para identificar el problema
pm2 logs vertice-api --lines 200

# Revisar si hay problemas de conexión a BD
# Revisar si hay puertos ocupados
# Verificar .env
```

### PM2 no encuentra los comandos

```bash
# Reinstalar PM2 globalmente
npm install -g pm2

# Verificar instalación
pm2 --version

# Agregar al PATH si es necesario
```

---

## 📈 Optimización y Mejores Prácticas

### 1. Monitoreo Regular

```bash
# Ejecuta esto regularmente para verificar salud del sistema
pm2 status
pm2 monit
```

### 2. Limpiar Logs Periódicamente

```bash
# Cada semana o mes
pm2 flush
```

### 3. Actualizar PM2

```bash
# Mantener PM2 actualizado
npm install -g pm2@latest

# Actualizar procesos en ejecución
pm2 update
```

### 4. Backup de Configuración

```bash
# Después de cambios importantes
pm2 save
```

### 5. Revisar Logs de Errores

```bash
# Al menos una vez por semana
pm2 logs --err --lines 100
```

---

## 🔧 Comandos Útiles Adicionales

```bash
# Recargar aplicación (sin downtime)
pm2 reload vertice-api

# Escalar a múltiples instancias (cluster mode)
pm2 scale vertice-api 4

# Ver métricas y estadísticas
pm2 describe vertice-api

# Enviar señal a proceso
pm2 sendSignal SIGINT vertice-api

# Resetear contador de reinicios
pm2 reset vertice-api

# Listar todos los procesos en formato JSON
pm2 jlist

# Exportar configuración
pm2 ecosystem
```

---

## 📊 Interpretación de Estados

| Estado | Significado |
|--------|-------------|
| `online` | Proceso corriendo correctamente |
| `stopped` | Proceso detenido manualmente |
| `stopping` | Proceso deteniéndose |
| `waiting restart` | Esperando reinicio después de cambios |
| `launching` | Iniciando proceso |
| `errored` | Proceso con errores, revisar logs |
| `one-launch-status` | Proceso que se ejecuta una vez y termina |

---

## 🎯 Checklist de Mantenimiento

### Diario
- [ ] Revisar `pm2 status` para verificar que todo esté `online`
- [ ] Verificar que no haya reinicios excesivos (`↺` column)

### Semanal
- [ ] Revisar logs de errores: `pm2 logs --err --lines 200`
- [ ] Verificar uso de memoria: `pm2 monit`
- [ ] Revisar archivos de log en `logs/`

### Mensual
- [ ] Limpiar logs antiguos: `pm2 flush`
- [ ] Verificar espacio en disco
- [ ] Actualizar PM2 si hay nueva versión
- [ ] Revisar y ajustar configuración si es necesario

---

## 📞 Comandos de Emergencia

Si algo sale mal:

```bash
# 1. Detener todo
pm2 stop all

# 2. Eliminar todos los procesos
pm2 delete all

# 3. Reiniciar desde cero
pm2 start ecosystem.config.js

# 4. Guardar configuración
pm2 save

# 5. Verificar estado
pm2 status
```

---

**¡Con PM2 tu sistema Vertice POS correrá de manera estable y profesional! 🚀**
