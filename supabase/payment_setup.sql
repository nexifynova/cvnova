-- 1. Payments Table Create Karein
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    user_email TEXT NOT NULL,
    package_type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT,
    slip_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Enable karein
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users apni payments dekh sakte hain aur add kar sakte hain
CREATE POLICY "Users can insert their own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);

-- Admin sab kuch dekh aur update kar sakta hai (Assuming aapne admin ka role set kiya hua hai, agar nahi to abhi ke liye service_role_key use karein)
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Admins can update all payments" ON public.payments FOR UPDATE USING (true);

-- 2. Storage Bucket Create Karein (Agar pehle se nahi hai)
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-slips', 'payment-slips', true) ON CONFLICT DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'payment-slips');
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-slips' AND auth.role() = 'authenticated');