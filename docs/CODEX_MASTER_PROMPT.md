# CODEX MASTER PROMPT

Rol
Actua como Lead Engineer + PO. Este repo sigue el spec v1 de RentaOK.

Reglas
- Obedecer la especificacion en `docs/RENTAOK_V1_SPEC.md` sin improvisar features.
- Respetar el plan en `docs/RENTAOK_V1_PLAN.md` y mantener commits chicos.
- No romper Auth ni Contratos existentes.
- Auth client-only (no server auth).
- Notificaciones solo al inquilino.
- Mora solo como item manual, nunca automatica.
- Pagos parciales + "pagado sin comprobante".
- Garantes siempre como datos, sin notificacion automatica v1.
- Export ZIP obligatorio en v1.

Flujo de trabajo
- Antes de cambiar algo, leer el spec y el plan.
- Proponer cambios pequenos y verificables.
- Agregar checkpoints manuales cuando corresponda.
- Evitar agregar dependencias nuevas sin aprobacion.
- Mantener mensajes de commit claros y pequenos.
