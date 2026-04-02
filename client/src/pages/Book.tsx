import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";

export default function Book() {
  const [, setLocation] = useLocation();
  const { data: packages, isLoading: packagesLoading } = trpc.packages.list.useQuery();
  const createReservationMutation = trpc.reservations.create.useMutation();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    packageId: "",
    checkInDate: "",
    checkOutDate: "",
    numberOfGuests: 1,
    specialRequests: "",
  });

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<{ checkIn: string | null; checkOut: string | null }>({
    checkIn: null,
    checkOut: null,
  });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];

    if (!selectedDates.checkIn) {
      setSelectedDates({ checkIn: dateStr, checkOut: null });
      setFormData({ ...formData, checkInDate: dateStr, checkOutDate: "" });
    } else if (!selectedDates.checkOut) {
      if (dateStr > selectedDates.checkIn) {
        setSelectedDates({ ...selectedDates, checkOut: dateStr });
        setFormData({ ...formData, checkOutDate: dateStr });
      } else {
        toast.error("Check-out date must be after check-in date");
      }
    } else {
      setSelectedDates({ checkIn: dateStr, checkOut: null });
      setFormData({ ...formData, checkInDate: dateStr, checkOutDate: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.packageId || !formData.checkInDate || !formData.checkOutDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createReservationMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        packageId: parseInt(formData.packageId),
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        numberOfGuests: formData.numberOfGuests,
        specialRequests: formData.specialRequests,
      });

      toast.success("Reservation submitted successfully! We'll contact you soon.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        packageId: "",
        checkInDate: "",
        checkOutDate: "",
        numberOfGuests: 1,
        specialRequests: "",
      });
      setSelectedDates({ checkIn: null, checkOut: null });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create reservation");
    }
  };

  const isDateInRange = (date: Date) => {
    if (!selectedDates.checkIn || !selectedDates.checkOut) return false;
    const dateStr = date.toISOString().split("T")[0];
    return dateStr >= selectedDates.checkIn && dateStr <= selectedDates.checkOut;
  };

  const isDateSelected = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return dateStr === selectedDates.checkIn || dateStr === selectedDates.checkOut;
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div
            className="text-2xl font-bold text-emerald-600 cursor-pointer"
            onClick={() => setLocation("/")}
          >
            Angela's Resort
          </div>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="text-slate-700 hover:text-emerald-600"
            >
              Home
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation("/packages")}
              className="text-slate-700 hover:text-emerald-600"
            >
              Packages
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation("/admin")}
              className="text-slate-700 hover:text-emerald-600"
            >
              Admin
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Make Your Reservation</h1>
          <p className="text-xl text-emerald-50">Select your dates and complete your booking</p>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="md:col-span-1">
              <Card className="border-0 shadow-lg sticky top-24">
                <CardHeader>
                  <CardTitle>Select Dates</CardTitle>
                  <CardDescription>Click to choose check-in and check-out dates</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Month Navigation */}
                  <div className="flex justify-between items-center mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h3 className="font-semibold text-center min-w-32">
                      {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((date, index) => (
                      <div key={index}>
                        {date ? (
                          <button
                            onClick={() => handleDateClick(date)}
                            disabled={isPastDate(date)}
                            className={`w-full h-10 rounded text-sm font-medium transition-colors ${
                              isPastDate(date)
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : isDateSelected(date)
                                  ? "bg-emerald-600 text-white"
                                  : isDateInRange(date)
                                    ? "bg-emerald-100 text-emerald-900"
                                    : "bg-white text-slate-900 hover:bg-slate-100 border border-slate-200"
                            }`}
                          >
                            {date.getDate()}
                          </button>
                        ) : (
                          <div className="w-full h-10" />
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedDates.checkIn && selectedDates.checkOut && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">Check-in:</span> {new Date(selectedDates.checkIn).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">Check-out:</span> {new Date(selectedDates.checkOut).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Form */}
            <div className="md:col-span-2">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Reservation Details</CardTitle>
                  <CardDescription>Fill in your information to complete the booking</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-4">Personal Information</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@example.com"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+63 9XX XXX XXXX"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-4">Booking Details</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="package">Select Package *</Label>
                          <Select value={formData.packageId} onValueChange={(value) => setFormData({ ...formData, packageId: value })}>
                            <SelectTrigger id="package" className="mt-1">
                              <SelectValue placeholder="Choose a package" />
                            </SelectTrigger>
                            <SelectContent>
                              {packagesLoading ? (
                                <SelectItem value="loading" disabled>
                                  Loading packages...
                                </SelectItem>
                              ) : packages && packages.length > 0 ? (
                                packages.map((pkg) => (
                                  <SelectItem key={pkg.id} value={pkg.id.toString()}>
                                    {pkg.name} - ₱{parseFloat(pkg.basePrice.toString()).toLocaleString()}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>
                                  No packages available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="guests">Number of Guests *</Label>
                          <Input
                            id="guests"
                            type="number"
                            min="1"
                            value={formData.numberOfGuests}
                            onChange={(e) => setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Special Requests */}
                    <div>
                      <Label htmlFor="requests">Special Requests</Label>
                      <Textarea
                        id="requests"
                        value={formData.specialRequests}
                        onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                        placeholder="Any special requests or dietary requirements?"
                        className="mt-1 min-h-24"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={createReservationMutation.isPending}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
                    >
                      {createReservationMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Submit Reservation
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Angela's Resort. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
