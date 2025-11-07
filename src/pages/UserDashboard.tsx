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
import { LogOut, Plus, CheckCircle, Clock } from "lucide-react";
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
      } catch (error) {
        console.error("Auth check failed:", error);
        // Allow app to continue without auth
        setUser(null);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const createTicket = async () => {
    try {
      const validated = ticketSchema.parse(newTicket);
      setLoading(true);
      setAiResponse(null);

      // Insert ticket into database
      const { data: ticketData, error: insertError } = await supabase
        .from("tickets")
        .insert({
          subject: validated.subject,
          description: validated.description,
          customer_name: validated.customerName,
          customer_email: validated.customerEmail,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Ticket Created",
        description: "Analyzing your ticket with AI...",
      });

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
          ai_response: categorization.suggestedResponse,
        })
        .eq("id", ticketData.id);

      if (updateError) {
        console.error("Update error:", updateError);
        // Continue anyway - ticket was created
      }

      setAiResponse(categorization);

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
    } catch (error: any) {
      console.error("Ticket creation error:", error);
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
      </div>
    </div>
  );
};

export default UserDashboard;
