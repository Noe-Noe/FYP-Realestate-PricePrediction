-- Create database (run this separately if needed)
-- CREATE DATABASE fyp_app;

-- Users table (main user accounts)
-- Includes user preferences for property recommendations
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    user_type VARCHAR(20) CHECK (user_type IN ('free', 'premium', 'agent', 'admin')) DEFAULT 'free',
    subscription_status VARCHAR(20) CHECK (subscription_status IN ('active', 'inactive', 'cancelled')) DEFAULT 'active',
    subscription_start_date DATE,
    subscription_end_date DATE,
    account_created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    profile_image_url VARCHAR(500) NULL,
    profile_image_thumbnail VARCHAR(500) NULL,
    profile_image_upload_date TIMESTAMP NULL,
    profile_image_filename VARCHAR(255) NULL,
    referral_code VARCHAR(50) NULL,
    first_time_user BOOLEAN DEFAULT TRUE,
    property_type_preferences JSONB DEFAULT '[]'::jsonb, -- Array of preferred property types for recommendations
    location_preferences JSONB DEFAULT '[]'::jsonb -- Array of preferred locations for recommendations
);

-- User subscriptions
CREATE TABLE user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan_type VARCHAR(20) CHECK (plan_type IN ('free', 'premium')) NOT NULL,
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly')) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Properties table (without PostGIS geometry for now)
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    property_type VARCHAR(50) CHECK (property_type IN ('Office', 'Retail', 'Shop House', 'Single-user Factory', 'Multiple-user Factory', 'Warehouse', 'Business Parks', 'office', 'industrial', 'retail', 'warehouse', 'land', 'mixed-use')) NOT NULL,
    address VARCHAR(500) NOT NULL,
    street_address VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    size_sqft DECIMAL(10,2) NOT NULL,
    floors INTEGER,
    year_built INTEGER,
    zoning VARCHAR(100),
    parking_spaces INTEGER,
    asking_price DECIMAL(12,2) NOT NULL,
    price_type VARCHAR(20) CHECK (price_type IN ('sale', 'rental')) DEFAULT 'sale',
    status VARCHAR(20) CHECK (status IN ('active', 'pending', 'sold', 'under-contract')) DEFAULT 'active',
    latitude DECIMAL(10,8), -- Regular decimal for coordinates
    longitude DECIMAL(11,8), -- Regular decimal for coordinates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- Property amenities
CREATE TABLE property_amenities (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL,
    amenity_name VARCHAR(100) NOT NULL,
    has_amenity BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Property images
CREATE TABLE property_images (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_name VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Price predictions
CREATE TABLE price_predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    property_address VARCHAR(500) NOT NULL,
    property_type VARCHAR(100) NOT NULL,
    size_sqft DECIMAL(10,2) NOT NULL,
    predicted_price DECIMAL(12,2) NOT NULL,
    confidence_score DECIMAL(5,2),
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    search_parameters JSONB,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Property comparisons
CREATE TABLE property_comparisons (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    comparison_name VARCHAR(255),
    properties_data JSONB NOT NULL,
    comparison_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Market analytics
CREATE TABLE market_analytics (
    id SERIAL PRIMARY KEY,
    property_type VARCHAR(100) NOT NULL,
    location_area VARCHAR(100) NOT NULL,
    average_price_per_sqft DECIMAL(8,2) NOT NULL,
    total_listings INTEGER NOT NULL,
    days_on_market_avg INTEGER,
    price_trend VARCHAR(20) CHECK (price_trend IN ('increasing', 'decreasing', 'stable')),
    analysis_date DATE NOT NULL
);

-- Bookmarks
CREATE TABLE bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    bookmark_type VARCHAR(20) CHECK (bookmark_type IN ('property', 'prediction', 'comparison')) NOT NULL,
    address VARCHAR(500) NOT NULL,
    reference_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Property views tracking
CREATE TABLE property_views (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL,
    user_id INTEGER NULL,  -- Can be NULL for anonymous views
    ip_address VARCHAR(45),  -- Store IP for anonymous tracking
    user_agent TEXT,  -- Browser/device info
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- User feedback/reviews
CREATE TABLE user_reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    review_type VARCHAR(20) CHECK (review_type IN ('platform', 'property', 'agent')) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Review interactions (likes/dislikes)
CREATE TABLE review_interactions (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    interaction_type VARCHAR(20) CHECK (interaction_type IN ('like', 'dislike')) NOT NULL,
    interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (review_id, user_id),
    FOREIGN KEY (review_id) REFERENCES user_reviews(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Content sections
CREATE TABLE content_sections (
    id SERIAL PRIMARY KEY,
    section_name VARCHAR(100) UNIQUE NOT NULL,
    section_type VARCHAR(20) CHECK (section_type IN ('hero', 'explore', 'features', 'reviews', 'subscription', 'faq', 'team', 'contact', 'disclaimer', 'legal', 'privacy')) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content versions
CREATE TABLE content_versions (
    id SERIAL PRIMARY KEY,
    section_id INTEGER NOT NULL,
    content_data JSONB NOT NULL,
    version_number INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    FOREIGN KEY (section_id) REFERENCES content_sections(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- FAQ section
CREATE TABLE IF NOT EXISTS faq_section (
    id SERIAL PRIMARY KEY,
    section_title VARCHAR(255) NOT NULL DEFAULT 'Frequently Asked Questions',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQ entries
CREATE TABLE faq_entries (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- support contact info
CREATE TABLE IF NOT EXISTS support_contact_info (
    id SERIAL PRIMARY KEY,
    contact_type VARCHAR(50) NOT NULL,
    contact_value VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- legal content
CREATE TABLE IF NOT EXISTS legal_content (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) CHECK (content_type IN ('disclaimer', 'privacy_policy', 'terms_of_use')) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent profiles
CREATE TABLE agent_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    license_number VARCHAR(100),
    company_name VARCHAR(255),
    company_phone VARCHAR(20),
    company_email VARCHAR(255),
    license_picture_url VARCHAR(500),
    years_experience INTEGER,
    specializations JSONB,
    bio TEXT,
    contact_preferences JSONB,
    first_time_agent BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Comments for first-time user tracking
COMMENT ON COLUMN users.first_time_user IS 'Indicates if user has completed first-time onboarding (TRUE = needs onboarding, FALSE = completed)';
COMMENT ON COLUMN users.referral_code IS 'Unique referral code for user tracking and rewards system';
COMMENT ON COLUMN agent_profiles.first_time_agent IS 'Indicates if agent has completed first-time region selection (TRUE = needs setup, FALSE = completed)';
COMMENT ON COLUMN agent_profiles.company_phone IS 'Company phone number for agent contact information';
COMMENT ON COLUMN agent_profiles.company_email IS 'Company email address for agent contact information';
COMMENT ON COLUMN agent_profiles.license_picture_url IS 'URL to uploaded CEA license picture/document';
COMMENT ON COLUMN bookmarks.address IS 'The property address being bookmarked (used for duplicate prevention and user identification)';
COMMENT ON TABLE property_views IS 'Tracks property listing views for analytics and agent dashboard statistics';
COMMENT ON COLUMN property_views.user_id IS 'User ID if logged in, NULL for anonymous views';
COMMENT ON COLUMN property_views.ip_address IS 'IP address for anonymous view tracking';
COMMENT ON COLUMN property_views.viewed_at IS 'Timestamp when the property was viewed';

-- Agent regions
CREATE TABLE agent_regions (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL,
    region_name VARCHAR(100) NOT NULL,
    region_type VARCHAR(20) CHECK (region_type IN ('city', 'district', 'postal_code')) NOT NULL,
    region_value VARCHAR(100) NOT NULL,
    FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- Business inquiries
CREATE TABLE business_inquiries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    inquiry_type VARCHAR(20) CHECK (inquiry_type IN ('property_viewing', 'price_quote', 'general', 'support')) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')) DEFAULT 'new',
    assigned_to INTEGER NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS hero_content (
    id SERIAL PRIMARY KEY,
    section_name VARCHAR(100) UNIQUE NOT NULL,
    headline TEXT NOT NULL,
    subheading TEXT NOT NULL,
    hero_background_url VARCHAR(500),
    marketing_video_url VARCHAR(500),
    button_text VARCHAR(100) NOT NULL,
    button_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE IF NOT EXISTS howitworks_properties (
    id SERIAL PRIMARY KEY,
    property_order INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    level VARCHAR(100),
    unit_area VARCHAR(100),
    property_type VARCHAR(100) NOT NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS features_section (
    id INTEGER PRIMARY KEY DEFAULT 1,
    section_title VARCHAR(255) NOT NULL DEFAULT 'How it Works',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS features_steps (
    id SERIAL PRIMARY KEY,
    step_number INTEGER NOT NULL,
    step_title VARCHAR(255) NOT NULL,
    step_description TEXT NOT NULL,
    step_image VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_section (
    id INTEGER PRIMARY KEY DEFAULT 1,
    section_title VARCHAR(255) NOT NULL DEFAULT 'Our Team',
    section_subtitle TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500), -- Stores file path to uploaded image in backend/admin/team/
    social_links JSONB,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System logs
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    log_level VARCHAR(20) CHECK (log_level IN ('info', 'warning', 'error', 'critical')) NOT NULL,
    log_message TEXT NOT NULL,
    user_id INTEGER NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Subscription Plans
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(20) CHECK (plan_type IN ('free', 'premium', 'agent')) NOT NULL,
    monthly_price DECIMAL(10,2) DEFAULT 0.00,
    yearly_price DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Plan Features
CREATE TABLE subscription_plan_features (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    feature_description TEXT,
    is_included BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
);

-- Important Features for Comparison
CREATE TABLE important_features (
    id SERIAL PRIMARY KEY,
    feature_name VARCHAR(255) NOT NULL,
    feature_description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Data backup logs
CREATE TABLE backup_logs (
    id SERIAL PRIMARY KEY,
    backup_type VARCHAR(20) CHECK (backup_type IN ('full', 'incremental', 'user_data', 'content')) NOT NULL,
    backup_size_mb DECIMAL(10,2),
    backup_status VARCHAR(20) CHECK (backup_status IN ('success', 'failed', 'in_progress')) NOT NULL,
    backup_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);

-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_profile_image ON users(profile_image_url);
CREATE INDEX idx_users_first_time ON users(first_time_user);
CREATE INDEX idx_properties_agent_id ON properties(agent_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties(city, state);
CREATE INDEX idx_price_predictions_user_id ON price_predictions(user_id);
CREATE INDEX idx_bookmarks_user_type ON bookmarks(user_id, bookmark_type);
CREATE INDEX idx_agent_profiles_first_time ON agent_profiles(first_time_agent);

-- Property views indexes for performance
CREATE INDEX idx_property_views_property_id ON property_views(property_id);
CREATE INDEX idx_property_views_user_id ON property_views(user_id);
CREATE INDEX idx_property_views_viewed_at ON property_views(viewed_at);
CREATE INDEX idx_property_views_property_user ON property_views(property_id, user_id);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to tables that need it
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_entries_updated_at BEFORE UPDATE ON faq_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_inquiries_updated_at BEFORE UPDATE ON business_inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update team_members.image_url to TEXT to support base64 data URLs
ALTER TABLE team_members ALTER COLUMN image_url TYPE TEXT;
