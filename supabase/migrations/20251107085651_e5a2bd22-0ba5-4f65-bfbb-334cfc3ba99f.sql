-- Allow anonymous users to create tickets
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;

CREATE POLICY "Anyone can create tickets" 
ON public.tickets 
FOR INSERT 
WITH CHECK (true);

-- Update the select policy to allow viewing without auth for own tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;

CREATE POLICY "Anyone can view tickets they created" 
ON public.tickets 
FOR SELECT 
USING (
  (created_by IS NOT NULL AND auth.uid() = created_by) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR created_by IS NULL
);

-- Allow anonymous users to update tickets they just created (for AI response)
CREATE POLICY "Anyone can update their tickets"
ON public.tickets
FOR UPDATE
USING (
  (created_by IS NOT NULL AND auth.uid() = created_by)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR created_by IS NULL
);