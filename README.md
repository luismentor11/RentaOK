# RentaOK v1

RentaOK es una app web para gestion operativa de contratos de alquiler.

## Descripcion v1
Incluye:
- Login y onboarding de tenant.
- Panel operativo con vencimientos y acciones basicas.
- Gestion de contratos y detalle con cuotas, notificaciones y actividad.
- Pagos (placeholder UI).
- Configuracion basica por tenant.

No incluye:
- Envio real de mensajes (solo registro).
- Jobs o envios automaticos de recordatorios.
- Cobranza automatica o integraciones de pago.
- Multi-rol avanzado ni permisos finos.

## Rutas principales
- `/dashboard`
- `/contracts`
- `/contracts/[id]`
- `/payments`
- `/settings`

## Setup local
```bash
npm install
npm run dev
npm run build
```

## Notas multi-tenant
- Todas las pantallas principales requieren `tenantId`.
- El `tenantId` se crea via onboarding y se guarda en el perfil de usuario.

## Deploy Firebase App Hosting
Prerequisitos:
- Firebase CLI instalado y autenticado.
- `firebase.json` en la raiz con `apphosting.backendId`.

Comandos:
```bash
npm run build
firebase deploy --project studio-9607181001-d81c6 --only apphosting:backend=rentaok-app
```
