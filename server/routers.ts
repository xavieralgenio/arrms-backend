import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getAllPackages,
  getPackageById,
  createCustomer,
  getCustomerByEmail,
  getCustomerById,
  createReservation,
  getReservationById,
  getAllReservations,
  updateReservationStatus,
  createPayment,
  getPaymentByReservationId,
  updatePaymentStatus,
  getAvailabilityByDate,
  getAvailabilityRange,
  updateAvailability,
  getCustomerHistory,
  checkDateCapacity,
  updateDateCapacityAfterReservation,
} from "./db";
import { TRPCError } from "@trpc/server";

// Helper to check if user is admin
function adminProcedure(procedure: typeof protectedProcedure) {
  return procedure.use(({ ctx, next }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }
    return next({ ctx });
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Packages routes
  packages: router({
    list: publicProcedure.query(async () => {
      return getAllPackages();
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getPackageById(input.id);
    }),
  }),

  // Reservations routes
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
          // Check date capacity first
          const hasCapacity = await checkDateCapacity(
            input.checkInDate,
            input.checkOutDate,
            input.packageId,
            input.numberOfGuests
          );
          if (!hasCapacity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Selected dates are not available or do not have sufficient capacity",
            });
          }

          // Get or create customer
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
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create customer" });
          }

          // Get package details
          const pkg = await getPackageById(input.packageId);
          if (!pkg) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });
          }

          // Calculate total price
          const checkIn = new Date(input.checkInDate);
          const checkOut = new Date(input.checkOutDate);
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          const totalPrice = parseFloat(pkg.basePrice.toString()) * Math.max(nights, 1) * input.numberOfGuests;

          // Create reservation
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

          // Update availability/capacity for the dates
          await updateDateCapacityAfterReservation(
            input.checkInDate,
            input.checkOutDate,
            input.numberOfGuests
          );

          // Create payment record
          await createPayment({
            reservationId: reservationId,
            status: "pending",
            totalAmount: totalPrice.toString() as any,
          });

          return {
            success: true,
            reservationId,
            message: "Reservation created successfully",
          };
        } catch (error) {
          console.error("Error creating reservation:", error);
          throw new TRPCError({
            code: error instanceof TRPCError ? (error.code as any) : "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to create reservation",
          });
        }
      }),

    list: adminProcedure(protectedProcedure).query(async () => {
      return getAllReservations();
    }),

    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getReservationById(input.id);
    }),

    approve: adminProcedure(protectedProcedure)
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateReservationStatus(input.id, "approved");
        return { success: true };
      }),

    reject: adminProcedure(protectedProcedure)
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateReservationStatus(input.id, "rejected");
        return { success: true };
      }),

    cancel: adminProcedure(protectedProcedure)
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateReservationStatus(input.id, "cancelled");
        return { success: true };
      }),
  }),

  // Availability routes
  availability: router({
    checkDate: publicProcedure.input(z.object({ date: z.string() })).query(async ({ input }) => {
      const avail = await getAvailabilityByDate(input.date);
      return {
        isBlocked: avail?.isBlocked === "true",
        bookedCapacity: avail?.bookedCapacity || 0,
      };
    }),

    getRange: publicProcedure
      .input(z.object({ startDate: z.string(), endDate: z.string() }))
      .query(async ({ input }) => {
        return getAvailabilityRange(input.startDate, input.endDate);
      }),

    blockDate: adminProcedure(protectedProcedure)
      .input(z.object({ date: z.string() }))
      .mutation(async ({ input }) => {
        await updateAvailability(input.date, true, 0);
        return { success: true };
      }),

    unblockDate: adminProcedure(protectedProcedure)
      .input(z.object({ date: z.string() }))
      .mutation(async ({ input }) => {
        await updateAvailability(input.date, false, 0);
        return { success: true };
      }),
  }),

  // Payments routes
  payments: router({
    getByReservation: adminProcedure(protectedProcedure)
      .input(z.object({ reservationId: z.number() }))
      .query(async ({ input }) => {
        return getPaymentByReservationId(input.reservationId);
      }),

    updateStatus: adminProcedure(protectedProcedure)
      .input(
        z.object({
          paymentId: z.number(),
          status: z.enum(["pending", "partially_paid", "fully_paid"]),
          downpayment: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updatePaymentStatus(input.paymentId, input.status, input.downpayment);
        return { success: true };
      }),
  }),

  // Customers routes
  customers: router({
    getHistory: adminProcedure(protectedProcedure)
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return getCustomerHistory(input.customerId);
      }),

    getById: adminProcedure(protectedProcedure)
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getCustomerById(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
