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

// ✅ Helper to ensure DB exists
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

// ✅ FIXED admin check (more reliable)
function adminProcedure(procedure: typeof publicProcedure) {
  return procedure.use(async ({ ctx, next }) => {
    const cookie = ctx.req.headers.cookie;

    console.log("[Auth] Incoming cookies:", cookie);

    if (!cookie) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No cookies found",
      });
    }

    const match = cookie.match(/admin=(\d+)/);

    if (!match) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Admin access required",
      });
    }

    return next();
  });
}

export const appRouter = router({
  system: systemRouter,

  // ================= AUTH =================
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      const cookie = ctx.req.headers.cookie;

      console.log("[Auth.me] cookies:", cookie);

      if (!cookie) return null;

      const match = cookie.match(/admin=(\d+)/);
      if (!match) return null;

      const adminId = parseInt(match[1]);

      const db = await getSafeDb();

      const result = await db.execute(
        `SELECT id, email, role FROM admins WHERE id = ${adminId} LIMIT 1`
      );

      const rows = (result as any).rows || result;

      return rows && rows.length > 0 ? rows[0] : null;
    }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const admin = await getAdminByEmail(input.email);

        if (!admin || String(admin.password) !== String(input.password)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // ✅ SIMPLE + STABLE COOKIE
        ctx.res.setHeader(
          "Set-Cookie",
          `admin=${admin.id}; Path=/; SameSite=Lax`
        );

        console.log("[Auth] Cookie set for admin:", admin.id);

        return {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.setHeader(
        "Set-Cookie",
        `admin=; Path=/; Max-Age=0; SameSite=Lax`
      );

      console.log("[Auth] Logged out");

      return { success: true } as const;
    }),
  }),

  // ================= PACKAGES =================
  packages: router({
    list: publicProcedure.query(async () => {
      return getAllPackages();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getPackageById(input.id);
      }),
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
        try {
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

          if (!customer) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Customer creation failed",
            });
          }

          const pkg = await getPackageById(input.packageId);

          if (!pkg) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Package not found",
            });
          }

          const checkIn = new Date(input.checkInDate);
          const checkOut = new Date(input.checkOutDate);

          const nights = Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          const totalPrice =
            parseFloat(pkg.basePrice.toString()) *
            Math.max(nights, 1) *
            input.numberOfGuests;

          const reservationId = await createReservation({
            customerId: customer.id,
            packageId: input.packageId,
            checkInDate: input.checkInDate as any,
            checkOutDate: input.checkOutDate as any,
            numberOfGuests: input.numberOfGuests,
            specialRequests: input.specialRequests,
            status: "pending",
            totalPrice: totalPrice.toString() as any,
          });

          await updateDateCapacityAfterReservation(
            input.checkInDate,
            input.checkOutDate,
            input.numberOfGuests
          );

          await createPayment({
            reservationId,
            status: "pending",
            totalAmount: totalPrice.toString() as any,
          });

          return {
            success: true,
            reservationId,
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Reservation failed",
          });
        }
      }),

    list: adminProcedure(protectedProcedure).query(async () => {
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
  }),

  // ================= AVAILABILITY =================
  availability: router({
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