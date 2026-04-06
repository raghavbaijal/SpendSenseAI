-- Create a table for budgets
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  -- Ensure each user only has one budget per category
  UNIQUE(user_id, category)
);

-- Enable Row Level Security (RLS)
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own budgets
CREATE POLICY "Users can view their own budgets" 
ON budgets FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own budgets
CREATE POLICY "Users can insert their own budgets" 
ON budgets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own budgets
CREATE POLICY "Users can update their own budgets" 
ON budgets FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can delete their own budgets
CREATE POLICY "Users can delete their own budgets" 
ON budgets FOR DELETE 
USING (auth.uid() = user_id);
