import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  numeric,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

/**
 * ENUMS (Postgres requires explicit enums)
 */
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const packageTypeEnum = pgEnum("package_type", ["day_tour", "overnight", "event"]);
export const reservationStatusEnum = pgEnum("reservation_status", ["pending", "approved", "rejected", "cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "partially_paid", "fully_paid"]);
export const availabilityBlockedEnum = pgEnum("availability_blocked", ["true", "false"]);

/**
 * USERS
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * PACKAGES
 */
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: packageTypeEnum("type").notNull(),
  basePrice: numeric("basePrice", { precision: 10, scale: 2 }).notNull(),
  maxCapacity: integer("maxCapacity").notNull(),
  duration: varchar("duration", { length: 100 }),
  amenities: text("amenities"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Package = typeof packages.$inferSelect;
export type InsertPackage = typeof packages.$inferInsert;

/**
 * CUSTOMERS
 */
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * RESERVATIONS
 */
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  customerId: integer("customerId").notNull(),
  packageId: integer("packageId").notNull(),
  checkInDate: date("checkInDate").notNull(),
  checkOutDate: date("checkOutDate").notNull(),
  numberOfGuests: integer("numberOfGuests").notNull(),
  specialRequests: text("specialRequests"),
  status: reservationStatusEnum("status").default("pending").notNull(),
  totalPrice: numeric("totalPrice", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;

/**
 * PAYMENTS
 */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservationId").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  downpayment: numeric("downpayment", { precision: 10, scale: 2 }).default("0"),
  totalAmount: numeric("totalAmount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * AVAILABILITY
 */
export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  isBlocked: availabilityBlockedEnum("isBlocked").default("false").notNull(),
  bookedCapacity: integer("bookedCapacity").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = typeof availability.$inferInsert;

/**
 * 🆕 ADMINS TABLE (REQUIRED FOR LOGIN)
 */
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).default("admin"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;