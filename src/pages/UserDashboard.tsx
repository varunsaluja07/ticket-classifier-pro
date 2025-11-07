import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus } from "lucide-react";
import { z } from "zod";

const ticketSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  customerName: z.string().min(1, "Name is required").max(100),
  customerEmail: z.string().email("Invalid email").max(255),
});

const UserDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    customerName: "",
    customerEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const createTicket = async () => {
    try {
      const validated = ticketSchema.parse(newTicket);
      setLoading(true);

      const { error } = await supabase.from("tickets").insert({
        subject: validated.subject,
        description: validated.description,
        customer_name: validated.customerName,
        customer_email: validated.customerEmail,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket created successfully!",
      });

      setNewTicket({
        subject: "",
        description: "",
        customerName: "",
        customerEmail: "",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create ticket",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Support Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief description of the issue"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the issue"
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Your Name</Label>
                <Input
                  id="customerName"
                  placeholder="John Doe"
                  value={newTicket.customerName}
                  onChange={(e) => setNewTicket({ ...newTicket, customerName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Your Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={newTicket.customerEmail}
                  onChange={(e) => setNewTicket({ ...newTicket, customerEmail: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={createTicket} className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Ticket"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
