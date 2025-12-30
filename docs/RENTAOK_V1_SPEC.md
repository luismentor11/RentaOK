# RENTAOK V1 SPEC

PROMPT PARA CODEX — Etapa 1 / Commit 1: Contratos MVP + PDF

Objetivo:
Agregar modulo Contratos v1 alineado al spec. No crear cuotas todavia.

Requisitos de producto:
- Contrato: propiedad + locatario + propietario + GARANTES (siempre).
- Garantes: nombre, DNI, domicilio, email, celular WhatsApp.
- Subir contrato PDF (archivo) y referenciarlo en el contrato.
- Campos editables: inicio/fin, dia vencimiento, monto inicial, regla actualizacion (IPC/ICL/fijo/manual) + periodicidad, deposito, tipo garantia (garantes/caucion), contactos.
- Nada de anti-mora. Nada de cobranzas. Nada de notificar garantes.

Datos / Firestore (por tenant):
- tenants/{tenantId}/contracts/{contractId}

Tareas (orden):
1) Crear `src/lib/model/v1.ts` con types + enums:
   - UpdateRuleType: IPC | ICL | FIJO | MANUAL
   - GuaranteeType: GARANTES | CAUCION
   - Contract con parties + guarantors[] + notificationConfig defaults (editable luego).
2) Crear `src/lib/db/contracts.ts`:
   - listContracts(tenantId)
   - createContract(tenantId, data) -> retorna contractId
   - getContract(tenantId, id)
   - updateContract(tenantId, id, patch)
3) Crear `src/lib/storage/contracts.ts`:
   - uploadContractPdf(tenantId, contractId, file) -> guarda en Storage y retorna metadata {path, downloadUrl, uploadedAt}
4) UI:
   - `src/app/contracts/page.tsx` listado simple + boton "Nuevo contrato"
   - `src/app/contracts/new/page.tsx` form simple:
     - seleccionar/crear propiedad (si ya existe modulo propiedades, reusar selector simple; si no, usar input title/address y luego lo conectamos)
     - locatario (nombre, dni, email, whatsapp)
     - propietario (nombre, dni, email, whatsapp)
     - garantes: UI para agregar 1..N, requerido al menos 1 (siempre)
     - contrato PDF upload (requerido)
     - config: fechas, dueDay, rentAmount, updateRule type + periodicidad, deposito, guaranteeType
     - al guardar: createContract -> upload PDF -> updateContract con pdf metadata -> redirect a /contracts/[id]
   - `src/app/contracts/[id]/page.tsx` detalle con tabs placeholders:
     - Cuotas (placeholder)
     - Garantes (mostrar datos)
     - Config Notificaciones (placeholder)
     - Bitacora (placeholder)
     - Export ZIP (placeholder)
5) Proteccion:
   - Todas las rutas requieren sesion y tenantId; si falta tenantId -> /onboarding.
6) Navegacion:
   - Agregar link "Contratos" en AppShell.
7) Commit + push:
   - `feat: contracts MVP with required guarantors and pdf upload`

Checkpoints manuales:
- /contracts lista
- /contracts/new permite crear contrato con garantes + PDF
- /contracts/[id] muestra datos del contrato y link de PDF
- build/dev no roto

PROMPT PARA CODEX — Etapa 1 / Commit 2: Cuotas (installments) + generacion mensual

Contexto:
- Contratos v1 ya existen con PDF y partes/garantes.
- No romper Auth ni Contratos.
- Objetivo: generar cuotas mensuales desde contrato.

Modelo Firestore (por tenant):
- tenants/{tenantId}/installments/{installmentId}
Campos minimos installment:
- contractId
- period (YYYY-MM)
- dueDate (timestamp)
- status (POR_VENCER|VENCE_HOY|VENCIDA|EN_ACUERDO|PARCIAL|PAGADA)
- totals: total, paid, due (number)  // calculables pero utiles para dashboard
- notificationConfigOverride (opcional) { enabledR1, enabledR2 }  // para etapa notifs
- createdAt, updatedAt

Subcolecciones:
- tenants/{tenantId}/installments/{installmentId}/items/{itemId}
  - type: ALQUILER|EXPENSAS|ROTURAS|SERVICIOS|MORA|AJUSTE|OTRO
  - label (string)
  - amount (number)
  - createdAt, updatedAt
- tenants/{tenantId}/installments/{installmentId}/payments/{paymentId} (vacio por ahora)

Tareas:
1) Crear helpers:
   - `src/lib/db/installments.ts` con:
     - `generateInstallmentsForContract(tenantId, contract)`:
        - genera meses desde startDate a endDate (inclusive por mes)
        - calcula dueDate usando contract.dueDay (si el mes no tiene ese dia, usar ultimo dia del mes)
        - crea installment doc por periodo si no existe (id estable recomendado: `${contractId}_${YYYY-MM}`)
        - crea item base ALQUILER en subcoleccion items con amount = contract.rentAmountInicial
        - inicializa totals: total=amount alquiler, paid=0, due=total
        - status inicial segun fecha vs hoy:
          - si dueDate > hoy: POR_VENCER
          - si dueDate == hoy: VENCE_HOY
          - si dueDate < hoy: VENCIDA
     - `listInstallmentsByContract(tenantId, contractId)`
2) UI en detalle de contrato:
   - En `src/app/contracts/[id]/page.tsx`, tab "Cuotas":
     - boton "Generar cuotas" (confirmacion simple: “Esto creara cuotas mensuales…”)
     - al click: llama generateInstallmentsForContract
     - muestra lista de cuotas generadas (period, dueDate, status, total, paid, due)
3) No implementar pagos/items extra todavia (solo ALQUILER base).
4) Commit + push:
   - `feat: generate monthly installments from contract`

Checkpoints manuales:
- Abrir contrato -> tab Cuotas -> click Generar cuotas
- Se crean cuotas mensuales y se listan
- Repetir click no duplica (id estable)
