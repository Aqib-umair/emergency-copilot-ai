-- Emergency Copilot AI - Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: patient_cases
-- Stores the base patient profile for an emergency case (since there is no login, we rely on a generated session/case ID).
CREATE TABLE patient_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL, -- Ties the case to a local browser session
    patient_name VARCHAR(255),
    age INTEGER,
    gender VARCHAR(50),
    language_code VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: medical_history
-- Stores prior conditions, allergies, and medications.
CREATE TABLE medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES patient_cases(id) ON DELETE CASCADE,
    conditions TEXT,
    allergies TEXT,
    medications TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: emergency_reports
-- Stores the details of the emergency, user's input, and the AI's response.
CREATE TABLE emergency_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES patient_cases(id) ON DELETE CASCADE,
    symptoms_text TEXT,
    urgency_level VARCHAR(50), -- e.g., 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    confidence_score NUMERIC(5, 2),
    ai_summary TEXT,
    first_aid_guidance TEXT,
    next_steps TEXT,
    timeline JSONB, -- stores an array of timeline steps
    hospital_data JSONB, -- stores recommended/selected hospital details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: care_circle
-- Stores trusted contacts to share emergency reports with.
CREATE TABLE care_circle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL, -- tied to the local session
    contact_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    relationship VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: language_preferences
-- Tracks language choices, if we need to store them persistently on the server.
CREATE TABLE language_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID UNIQUE NOT NULL,
    language_code VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: settings
-- For any app-wide or session-specific feature toggles.
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS (Row Level Security) - Since there is no auth, we can configure RLS to allow anon inserts
-- but strictly control select based on session_id if needed, or keep it open for the MVP.
-- For production without auth, ensure endpoints validate session_ids.
ALTER TABLE patient_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert to patient_cases" ON patient_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select to patient_cases" ON patient_cases FOR SELECT USING (true);
CREATE POLICY "Allow anon update to patient_cases" ON patient_cases FOR UPDATE USING (true);

ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert to medical_history" ON medical_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select to medical_history" ON medical_history FOR SELECT USING (true);
CREATE POLICY "Allow anon update to medical_history" ON medical_history FOR UPDATE USING (true);

ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert to emergency_reports" ON emergency_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select to emergency_reports" ON emergency_reports FOR SELECT USING (true);
CREATE POLICY "Allow anon update to emergency_reports" ON emergency_reports FOR UPDATE USING (true);

ALTER TABLE care_circle ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert to care_circle" ON care_circle FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select to care_circle" ON care_circle FOR SELECT USING (true);
CREATE POLICY "Allow anon update to care_circle" ON care_circle FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete to care_circle" ON care_circle FOR DELETE USING (true);

ALTER TABLE language_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert to language_preferences" ON language_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select to language_preferences" ON language_preferences FOR SELECT USING (true);
CREATE POLICY "Allow anon update to language_preferences" ON language_preferences FOR UPDATE USING (true);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert to settings" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select to settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow anon update to settings" ON settings FOR UPDATE USING (true);
