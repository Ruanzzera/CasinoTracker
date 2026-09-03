-- Add UPDATE policy for casino_entries
CREATE POLICY "Users can update their own entries"
ON public.casino_entries
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);