"use client";

import JSZip from "jszip";
import {
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { getContract } from "@/lib/db/contracts";
import { listInstallmentsByContract } from "@/lib/db/installments";
import { listContractEvents } from "@/lib/db/events";

const toSafeFilename = (value: string) =>
  value.replace(/[^a-zA-Z0-9._-]/g, "_");

const stripUndefinedDeep = <T,>(value: T): T => {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedDeep(item))
      .filter((item) => item !== undefined) as T;
  }
  if (value && typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype) {
      return value;
    }
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, stripUndefinedDeep(item)]);
    return Object.fromEntries(entries) as T;
  }
  return value;
};

const sanitizePayload = <T extends Record<string, unknown>>(value: T) =>
  stripUndefinedDeep(value) as T;

const toIsoString = (value: unknown) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof (value as any)?.toDate === "function") {
    return (value as any).toDate().toISOString();
  }
  return "";
};

const csvEscape = (value: string) => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
};

const buildCsv = (headers: string[], rows: string[][]) => {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(row.map((value) => csvEscape(value)).join(","));
  }
  return lines.join("\n");
};

const resolveDownloadUrl = async (value?: {
  url?: string;
  path?: string;
  downloadUrl?: string;
}) => {
  if (!value) return null;
  if (value.downloadUrl) return value.downloadUrl;
  if (value.url) return value.url;
  if (value.path) {
    return getDownloadURL(ref(storage, value.path));
  }
  return null;
};

const downloadFile = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudo descargar un adjunto.");
  }
  return response.blob();
};

export async function exportContractZip(
  tenantId: string,
  contractId: string
) {
  const contract = await getContract(tenantId, contractId);
  if (!contract) {
    throw new Error("Contrato no encontrado.");
  }

  const zip = new JSZip();
  const root = zip.folder(`expediente_${contractId}`);
  if (!root) {
    throw new Error("No se pudo crear el ZIP.");
  }

  const missing: string[] = [];
  const dataFolder = root.folder("data");
  const attachmentsFolder = root.folder("attachments");
  const paymentsFolder = attachmentsFolder?.folder("payments");
  const eventsFolder = attachmentsFolder?.folder("events");
  let hasPaymentAttachments = false;
  let hasEventAttachments = false;

  const sanitizedContract = sanitizePayload(contract);
  dataFolder?.file(
    "contract.json",
    JSON.stringify(sanitizedContract, null, 2)
  );

  const contractPdfUrl = await resolveDownloadUrl(contract.pdf);
  if (contractPdfUrl) {
    try {
      const pdfBlob = await downloadFile(contractPdfUrl);
      root.file("contrato.pdf", pdfBlob);
    } catch {
      missing.push("contrato.pdf (no se pudo descargar)");
    }
  } else {
    missing.push("contrato.pdf (sin PDF asociado)");
  }

  const installments = await listInstallmentsByContract(tenantId, contractId);
  const installmentRows: string[][] = [];
  const paymentRows: string[][] = [];
  const notificationRows: string[][] = [];

  for (const installment of installments) {
    installmentRows.push([
      installment.id,
      installment.contractId,
      installment.period,
      toIsoString(installment.dueDate),
      installment.status,
      String(installment.totals?.total ?? 0),
      String(installment.totals?.paid ?? 0),
      String(installment.totals?.due ?? 0),
    ]);

    const paymentsRef = collection(
      db,
      "tenants",
      tenantId,
      "installments",
      installment.id,
      "payments"
    );
    const paymentsSnap = await getDocs(paymentsRef);
    for (const paymentSnap of paymentsSnap.docs) {
      const payment = paymentSnap.data() as any;
      paymentRows.push([
        installment.id,
        paymentSnap.id,
        String(payment.amount ?? ""),
        toIsoString(payment.paidAt),
        String(payment.method ?? ""),
        String(payment.collectedBy ?? ""),
        String(payment.withoutReceipt ?? false),
        String(payment.receipt?.name ?? ""),
        String(payment.receipt?.path ?? ""),
      ]);

      if (payment.receipt) {
        const receiptUrl = await resolveDownloadUrl(payment.receipt);
        if (receiptUrl && paymentsFolder) {
          try {
            const blob = await downloadFile(receiptUrl);
            const safeName = toSafeFilename(
              payment.receipt?.name || `payment_${paymentSnap.id}`
            );
            paymentsFolder.file(`${paymentSnap.id}_${safeName}`, blob);
            hasPaymentAttachments = true;
          } catch {
            missing.push(
              `Comprobante pago ${paymentSnap.id} (no se pudo descargar)`
            );
          }
        }
      }
    }

    const logEntries = Array.isArray((installment as any)?.notificationLog)
      ? (installment as any).notificationLog
      : [];
    for (const entry of logEntries) {
      notificationRows.push([
        installment.id,
        toIsoString(entry?.at),
        String(entry?.dayKey ?? ""),
        String(entry?.type ?? ""),
        String(entry?.channel ?? ""),
        String(entry?.audience ?? ""),
        String(entry?.recipient ?? ""),
      ]);
    }
  }

  dataFolder?.file(
    "installments.csv",
    buildCsv(
      [
        "installmentId",
        "contractId",
        "period",
        "dueDate",
        "status",
        "total",
        "paid",
        "due",
      ],
      installmentRows
    )
  );

  dataFolder?.file(
    "payments.csv",
    buildCsv(
      [
        "installmentId",
        "paymentId",
        "amount",
        "paidAt",
        "method",
        "collectedBy",
        "withoutReceipt",
        "receiptName",
        "receiptPath",
      ],
      paymentRows
    )
  );

  if (notificationRows.length > 0) {
    dataFolder?.file(
      "notifications_log.csv",
      buildCsv(
        [
          "installmentId",
          "at",
          "dayKey",
          "type",
          "channel",
          "audience",
          "recipient",
        ],
        notificationRows
      )
    );
  } else {
    missing.push("notifications_log.csv (sin registros)");
  }

  const events = await listContractEvents(tenantId, contractId);
  const eventRows: string[][] = [];
  for (const eventItem of events) {
    eventRows.push([
      eventItem.id,
      eventItem.type,
      toIsoString(eventItem.at),
      eventItem.detail,
      (eventItem.tags ?? []).join("|"),
      String(eventItem.installmentId ?? ""),
      String(eventItem.createdBy ?? ""),
      String(eventItem.attachments?.length ?? 0),
    ]);

    if (eventItem.attachments && eventsFolder) {
      for (const attachment of eventItem.attachments) {
        const attachmentUrl = await resolveDownloadUrl(attachment);
        if (!attachmentUrl) continue;
        try {
          const blob = await downloadFile(attachmentUrl);
          const safeName = toSafeFilename(attachment.name || "adjunto");
          eventsFolder.file(`${eventItem.id}_${safeName}`, blob);
          hasEventAttachments = true;
        } catch {
          missing.push(
            `Adjunto evento ${eventItem.id} (no se pudo descargar)`
          );
        }
      }
    }
  }

  dataFolder?.file(
    "events.csv",
    buildCsv(
      [
        "eventId",
        "type",
        "at",
        "detail",
        "tags",
        "installmentId",
        "createdBy",
        "attachmentCount",
      ],
      eventRows
    )
  );

  if (!hasPaymentAttachments) {
    missing.push("attachments/payments (sin comprobantes)");
  }
  if (!hasEventAttachments) {
    missing.push("attachments/events (sin adjuntos)");
  }

  if (missing.length > 0) {
    root.file(
      "README.txt",
      `Archivos faltantes o no descargados:\n- ${missing.join("\n- ")}\n`
    );
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expediente_${contractId}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
