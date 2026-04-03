import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

type PaymentStatus = "pending" | "partially_paid" | "fully_paid";

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  const { data: reservations, isLoading, refetch } =
    trpc.reservations.list.useQuery(undefined, {
      enabled: user?.role === "admin",
    });

  const { data: payments } = trpc.payments.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const paymentRows = (payments as any)?.rows || payments || [];

  const [blockDateInput, setBlockDateInput] = useState("");

  const approve = trpc.reservations.approve.useMutation({
    onSuccess: () => {
      toast.success("Approved");
      refetch();
    },
  });

  const reject = trpc.reservations.reject.useMutation({
    onSuccess: () => {
      toast.success("Rejected");
      refetch();
    },
  });

  const cancel = trpc.reservations.cancel.useMutation({
    onSuccess: () => {
      toast.success("Cancelled");
      refetch();
    },
  });

  const updatePayment = trpc.payments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Payment updated");
    },
  });

  const blockDate = trpc.availability.blockDate.useMutation({
    onSuccess: () => {
      toast.success("Date blocked");
      setBlockDateInput("");
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b p-4 flex justify-between">
        <h1 className="font-bold text-xl text-emerald-600">
          Admin Dashboard
        </h1>
        <Button onClick={logout} variant="outline">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </nav>

      <div className="p-6 space-y-8">
        {/* BLOCK DATE */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Block Date</h2>
          <div className="flex gap-2">
            <Input
              type="date"
              value={blockDateInput}
              onChange={(e) => setBlockDateInput(e.target.value)}
            />
            <Button
              onClick={() =>
                blockDate.mutate({ date: blockDateInput })
              }
            >
              Block
            </Button>
          </div>
        </div>

        {/* RESERVATIONS */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-4">Reservations</h2>

          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Dates</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {reservations?.map((r: any) => {
                  const payment = paymentRows.find(
                    (p: any) => p.reservation_id === r.id
                  );

                  return (
                    <tr key={r.id} className="border-b">
                      <td>{r.id}</td>
                      <td>{r.customerId}</td>
                      <td>
                        {r.checkInDate} → {r.checkOutDate}
                      </td>
                      <td>{r.numberOfGuests}</td>
                      <td>{r.status}</td>

                      <td>
                        <select
                          value={String(payment?.status ?? "pending")}
                          onChange={(e) =>
                            updatePayment.mutate({
                              reservationId: r.id,
                              status: e.target.value as PaymentStatus, // ✅ FIX HERE
                            })
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="partially_paid">
                            Partial
                          </option>
                          <option value="fully_paid">Full</option>
                        </select>
                      </td>

                      <td className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approve.mutate({ id: r.id })}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reject.mutate({ id: r.id })}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancel.mutate({ id: r.id })}
                        >
                          Cancel
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}