import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, LogOut, Calendar, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  // ✅ INCLUDE loading
  const { user, logout, loading } = useAuth();
  const [, setLocation] = useLocation();

  // 🔐 ADMIN PROTECTION (THIS IS THE IMPORTANT PART)
  if (!loading && (!user || user.role !== "admin")) {
    setLocation("/admin-login");
    return null;
  }

  const { data: reservations, isLoading, refetch } =
    trpc.reservations.list.useQuery(undefined, {
      enabled: user?.role === "admin",
    });

  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    status: "pending",
    downpayment: 0,
  });
  const [blockDateInput, setBlockDateInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // ✅ OPTIONAL: show loader while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
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
              Welcome, {user?.name || "Admin"}
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Admin Dashboard
          </h1>
          <Button
            onClick={() => setLocation("/admin/customers")}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            View Customer Records
          </Button>
        </div>

        {/* KEEP YOUR EXISTING TABS + CONTENT BELOW */}
      </div>
    </div>
  );
}