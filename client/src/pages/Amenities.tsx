import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Waves, Utensils, Users, Wifi, Dumbbell, TreePalm } from "lucide-react";
import { useEffect, useState } from "react";

export default function Amenities() {
  const [, setLocation] = useLocation();

  const [highlighted, setHighlighted] = useState<string | null>(null);

  const amenities = [
    {
      id: "pool",
      icon: Waves,
      title: "Swimming Pool",
      description: "Relax in our spacious resort-style swimming pool.",
      image: "https://via.placeholder.com/400x250",
    },
    {
      id: "restaurant",
      icon: Utensils,
      title: "Restaurant",
      description: "Enjoy local and international cuisine.",
      image: "https://via.placeholder.com/400x250",
    },
    {
      id: "events",
      icon: Users,
      title: "Event Hall",
      description: "Perfect for weddings, birthdays, and conferences.",
      image: "https://via.placeholder.com/400x250",
    },
    {
      id: "wifi",
      icon: Wifi,
      title: "Free WiFi",
      description: "Fast and reliable internet across the resort.",
      image: "https://via.placeholder.com/400x250",
    },
    {
      id: "gym",
      icon: Dumbbell,
      title: "Fitness Area",
      description: "Stay active with our mini gym facilities.",
      image: "https://via.placeholder.com/400x250",
    },
    {
      id: "garden",
      icon: TreePalm,
      title: "Garden & Lounge",
      description: "Peaceful outdoor spaces to relax and unwind.",
      image: "https://via.placeholder.com/400x250",
    },
  ];

  // ✅ SCROLL + HIGHLIGHT LOGIC
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const item = params.get("item");

    if (item) {
      const el = document.getElementById(item);

      if (el) {
        setHighlighted(item);

        setTimeout(() => {
          el.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-emerald-600">
            Angela's Resort
          </div>

          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setLocation("/")}>
              Home
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/accomodations")}>
              Accommodations
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/book")}>
              Book
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-5xl font-bold mb-4">Our Amenities</h1>
          <p className="text-lg text-emerald-50">
            Discover everything Angela's Resort has to offer — designed for comfort, leisure, and unforgettable experiences.
          </p>
        </div>
      </section>

      {/* AMENITIES GRID */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {amenities.map((item, index) => {
              const Icon = item.icon;

              return (
                <Card
                  id={item.id}
                  key={index}
                  className={`overflow-hidden border-0 shadow-md transition-all duration-300 group
                    ${
                      highlighted === item.id
                        ? "ring-2 ring-emerald-500 scale-105"
                        : "hover:shadow-xl"
                    }
                  `}
                >
                  {/* IMAGE */}
                  <div className="h-48 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* CONTENT */}
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Icon className="text-emerald-600 w-5 h-5" />
                      <CardTitle>{item.title}</CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-slate-600 text-sm">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-100 text-center">
        <h2 className="text-3xl font-bold mb-4 text-slate-900">
          Ready to Experience It?
        </h2>
        <p className="text-slate-600 mb-6">
          Book your stay now and enjoy all these amazing amenities.
        </p>
        <Button
          onClick={() => setLocation("/book")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Book Now
        </Button>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-6 text-center">
        <p>&copy; 2024 Angela's Resort</p>
      </footer>
    </div>
  );
}