import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getAllPackages,
  getAdminByEmail,
  getPackageById,
  createCustomer,
  getCustomerByEmail,
  createReservation,
  getAllReservations,
  createPayment,
  checkDateCapacity,
  updateDateCapacityAfterReservation,
} from "./db";
import { TRPCError } from "@trpc/server";

// ================= HELPERS =================
async function getSafeDb() {
  const db = await (await import("./db")).getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }
  return db;
}

function adminProcedure(procedure: typeof publicProcedure) {
  return procedure.use(async ({ ctx, next }) => {
    const cookie = ctx.req.headers.cookie;

    if (!cookie) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const match = cookie.match(/admin=(\d+)/);

    if (!match) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next();
  });
}

// ================= ROUTER =================
export const appRouter = router({
  system: systemRouter,

  // ================= AUTH =================
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      const cookie = ctx.req.headers.cookie;
      if (!cookie) return null;

      const match = cookie.match(/admin=(\d+)/);
      if (!match) return null;

      const adminId = parseInt(match[1]);
      const db = await getSafeDb();

      const result = await db.execute(
        `SELECT id, email, role FROM admins WHERE id = ${adminId} LIMIT 1`
      );

      const rows = (result as any).rows || result;
      return rows?.[0] ?? null;
    }),

    login: publicProcedure
      .input(z.object({ email: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const admin = await getAdminByEmail(input.email);

        if (!admin || String(admin.password) !== String(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        ctx.res.setHeader(
          "Set-Cookie",
          `admin=${admin.id}; Path=/; SameSite=Lax`
        );

        return admin;
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.setHeader(
        "Set-Cookie",
        `admin=; Path=/; Max-Age=0; SameSite=Lax`
      );
      return { success: true };
    }),
  }),

  // ================= PACKAGES =================
  packages: router({
    list: publicProcedure.query(() => getAllPackages()),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getPackageById(input.id)),
  }),

  // ================= RESERVATIONS =================
  reservations: router({
    create: publicProcedure
      .input(
        z.object({
          name: z.string(),
          email: z.string().email(),
          phone: z.string(),
          packageId: z.number(),
          checkInDate: z.string(),
          checkOutDate: z.string(),
          numberOfGuests: z.number(),
          specialRequests: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const hasCapacity = await checkDateCapacity(
          input.checkInDate,
          input.checkOutDate,
          input.packageId,
          input.numberOfGuests
        );

        if (!hasCapacity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selected dates not available",
          });
        }

        let customer = await getCustomerByEmail(input.email);

        if (!customer) {
          await createCustomer({
            name: input.name,
            email: input.email,
            phone: input.phone,
          });

          customer = await getCustomerByEmail(input.email);
        }

        // ✅ FIX: ensure customer exists
        if (!customer) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Customer creation failed",
          });
        }

        const pkg = await getPackageById(input.packageId);

        // ✅ FIX: ensure package exists
        if (!pkg) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Package not found",
          });
        }

        const nights =
          (new Date(input.checkOutDate).getTime() -
            new Date(input.checkInDate).getTime()) /
          (1000 * 60 * 60 * 24);

        const total =
          parseFloat(pkg.basePrice.toString()) *
          Math.max(nights, 1) *
          input.numberOfGuests;

        const reservationId = await createReservation({
          customerId: customer.id,
          packageId: input.packageId,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          numberOfGuests: input.numberOfGuests,
          specialRequests: input.specialRequests,
          status: "pending",
          totalPrice: total.toString(),
        });

        await updateDateCapacityAfterReservation(
          input.checkInDate,
          input.checkOutDate,
          input.numberOfGuests
        );

        await createPayment({
          reservationId,
          status: "pending",
          totalAmount: total.toString(),
        });

        return { success: true, reservationId };
      }),

    list: adminProcedure(protectedProcedure).query(() => {
      return getAllReservations();
    }),

    approve: adminProcedure(protectedProcedure)
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getSafeDb();
        await db.execute(
          `UPDATE reservations SET status='approved' WHERE id=${input.id}`
        );
        return { success: true };
      }),

    reject: adminProcedure(protectedProcedure)
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getSafeDb();
        await db.execute(
          `UPDATE reservations SET status='rejected' WHERE id=${input.id}`
        );
        return { success: true };
      }),

    cancel: adminProcedure(protectedProcedure)
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getSafeDb();
        await db.execute(
          `UPDATE reservations SET status='cancelled' WHERE id=${input.id}`
        );
        return { success: true };
      }),

    update: adminProcedure(protectedProcedure)
      .input(
        z.object({
          id: z.number(),
          numberOfGuests: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getSafeDb();
        await db.execute(
          `UPDATE reservations SET number_of_guests=${input.numberOfGuests} WHERE id=${input.id}`
        );
        return { success: true };
      }),
  }),

  // ================= PAYMENTS =================
  payments: router({
    list: adminProcedure(protectedProcedure).query(async () => {
      const db = await getSafeDb();
      return db.execute(`SELECT * FROM payments`);
    }),

    updateStatus: adminProcedure(protectedProcedure)
      .input(
        z.object({
          reservationId: z.number(),
          status: z.enum(["pending", "partially_paid", "fully_paid"]),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getSafeDb();
        await db.execute(
          `UPDATE payments SET status='${input.status}' WHERE reservation_id=${input.reservationId}`
        );
        return { success: true };
      }),
  }),

  // ================= CUSTOMERS =================
  customers: router({
    list: adminProcedure(protectedProcedure).query(async () => {
      const db = await getSafeDb();
      return db.execute(`SELECT * FROM customers`);
    }),

    history: adminProcedure(protectedProcedure)
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getSafeDb();
        return db.execute(
          `SELECT * FROM reservations WHERE customer_id=${input.id}`
        );
      }),
  }),

  // ================= AVAILABILITY =================
  availability: router({
    list: adminProcedure(protectedProcedure).query(async () => {
      const db = await getSafeDb();
      return db.execute(`SELECT * FROM blocked_dates`);
    }),

    blockDate: adminProcedure(protectedProcedure)
      .input(z.object({ date: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getSafeDb();
        await db.execute(
          `INSERT INTO blocked_dates (date) VALUES ('${input.date}')`
        );
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;