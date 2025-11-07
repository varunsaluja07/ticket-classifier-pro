import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Clock, MessageSquare, Paperclip } from "lucide-react";
import { TicketUpdateDialog } from "./TicketUpdateDialog";

interface TicketUpdate {
  id: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
}

interface UserTicketCardProps {
  ticket: {
    id: string;
    subject: string;
    description: string;
    status: string;
    category?: string;
    priority?: string;
    sla?: string;
    ai_response?: string;
    created_at: string;
  };
  updates: TicketUpdate[];
  onUpdateAdded: () => void;
}

const statusColors = {
  open: "bg-status-medium text-white",
  closed: "bg-status-low text-white",
  pending: "bg-status-high text-white",
};

const priorityColors = {
  high: "bg-status-high text-white",
  medium: "bg-status-medium text-white",
  low: "bg-status-low text-white",
};

const categoryColors = {
  "Login issues": "bg-category-login text-white",
  "Account Access": "bg-category-account text-white",
  Technical: "bg-category-technical text-white",
  Feedback: "bg-category-feedback text-white",
};

export const UserTicketCard = ({ ticket, updates, onUpdateAdded }: UserTicketCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow animate-fade-in">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg line-clamp-2 flex-1">{ticket.subject}</CardTitle>
          <Badge className={statusColors[ticket.status as keyof typeof statusColors] || "bg-secondary"}>
            {ticket.status}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {ticket.category && (
            <Badge variant="secondary" className={categoryColors[ticket.category as keyof typeof categoryColors]}>
              {ticket.category}
            </Badge>
          )}
          {ticket.priority && (
            <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
              {ticket.priority.toUpperCase()}
            </Badge>
          )}
          {ticket.sla && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              SLA: {ticket.sla}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {ticket.description}
          </p>
        </div>

        {ticket.ai_response && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs font-semibold text-primary mb-1">AI Response:</p>
            <p className="text-sm leading-relaxed line-clamp-3">
              {ticket.ai_response}
            </p>
          </div>
        )}

        {updates.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            <span>{updates.length} update{updates.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between"
        >
          <span>{isExpanded ? "Show Less" : "Show More"}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {isExpanded && (
          <div className="space-y-4 pt-4 border-t animate-fade-in">
            <div>
              <h4 className="text-sm font-semibold mb-2">Full Description:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {ticket.ai_response && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Complete AI Response:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {ticket.ai_response}
                </p>
              </div>
            )}

            {updates.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Updates:</h4>
                <div className="space-y-3">
                  {updates.map((update) => (
                    <div key={update.id} className="p-3 bg-secondary/50 rounded-lg space-y-2">
                      <p className="text-sm">{update.message}</p>
                      {update.attachment_url && (
                        <a
                          href={update.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Paperclip className="w-3 h-3" />
                          View Attachment
                        </a>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(update.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <TicketUpdateDialog ticketId={ticket.id} onUpdateAdded={onUpdateAdded} />
            </div>
          </div>
        )}

        {!isExpanded && (
          <div className="pt-2">
            <TicketUpdateDialog ticketId={ticket.id} onUpdateAdded={onUpdateAdded} />
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Created: {new Date(ticket.created_at).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
};
