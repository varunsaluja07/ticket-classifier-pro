-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Public ticket updates" ON public.tickets;

-- Allow anyone to update tickets (needed for AI categorization of anonymous tickets)
CREATE POLICY "Allow ticket updates" 
ON public.tickets 
FOR UPDATE 
USING (true)
WITH CHECK (true);