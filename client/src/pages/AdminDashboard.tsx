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
import { Loader2, LogOut, Calendar, DollarSign, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: reservations, isLoading, refetch } = trpc.reservations.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ status: "pending", downpayment: 0 });
  const [blockDateInput, setBlockDateInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mutations
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-emerald-600">Angela's Resort - Admin</div>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-slate-600">Welcome, {user?.name}</span>
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
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <Button
            onClick={() => setLocation("/admin/customers")}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            View Customer Records
          </Button>
        </div>
        <Tabs defaultValue="reservations" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Reservation Management</CardTitle>
                <CardDescription>View and manage all guest reservations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-2">
                  <Label htmlFor="statusFilter" className="flex items-center">Filter by Status:</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="statusFilter" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reservations</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  </div>
                ) : reservations && reservations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-semibold text-slate-900">ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-900">Guest Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-900">Check-in</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-900">Check-out</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-900">Guests</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations
                          .filter((r) => statusFilter === "all" || r.status === statusFilter)
                          .map((reservation) => (
                          <tr key={reservation.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-600">#{reservation.id}</td>
                            <td className="py-3 px-4 text-slate-900 font-medium">
                              {/* Customer name would be fetched separately */}
                              Guest {reservation.customerId}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {new Date(reservation.checkInDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {new Date(reservation.checkOutDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{reservation.numberOfGuests}</td>
                            <td className="py-3 px-4">
                              <Badge className={`${getStatusColor(reservation.status)} flex items-center gap-1 w-fit`}>
                                {getStatusIcon(reservation.status)}
                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                {reservation.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => approveReservationMutation.mutate({ id: reservation.id })}
                                      disabled={approveReservationMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => rejectReservationMutation.mutate({ id: reservation.id })}
                                      disabled={rejectReservationMutation.isPending}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {reservation.status === "approved" && (
                                  <Button
                                    size="sm"
                                    onClick={() => cancelReservationMutation.mutate({ id: reservation.id })}
                                    disabled={cancelReservationMutation.isPending}
                                    variant="outline"
                                  >
                                    Cancel
                                  </Button>
                                )}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      Details
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reservation Details</DialogTitle>
                                      <DialogDescription>Reservation ID: {reservation.id}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-slate-600">Check-in Date</Label>
                                        <p className="font-semibold">{new Date(reservation.checkInDate).toLocaleDateString()}</p>
                                      </div>
                                      <div>
                                        <Label className="text-slate-600">Check-out Date</Label>
                                        <p className="font-semibold">{new Date(reservation.checkOutDate).toLocaleDateString()}</p>
                                      </div>
                                      <div>
                                        <Label className="text-slate-600">Number of Guests</Label>
                                        <p className="font-semibold">{reservation.numberOfGuests}</p>
                                      </div>
                                      <div>
                                        <Label className="text-slate-600">Total Price</Label>
                                        <p className="font-semibold">₱{parseFloat(reservation.totalPrice?.toString() || "0").toLocaleString()}</p>
                                      </div>
                                      {reservation.specialRequests && (
                                        <div>
                                          <Label className="text-slate-600">Special Requests</Label>
                                          <p className="text-slate-700">{reservation.specialRequests}</p>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-600">No reservations found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Calendar Management</CardTitle>
                <CardDescription>Block dates or mark special events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="blockDate">Block Date</Label>
                      <Input
                        id="blockDate"
                        type="date"
                        value={blockDateInput}
                        onChange={(e) => setBlockDateInput(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => {
                          if (blockDateInput) {
                            blockDateMutation.mutate({ date: blockDateInput });
                          } else {
                            toast.error("Please select a date");
                          }
                        }}
                        disabled={blockDateMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {blockDateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                        Block Date
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> Block dates to prevent new bookings on specific days (maintenance, private events, etc.)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Payment Tracking</CardTitle>
                <CardDescription>Manage payment status for reservations</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  </div>
                ) : reservations && reservations.length > 0 ? (
                  <div className="space-y-4">
                    {reservations.map((reservation) => (
                      <Card key={reservation.id} className="border border-slate-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-slate-900">Reservation #{reservation.id}</p>
                              <p className="text-sm text-slate-600">
                                Total: ₱{parseFloat(reservation.totalPrice?.toString() || "0").toLocaleString()}
                              </p>
                            </div>
                            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  onClick={() => setSelectedReservation(reservation)}
                                  className="text-emerald-600 hover:text-emerald-700"
                                >
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Update Payment
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Update Payment Status</DialogTitle>
                                  <DialogDescription>Reservation #{selectedReservation?.id}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="paymentStatus">Payment Status</Label>
                                    <Select value={paymentData.status} onValueChange={(value) => setPaymentData({ ...paymentData, status: value })}>
                                      <SelectTrigger id="paymentStatus" className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                                        <SelectItem value="fully_paid">Fully Paid</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="downpayment">Downpayment Amount</Label>
                                    <Input
                                      id="downpayment"
                                      type="number"
                                      value={paymentData.downpayment}
                                      onChange={(e) => setPaymentData({ ...paymentData, downpayment: parseFloat(e.target.value) })}
                                      className="mt-1"
                                    />
                                  </div>
                                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Save Payment</Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-600">No reservations to track payments for</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
