import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, LogOut, Search, Users } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function CustomerRecords() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Fetch all reservations to build customer list
  const { data: reservations, isLoading } = trpc.reservations.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  // Build unique customer list from reservations
  const customers = reservations ? Array.from(
    new Map(
      reservations.map((r) => [r.customerId, r])
    ).values()
  ).filter((r) => r.customerId) : [];

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.customerId?.toString().includes(searchLower) ||
      customer.id?.toString().includes(searchLower)
    );
  });

  // Check if user is admin
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Card className="border-0 shadow-lg max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>You need to be logged in as an admin to access this page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Login as Admin
            </Button>
            <Button onClick={() => setLocation("/")} variant="outline" className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-emerald-600">Angela's Resort - Customer Records</div>
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
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Customer Database</CardTitle>
            <CardDescription>View and manage customer records and booking history</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-6 flex gap-2">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">Search customers</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="search"
                    placeholder="Search by customer ID or reservation ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Customer List */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : filteredCustomers.length > 0 ? (
              <div className="space-y-4">
                {filteredCustomers.map((customer) => {
                  // Get all reservations for this customer
                  const customerReservations = reservations?.filter((r) => r.customerId === customer.customerId) || [];

                  return (
                    <Card key={customer.customerId} className="border border-slate-200">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4 text-emerald-600" />
                              <p className="font-semibold text-slate-900">Customer ID: {customer.customerId}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-slate-600">Total Reservations</p>
                                <p className="font-semibold text-slate-900">{customerReservations.length}</p>
                              </div>
                              <div>
                                <p className="text-slate-600">Total Spent</p>
                                <p className="font-semibold text-slate-900">
                                  ₱{customerReservations
                                    .reduce((sum, r) => sum + parseFloat(r.totalPrice?.toString() || "0"), 0)
                                    .toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                onClick={() => setSelectedCustomer(customer)}
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Customer Details</DialogTitle>
                                <DialogDescription>Customer ID: {selectedCustomer?.customerId}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div>
                                  <h3 className="font-semibold text-slate-900 mb-4">Booking History</h3>
                                  <div className="space-y-3">
                                    {customerReservations.length > 0 ? (
                                      customerReservations.map((reservation) => (
                                        <div key={reservation.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                          <div className="flex justify-between items-start mb-2">
                                            <p className="font-semibold text-slate-900">Reservation #{reservation.id}</p>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                              reservation.status === "approved" ? "bg-green-100 text-green-800" :
                                              reservation.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                              reservation.status === "rejected" ? "bg-red-100 text-red-800" :
                                              "bg-slate-100 text-slate-800"
                                            }`}>
                                              {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                                            <div>
                                              <p className="text-xs text-slate-500">Check-in</p>
                                              <p className="font-medium">{new Date(reservation.checkInDate).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-slate-500">Check-out</p>
                                              <p className="font-medium">{new Date(reservation.checkOutDate).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-slate-500">Guests</p>
                                              <p className="font-medium">{reservation.numberOfGuests}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-slate-500">Total</p>
                                              <p className="font-medium">₱{parseFloat(reservation.totalPrice?.toString() || "0").toLocaleString()}</p>
                                            </div>
                                          </div>
                                          {reservation.specialRequests && (
                                            <div className="mt-2 pt-2 border-t border-slate-200">
                                              <p className="text-xs text-slate-500">Special Requests</p>
                                              <p className="text-sm text-slate-700">{reservation.specialRequests}</p>
                                            </div>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-slate-600">No reservations found</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600">No customers found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
