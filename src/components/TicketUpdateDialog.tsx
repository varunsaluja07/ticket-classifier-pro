import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Paperclip, X } from "lucide-react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const updateSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

interface TicketUpdateDialogProps {
  ticketId: string;
  onUpdateAdded: () => void;
}

export const TicketUpdateDialog = ({ ticketId, onUpdateAdded }: TicketUpdateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (20MB max)
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 20MB",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async () => {
    try {
      const validated = updateSchema.parse({ message });
      setIsSubmitting(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("You must be logged in to add updates");
      }

      let attachmentUrl = null;

      // Upload file if attached
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${ticketId}/${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error("Failed to upload attachment");
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(fileName);

        attachmentUrl = urlData.publicUrl;
      }

      // Insert ticket update
      const { error: insertError } = await supabase
        .from('ticket_updates')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          message: validated.message,
          attachment_url: attachmentUrl,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      toast({
        title: "Success",
        description: "Your update has been added to the ticket",
      });

      setMessage("");
      setFile(null);
      setOpen(false);
      onUpdateAdded();
    } catch (error: any) {
      console.error("Update submission error:", error);
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to add update",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Add More Information
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add More Information</DialogTitle>
          <DialogDescription>
            Provide additional details or attach files to help us resolve your issue faster.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Additional Details</Label>
            <Textarea
              id="message"
              placeholder="Describe any additional information about your issue..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/2000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment">Attach File (Optional)</Label>
            <div className="flex flex-col gap-2">
              {!file ? (
                <div className="relative">
                  <Input
                    id="attachment"
                    type="file"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx"
                    className="cursor-pointer"
                  />
                  <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-md">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Supported: Images, PDF, Word documents (Max 20MB)
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
          >
            {isSubmitting ? "Submitting..." : "Submit Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
