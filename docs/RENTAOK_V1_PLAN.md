# RENTAOK V1 PLAN

Reglas no negociables
- Notificaciones solo al inquilino
- Mora manual como item, nunca automatica
- Pagos parciales + "pagado sin comprobante"
- Garantes siempre como datos, sin notificacion automatica v1
- Export ZIP obligatorio
- Auth client-only

Etapa 1 - Contratos MVP + PDF
- Commits chicos:
  - feat: contracts MVP with required guarantors and pdf upload
- Checkpoints verificables:
  - /contracts lista
  - /contracts/new permite crear contrato con garantes + PDF
  - /contracts/[id] muestra datos del contrato y link de PDF
  - build/dev no roto

Etapa 2 - Cuotas (installments) y generacion mensual
- Commits chicos:
  - feat: generate monthly installments from contract
- Checkpoints verificables:
  - Abrir contrato -> tab Cuotas -> click Generar cuotas
  - Se crean cuotas mensuales y se listan
  - Repetir click no duplica (id estable)

Etapa 3 - Pagos basicos e items manuales
- Commits chicos:
  - feat: add payments collection scaffolding
  - feat: record partial payments and mark paid without receipt
- Checkpoints verificables:
  - Registrar pago parcial en una cuota y ver total/due actualizado
  - Marcar cuota como "pagado sin comprobante"
  - Mora solo como item manual, nunca automatico

Etapa 4 - Notificaciones v1 (solo inquilino)
- Commits chicos:
  - feat: tenant-only notification config and overrides
  - feat: notification preview and opt-in per installment
- Checkpoints verificables:
  - Configuracion de notificaciones solo al inquilino
  - Overrides por cuota respetados

Etapa 5 - Export ZIP obligatorio
- Commits chicos:
  - feat: export ZIP with contract + installments
- Checkpoints verificables:
  - Export ZIP disponible en detalle de contrato
  - ZIP incluye contrato PDF y resumen de cuotas

Etapa 6 - Hardening y QA
- Commits chicos:
  - chore: validate invariants and edge cases
  - chore: UI polish for installments and contracts
- Checkpoints verificables:
  - Flujos principales sin errores en dev
  - Reglas no negociables verificadas
