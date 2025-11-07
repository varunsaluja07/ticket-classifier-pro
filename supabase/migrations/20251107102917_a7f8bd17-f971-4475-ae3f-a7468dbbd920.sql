-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-attachments',
  'ticket-attachments',
  false,
  20971520, -- 20MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create RLS policies for ticket attachments
CREATE POLICY "Users can view their own ticket attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ticket-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM tickets WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can upload to their own tickets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM tickets WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Admins can view all ticket attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ticket-attachments' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create ticket_updates table for follow-up messages
CREATE TABLE public.ticket_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ticket_updates
ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;

-- RLS policies for ticket_updates
CREATE POLICY "Users can view updates on their tickets"
ON public.ticket_updates
FOR SELECT
USING (
  ticket_id IN (
    SELECT id FROM tickets WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can add updates to their tickets"
ON public.ticket_updates
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  ticket_id IN (
    SELECT id FROM tickets WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Admins can view all ticket updates"
ON public.ticket_updates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can add updates to any ticket"
ON public.ticket_updates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_ticket_updates_ticket_id ON public.ticket_updates(ticket_id);
CREATE INDEX idx_ticket_updates_created_at ON public.ticket_updates(created_at DESC);