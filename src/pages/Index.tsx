import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/TicketCard";
import { useToast } from "@/hooks/use-toast";
import { Download, Sparkles, RefreshCw, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  customerEmail: string;
  customerName: string;
  date: string;
  category?: string;
  priority?: string;
  sla?: string;
  suggestedResponse?: string;
}

// Synthetic ticket data
const initialTickets: Ticket[] = [
  {
    id: "1",
    subject: "Unable to login to account",
    description: "I've been trying to access my account for the past hour but keep getting an 'invalid credentials' error. I'm sure my password is correct. This is urgent as I need to access important files.",
    customerEmail: "john.doe@company.com",
    customerName: "John Doe",
    date: "2024-01-15",
  },
  {
    id: "2",
    subject: "Request for premium plan features",
    description: "I'm currently on the basic plan but would like to understand what additional features come with the premium plan. Could you provide a detailed comparison?",
    customerEmail: "sarah.smith@startup.io",
    customerName: "Sarah Smith",
    date: "2024-01-15",
  },
  {
    id: "3",
    subject: "Billing discrepancy on invoice",
    description: "I noticed my latest invoice shows a charge that doesn't match my subscription plan. The amount is $50 more than expected. Please review and correct this.",
    customerEmail: "mike.johnson@business.com",
    customerName: "Mike Johnson",
    date: "2024-01-14",
  },
  {
    id: "4",
    subject: "App crashes when uploading files",
    description: "Every time I try to upload a PDF file larger than 5MB, the application crashes completely. This happens consistently on both Chrome and Firefox browsers.",
    customerEmail: "emma.wilson@tech.com",
    customerName: "Emma Wilson",
    date: "2024-01-14",
  },
  {
    id: "5",
    subject: "How to export data",
    description: "I need to export all my data from the platform. Is there a bulk export feature? I couldn't find it in the settings.",
    customerEmail: "david.brown@enterprise.com",
    customerName: "David Brown",
    date: "2024-01-13",
  },
];

const Index = () => {
  const [tickets, setTickets] = useState(initialTickets);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    customerEmail: "",
    customerName: "",
  });
  const { toast } = useToast();

  const categorizeTicket = async (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    setProcessingIds((prev) => new Set(prev).add(ticketId));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/categorize-ticket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            subject: ticket.subject,
            description: ticket.description,
            customerEmail: ticket.customerEmail,
          }),
        }
      );

      if (response.status === 429) {
        toast({
          title: "Rate Limit Exceeded",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
        return;
      }

      if (response.status === 402) {
        toast({
          title: "Payment Required",
          description: "Please add credits to continue using AI features.",
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to categorize ticket");
      }

      const result = await response.json();

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                category: result.category,
                priority: result.priority,
                sla: result.sla,
                suggestedResponse: result.suggestedResponse,
              }
            : t
        )
      );

      toast({
        title: "Ticket Categorized",
        description: "AI has successfully analyzed and categorized the ticket.",
      });
    } catch (error) {
      console.error("Error categorizing ticket:", error);
      toast({
        title: "Error",
        description: "Failed to categorize ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(ticketId);
        return next;
      });
    }
  };

  const categorizeAll = async () => {
    const uncategorized = tickets.filter((t) => !t.category);
    for (const ticket of uncategorized) {
      await categorizeTicket(ticket.id);
    }
  };

  const refreshData = () => {
    setTickets(initialTickets);
    toast({
      title: "Data Refreshed",
      description: "Tickets have been reset to initial state.",
    });
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(tickets, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `support-tickets-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Export Successful",
      description: "Tickets exported as JSON file.",
    });
  };

  const createTicket = () => {
    if (!newTicket.subject || !newTicket.description || !newTicket.customerEmail || !newTicket.customerName) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields to create a ticket.",
        variant: "destructive",
      });
      return;
    }

    const ticket: Ticket = {
      id: String(tickets.length + 1),
      ...newTicket,
      date: new Date().toISOString().split("T")[0],
    };

    setTickets((prev) => [ticket, ...prev]);
    setNewTicket({ subject: "", description: "", customerEmail: "", customerName: "" });
    setShowForm(false);
    toast({
      title: "Ticket Created",
      description: "New support ticket has been created successfully.",
    });
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Subject",
      "Description",
      "Customer Email",
      "Customer Name",
      "Date",
      "Category",
      "Priority",
      "SLA",
      "Suggested Response",
    ];

    const rows = tickets.map((t) => [
      t.id,
      t.subject,
      t.description,
      t.customerEmail,
      t.customerName,
      t.date,
      t.category || "",
      t.priority || "",
      t.sla || "",
      t.suggestedResponse || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    const exportFileDefaultName = `support-tickets-${new Date().toISOString().split("T")[0]}.csv`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Export Successful",
      description: "Tickets exported as CSV file.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">AI Support Ticket Manager</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Automatically categorize tickets, assign priorities, and generate response templates
          </p>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <Button onClick={() => setShowForm(!showForm)} variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Create New Ticket
          </Button>
          <Button onClick={categorizeAll} className="bg-primary hover:bg-primary/90">
            <Sparkles className="mr-2 h-4 w-4" />
            Categorize All Tickets
          </Button>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button onClick={exportToJSON} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create New Support Ticket</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input
                  placeholder="Ticket subject"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Describe the issue"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Customer Name</label>
                  <Input
                    placeholder="John Doe"
                    value={newTicket.customerName}
                    onChange={(e) => setNewTicket({ ...newTicket, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Customer Email</label>
                  <Input
                    type="email"
                    placeholder="customer@example.com"
                    value={newTicket.customerEmail}
                    onChange={(e) => setNewTicket({ ...newTicket, customerEmail: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={createTicket} className="w-full">
                Create Ticket
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              isProcessing={processingIds.has(ticket.id)}
              onCategorize={categorizeTicket}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
