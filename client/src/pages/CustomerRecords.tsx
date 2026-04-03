import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";

export default function CustomerRecords() {
  const { user, logout, loading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: customers, isLoading } =
    trpc.customers.list.useQuery(undefined, {
      enabled: user?.role === "admin",
    });

  const [selected, setSelected] = useState<any>(null);

  const { data: history } = trpc.customers.history.useQuery(
    { id: selected?.id },
    { enabled: !!selected }
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b p-4 flex justify-between">
        <h1 className="font-bold text-xl text-emerald-600">
          Customers
        </h1>
        <Button onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </nav>

      <div className="p-6 space-y-4">
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          customers?.map((c: any) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
              </CardHeader>

              <CardContent>
                <p>Email: {c.email}</p>
                <p>Phone: {c.phone}</p>

                <Button
                  className="mt-2"
                  onClick={() => setSelected(c)}
                >
                  View History
                </Button>

                {/* HISTORY */}
                {selected?.id === c.id && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="font-semibold mb-2">
                      Booking History
                    </h3>

                    {history?.map((r: any) => (
                      <div
                        key={r.id}
                        className="text-sm border-b py-2"
                      >
                        #{r.id} | {r.status} | {r.checkInDate} →{" "}
                        {r.checkOutDate}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}