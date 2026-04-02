import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock context for testing
function createMockContext(isAdmin: boolean = false): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "test",
      role: isAdmin ? "admin" : "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("ARRMS Backend - Reservations", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx = createMockContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("packages.list", () => {
    it("should return a list of packages", async () => {
      const packages = await caller.packages.list();
      expect(Array.isArray(packages)).toBe(true);
      expect(packages.length).toBeGreaterThan(0);
    });

    it("should return packages with required fields", async () => {
      const packages = await caller.packages.list();
      const pkg = packages[0];
      expect(pkg).toHaveProperty("id");
      expect(pkg).toHaveProperty("name");
      expect(pkg).toHaveProperty("basePrice");
      expect(pkg).toHaveProperty("maxCapacity");
      expect(pkg).toHaveProperty("type");
    });

    it("should have valid package types", async () => {
      const packages = await caller.packages.list();
      const validTypes = ["day_tour", "overnight", "event"];
      packages.forEach((pkg) => {
        expect(validTypes).toContain(pkg.type);
      });
    });
  });

  describe("packages.getById", () => {
    it("should return a specific package by ID", async () => {
      const packages = await caller.packages.list();
      if (packages.length > 0) {
        const pkg = await caller.packages.getById({ id: packages[0].id });
        expect(pkg).toBeDefined();
        expect(pkg?.id).toBe(packages[0].id);
      }
    });

    it("should return undefined for non-existent package", async () => {
      const pkg = await caller.packages.getById({ id: 99999 });
      expect(pkg).toBeUndefined();
    });
  });

  describe("reservations.create", () => {
    it("should create a reservation with valid input", async () => {
      const packages = await caller.packages.list();
      if (packages.length === 0) {
        throw new Error("No packages available for testing");
      }

      // Use dates 10 days in the future to avoid conflicts
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 10);
      const checkInDate = checkIn.toISOString().split("T")[0];

      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 1);
      const checkOutDate = checkOut.toISOString().split("T")[0];

      const result = await caller.reservations.create({
        name: "John Doe",
        email: `test-${Date.now()}@example.com`,
        phone: "+63 9123456789",
        packageId: packages[0].id,
        checkInDate,
        checkOutDate,
        numberOfGuests: 1,
        specialRequests: "Early check-in preferred",
      });

      expect(result.success).toBe(true);
      expect(result.reservationId).toBeDefined();
      expect(result.reservationId).toBeGreaterThan(0);
    });

    it("should fail with invalid email", async () => {
      const packages = await caller.packages.list();
      if (packages.length === 0) {
        throw new Error("No packages available for testing");
      }

      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 10);
      const checkInDate = checkIn.toISOString().split("T")[0];

      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 1);
      const checkOutDate = checkOut.toISOString().split("T")[0];

      try {
        await caller.reservations.create({
          name: "John Doe",
          email: "invalid-email",
          phone: "+63 9123456789",
          packageId: packages[0].id,
          checkInDate,
          checkOutDate,
          numberOfGuests: 2,
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should fail for non-existent package", async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 10);
      const checkInDate = checkIn.toISOString().split("T")[0];

      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 1);
      const checkOutDate = checkOut.toISOString().split("T")[0];

      try {
        await caller.reservations.create({
          name: "John Doe",
          email: `test-${Date.now()}@example.com`,
          phone: "+63 9123456789",
          packageId: 99999,
          checkInDate,
          checkOutDate,
          numberOfGuests: 2,
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("reservations.list (admin only)", () => {
    it("should return empty array for non-admin user", async () => {
      const userCtx = createMockContext(false);
      const userCaller = appRouter.createCaller(userCtx);

      try {
        await userCaller.reservations.list();
        expect.fail("Should have thrown a FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should return reservations for admin user", async () => {
      const adminCtx = createMockContext(true);
      const adminCaller = appRouter.createCaller(adminCtx);

      const reservations = await adminCaller.reservations.list();
      expect(Array.isArray(reservations)).toBe(true);
    });
  });

  describe("availability.checkDate", () => {
    it("should check availability for a specific date", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];

      const availability = await caller.availability.checkDate({ date: dateStr });
      expect(availability).toHaveProperty("isBlocked");
      expect(availability).toHaveProperty("bookedCapacity");
      expect(typeof availability.isBlocked).toBe("boolean");
      expect(typeof availability.bookedCapacity).toBe("number");
    });
  });

  describe("availability.blockDate (admin only)", () => {
    it("should block a date for admin user", async () => {
      const adminCtx = createMockContext(true);
      const adminCaller = appRouter.createCaller(adminCtx);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];

      const result = await adminCaller.availability.blockDate({ date: dateStr });
      expect(result.success).toBe(true);

      // Verify the date is blocked
      const availability = await caller.availability.checkDate({ date: dateStr });
      expect(availability.isBlocked).toBe(true);
    });

    it("should reject block date for non-admin user", async () => {
      const userCtx = createMockContext(false);
      const userCaller = appRouter.createCaller(userCtx);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];

      try {
        await userCaller.availability.blockDate({ date: dateStr });
        expect.fail("Should have thrown a FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("reservations.approve (admin only)", () => {
    it("should approve a reservation for admin user", async () => {
      const adminCtx = createMockContext(true);
      const adminCaller = appRouter.createCaller(adminCtx);

      // First create a reservation
      const packages = await caller.packages.list();
      if (packages.length === 0) {
        throw new Error("No packages available for testing");
      }

      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 20);
      const checkInDate = checkIn.toISOString().split("T")[0];

      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 1);
      const checkOutDate = checkOut.toISOString().split("T")[0];

      const reservation = await caller.reservations.create({
        name: "Jane Doe",
        email: `test-${Date.now()}@example.com`,
        phone: "+63 9123456789",
        packageId: packages[0].id,
        checkInDate,
        checkOutDate,
        numberOfGuests: 1,
      });

      // Approve the reservation
      const result = await adminCaller.reservations.approve({ id: reservation.reservationId });
      expect(result.success).toBe(true);

      // Verify the reservation is approved
      const updated = await caller.reservations.getById({ id: reservation.reservationId });
      expect(updated?.status).toBe("approved");
    });
  });

  describe("reservations.reject (admin only)", () => {
    it("should reject a reservation for admin user", async () => {
      const adminCtx = createMockContext(true);
      const adminCaller = appRouter.createCaller(adminCtx);

      // First create a reservation
      const packages = await caller.packages.list();
      if (packages.length === 0) {
        throw new Error("No packages available for testing");
      }

      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 30);
      const checkInDate = checkIn.toISOString().split("T")[0];

      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 1);
      const checkOutDate = checkOut.toISOString().split("T")[0];

      const reservation = await caller.reservations.create({
        name: "Bob Smith",
        email: `test-${Date.now()}@example.com`,
        phone: "+63 9123456789",
        packageId: packages[0].id,
        checkInDate,
        checkOutDate,
        numberOfGuests: 1,
      });

      // Reject the reservation
      const result = await adminCaller.reservations.reject({ id: reservation.reservationId });
      expect(result.success).toBe(true);

      // Verify the reservation is rejected
      const updated = await caller.reservations.getById({ id: reservation.reservationId });
      expect(updated?.status).toBe("rejected");
    });
  });
});
