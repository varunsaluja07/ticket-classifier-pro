import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Calendar } from "lucide-react";

interface TicketCardProps {
  ticket: {
    id: string;
    subject: string;
    description: string;
    customerEmail: string;
    customerName: string;
    date: string;
    category?: string;
    priority?: string;
    suggestedResponse?: string;
  };
  isProcessing: boolean;
  onCategorize: (id: string) => void;
}

const priorityColors = {
  high: "bg-[hsl(var(--status-high))] text-white",
  medium: "bg-[hsl(var(--status-medium))] text-white",
  low: "bg-[hsl(var(--status-low))] text-white",
};

const categoryColors = {
  Technical: "bg-[hsl(var(--category-technical))] text-white",
  Billing: "bg-[hsl(var(--category-billing))] text-white",
  "Feature Request": "bg-[hsl(var(--category-feature))] text-white",
  "Bug Report": "bg-[hsl(var(--category-bug))] text-white",
  General: "bg-[hsl(var(--category-general))] text-white",
};

export const TicketCard = ({ ticket, isProcessing, onCategorize }: TicketCardProps) => {
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
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span>{ticket.customerEmail}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{ticket.date}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed">{ticket.description}</p>

        {ticket.suggestedResponse && (
          <div className="bg-accent/50 rounded-lg p-4 space-y-2 border border-border">
            <h4 className="font-medium text-sm text-foreground">Suggested Response:</h4>
            <p className="text-sm text-foreground/90 leading-relaxed">{ticket.suggestedResponse}</p>
          </div>
        )}

        {!ticket.category && (
          <Button
            onClick={() => onCategorize(ticket.id)}
            disabled={isProcessing}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Categorize with AI"
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};
