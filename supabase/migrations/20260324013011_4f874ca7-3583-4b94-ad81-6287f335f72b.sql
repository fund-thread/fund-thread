CREATE TABLE public.trade_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_id UUID NOT NULL REFERENCES public.identities(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('risk_control', 'entry_rules', 'exit_rules', 'position_sizing', 'general')),
  content TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notes" ON public.trade_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.trade_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.trade_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.trade_notes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_trade_notes_updated_at BEFORE UPDATE ON public.trade_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();