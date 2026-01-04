# RentaOK v1 Smoke Checklist

## Pre-requisitos
- Deploy activo en App Hosting.
- Usuario de prueba disponible o registro habilitado.

## Checks rapidos (post-deploy)
1) Login
   - Esperado: acceso exitoso y redireccion a onboarding si no hay tenant.

2) Onboarding tenant
   - Esperado: tenant creado y acceso al panel operativo.

3) Dashboard carga
   - Esperado: KPIs y filtros visibles sin errores.

4) Crear contrato
   - Esperado: contrato creado y redireccion al detalle.

5) Generar cuotas
   - Esperado: cuotas creadas y visibles en tab Pagos.

6) Registrar pago parcial
   - Esperado: estado de cuota cambia y totales se actualizan.

7) Registrar item adicional
   - Esperado: item agregado y totales recalculados.

8) Registrar mora
   - Esperado: mora agregada y totales recalculados.

9) Enviar mensaje manual
   - Esperado: evento registrado en Actividad.

10) Configuracion
   - Esperado: guardar Datos de oficina y Recordatorios sin errores.
