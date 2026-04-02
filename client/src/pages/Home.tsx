import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { MapPin, Phone, Mail, Users, Utensils, Waves, Wifi } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  const amenities = [
    { icon: Waves, name: "Swimming Pool", description: "Olympic-sized pool with lounging area" },
    { icon: Utensils, name: "Restaurant", description: "On-site dining with local and international cuisine" },
    { icon: Users, name: "Event Spaces", description: "Versatile venues for conferences and celebrations" },
    { icon: Wifi, name: "Free WiFi", description: "High-speed internet throughout the resort" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-emerald-600">Angela's Resort</div>
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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">Welcome to Angela's Resort</h1>
            <p className="text-xl mb-8 text-emerald-50">
              Experience luxury and comfort in San Pablo City. Perfect for getaways, events, and celebrations.
            </p>
            <Button
              size="lg"
              onClick={() => setLocation("/book")}
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold"
            >
              Book Your Stay Now
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-slate-900">About Our Resort</h2>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Angela's Resort is a premier destination in San Pablo City, offering world-class accommodations and
                amenities for the discerning traveler. Whether you're planning a romantic getaway, family vacation, or
                corporate event, we have the perfect setting for your needs.
              </p>
              <p className="text-slate-600 mb-6 leading-relaxed">
                With over two decades of hospitality excellence, our dedicated team ensures every guest enjoys an
                unforgettable experience. From our comfortable rooms to our state-of-the-art facilities, we're committed
                to making your stay exceptional.
              </p>
              <Button onClick={() => setLocation("/book")} className="bg-emerald-600 hover:bg-emerald-700">
                Reserve Now
              </Button>
            </div>
            <div className="bg-gradient-to-br from-emerald-200 to-teal-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center text-slate-600">
                <Waves className="w-24 h-24 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">Resort Image Gallery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center text-slate-900">Our Amenities</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {amenities.map((amenity, index) => {
              const Icon = amenity.icon;
              return (
                <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Icon className="w-10 h-10 text-emerald-600 mb-2" />
                    <CardTitle className="text-lg">{amenity.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 text-sm">{amenity.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center text-slate-900">Get In Touch</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <Card className="border-0 shadow-md text-center">
              <CardHeader>
                <MapPin className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">San Pablo City, Laguna, Philippines</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md text-center">
              <CardHeader>
                <Phone className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <CardTitle>Phone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">(043) 123-4567</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md text-center">
              <CardHeader>
                <Mail className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <CardTitle>Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">info@angelasresort.com</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-emerald-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for Your Perfect Getaway?</h2>
          <p className="text-xl mb-8 text-emerald-50">Check our availability and book your reservation today</p>
          <Button
            size="lg"
            onClick={() => setLocation("/book")}
            className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold"
          >
            Start Booking
          </Button>
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
