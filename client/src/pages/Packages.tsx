import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, Check } from "lucide-react";

export default function Packages() {
  const [, setLocation] = useLocation();
  const { data: packages, isLoading } = trpc.packages.list.useQuery();

  const getPackageTypeLabel = (type: string) => {
    switch (type) {
      case "day_tour":
        return "Day Tour";
      case "overnight":
        return "Overnight Stay";
      case "event":
        return "Event Package";
      default:
        return type;
    }
  };

  const getPackageTypeColor = (type: string) => {
    switch (type) {
      case "day_tour":
        return "bg-blue-100 text-blue-800";
      case "overnight":
        return "bg-purple-100 text-purple-800";
      case "event":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
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
              className="text-slate-700 hover:text-emerald-600 font-semibold"
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
          <h1 className="text-4xl font-bold mb-4">Our Packages</h1>
          <p className="text-xl text-emerald-50">Choose the perfect package for your stay</p>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : packages && packages.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                  <div className={`h-2 ${pkg.type === "day_tour" ? "bg-blue-500" : pkg.type === "overnight" ? "bg-purple-500" : "bg-pink-500"}`} />
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getPackageTypeColor(pkg.type)}>{getPackageTypeLabel(pkg.type)}</Badge>
                      <span className="text-2xl font-bold text-emerald-600">₱{parseFloat(pkg.basePrice.toString()).toLocaleString()}</span>
                    </div>
                    <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.duration || "Flexible duration"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 mb-6">{pkg.description}</p>

                    <div className="mb-6">
                      <h4 className="font-semibold text-slate-900 mb-3">Amenities & Features:</h4>
                      <ul className="space-y-2">
                        {pkg.amenities
                          ? JSON.parse(pkg.amenities).map((amenity: string, idx: number) => (
                              <li key={idx} className="flex items-center gap-2 text-slate-600">
                                <Check className="w-4 h-4 text-emerald-600" />
                                {amenity}
                              </li>
                            ))
                          : [
                              <li key="1" className="flex items-center gap-2 text-slate-600">
                                <Check className="w-4 h-4 text-emerald-600" />
                                Comfortable accommodation
                              </li>,
                              <li key="2" className="flex items-center gap-2 text-slate-600">
                                <Check className="w-4 h-4 text-emerald-600" />
                                Access to all facilities
                              </li>,
                              <li key="3" className="flex items-center gap-2 text-slate-600">
                                <Check className="w-4 h-4 text-emerald-600" />
                                Complimentary breakfast
                              </li>,
                            ]}
                      </ul>
                    </div>

                    <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Max Capacity:</span> {pkg.maxCapacity} guests
                      </p>
                    </div>

                    <Button
                      onClick={() => setLocation("/book")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Book This Package
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg">No packages available at the moment.</p>
            </div>
          )}
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
