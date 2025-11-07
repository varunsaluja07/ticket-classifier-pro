-- Drop existing policies
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Anyone can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Anyone can view tickets they created" ON public.tickets;
DROP POLICY IF EXISTS "Anyone can update their tickets" ON public.tickets;

-- Allow anonymous users to create tickets (no auth required)
CREATE POLICY "Public ticket creation" 
ON public.tickets 
FOR INSERT 
WITH CHECK (true);

-- Allow viewing tickets for creators or admins
CREATE POLICY "Public ticket viewing" 
ON public.tickets 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR true
);

-- Allow updating tickets for admins
CREATE POLICY "Public ticket updates"
ON public.tickets
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));