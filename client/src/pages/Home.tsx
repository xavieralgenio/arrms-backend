import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { MapPin, Phone, Mail, Users, Utensils, Waves, Wifi } from "lucide-react";

// ✅ AI Chat imports
import { AIChatBox, Message } from "@/components/AIChatBox";
import { useState } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system" as const,
      content:
        "You are a helpful assistant for Angela's Resort. Answer questions about bookings, amenities, pricing, and location.",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // ✅ DEFAULT MINIMIZED
  const [isChatOpen, setIsChatOpen] = useState(false);

  // ✅ NEW INPUT STATE
  const [input, setInput] = useState("");

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user" as const, content },
    ];

    setMessages(newMessages);
    setIsLoading(true);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: data.response,
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const amenities = [
  {
    id: "pool",
    icon: Waves,
    name: "Swimming Pool",
    description: "Olympic-sized pool with lounging area",
  },
  {
    id: "restaurant",
    icon: Utensils,
    name: "Restaurant",
    description: "On-site dining with local and international cuisine",
  },
  {
    id: "events",
    icon: Users,
    name: "Event Spaces",
    description: "Versatile venues for conferences and celebrations",
  },
  {
    id: "wifi",
    icon: Wifi,
    name: "Free WiFi",
    description: "High-speed internet throughout the resort",
  },
];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-emerald-600">Angela's Resort</div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => {window.scrollTo({ top: 0, behavior: "smooth" });
            }} className="text-slate-700 hover:text-emerald-600">
              Home
            </Button>

            <Button variant="ghost" onClick={() => {document.getElementById("amenities")?.scrollIntoView({ behavior: "smooth" });
            }} className="text-slate-700 hover:text-emerald-600">
              Amenities
            </Button>

            <Button variant="ghost" onClick={() => setLocation("/accomodations")} className="text-slate-700 hover:text-emerald-600">
              Accomodations
            </Button>

            <Button variant="ghost" onClick={() => setLocation("/book")} className="text-slate-700 hover:text-emerald-600">
              Book
            </Button>

            {user?.role === "admin" && (
              <Button variant="ghost" onClick={() => setLocation("/admin")} className="text-slate-700 hover:text-emerald-600">
                Admin
              </Button>
            )}

            {user ? (
              <Button variant="ghost" onClick={logout}>
                Logout
              </Button>
            ) : (
              <Button onClick={() => setLocation("/login")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Login
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">Welcome to Angela's Resort</h1>
            <p className="text-xl mb-8 text-emerald-50">
              Experience luxury and comfort in San Pablo City. Perfect for getaways, events, and celebrations.
            </p>
            <Button size="lg" onClick={() => setLocation("/book")} className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold">
              Book Your Stay Now
            </Button>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-900">About Our Resort</h2>
            <p className="text-slate-600 mb-4">
              Angela's Resort is a premier destination in San Pablo City, offering world-class accommodations and amenities.
            </p>
            <Button onClick={() => setLocation("/Accomodations")} className="bg-emerald-600 hover:bg-emerald-700">
              Check Accomodations
            </Button>
          </div>

          <div className="bg-gradient-to-br from-emerald-200 to-teal-200 rounded-lg h-96 flex items-center justify-center">
            <Waves className="w-24 h-24 opacity-50" />
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="py-16 bg-slate-50" id="amenities">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center text-slate-900">Our Amenities</h2>

          <div className="grid md:grid-cols-4 gap-6">
            {amenities.map((amenity, index) => {
              const Icon = amenity.icon;

              return (
                <Card key={index} onClick={() => setLocation(`/amenities?item=${amenity.id}`)}
                className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
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

      {/* Contact */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12 text-slate-900">Get In Touch</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <Card className="shadow-md">
              <CardHeader>
                <MapPin className="mx-auto text-emerald-600" />
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>San Pablo City, Laguna</CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <Phone className="mx-auto text-emerald-600" />
                <CardTitle>Phone</CardTitle>
              </CardHeader>
              <CardContent>(043) 123-4567</CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <Mail className="mx-auto text-emerald-600" />
                <CardTitle>Email</CardTitle>
              </CardHeader>
              <CardContent>info@angelasresort.com</CardContent>
            </Card>
          </div>
        </div>
      </section>


      <footer className="bg-slate-900 text-white py-8 text-center">
        <p>&copy; 2024 Angela's Resort</p>
      </footer>

      {/* ✅ CHATBOT */}
      <div className="fixed bottom-4 right-4 z-50">
        {isChatOpen ? (
          <div className="w-[280px] h-[420px] shadow-xl rounded-lg overflow-hidden border bg-white flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center bg-emerald-600 text-white px-3 py-2 text-sm">
              <span className="font-semibold">AI Assistant</span>
              <button onClick={() => setIsChatOpen(false)}>−</button>
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-hidden">
              <AIChatBox
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>

            {/* ✅ INPUT BOX */}
            <div className="border-t p-2 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(input)}
                placeholder="Type a message..."
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              <button
                onClick={() => handleSendMessage(input)}
                className="bg-emerald-600 text-white px-3 rounded text-sm"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-emerald-600 text-white px-3 py-2 text-sm rounded-full shadow-lg"
          >
            Chat 💬
          </button>
        )}
      </div>
    </div>
  );
}