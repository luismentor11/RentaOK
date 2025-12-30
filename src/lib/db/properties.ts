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

export type PropertyStatus = "available" | "rented";

export type Property = {
  id: string;
  title: string;
  address: string;
  status: PropertyStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdByUid: string;
};

export async function listProperties(tenantId: string) {
  const ref = collection(db, "tenants", tenantId, "properties");
  const snap = await getDocs(ref);
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Property, "id">),
  })) as Property[];
}

export async function createProperty(
  tenantId: string,
  data: Pick<Property, "title" | "address" | "status" | "createdByUid">
) {
  const ref = collection(db, "tenants", tenantId, "properties");
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(ref, payload);
  return { id: docRef.id, ...payload };
}

export async function getProperty(tenantId: string, propertyId: string) {
  const ref = doc(db, "tenants", tenantId, "properties", propertyId);
  const snap = await getDoc(ref);
  return snap.exists()
    ? ({ id: snap.id, ...(snap.data() as Omit<Property, "id">) } as Property)
    : null;
}

export async function updateProperty(
  tenantId: string,
  propertyId: string,
  data: Partial<Pick<Property, "title" | "address" | "status">>
) {
  const ref = doc(db, "tenants", tenantId, "properties", propertyId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}
