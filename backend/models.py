from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20))
    user_type = db.Column(db.String(20), default='free')
    subscription_status = db.Column(db.String(20), default='active')
    subscription_start_date = db.Column(db.Date)
    subscription_end_date = db.Column(db.Date)
    account_created_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    profile_image_url = db.Column(db.String(500))
    profile_image_thumbnail = db.Column(db.String(500))
    profile_image_upload_date = db.Column(db.DateTime)
    profile_image_filename = db.Column(db.String(255))
    referral_code = db.Column(db.String(20), unique=True)
    first_time_user = db.Column(db.Boolean, default=True)  # Track first-time onboarding status
    
    # User preferences for recommendations
    property_type_preferences = db.Column(db.JSON)  # Array of preferred property types
    location_preferences = db.Column(db.JSON)  # Array of preferred locations
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Property(db.Model):
    __tablename__ = 'properties'
    
    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    property_type = db.Column(db.String(50), nullable=False)
    address = db.Column(db.String(500), nullable=False)
    street_address = db.Column(db.String(255))
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    zip_code = db.Column(db.String(20), nullable=False)
    size_sqft = db.Column(db.Numeric(10, 2), nullable=False)
    floors = db.Column(db.Integer)
    year_built = db.Column(db.Integer)
    zoning = db.Column(db.String(100))
    parking_spaces = db.Column(db.Integer)
    asking_price = db.Column(db.Numeric(12, 2), nullable=False)
    price_type = db.Column(db.String(20), default='sale')
    status = db.Column(db.String(20), default='active')
    latitude = db.Column(db.Numeric(10, 8))
    longitude = db.Column(db.Numeric(11, 8))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    agent = db.relationship('User', backref='properties')
    amenities = db.relationship('PropertyAmenity', backref='property', lazy='dynamic')
    images = db.relationship('PropertyImage', backref='property', lazy='dynamic')

class AgentProfile(db.Model):
    __tablename__ = 'agent_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    license_number = db.Column(db.String(50))
    company_name = db.Column(db.String(255))
    company_phone = db.Column(db.String(20))
    company_email = db.Column(db.String(255))
    license_picture_url = db.Column(db.String(500))
    years_experience = db.Column(db.Integer)
    specializations = db.Column(db.JSON)  # Array of specializations
    bio = db.Column(db.Text)
    contact_preferences = db.Column(db.JSON)  # Array of contact preferences
    
    # Relationships
    user = db.relationship('User', backref='agent_profile')
    
    # Track first-time agent onboarding status
    first_time_agent = db.Column(db.Boolean, default=True)

class Region(db.Model):
    __tablename__ = 'regions'
    
    id = db.Column(db.Integer, primary_key=True)
    district = db.Column(db.String(10), nullable=False)
    sector = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AgentRegion(db.Model):
    __tablename__ = 'agent_regions'
    
    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    region_name = db.Column(db.String(100), nullable=False)
    region_type = db.Column(db.String(20), nullable=False)  # 'city', 'district', 'postal_code'
    region_value = db.Column(db.String(100), nullable=False)
    
    # Relationships
    agent = db.relationship('User', backref='agent_regions')

class BusinessInquiry(db.Model):
    __tablename__ = 'business_inquiries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    inquiry_type = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='new')
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='inquiries')
    assigned_agent = db.relationship('User', foreign_keys=[assigned_to], backref='assigned_inquiries')

class PropertyView(db.Model):
    __tablename__ = 'property_views'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Can be anonymous
    ip_address = db.Column(db.String(45))  # Store IP for anonymous tracking
    user_agent = db.Column(db.Text)  # Browser/device info
    viewed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    property = db.relationship('Property', backref='views')
    user = db.relationship('User', backref='viewed_properties')

class PropertyAmenity(db.Model):
    __tablename__ = 'property_amenities'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    amenity_name = db.Column(db.String(100), nullable=False)
    has_amenity = db.Column(db.Boolean, default=False)

class PropertyImage(db.Model):
    __tablename__ = 'property_images'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    image_name = db.Column(db.String(255))
    is_primary = db.Column(db.Boolean, default=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)

class PricePrediction(db.Model):
    __tablename__ = 'price_predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    property_address = db.Column(db.String(500), nullable=False)
    property_type = db.Column(db.String(100), nullable=False)
    size_sqft = db.Column(db.Numeric(10, 2), nullable=False)
    predicted_price = db.Column(db.Numeric(12, 2), nullable=False)
    confidence_score = db.Column(db.Numeric(5, 2))
    prediction_date = db.Column(db.DateTime, default=datetime.utcnow)
    search_parameters = db.Column(db.JSON)
    
    # Relationships
    user = db.relationship('User', backref='price_predictions')

class FAQSection(db.Model):
    __tablename__ = 'faq_section'
    
    id = db.Column(db.Integer, primary_key=True)
    section_title = db.Column(db.String(255), nullable=False, default='Frequently Asked Questions')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

class FAQEntry(db.Model):
    __tablename__ = 'faq_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100))
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

class ContentSection(db.Model):
    __tablename__ = 'content_sections'
    
    id = db.Column(db.Integer, primary_key=True)
    section_name = db.Column(db.String(100), unique=True, nullable=False)
    section_type = db.Column(db.String(20), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    versions = db.relationship('ContentVersion', backref='section', lazy='dynamic')

class ContentVersion(db.Model):
    __tablename__ = 'content_versions'
    
    id = db.Column(db.Integer, primary_key=True)
    section_id = db.Column(db.Integer, db.ForeignKey('content_sections.id'), nullable=False)
    content_data = db.Column(db.JSON, nullable=False)
    version_number = db.Column(db.Integer, nullable=False)
    is_published = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    published_at = db.Column(db.DateTime)
    
    # Relationships
    creator = db.relationship('User', backref='content_versions')

class Bookmark(db.Model):
    __tablename__ = 'bookmarks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    bookmark_type = db.Column(db.String(20), nullable=False)  # 'property', 'prediction', 'comparison'
    reference_id = db.Column(db.Integer, nullable=False)  # ID in the referenced table
    
    # Primary property details (for all bookmark types)
    address = db.Column(db.String(500))  # Store the actual address for easy access
    floor_area = db.Column(db.Numeric(10, 2))  # Floor area in sq ft
    level = db.Column(db.String(50))  # Floor level (e.g., "Ground Floor", "Level 3")
    unit_number = db.Column(db.String(50))  # Unit number (e.g., "A-01", "B-15")
    property_type = db.Column(db.String(100))  # Property type (e.g., "Industrial", "Office")
    
    # Secondary property details (for comparison bookmarks only)
    address_2 = db.Column(db.String(500))  # Second property address for comparisons
    floor_area_2 = db.Column(db.Numeric(10, 2))  # Second property floor area
    level_2 = db.Column(db.String(50))  # Second property level
    unit_number_2 = db.Column(db.String(50))  # Second property unit number
    property_type_2 = db.Column(db.String(100))  # Second property type
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='bookmarks')

class TeamSection(db.Model):
    __tablename__ = 'team_section'
    
    id = db.Column(db.Integer, primary_key=True, default=1)
    section_title = db.Column(db.String(255), nullable=False, default='Our Team')
    section_subtitle = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TeamMember(db.Model):
    __tablename__ = 'team_members'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(500))
    social_links = db.Column(db.JSON)
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LegalContent(db.Model):
    __tablename__ = 'legal_content'
    
    id = db.Column(db.Integer, primary_key=True)
    content_type = db.Column(db.String(50), nullable=False)  # 'disclaimer', 'privacy_policy', 'terms_of_use'
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    version = db.Column(db.String(20), default='1.0')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SubscriptionPlan(db.Model):
    __tablename__ = 'subscription_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    plan_name = db.Column(db.String(100), nullable=False)
    plan_type = db.Column(db.String(20), nullable=False)  # 'free', 'premium', 'agent'
    monthly_price = db.Column(db.Numeric(10, 2), default=0.00)
    yearly_price = db.Column(db.Numeric(10, 2), default=0.00)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    is_popular = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with features
    features = db.relationship('SubscriptionPlanFeature', backref='plan', lazy=True, cascade='all, delete-orphan')

class SubscriptionPlanFeature(db.Model):
    __tablename__ = 'subscription_plan_features'
    
    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey('subscription_plans.id'), nullable=False)
    feature_name = db.Column(db.String(255), nullable=False)
    feature_description = db.Column(db.Text)
    is_included = db.Column(db.Boolean, default=True)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ImportantFeature(db.Model):
    __tablename__ = 'important_features'
    
    id = db.Column(db.Integer, primary_key=True)
    feature_name = db.Column(db.String(255), nullable=False)
    feature_description = db.Column(db.Text)
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
