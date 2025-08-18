-- Create reports table for water installation reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Add RLS (Row Level Security) policy to allow all operations for now
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later if needed)
CREATE POLICY "Allow all operations on reports" ON reports
  FOR ALL USING (true);
