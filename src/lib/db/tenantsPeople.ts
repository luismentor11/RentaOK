"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type TenantPerson = {
  id: string;
  fullName: string;
  dni?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdByUid: string;
};

export async function listPeople(tenantId: string) {
  const ref = collection(db, "tenants", tenantId, "tenantsPeople");
  const snap = await getDocs(ref);
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<TenantPerson, "id">),
  })) as TenantPerson[];
}

export async function createPerson(
  tenantId: string,
  data: Pick<
    TenantPerson,
    "fullName" | "dni" | "phone" | "email" | "notes" | "createdByUid"
  >
) {
  const ref = collection(db, "tenants", tenantId, "tenantsPeople");
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(ref, payload);
  return { id: docRef.id, ...payload };
}

export async function getPerson(tenantId: string, personId: string) {
  const ref = doc(db, "tenants", tenantId, "tenantsPeople", personId);
  const snap = await getDoc(ref);
  return snap.exists()
    ? ({ id: snap.id, ...(snap.data() as Omit<TenantPerson, "id">) } as TenantPerson)
    : null;
}

export async function updatePerson(
  tenantId: string,
  personId: string,
  data: Partial<Pick<TenantPerson, "fullName" | "dni" | "phone" | "email" | "notes">>
) {
  const ref = doc(db, "tenants", tenantId, "tenantsPeople", personId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}
