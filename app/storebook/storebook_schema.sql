-- ==========================================
-- Storebook Supabase Schema Definition
-- ==========================================

-- 1. Transactions Table
CREATE TABLE IF NOT EXISTS storebook_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_month VARCHAR(7) NOT NULL, -- e.g. '2026-07'
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast query by year_month
CREATE INDEX IF NOT EXISTS idx_storebook_tx_ym ON storebook_transactions(year_month);

-- 2. Monthly Summaries (Carry-over Balance) Table
CREATE TABLE IF NOT EXISTS storebook_monthly_summaries (
    year_month VARCHAR(7) PRIMARY KEY, -- e.g. '2026-07'
    carry_over NUMERIC(15, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Custom Categories Table
CREATE TABLE IF NOT EXISTS storebook_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    value VARCHAR(100) NOT NULL,
    label VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initial Demo Categories Seed Data
INSERT INTO storebook_categories (type, value, label) VALUES
('income', '급여', '급여 💰'),
('income', '지원금', '지원금 🎁'),
('income', '투자/부업', '투자/부업 📈'),
('income', '기타', '기타 수입 🪙'),
('expense', '쇼핑/카드', '쇼핑/카드 💳'),
('expense', '주거/월세', '주거/월세 🏠'),
('expense', '보험/세금', '보험/세금 🛡️'),
('expense', '식비', '식비 🍔'),
('expense', '교통', '교통 🚗'),
('expense', '생활비', '생활비/기타 🛒')
ON CONFLICT DO NOTHING;

-- Initial Demo Monthly Carry-over & Transactions
INSERT INTO storebook_monthly_summaries (year_month, carry_over) VALUES
('2026-07', 560000)
ON CONFLICT (year_month) DO NOTHING;

INSERT INTO storebook_transactions (year_month, type, name, amount, category, is_recurring, date) VALUES
('2026-07', 'income', '월급', 2780000, '급여', TRUE, '2026-07-25'),
('2026-07', 'income', '지원금', 1200000, '지원금', FALSE, '2026-07-10'),
('2026-07', 'expense', '카드', 537460, '쇼핑/카드', FALSE, '2026-07-15'),
('2026-07', 'expense', '보험', 100000, '보험/세금', TRUE, '2026-07-20'),
('2026-07', 'expense', '월세', 450000, '주거/월세', TRUE, '2026-07-01'),
('2026-07', 'expense', '최저한도 맞추기', 440000, '생활비', FALSE, '2026-07-05')
ON CONFLICT DO NOTHING;
