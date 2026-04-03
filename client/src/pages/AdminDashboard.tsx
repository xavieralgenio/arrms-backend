import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const [, setLocation] = useLocation();

  // ✅ FIX: move redirect into useEffect (prevents loop)
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  const { data: reservations, isLoading, refetch } =
    trpc.reservations.list.useQuery(undefined, {
      enabled: user?.role === "admin",
    });

  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [blockDateInput, setBlockDateInput] = useState("");

  const approveReservationMutation = trpc.reservations.approve.useMutation({
    onSuccess: () => {
      toast.success("Reservation approved");
      refetch();
    },
  });

  const rejectReservationMutation = trpc.reservations.reject.useMutation({
    onSuccess: () => {
      toast.success("Reservation rejected");
      refetch();
    },
  });

  const cancelReservationMutation = trpc.reservations.cancel.useMutation({
    onSuccess: () => {
      toast.success("Reservation cancelled");
      refetch();
    },
  });

  const blockDateMutation = trpc.availability.blockDate.useMutation({
    onSuccess: () => {
      toast.success("Date blocked successfully");
      setBlockDateInput("");
    },
  });

  // ⏳ Show loader while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // ⛔ Prevent rendering while redirecting
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-emerald-600">
            Angela's Resort - Admin
          </div>

          <div className="flex gap-4 items-center">
            <span className="text-sm text-slate-600">
              Welcome, {user?.email || "Admin"}
            </span>

            <Button
              onClick={logout}
              variant="outline"
              className="text-slate-700 hover:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        {/* TEMP DEBUG BUTTONS */}
        <div className="flex gap-4 mt-6">
          <Button onClick={() => approveReservationMutation.mutate({ id: 1 })}>
            Approve Test
          </Button>

          <Button onClick={() => rejectReservationMutation.mutate({ id: 1 })}>
            Reject Test
          </Button>

          <Button onClick={() => cancelReservationMutation.mutate({ id: 1 })}>
            Cancel Test
          </Button>

          <Button
            onClick={() =>
              blockDateMutation.mutate({ date: "2026-01-01" })
            }
          >
            Block Date Test
          </Button>
        </div>

        {/* Example reservation display */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Reservations</h2>

          {isLoading ? (
            <p>Loading reservations...</p>
          ) : (
            <pre className="bg-slate-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(reservations, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}