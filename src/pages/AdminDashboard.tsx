import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Download, RefreshCw, BarChart3, AlertCircle, CheckCircle, Clock, Zap } from "lucide-react";
import { TicketCard } from "@/components/TicketCard";
import { categorizeTicket as categorizeTicketLocal } from "@/utils/ticketCategorization";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          toast({
            title: "Connection Error",
            description: "Unable to verify authentication. Please try again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        if (!session) {
          navigate("/auth");
          return;
        }
        setUser(session.user);

        // Check if user is admin
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin");

        if (rolesError) {
          console.error("Roles error:", rolesError);
          toast({
            title: "Error",
            description: "Failed to verify admin access",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

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
      } catch (error) {
        console.error("Auth check error:", error);
        toast({
          title: "Authentication Error",
          description: "Please refresh the page or sign in again",
          variant: "destructive",
        });
        setLoading(false);
      }
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

  const categorizeOpenTickets = async () => {
    const openTickets = tickets.filter(t => t.status === "open" && !t.category);
    
    if (openTickets.length === 0) {
      toast({
        title: "No Open Tickets",
        description: "All open tickets are already categorized",
      });
      return;
    }

    toast({
      title: "Categorizing",
      description: `Processing ${openTickets.length} open tickets...`,
    });

    let successCount = 0;
    let errorCount = 0;

    for (const ticket of openTickets) {
      try {
        await categorizeTicket(ticket);
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    toast({
      title: "Bulk Categorization Complete",
      description: `${successCount} succeeded, ${errorCount} failed`,
      variant: errorCount > 0 ? "destructive" : "default",
    });
  };

  const suggestResponsesForOpenTickets = async () => {
    const openTickets = tickets.filter(t => t.status === "open");
    
    if (openTickets.length === 0) {
      toast({
        title: "No Open Tickets",
        description: "There are no open tickets to generate responses for",
      });
      return;
    }

    setIsProcessing(true);
    toast({
      title: "Generating AI Responses",
      description: `Processing ${openTickets.length} open tickets...`,
    });

    let successCount = 0;
    let errorCount = 0;

    for (const ticket of openTickets) {
      try {
        const { error } = await supabase.functions.invoke('suggest-response', {
          body: {
            ticketId: ticket.id,
            subject: ticket.subject,
            description: ticket.description,
            customerName: ticket.customer_name
          }
        });

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error(`Failed to generate response for ticket ${ticket.id}:`, error);
        errorCount++;
      }
    }
    
    await loadTickets();
    setIsProcessing(false);
    
    toast({
      title: "AI Response Generation Complete",
      description: `${successCount} succeeded, ${errorCount} failed`,
      variant: errorCount > 0 ? "destructive" : "default",
    });
  };

  const quickCategorizeTickets = async () => {
    const uncategorizedTickets = tickets.filter(t => !t.category || t.category === "Uncategorized");
    
    if (uncategorizedTickets.length === 0) {
      toast({
        title: "No Uncategorized Tickets",
        description: "All tickets are already categorized",
      });
      return;
    }

    setIsProcessing(true);
    toast({
      title: "Quick Categorizing",
      description: `Processing ${uncategorizedTickets.length} tickets with rule-based logic...`,
    });

    let successCount = 0;
    let errorCount = 0;

    for (const ticket of uncategorizedTickets) {
      try {
        // Use local categorization
        const localCat = categorizeTicketLocal(ticket.subject, ticket.description);
        
        const { error: updateError } = await supabase
          .from("tickets")
          .update({
            category: localCat.category,
            priority: localCat.priority,
            sla: localCat.sla,
          })
          .eq("id", ticket.id);

        if (updateError) throw updateError;
        successCount++;
      } catch (error) {
        console.error(`Failed to categorize ticket ${ticket.id}:`, error);
        errorCount++;
      }
    }
    
    await loadTickets();
    setIsProcessing(false);
    
    toast({
      title: "Quick Categorization Complete",
      description: `${successCount} succeeded, ${errorCount} failed`,
      variant: errorCount > 0 ? "destructive" : "default",
    });
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
    const headers = ["Subject", "Customer Name", "Email", "Status", "Category", "Priority", "SLA", "AI Response", "Created At"];
    const csvData = tickets.map((t) => [
      `"${t.subject.replace(/"/g, '""')}"`,
      `"${t.customer_name.replace(/"/g, '""')}"`,
      t.customer_email,
      t.status,
      t.category || "",
      t.priority || "",
      t.sla || "",
      t.ai_response ? `"${t.ai_response.replace(/"/g, '""')}"` : "",
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

  const analytics = useMemo(() => {
    const categoryStats = tickets.reduce((acc, ticket) => {
      const cat = ticket.category || "Uncategorized";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityStats = tickets.reduce((acc, ticket) => {
      const pri = ticket.priority || "unassigned";
      acc[pri] = (acc[pri] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusStats = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categorizedCount = tickets.filter(t => t.category).length;
    const avgResponseTime = tickets.filter(t => t.sla).length;

    return {
      total: tickets.length,
      categorized: categorizedCount,
      categoryStats,
      priorityStats,
      statusStats,
      avgResponseTime,
    };
  }, [tickets]);

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
          <Button onClick={quickCategorizeTickets} variant="outline" disabled={isProcessing}>
            <Zap className="w-4 h-4 mr-2" />
            Quick Categorize (Rule-based)
          </Button>
          <Button onClick={categorizeOpenTickets} variant="default" disabled={isProcessing}>
            Categorize with AI
          </Button>
          <Button onClick={suggestResponsesForOpenTickets} variant="secondary" disabled={isProcessing}>
            Suggest AI Responses for All Open Tickets
          </Button>
          <Button onClick={exportToJSON} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All JSON
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All CSV
          </Button>
        </div>

        {/* Analytics Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Analytics Overview
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Categorized
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {analytics.categorized}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.total > 0 ? Math.round((analytics.categorized / analytics.total) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  High Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {analytics.priorityStats.high || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Open Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.statusStats.open || 0}
                </div>
                <Button 
                  onClick={categorizeOpenTickets} 
                  variant="outline" 
                  size="sm"
                  className="mt-3 w-full"
                >
                  Categorize with AI
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.categoryStats).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${(count / analytics.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.priorityStats).map(([priority, count]) => (
                    <div key={priority} className="flex justify-between items-center">
                      <span className="text-sm capitalize flex items-center gap-2">
                        {priority === "high" && <AlertCircle className="w-4 h-4 text-red-600" />}
                        {priority === "medium" && <Clock className="w-4 h-4 text-yellow-600" />}
                        {priority === "low" && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {priority}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              priority === "high" ? "bg-red-600" :
                              priority === "medium" ? "bg-yellow-600" :
                              "bg-green-600"
                            }`}
                            style={{ width: `${(count / analytics.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.statusStats).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{status}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${(count / analytics.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">All Tickets</h2>
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
