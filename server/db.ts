import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  InsertUser,
  users,
  packages,
  customers,
  reservations,
  payments,
  availability,
  InsertCustomer,
  InsertReservation,
  InsertPayment,
} from "../drizzle/schema";

import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// =========================
// DATABASE CONNECTION
// =========================
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, {
        ssl: "require",
      });

      _db = drizzle(client);
      console.log("[Database] Connected to Supabase ✅");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// =========================
// USERS
// =========================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required");
  }

  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = {
      openId: user.openId,
    };

    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;

    textFields.forEach((field) => {
      const value = user[field];
      if (value === undefined) return;

      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    });

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[DB] upsertUser error:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result[0];
}

// =========================
// ADMIN LOGIN
// =========================
export async function getAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.execute(
      sql`SELECT * FROM admins WHERE email = ${email} LIMIT 1`
    );

    const rows = result as any[];

    return rows.length > 0 ? rows[0] : undefined;
  } catch (error) {
    console.error("[DB] getAdminByEmail error:", error);
    return undefined;
  }
}

// =========================
// PACKAGES
// =========================
export async function getAllPackages() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(packages);
}

export async function getPackageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(packages)
    .where(eq(packages.id, id))
    .limit(1);

  return result[0];
}

// =========================
// CUSTOMERS
// =========================
export async function createCustomer(customer: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(customers).values(customer);
  return 1;
}

export async function getCustomerByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.email, email))
    .limit(1);

  return result[0];
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  return result[0];
}

// =========================
// RESERVATIONS
// =========================
export async function createReservation(reservation: InsertReservation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(reservations).values(reservation);
  return 1;
}

export async function getAllReservations() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(reservations);
}

export async function getReservationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(reservations)
    .where(eq(reservations.id, id))
    .limit(1);

  return result[0];
}

// =========================
// PAYMENTS
// =========================
export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(payments).values(payment);
  return 1;
}

// =========================
// AVAILABILITY
// =========================
export async function getAvailabilityByDate(date: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(availability)
    .where(eq(availability.date, date as any))
    .limit(1);

  return result[0];
}

export async function updateAvailability(
  date: string,
  isBlocked: boolean,
  bookedCapacity: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getAvailabilityByDate(date);

  if (existing) {
    await db
      .update(availability)
      .set({
        isBlocked: isBlocked ? "true" : "false",
        bookedCapacity,
      })
      .where(eq(availability.date, date as any));
  } else {
    await db.insert(availability).values({
      date: date as any,
      isBlocked: isBlocked ? "true" : "false",
      bookedCapacity,
    });
  }
}

// =========================
// 🔥 CAPACITY HELPERS (FIXED)
// =========================
export async function checkDateCapacity(
  checkInDate: string,
  checkOutDate: string,
  packageId: number,
  numberOfGuests: number
) {
  const db = await getDb();
  if (!db) return true;

  const pkg = await getPackageById(packageId);
  if (!pkg) return false;

  const currentDate = new Date(checkInDate);

  while (currentDate.toISOString().split("T")[0] <= checkOutDate) {
    const dateStr = currentDate.toISOString().split("T")[0];

    const avail = await getAvailabilityByDate(dateStr);

    if (avail && avail.isBlocked === "true") {
      return false;
    }

    const bookedCapacity = avail?.bookedCapacity || 0;

    if (bookedCapacity + numberOfGuests > pkg.maxCapacity) {
      return false;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return true;
}

export async function updateDateCapacityAfterReservation(
  checkInDate: string,
  checkOutDate: string,
  numberOfGuests: number
) {
  const db = await getDb();
  if (!db) return;

  const currentDate = new Date(checkInDate);

  while (currentDate.toISOString().split("T")[0] <= checkOutDate) {
    const dateStr = currentDate.toISOString().split("T")[0];

    const avail = await getAvailabilityByDate(dateStr);
    const newCapacity = (avail?.bookedCapacity || 0) + numberOfGuests;

    await updateAvailability(dateStr, false, newCapacity);

    currentDate.setDate(currentDate.getDate() + 1);
  }
}