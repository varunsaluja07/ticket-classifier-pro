import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Download, RefreshCw } from "lucide-react";
import { TicketCard } from "@/components/TicketCard";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  customer_name: string;
  customer_email: string;
  status: string;
  category?: string;
  priority?: string;
  sla?: string;
  ai_response?: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin");

      if (!roles || roles.length === 0) {
        toast({
          title: "Access Denied",
          description: "You don't have admin access",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      loadTickets();
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const loadTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const categorizeTicket = async (ticket: Ticket) => {
    try {
      const { data, error } = await supabase.functions.invoke("categorize-ticket", {
        body: { ticket },
      });

      if (error) throw error;

      const { category, priority, sla, aiResponse } = data;

      // Update ticket in database
      const { error: updateError } = await supabase
        .from("tickets")
        .update({
          category,
          priority,
          sla,
          ai_response: aiResponse,
        })
        .eq("id", ticket.id);

      if (updateError) throw updateError;

      // Update local state
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticket.id
            ? { ...t, category, priority, sla, ai_response: aiResponse }
            : t
        )
      );

      toast({
        title: "Success",
        description: "Ticket categorized successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to categorize ticket",
        variant: "destructive",
      });
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(tickets, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `tickets-${new Date().toISOString()}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const exportToCSV = () => {
    const headers = ["Subject", "Customer Name", "Email", "Status", "Category", "Priority", "SLA", "Created At"];
    const csvData = tickets.map((t) => [
      t.subject,
      t.customer_name,
      t.customer_email,
      t.status,
      t.category || "",
      t.priority || "",
      t.sla || "",
      new Date(t.created_at).toLocaleString(),
    ]);
    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button onClick={loadTickets} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToJSON} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No tickets found</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onCategorize={() => categorizeTicket(ticket)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
