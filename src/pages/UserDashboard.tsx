import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, CheckCircle, Clock, Ticket } from "lucide-react";
import { z } from "zod";
import { LoadingModal } from "@/components/LoadingModal";
import { UserTicketCard } from "@/components/UserTicketCard";

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
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [ticketUpdates, setTicketUpdates] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState<{
    category: string;
    priority: string;
    sla: string;
    suggestedResponse: string;
  } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth session error:", error);
          // Continue without auth - allow anonymous ticket submission
          setUser(null);
          return;
        }
        
        setUser(session?.user || null);
        
        // Load user's tickets if authenticated
        if (session?.user) {
          loadMyTickets(session.user.id);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        // Allow app to continue without auth
        setUser(null);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadMyTickets(session.user.id);
      } else {
        setMyTickets([]);
        setTicketUpdates({});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadMyTickets = async (userId: string) => {
    try {
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      if (ticketsError) throw ticketsError;

      setMyTickets(tickets || []);

      // Load updates for each ticket
      if (tickets && tickets.length > 0) {
        const ticketIds = tickets.map(t => t.id);
        const { data: updates, error: updatesError } = await supabase
          .from("ticket_updates")
          .select("*")
          .in("ticket_id", ticketIds)
          .order("created_at", { ascending: true });

        if (updatesError) throw updatesError;

        // Group updates by ticket_id
        const groupedUpdates: Record<string, any[]> = {};
        updates?.forEach(update => {
          if (!groupedUpdates[update.ticket_id]) {
            groupedUpdates[update.ticket_id] = [];
          }
          groupedUpdates[update.ticket_id].push(update);
        });

        setTicketUpdates(groupedUpdates);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const createTicket = async () => {
    try {
      const validated = ticketSchema.parse(newTicket);
      setLoading(true);
      setAiResponse(null);

      // Generate a temporary UUID for anonymous users
      const createdById = user?.id || crypto.randomUUID();

      // Insert ticket into database
      const { data: ticketData, error: insertError } = await supabase
        .from("tickets")
        .insert({
          subject: validated.subject,
          description: validated.description,
          customer_name: validated.customerName,
          customer_email: validated.customerEmail,
          created_by: createdById,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      // Show AI processing modal
      setIsProcessingAI(true);

      // Call AI categorization
      const categorizationResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/categorize-ticket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: validated.subject,
            description: validated.description,
            customerEmail: validated.customerEmail,
          }),
        }
      );

      if (!categorizationResponse.ok) {
        const errorData = await categorizationResponse.json();
        console.error("Categorization error:", errorData);
        throw new Error(errorData.error || "Failed to categorize ticket");
      }

      const categorization = await categorizationResponse.json();
      
      // Update ticket with AI categorization
      const { error: updateError } = await supabase
        .from("tickets")
        .update({
          category: categorization.category,
          priority: categorization.priority,
          sla: categorization.sla,
          ai_response: categorization.aiResponse || categorization.suggestedResponse,
        })
        .eq("id", ticketData.id);

      if (updateError) {
        console.error("Update error:", updateError);
        // Continue anyway - ticket was created
      }

      setAiResponse({
        category: categorization.category,
        priority: categorization.priority,
        sla: categorization.sla,
        suggestedResponse: categorization.aiResponse || categorization.suggestedResponse,
      });

      setIsProcessingAI(false);

      toast({
        title: "Success",
        description: "Ticket created and categorized successfully!",
      });

      setNewTicket({
        subject: "",
        description: "",
        customerName: "",
        customerEmail: "",
      });

      // Reload tickets if user is authenticated
      if (user) {
        loadMyTickets(user.id);
      }
    } catch (error: any) {
      console.error("Ticket creation error:", error);
      setIsProcessingAI(false);
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <LoadingModal isOpen={isProcessingAI} message="Processing with AI" />
      
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Support Portal</h1>
          {user && (
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Support Ticket
            </CardTitle>
            <CardDescription>
              Submit your issue and receive an instant AI-powered response
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 mb-4">
                <p className="text-sm text-primary font-medium">
                  💡 Tip: After submitting, you'll be able to view your tickets and add more information below!
                </p>
              </div>
            )}
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

        {aiResponse && (
          <Card className="max-w-2xl mx-auto border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <CheckCircle className="w-5 h-5" />
                Ticket Categorized Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-sm">
                  Category: {aiResponse.category}
                </Badge>
                <Badge 
                  variant={aiResponse.priority === "high" ? "destructive" : "secondary"}
                  className="text-sm"
                >
                  Priority: {aiResponse.priority.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  SLA: {aiResponse.sla}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Automated Response:</Label>
                <div className="p-4 bg-background rounded-lg border">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {aiResponse.suggestedResponse}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Our support team will review your ticket and respond within the SLA timeframe.
              </p>
            </CardContent>
          </Card>
        )}

        {user && myTickets.length > 0 && (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="w-5 h-5" />
              <h2 className="text-xl font-semibold">My Tickets</h2>
              <Badge variant="secondary">{myTickets.length}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {myTickets.map((ticket) => (
                <UserTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  updates={ticketUpdates[ticket.id] || []}
                  onUpdateAdded={() => loadMyTickets(user.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
