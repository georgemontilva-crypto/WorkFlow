# Guía Rápida de Deployment - Sistema de Monedas

## ⚡ PASOS INMEDIATOS

### 1. Ejecutar Migración en TablePlus (OBLIGATORIO)

```sql
ALTER TABLE `user` 
ADD COLUMN `primary_currency` VARCHAR(3) NOT NULL DEFAULT 'USD' 
AFTER `two_factor_enabled`;
```

**Tiempo estimado:** 10 segundos

---

### 2. Verificar Deployment en Railway

1. Ve a Railway → Tu servicio → Deployments
2. Verifica que el commit `527b1ba` esté desplegando
3. Espera 2-3 minutos a que termine el build
4. Verifica que el status sea "Success"

---

### 3. Probar el Sistema

#### Test 1: Registro con Moneda

1. Abre tu app en modo incógnito
2. Ve a `/signup`
3. Llena el formulario
4. **Verifica que aparezca el selector de "Moneda Principal"**
5. Busca "peso" en el selector
6. Selecciona "COP – Peso colombiano"
7. Completa el registro
8. Verifica que el email de verificación llegue

#### Test 2: Metas de Ahorro

1. Login con tu usuario
2. Ve a `/savings`
3. Crea una nueva meta
4. **Verifica que el selector de moneda aparezca**
5. Selecciona una moneda diferente (ej: EUR)
6. Guarda la meta
7. Verifica que se muestre en EUR

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Migración SQL ejecutada en TablePlus
- [ ] Deployment en Railway completado (commit 527b1ba)
- [ ] Registro muestra selector de moneda
- [ ] Selector tiene buscador funcional
- [ ] Selector muestra 60+ monedas
- [ ] Metas de ahorro permiten seleccionar moneda
- [ ] Valores monetarios se formatean correctamente

---

## 🚨 SI ALGO FALLA

### Error: "Unknown column 'primary_currency'"

**Solución:** No ejecutaste la migración SQL. Ve al Paso 1.

### Error: "Cannot find module '@shared/currencies'"

**Solución:** El deployment no terminó. Espera 2-3 minutos más.

### Selector de moneda no aparece

**Solución:** 
1. Limpia caché del navegador (Ctrl + Shift + R)
2. Verifica que el deployment esté completo
3. Revisa logs de Railway para errores de build

---

## 📞 DOCUMENTACIÓN COMPLETA

Ver `SISTEMA_MONEDAS_IMPLEMENTACION.md` para detalles completos.

---

**Tiempo total de deployment:** 5-10 minutos
