import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Calendar, Download } from "lucide-react";

interface TicketCardProps {
  ticket: {
    id: string;
    subject: string;
    description: string;
    customer_email: string;
    customer_name: string;
    created_at: string;
    category?: string;
    priority?: string;
    sla?: string;
    ai_response?: string;
  };
  onCategorize: () => void;
}

const priorityColors = {
  high: "bg-[hsl(var(--status-high))] text-white",
  medium: "bg-[hsl(var(--status-medium))] text-white",
  low: "bg-[hsl(var(--status-low))] text-white",
};

const categoryColors = {
  "Login issues": "bg-[hsl(var(--category-login))] text-white",
  "Account Access": "bg-[hsl(var(--category-account))] text-white",
  Technical: "bg-[hsl(var(--category-technical))] text-white",
  Feedback: "bg-[hsl(var(--category-feedback))] text-white",
};

export const TicketCard = ({ ticket, onCategorize }: TicketCardProps) => {
  const exportTicketToJSON = () => {
    const dataStr = JSON.stringify(ticket, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `ticket-${ticket.id}-${new Date().toISOString()}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const exportTicketToCSV = () => {
    const headers = ["Field", "Value"];
    const csvData = [
      ["Subject", `"${ticket.subject.replace(/"/g, '""')}"`],
      ["Customer Name", `"${ticket.customer_name.replace(/"/g, '""')}"`],
      ["Email", ticket.customer_email],
      ["Category", ticket.category || ""],
      ["Priority", ticket.priority || ""],
      ["SLA", ticket.sla || ""],
      ["Description", `"${ticket.description.replace(/"/g, '""')}"`],
      ["AI Response", ticket.ai_response ? `"${ticket.ai_response.replace(/"/g, '""')}"` : ""],
      ["Created At", new Date(ticket.created_at).toLocaleString()],
    ];
    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${ticket.id}-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <Card className="p-6 hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)] border-border">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg text-foreground">{ticket.subject}</h3>
              {ticket.priority && (
                <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                  {ticket.priority.toUpperCase()}
                </Badge>
              )}
          {ticket.category && (
            <Badge className={categoryColors[ticket.category as keyof typeof categoryColors]}>
              {ticket.category}
            </Badge>
          )}
          {ticket.sla && (
            <Badge variant="outline" className="border-primary text-primary">
              SLA: {ticket.sla}
            </Badge>
          )}
        </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span>{ticket.customer_email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed">{ticket.description}</p>

        {ticket.ai_response && (
          <div className="bg-accent/50 rounded-lg p-4 space-y-2 border border-border">
            <h4 className="font-medium text-sm text-foreground">Suggested Response:</h4>
            <p className="text-sm text-foreground/90 leading-relaxed">{ticket.ai_response}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!ticket.category && (
            <Button
              onClick={onCategorize}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Categorize with AI
            </Button>
          )}
          <Button
            onClick={exportTicketToJSON}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Download className="w-4 h-4" />
            JSON
          </Button>
          <Button
            onClick={exportTicketToCSV}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Download className="w-4 h-4" />
            CSV
          </Button>
        </div>
      </div>
    </Card>
  );
};
