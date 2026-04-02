import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, packages, customers, reservations, payments, availability, InsertCustomer, InsertReservation, InsertPayment, InsertAvailability } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Packages queries
export async function getAllPackages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(packages);
}

export async function getPackageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  return result[0];
}

// Customers queries
export async function createCustomer(customer: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customers).values(customer);
  return (result as any).insertId || 0;
}

export async function getCustomerByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  return result[0];
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0];
}

// Reservations queries
export async function createReservation(reservation: InsertReservation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    // Insert the reservation
    await db.insert(reservations).values(reservation);
    // Fetch the last inserted reservation to get its ID
    const result = await db.select().from(reservations).orderBy((t) => t.id).limit(1);
    // Get the one with the highest ID (most recent)
    const allReservations = await db.select().from(reservations);
    if (allReservations.length > 0) {
      const lastReservation = allReservations[allReservations.length - 1];
      return lastReservation.id || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error creating reservation:", error);
    throw error;
  }
}

export async function getReservationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
  return result[0];
}

export async function getAllReservations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reservations);
}

export async function updateReservationStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(reservations).set({ status: status as any }).where(eq(reservations.id, id));
}

// Payments queries
export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payments).values(payment);
  return (result as any).insertId || 0;
}

export async function getPaymentByReservationId(reservationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.reservationId, reservationId)).limit(1);
  return result[0];
}

export async function updatePaymentStatus(id: number, status: string, downpayment?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { status };
  if (downpayment !== undefined) {
    updateData.downpayment = downpayment;
  }
  return db.update(payments).set(updateData).where(eq(payments.id, id));
}

// Availability queries
export async function getAvailabilityByDate(date: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(availability).where(eq(availability.date, date as any)).limit(1);
  return result[0];
}

export async function getAvailabilityRange(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(availability).where(
    sql`${availability.date} >= ${startDate} AND ${availability.date} <= ${endDate}`
  );
}

export async function updateAvailability(date: string, isBlocked: boolean, bookedCapacity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existingAvail = await getAvailabilityByDate(date);
  if (existingAvail) {
    return db.update(availability).set({ isBlocked: isBlocked ? "true" : "false", bookedCapacity }).where(eq(availability.date, date as any));
  } else {
    return db.insert(availability).values({ date: date as any, isBlocked: isBlocked ? "true" : "false", bookedCapacity });
  }
}

export async function getCustomerHistory(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reservations).where(eq(reservations.customerId, customerId));
}

// Helper to check if dates have available capacity
export async function checkDateCapacity(checkInDate: string, checkOutDate: string, packageId: number, numberOfGuests: number) {
  const db = await getDb();
  if (!db) return true; // Allow if DB not available

  // Get package max capacity
  const pkg = await getPackageById(packageId);
  if (!pkg) return false;

  // Check all dates in range for conflicts
  const checkIn = new Date(checkInDate + "T00:00:00Z");
  const checkOut = new Date(checkOutDate + "T00:00:00Z");
  const currentDate = new Date(checkIn);

  while (currentDate.toISOString().split("T")[0] <= checkOutDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const avail = await getAvailabilityByDate(dateStr);

    // If date is blocked, reject
    if (avail && avail.isBlocked === "true") {
      return false;
    }

    // Check if capacity would be exceeded
    const bookedCapacity = avail?.bookedCapacity || 0;
    if (bookedCapacity + numberOfGuests > pkg.maxCapacity) {
      return false;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return true;
}

// Helper to update availability after reservation
export async function updateDateCapacityAfterReservation(checkInDate: string, checkOutDate: string, numberOfGuests: number) {
  const db = await getDb();
  if (!db) return;

  const checkIn = new Date(checkInDate + "T00:00:00Z");
  const checkOut = new Date(checkOutDate + "T00:00:00Z");
  const currentDate = new Date(checkIn);

  while (currentDate.toISOString().split("T")[0] <= checkOutDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const avail = await getAvailabilityByDate(dateStr);
    const newCapacity = (avail?.bookedCapacity || 0) + numberOfGuests;
    await updateAvailability(dateStr, false, newCapacity);
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

// TODO: add feature queries here as your schema grows.
