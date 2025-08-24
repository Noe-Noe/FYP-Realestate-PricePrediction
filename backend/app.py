from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import random
import string
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from flask_mail import Mail, Message
from models import db, User, Property, PricePrediction, FAQEntry, ContentSection, Bookmark
from sqlalchemy import text
import jwt

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-in-production')
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)  # 24 hours

# JWT Helper Functions
def create_access_token(user_id, email, user_type):
    """Create JWT access token"""
    payload = {
        'user_id': user_id,
        'email': email,
        'user_type': user_type,
        'exp': datetime.utcnow() + JWT_ACCESS_TOKEN_EXPIRES
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')

def verify_token(token):
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Authentication Middleware
def require_auth(f):
    """Decorator to require authentication"""
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user info to request
        request.user = payload
        return f(*args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/fyp_app')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

# Initialize database with app
db.init_app(app)

# Gmail SMTP Configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'bearmeh00@gmail.com'  # ← Change this to your Gmail
app.config['MAIL_PASSWORD'] = 'tuei rmyg tfqq szai'     # ← Change this to your 16-char app password

# Initialize Flask-Mail
mail = Mail(app)

# Basic route to test if server is running
@app.route('/')
def home():
    return jsonify({'message': 'FYP App Backend is running!'})

# Health check route
@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'message': 'Server is running'})

# Database check route
@app.route('/api/db/check')
def check_database():
    """Check what tables exist in the database"""
    try:
        # Get list of tables
        query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        result = db.session.execute(query)
        tables = [row[0] for row in result]
        
        return jsonify({
            'status': 'success',
            'tables': tables,
            'message': f'Found {len(tables)} tables in database'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'message': 'Failed to check database'
        }), 500

# Create missing tables route
@app.route('/api/db/setup', methods=['POST'])
def setup_database():
    """Create missing tables if they don't exist"""
    try:
        # Create user_reviews table if it doesn't exist
        create_reviews_table = text("""
            CREATE TABLE IF NOT EXISTS user_reviews (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                review_type VARCHAR(20) CHECK (review_type IN ('platform', 'property', 'agent')) NOT NULL,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                review_text TEXT,
                review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_verified BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Create review_interactions table if it doesn't exist
        create_interactions_table = text("""
            CREATE TABLE IF NOT EXISTS review_interactions (
                id SERIAL PRIMARY KEY,
                review_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                interaction_type VARCHAR(20) CHECK (interaction_type IN ('like', 'dislike')) NOT NULL,
                interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (review_id, user_id),
                FOREIGN KEY (review_id) REFERENCES user_reviews(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        db.session.execute(create_reviews_table)
        db.session.execute(create_interactions_table)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Database tables created successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'error': str(e),
            'message': 'Failed to create database tables'
        }), 500

# Note: Sample data routes removed - system now uses real database data

# Test feedback submission without authentication (for debugging)
@app.route('/api/feedback/test-submit', methods=['POST'])
def test_submit_feedback():
    """Test feedback submission without authentication"""
    try:
        data = request.get_json()
        
        if not data or not data.get('rating') or not data.get('review_text'):
            return jsonify({'error': 'Rating and review text are required'}), 400
        
        # Get the first user from the database for testing
        user = User.query.first()
        if not user:
            return jsonify({'error': 'No users found in database'}), 400
        
        # Create new review
        new_review = {
            'user_id': user.id,
            'review_type': data.get('review_type', 'platform'),
            'rating': data['rating'],
            'review_text': data['review_text'],
            'review_date': datetime.utcnow(),
            'is_verified': False
        }
        
        # Insert into database
        query = text("""
            INSERT INTO user_reviews (user_id, review_type, rating, review_text, review_date, is_verified)
            VALUES (:user_id, :review_type, :rating, :review_text, :review_date, :is_verified)
            RETURNING id
        """)
        
        result = db.session.execute(query, new_review)
        review_id = result.fetchone()[0]
        db.session.commit()
        
        return jsonify({
            'message': 'Test feedback submitted successfully!',
            'review_id': review_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error submitting test feedback: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to submit test feedback: {str(e)}'}), 500

# Example API route
@app.route('/api/test')
def test_api():
    return jsonify({'message': 'API is working!'})

# User registration
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('full_name'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'User already exists'}), 409
    
    # Create new user
    user = User(
        email=data['email'],
        full_name=data['full_name'],
        phone_number=data.get('phone_number'),
        user_type=data.get('user_type', 'free')
    )
    user.set_password(data['password'])
    
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({
            'message': 'User created successfully',
            'user_id': user.id,
            'email': user.email,
            'full_name': user.full_name
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create user'}), 500

# User login
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if user and user.check_password(data['password']):
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create JWT token
        access_token = create_access_token(user.id, user.email, user.user_type)
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': {
                'user_id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'user_type': user.user_type
            }
        }), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

# Email verification storage (in production, use Redis or database)
email_verification_codes = {}

# Password reset storage (in production, use Redis or database)
password_reset_codes = {}

# Generate OTP code
def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

# Send OTP to email using Gmail SMTP
def send_otp_email(email, otp):
    try:
        msg = Message(
            'Your FYP App Verification Code',
            sender='bearmeh00@gmail.com',  # ← Now matches your MAIL_USERNAME
            recipients=[email]
        )
        msg.body = f'Your verification code is: {otp}'
        mail.send(msg)
        print(f"📧 Email sent successfully to {email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False

# Request email verification
@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    
    if not data or not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400
    
    email = data['email']
    
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User already exists with this email'}), 409
    
    # Generate OTP
    otp = generate_otp()
    
    # Store OTP with expiration (5 minutes)
    email_verification_codes[email] = {
        'otp': otp,
        'expires_at': datetime.utcnow() + timedelta(minutes=5),
        'attempts': 0
    }
    
    # Send OTP (mock)
    if send_otp_email(email, otp):
        return jsonify({
            'message': 'OTP sent successfully',
            'email': email
        }), 200
    else:
        return jsonify({'error': 'Failed to send OTP'}), 500

# Verify OTP
@app.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('otp'):
        return jsonify({'error': 'Email and OTP are required'}), 400
    
    email = data['email']
    otp = data['otp']
    
    # Check if OTP exists and is valid
    if email not in email_verification_codes:
        return jsonify({'error': 'No OTP requested for this email'}), 400
    
    verification_data = email_verification_codes[email]
    
    # Check if OTP is expired
    if datetime.utcnow() > verification_data['expires_at']:
        del email_verification_codes[email]
        return jsonify({'error': 'OTP has expired'}), 400
    
    # Check if too many attempts
    if verification_data['attempts'] >= 3:
        del email_verification_codes[email]
        return jsonify({'error': 'Too many failed attempts. Please request a new OTP'}), 400
    
    # Check if OTP matches
    if verification_data['otp'] != otp:
        verification_data['attempts'] += 1
        return jsonify({'error': 'Invalid OTP'}), 400
    
    # OTP is valid - mark email as verified
    verification_data['verified'] = True
    verification_data['verified_at'] = datetime.utcnow()
    
    return jsonify({
        'message': 'Email verified successfully',
        'email': email
    }), 200

# Get all properties
@app.route('/api/properties', methods=['GET'])
def get_properties():
    try:
        properties = Property.query.filter_by(status='active').all()
        property_list = []
        
        for prop in properties:
            property_data = {
                'id': prop.id,
                'title': prop.title,
                'description': prop.description,
                'property_type': prop.property_type,
                'address': prop.address,
                'city': prop.city,
                'state': prop.state,
                'zip_code': prop.zip_code,
                'size_sqft': float(prop.size_sqft),
                'asking_price': float(prop.asking_price),
                'price_type': prop.price_type,
                'status': prop.status,
                'latitude': float(prop.latitude) if prop.latitude else None,
                'longitude': float(prop.longitude) if prop.longitude else None,
                'created_at': prop.created_at.isoformat() if prop.created_at else None
            }
            property_list.append(property_data)
        
        return jsonify({'properties': property_list}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch properties'}), 500

# Get property by ID
@app.route('/api/properties/<int:property_id>', methods=['GET'])
def get_property(property_id):
    try:
        property = Property.query.get_or_404(property_id)
        
        property_data = {
            'id': property.id,
            'title': property.title,
            'description': property.description,
            'property_type': property.property_type,
            'address': property.address,
            'street_address': property.street_address,
            'city': property.city,
            'state': property.state,
            'zip_code': property.zip_code,
            'size_sqft': float(property.size_sqft),
            'floors': property.floors,
            'year_built': property.year_built,
            'zoning': property.zoning,
            'parking_spaces': property.parking_spaces,
            'asking_price': float(property.asking_price),
            'price_type': property.price_type,
            'status': property.status,
            'latitude': float(property.latitude) if property.latitude else None,
            'longitude': float(property.longitude) if property.longitude else None,
            'created_at': property.created_at.isoformat() if property.created_at else None,
            'updated_at': property.updated_at.isoformat() if property.updated_at else None
        }
        
        return jsonify(property_data), 200
    except Exception as e:
        return jsonify({'error': 'Property not found'}), 404

# Get FAQ entries
@app.route('/api/faq', methods=['GET'])
def get_faq():
    try:
        faq_entries = FAQEntry.query.filter_by(is_active=True).order_by(FAQEntry.display_order).all()
        faq_list = []
        
        for entry in faq_entries:
            faq_data = {
                'id': entry.id,
                'question': entry.question,
                'answer': entry.answer,
                'category': entry.category,
                'display_order': entry.display_order
            }
            faq_list.append(faq_data)
        
        return jsonify({'faq_entries': faq_list}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch FAQ'}), 500

# Password recovery - Send OTP
@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    
    if not data or not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400
    
    email = data['email']
    user = User.query.filter_by(email=email).first()
    
    if not user:
        # Don't reveal if user exists or not for security
        return jsonify({'message': 'If the email exists, a recovery code has been sent'}), 200
    
    # Generate OTP for password recovery
    otp = generate_otp()
    
    # Store OTP with expiration (5 minutes)
    password_reset_codes[email] = {
        'otp': otp,
        'expires_at': datetime.utcnow() + timedelta(minutes=5),
        'attempts': 0
    }
    
    try:
        # Send recovery email
        msg = Message(
            subject='Password Recovery - Valuez',
            sender='bearmeh00@gmail.com',
            recipients=[email]
        )
        msg.body = f'''Hello {user.full_name},

You have requested to reset your password for your Valuez account.

Your recovery code is: {otp}

This code will expire in 5 minutes.

If you did not request this password reset, please ignore this email.

Best regards,
Valuez Team'''
        
        mail.send(msg)
        
        return jsonify({'message': 'Recovery code sent successfully'}), 200
        
    except Exception as e:
        # Remove the stored OTP if email fails
        if email in password_reset_codes:
            del password_reset_codes[email]
        return jsonify({'error': 'Failed to send recovery email'}), 500

# Get user profile
@app.route('/api/auth/profile', methods=['GET'])
@require_auth
def get_profile():
    # Get user from authenticated token
    user_id = request.user['user_id']
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'phone_number': user.phone_number,
        'user_type': user.user_type,
        'subscription_status': user.subscription_status,
        'subscription_start_date': user.subscription_start_date.isoformat() if user.subscription_start_date else None,
        'account_created_date': user.account_created_date.isoformat() if user.account_created_date else None,
        'last_login': user.last_login.isoformat() if user.last_login else None,
        'is_active': user.is_active
    }), 200

# Get user properties and recommendations
@app.route('/api/user/properties', methods=['GET'])
@require_auth
def get_user_properties():
    """Get properties for user dashboard with recommendations"""
    try:
        # Get properties from database (you can add filtering logic here)
        properties = Property.query.limit(10).all()
        
        # Convert to JSON format
        properties_data = []
        for prop in properties:
            properties_data.append({
                'id': prop.id,
                'title': prop.title or f"{prop.property_type} Property",
                'address': prop.address,
                'price': f"${prop.asking_price:,}" if prop.asking_price else "Price on request",
                'propertyType': prop.property_type,
                'image': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
            })
        
        return jsonify({
            'properties': properties_data,
            'message': 'Properties retrieved successfully'
        }), 200
        
    except Exception as e:
        print(f"Error fetching properties: {e}")
        # Return empty properties if there's an error
        return jsonify({
            'properties': [],
            'message': 'No properties available at the moment'
        }), 200

# Get published user reviews for feedback page
@app.route('/api/feedback/reviews', methods=['GET'])
def get_published_reviews():
    """Get published reviews from user_reviews table"""
    try:
        # User model is already imported at the top
        
        # Get verified/published reviews with user information and real like/dislike counts
        query = text("""
            SELECT 
                ur.id,
                ur.rating,
                ur.review_text,
                ur.review_date,
                ur.review_type,
                ur.admin_response,
                ur.admin_response_date,
                u.full_name,
                u.email,
                COALESCE(ri.likes_count, 0) as likes,
                COALESCE(ri.dislikes_count, 0) as dislikes
            FROM user_reviews ur
            JOIN users u ON ur.user_id = u.id
            LEFT JOIN (
                SELECT 
                    review_id,
                    COUNT(CASE WHEN interaction_type = 'like' THEN 1 END) as likes_count,
                    COUNT(CASE WHEN interaction_type = 'dislike' THEN 1 END) as dislikes_count
                FROM review_interactions
                GROUP BY review_id
            ) ri ON ur.id = ri.review_id
            WHERE ur.is_verified = TRUE
            ORDER BY ur.review_date DESC
            LIMIT 10
        """)
        
        result = db.session.execute(query)
        reviews = []
        
        for row in result:
            # Generate a default avatar based on user's name
            avatar_url = f"https://ui-avatars.com/api/?name={row.full_name}&background=random&size=40"
            
            reviews.append({
                'id': row.id,
                'name': row.full_name,
                'time': format_time_ago(row.review_date),
                'rating': row.rating,
                'text': row.review_text,
                'likes': row.likes,
                'dislikes': row.dislikes,
                'image': avatar_url,
                'review_type': row.review_type,
                'review_date': row.review_date.isoformat() if row.review_date else None,
                'admin_response': row.admin_response,
                'admin_response_date': row.admin_response_date.isoformat() if row.admin_response_date else None
            })
        
        return jsonify({
            'reviews': reviews,
            'message': 'Reviews retrieved successfully'
        }), 200
        
    except Exception as e:
        print(f"Error fetching reviews: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to retrieve reviews: {str(e)}'}), 500

# Submit new user feedback/review
@app.route('/api/feedback/submit', methods=['POST'])
@require_auth
def submit_feedback():
    """Submit new user feedback/review"""
    try:
        data = request.get_json()
        user_id = request.user['user_id']
        
        if not data or not data.get('rating') or not data.get('review_text'):
            return jsonify({'error': 'Rating and review text are required'}), 400
        
        # Create new review
        new_review = {
            'user_id': user_id,
            'review_type': data.get('review_type', 'platform'),
            'rating': data['rating'],
            'review_text': data['review_text'],
            'review_date': datetime.utcnow(),
            'is_verified': False  # Admin needs to verify/publish
        }
        
        # Insert into database
        query = text("""
            INSERT INTO user_reviews (user_id, review_type, rating, review_text, review_date, is_verified)
            VALUES (:user_id, :review_type, :rating, :review_text, :review_date, :is_verified)
            RETURNING id
        """)
        
        result = db.session.execute(query, new_review)
        review_id = result.fetchone()[0]
        db.session.commit()
        
        return jsonify({
            'message': 'Feedback submitted successfully! It will be reviewed by our team before publishing.',
            'review_id': review_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error submitting feedback: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to submit feedback: {str(e)}'}), 500

# Like a review
@app.route('/api/feedback/like', methods=['POST'])
@require_auth
def like_review():
    """Like or unlike a review"""
    try:
        data = request.get_json()
        user_id = request.user['user_id']
        review_id = data.get('review_id')
        
        if not review_id:
            return jsonify({'error': 'Review ID is required'}), 400
        
        # Check if user already liked this review
        check_query = text("""
            SELECT interaction_type FROM review_interactions 
            WHERE user_id = :user_id AND review_id = :review_id
        """)
        
        result = db.session.execute(check_query, {'user_id': user_id, 'review_id': review_id})
        existing_interaction = result.fetchone()
        
        if existing_interaction:
            if existing_interaction[0] == 'like':
                # User already liked, remove the like
                delete_query = text("""
                    DELETE FROM review_interactions 
                    WHERE user_id = :user_id AND review_id = :review_id
                """)
                db.session.execute(delete_query, {'user_id': user_id, 'review_id': review_id})
                action = 'removed'
            else:
                # User disliked, switch to like
                update_query = text("""
                    UPDATE review_interactions 
                    SET interaction_type = 'like', interaction_date = CURRENT_TIMESTAMP
                    WHERE user_id = :user_id AND review_id = :review_id
                """)
                db.session.execute(update_query, {'user_id': user_id, 'review_id': review_id})
                action = 'switched_to_like'
        else:
            # User hasn't interacted, add like
            insert_query = text("""
                INSERT INTO review_interactions (user_id, review_id, interaction_type)
                VALUES (:user_id, :review_id, 'like')
            """)
            db.session.execute(insert_query, {'user_id': user_id, 'review_id': review_id})
            action = 'added'
        
        db.session.commit()
        
        # Get updated counts
        count_query = text("""
            SELECT 
                COUNT(CASE WHEN interaction_type = 'like' THEN 1 END) as likes,
                COUNT(CASE WHEN interaction_type = 'dislike' THEN 1 END) as dislikes
            FROM review_interactions 
            WHERE review_id = :review_id
        """)
        
        count_result = db.session.execute(count_query, {'review_id': review_id})
        counts = count_result.fetchone()
        
        return jsonify({
            'message': f'Like {action} successfully',
            'action': action,
            'likes': counts[0],
            'dislikes': counts[1]
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error handling like: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to handle like: {str(e)}'}), 500

# Dislike a review
@app.route('/api/feedback/dislike', methods=['POST'])
@require_auth
def dislike_review():
    """Dislike or undislike a review"""
    try:
        data = request.get_json()
        user_id = request.user['user_id']
        review_id = data.get('review_id')
        
        if not review_id:
            return jsonify({'error': 'Review ID is required'}), 400
        
        # Check if user already disliked this review
        check_query = text("""
            SELECT interaction_type FROM review_interactions 
            WHERE user_id = :user_id AND review_id = :review_id
        """)
        
        result = db.session.execute(check_query, {'user_id': user_id, 'review_id': review_id})
        existing_interaction = result.fetchone()
        
        if existing_interaction:
            if existing_interaction[0] == 'dislike':
                # User already disliked, remove the dislike
                delete_query = text("""
                    DELETE FROM review_interactions 
                    WHERE user_id = :user_id AND review_id = :review_id
                """)
                db.session.execute(delete_query, {'user_id': user_id, 'review_id': review_id})
                action = 'removed'
            else:
                # User liked, switch to dislike
                update_query = text("""
                    UPDATE review_interactions 
                    SET interaction_type = 'dislike', interaction_date = CURRENT_TIMESTAMP
                    WHERE user_id = :user_id AND review_id = :review_id
                """)
                db.session.execute(update_query, {'user_id': user_id, 'review_id': review_id})
                action = 'switched_to_dislike'
        else:
            # User hasn't interacted, add dislike
            insert_query = text("""
                INSERT INTO review_interactions (user_id, review_id, interaction_type)
                VALUES (:user_id, :review_id, 'dislike')
            """)
            db.session.execute(insert_query, {'user_id': user_id, 'review_id': review_id})
            action = 'added'
        
        db.session.commit()
        
        # Get updated counts
        count_query = text("""
            SELECT 
                COUNT(CASE WHEN interaction_type = 'like' THEN 1 END) as likes,
                COUNT(CASE WHEN interaction_type = 'dislike' THEN 1 END) as dislikes
            FROM review_interactions 
            WHERE review_id = :review_id
        """)
        
        count_result = db.session.execute(count_query, {'review_id': review_id})
        counts = count_result.fetchone()
        
        return jsonify({
            'message': f'Dislike {action} successfully',
            'action': action,
            'likes': counts[0],
            'dislikes': counts[1]
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error handling dislike: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to handle dislike: {str(e)}'}), 500

# Get user's interaction state for reviews
@app.route('/api/feedback/interactions', methods=['GET'])
@require_auth
def get_user_interactions():
    """Get current user's interaction state for all reviews"""
    try:
        user_id = request.user['user_id']
        
        # Get all user interactions
        query = text("""
            SELECT review_id, interaction_type
            FROM review_interactions
            WHERE user_id = :user_id
        """)
        
        result = db.session.execute(query, {'user_id': user_id})
        interactions = {}
        
        for row in result:
            interactions[row.review_id] = row.interaction_type
        
        return jsonify({
            'interactions': interactions,
            'message': 'User interactions retrieved successfully'
        }), 200
        
    except Exception as e:
        print(f"Error fetching user interactions: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to retrieve user interactions: {str(e)}'}), 500

# Get current user's reviews
@app.route('/api/feedback/my-reviews', methods=['GET'])
@require_auth
def get_my_reviews():
    """Get reviews submitted by the current user"""
    try:
        user_id = request.user['user_id']
        print(f"Fetching reviews for user_id: {user_id}")
        
        # First, check if the user_reviews table exists
        try:
            # Simple query to check if table exists
            check_query = text("SELECT COUNT(*) FROM user_reviews LIMIT 1")
            db.session.execute(check_query)
            print("user_reviews table exists")
        except Exception as table_error:
            print(f"Table check error: {table_error}")
            return jsonify({
                'reviews': [],
                'message': 'No reviews table found. Please contact administrator.'
            }), 200
        
        # Get user reviews with real like/dislike counts
        query = text("""
            SELECT 
                ur.id,
                ur.rating,
                ur.review_text,
                ur.review_date,
                ur.review_type,
                ur.is_verified,
                ur.admin_response,
                ur.admin_response_date,
                COALESCE(ri.likes_count, 0) as likes,
                COALESCE(ri.dislikes_count, 0) as dislikes
            FROM user_reviews ur
            LEFT JOIN (
                SELECT 
                    review_id,
                    COUNT(CASE WHEN interaction_type = 'like' THEN 1 END) as likes_count,
                    COUNT(CASE WHEN interaction_type = 'dislike' THEN 1 END) as dislikes_count
                FROM review_interactions
                GROUP BY review_id
            ) ri ON ur.id = ri.review_id
            WHERE ur.user_id = :user_id
            ORDER BY ur.review_date DESC
        """)
        
        print(f"Executing query: {query}")
        result = db.session.execute(query, {'user_id': user_id})
        reviews = []
        
        for row in result:
            reviews.append({
                'id': row.id,
                'time': format_time_ago(row.review_date),
                'rating': row.rating,
                'text': row.review_text,
                'likes': row.likes,
                'dislikes': row.dislikes,
                'is_verified': row.is_verified,
                'review_type': row.review_type,
                'review_date': row.review_date.isoformat() if row.review_date else None,
                'admin_response': row.admin_response,
                'admin_response_date': row.admin_response_date.isoformat() if row.admin_response_date else None
            })
        
        print(f"Found {len(reviews)} reviews for user {user_id}")
        
        return jsonify({
            'reviews': reviews,
            'message': 'User reviews retrieved successfully'
        }), 200
        
    except Exception as e:
        print(f"Error fetching user reviews: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to retrieve user reviews: {str(e)}'}), 500

def format_time_ago(timestamp):
    """Format timestamp to relative time string"""
    if not timestamp:
        return 'Unknown time'
    
    now = datetime.utcnow()
    diff = now - timestamp
    
    if diff.days > 0:
        if diff.days == 1:
            return '1 day ago'
        elif diff.days < 7:
            return f'{diff.days} days ago'
        elif diff.days < 30:
            weeks = diff.days // 7
            return f'{weeks} week{"s" if weeks > 1 else ""} ago'
        else:
            months = diff.days // 30
            return f'{months} month{"s" if months > 1 else ""} ago'
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f'{hours} hour{"s" if hours > 1 else ""} ago'
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f'{minutes} minute{"s" if minutes > 1 else ""} ago'
    else:
        return 'Just now'

# Update user profile
@app.route('/api/auth/profile', methods=['PUT'])
@require_auth
def update_profile():
    data = request.get_json()
    
    # Get user from authenticated token
    user_id = request.user['user_id']
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        # Update allowed fields
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'phone_number' in data:
            user.phone_number = data['phone_number']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'phone_number': user.phone_number,
                'user_type': user.user_type
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile'}), 500

# Change password
@app.route('/api/auth/change-password', methods=['POST'])
@require_auth
def change_password():
    data = request.get_json()
    
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current password and new password are required'}), 400
    
    # Get user from authenticated token
    user_id = request.user['user_id']
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Verify current password
    if not user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 400
    
    try:
        # Set new password
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to change password'}), 500

# Upgrade to Premium
@app.route('/api/auth/upgrade-to-premium', methods=['POST'])
@require_auth
def upgrade_to_premium():
    # Get user from authenticated token
    user_id = request.user['user_id']
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.user_type == 'premium':
        return jsonify({'error': 'User is already premium'}), 400
    
    try:
        # Update user to premium
        user.user_type = 'premium'
        user.subscription_status = 'active'
        user.subscription_start_date = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully upgraded to Premium',
            'user': {
                'id': user.id,
                'email': user.email,
                'user_type': user.user_type,
                'subscription_status': user.subscription_status,
                'subscription_start_date': user.subscription_start_date.isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to upgrade to premium'}), 500

# Downgrade to Free
@app.route('/api/auth/downgrade-to-free', methods=['POST'])
@require_auth
def downgrade_to_free():
    # Get user from authenticated token
    user_id = request.user['user_id']
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.user_type == 'free':
        return jsonify({'error': 'User is already on free plan'}), 400
    
    try:
        # Update user to free
        user.user_type = 'free'
        user.subscription_status = 'inactive'
        user.subscription_start_date = None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully downgraded to Free plan',
            'user': {
                'id': user.id,
                'email': user.email,
                'user_type': user.user_type,
                'subscription_status': user.subscription_status
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to downgrade to free'}), 500

# Delete account
@app.route('/api/auth/deactivate', methods=['POST'])
def delete_account():
    data = request.get_json()
    
    if not data or not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400
    
    email = data['email']
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        # Completely delete user account from database
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete account'}), 500

# Password recovery - Verify OTP and reset password
@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('otp') or not data.get('new_password'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    email = data['email']
    otp = data['otp']
    new_password = data['new_password']
    
    # Check if OTP exists and is valid
    if email not in password_reset_codes:
        return jsonify({'error': 'Invalid or expired recovery code'}), 400
    
    reset_data = password_reset_codes[email]
    
    # Check if OTP has expired
    if datetime.utcnow() > reset_data['expires_at']:
        del password_reset_codes[email]
        return jsonify({'error': 'Recovery code has expired'}), 400
    
    # Check if OTP matches
    if reset_data['otp'] != otp:
        reset_data['attempts'] += 1
        
        # Remove OTP if too many attempts
        if reset_data['attempts'] >= 3:
            del password_reset_codes[email]
            return jsonify({'error': 'Too many failed attempts. Please request a new recovery code'}), 400
        
        return jsonify({'error': 'Invalid recovery code'}), 400
    
    # OTP is valid, reset password
    user = User.query.filter_by(email=email).first()
    if not user:
        del password_reset_codes[email]
        return jsonify({'error': 'User not found'}), 404
    
    try:
        user.set_password(new_password)
        db.session.commit()
        
        # Remove the used OTP
        del password_reset_codes[email]
        
        return jsonify({'message': 'Password reset successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to reset password'}), 500

# Admin Dashboard Endpoints

# Get admin dashboard metrics
@app.route('/api/admin/metrics', methods=['GET'])
@require_auth
def get_admin_metrics():
    try:
        print("Admin metrics endpoint called")
        
        # Get current user to verify admin status
        current_user = request.user
        print(f"Current user: {current_user}")
        
        if current_user['user_type'] != 'admin':
            print(f"User type {current_user['user_type']} is not admin")
            return jsonify({'error': 'Admin access required'}), 403
        
        print("User is admin, proceeding with metrics calculation")
        
        # Count total users
        try:
            total_users = User.query.count()
            print(f"Total users: {total_users}")
        except Exception as e:
            print(f"Error counting total users: {e}")
            total_users = 0
        
        # Count active subscriptions (premium and agent users)
        try:
            active_subscriptions = User.query.filter(
                User.subscription_status == 'active',
                User.user_type.in_(['premium', 'agent'])
            ).count()
            print(f"Active subscriptions: {active_subscriptions}")
        except Exception as e:
            print(f"Error counting active subscriptions: {e}")
            active_subscriptions = 0
        
        # Count total feedback/reviews (handle case where table might not exist)
        try:
            total_feedback = db.session.execute(text('SELECT COUNT(*) FROM user_reviews')).scalar()
            print(f"Total feedback: {total_feedback}")
        except Exception as e:
            print(f"Error counting feedback: {e}")
            total_feedback = 0
        
        # Calculate revenue (mock calculation for now)
        try:
            premium_users = User.query.filter_by(user_type='premium', subscription_status='active').count()
            agent_users = User.query.filter_by(user_type='agent', subscription_status='active').count()
            print(f"Premium users: {premium_users}, Agent users: {agent_users}")
            
            # Mock pricing: Premium $29/month, Agent $99/month
            monthly_revenue = (premium_users * 29) + (agent_users * 99)
            print(f"Monthly revenue: {monthly_revenue}")
        except Exception as e:
            print(f"Error calculating revenue: {e}")
            monthly_revenue = 0
        
        metrics = {
            'total_users': total_users,
            'active_subscriptions': active_subscriptions,
            'total_feedback': total_feedback,
            'monthly_revenue': monthly_revenue
        }
        
        print(f"Final metrics: {metrics}")
        return jsonify(metrics), 200
        
    except Exception as e:
        print(f"Error getting admin metrics: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to get admin metrics'}), 500

# Get all user accounts for admin
@app.route('/api/admin/users', methods=['GET'])
@require_auth
def get_all_users():
    try:
        # Get current user to verify admin status
        current_user = request.user
        if current_user['user_type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get all users with pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        users = User.query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        user_list = []
        for user in users.items:
            user_list.append({
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'user_type': user.user_type,
                'subscription_status': user.subscription_status,
                'account_created_date': user.account_created_date.isoformat() if user.account_created_date else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'is_active': user.is_active,
                'referral_code': user.referral_code
            })
        
        return jsonify({
            'users': user_list,
            'total': users.total,
            'pages': users.pages,
            'current_page': users.page
        }), 200
        
    except Exception as e:
        print(f"Error getting users: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to get users'}), 500

# Get user details by ID for admin
@app.route('/api/admin/users/<int:user_id>', methods=['GET'])
@require_auth
def get_user_by_id(user_id):
    try:
        # Get current user to verify admin status
        current_user = request.user
        if current_user['user_type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get user by ID
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user's recent activities (reviews, interactions, etc.)
        activities = []
        
        # Get user's reviews
        reviews_query = text("""
            SELECT review_date, 'Review Submitted' as type, review_text as details
            FROM user_reviews 
            WHERE user_id = :user_id
            ORDER BY review_date DESC
            LIMIT 10
        """)
        reviews_result = db.session.execute(reviews_query, {'user_id': user_id})
        for row in reviews_result:
            activities.append({
                'date': row.review_date.isoformat() if row.review_date else None,
                'type': row.type,
                'details': row.details[:100] + '...' if len(row.details) > 100 else row.details
            })
        
        # Get user's review interactions (likes/dislikes)
        interactions_query = text("""
            SELECT interaction_date, 
                   CASE WHEN interaction_type = 'like' THEN 'Liked Review' ELSE 'Disliked Review' END as type,
                   'Interacted with review' as details
            FROM review_interactions 
            WHERE user_id = :user_id
            ORDER BY interaction_date DESC
            LIMIT 5
        """)
        interactions_result = db.session.execute(interactions_query, {'user_id': user_id})
        for row in interactions_result:
            activities.append({
                'date': row.interaction_date.isoformat() if row.interaction_date else None,
                'type': row.type,
                'details': row.details
            })
        
        # Sort activities by date (most recent first)
        activities.sort(key=lambda x: x['date'] or '', reverse=True)
        
        # Limit to 15 most recent activities
        activities = activities[:15]
        
        user_data = {
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'phone_number': user.phone_number,
            'user_type': user.user_type,
            'subscription_status': user.subscription_status,
            'account_created_date': user.account_created_date.isoformat() if user.account_created_date else None,
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'is_active': user.is_active,
            'referral_code': user.referral_code,
            'activities': activities
        }
        
        return jsonify(user_data), 200
        
    except Exception as e:
        print(f"Error getting user details: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to get user details'}), 500

# Deactivate user account
@app.route('/api/admin/users/<int:user_id>/deactivate', methods=['POST'])
@require_auth
def deactivate_user(user_id):
    try:
        # Get current user to verify admin status
        current_user = request.user
        if current_user['user_type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get user by ID
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if trying to deactivate self
        if user.id == current_user['user_id']:
            return jsonify({'error': 'Cannot deactivate your own account'}), 400
        
        # Deactivate user
        user.is_active = False
        user.subscription_status = 'Inactive'
        db.session.commit()
        
        return jsonify({
            'message': 'User deactivated successfully',
            'user_id': user_id,
            'status': 'deactivated'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deactivating user: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to deactivate user'}), 500

# User deactivates their own account
@app.route('/api/user/deactivate', methods=['POST'])
@require_auth
def deactivate_own_account():
    try:
        # Get current user
        current_user = request.user
        
        # Get user by ID
        user = User.query.get(current_user['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Mark account as inactive and clear sensitive data
        # This allows the same email to be used for new signups
        user.is_active = False
        user.subscription_status = 'Inactive'
        user.email = f"deactivated_{user.id}_{int(time.time())}@deactivated.com"
        user.password_hash = "deactivated"
        user.full_name = "Deactivated User"
        db.session.commit()
        
        return jsonify({
            'message': 'Account deactivated successfully. You can sign up again with the same email.',
            'user_id': current_user['user_id'],
            'status': 'inactive'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deactivating own account: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to deactivate account'}), 500

# Suspend user account
@app.route('/api/admin/users/<int:user_id>/suspend', methods=['POST'])
@require_auth
def suspend_user(user_id):
    try:
        # Get current user to verify admin status
        current_user = request.user
        if current_user['user_type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get user by ID
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if trying to suspend self
        if user.id == current_user['user_id']:
            return jsonify({'error': 'Cannot suspend your own account'}), 400
        
        # Suspend user (set subscription status to suspended)
        user.subscription_status = 'Suspended'
        db.session.commit()
        
        return jsonify({
            'message': 'User suspended successfully',
            'user_id': user_id,
            'status': 'suspended'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error suspending user: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to suspend user'}), 500

# Reactivate user account
@app.route('/api/admin/users/<int:user_id>/reactivate', methods=['POST'])
@require_auth
def reactivate_user(user_id):
    try:
        # Get current user to verify admin status
        current_user = request.user
        if current_user['user_type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get user by ID
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Reactivate user
        user.is_active = True
        user.subscription_status = 'Active'
        db.session.commit()
        
        return jsonify({
            'message': 'User reactivated successfully',
            'user_id': user_id,
            'status': 'active'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error reactivating user: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to reactivate user'}), 500

# Get all feedback for admin review
@app.route('/api/admin/feedback', methods=['GET'])
@require_auth
def get_all_feedback():
    try:
        # Get current user to verify admin status
        current_user = request.user
        if current_user['user_type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get all feedback with pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Query all reviews with user information
        query = text("""
            SELECT r.id, r.review_text, r.rating, r.review_date, r.is_verified,
                   r.admin_response, r.admin_response_date,
                   u.full_name, u.email, u.user_type
            FROM user_reviews r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.review_date DESC
        """)
        
        result = db.session.execute(query)
        all_reviews = []
        
        for row in result:
            all_reviews.append({
                'id': row.id,
                'review_text': row.review_text,
                'rating': row.rating,
                'review_date': row.review_date.isoformat() if row.review_date else None,
                'is_verified': row.is_verified,
                'admin_response': row.admin_response,
                'admin_response_date': row.admin_response_date.isoformat() if row.admin_response_date else None,
                'user_name': row.full_name,
                'user_email': row.email,
                'user_type': row.user_type
            })
        
        # Simple pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_reviews = all_reviews[start_idx:end_idx]
        
        return jsonify({
            'feedback': paginated_reviews,
            'total': len(all_reviews),
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        print(f"Error getting feedback: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to get feedback'}), 500

# Verify/publish feedback (make it public)
@app.route('/api/admin/feedback/verify', methods=['POST'])
@require_auth
def verify_feedback():
    try:
        # Get current user to verify admin status
        current_user = request.user
        if current_user['user_type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        if not data or not data.get('feedback_id'):
            return jsonify({'error': 'Feedback ID is required'}), 400
        
        feedback_id = data['feedback_id']
        
        # Update the feedback verification status only (make it public)
        query = text("""
            UPDATE user_reviews 
            SET is_verified = TRUE
            WHERE id = :id
        """)
        db.session.execute(query, {
            'id': feedback_id
        })
        db.session.commit()
        
        return jsonify({'message': 'Feedback verified and published successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error verifying feedback: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to verify feedback'}), 500

# Respond to feedback (send message to user)
@app.route('/api/admin/feedback/respond', methods=['POST'])
@require_auth
def respond_to_feedback():
    try:
        # Get current user to verify admin status
        current_user = request.user
        if current_user['user_type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        if not data or not data.get('feedback_id'):
            return jsonify({'error': 'Feedback ID is required'}), 400
        
        feedback_id = data['feedback_id']
        admin_response = data.get('admin_response', '')
        
        if not admin_response.strip():
            return jsonify({'error': 'Response message is required'}), 400
        

        # Add admin response to the feedback
        query = text("""
            UPDATE user_reviews 
            SET admin_response = :admin_response,
                admin_response_date = NOW()
            WHERE id = :id
        """)
        db.session.execute(query, {
            'id': feedback_id,
            'admin_response': admin_response
        })
        db.session.commit()
        
        return jsonify({'message': 'Response sent successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error responding to feedback: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to send response'}), 500

# Get feedback by ID
@app.route('/api/admin/feedback/<int:feedback_id>', methods=['GET'])
@require_auth
def get_feedback_by_id(feedback_id):
    try:
        current_user = request.user
        if current_user['user_type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get feedback details with user information
        query = text("""
            SELECT 
                ur.id,
                ur.review_type,
                ur.rating,
                ur.review_text,
                ur.review_date,
                ur.is_verified,
                ur.admin_response,
                ur.admin_response_date,
                u.full_name as user_name,
                u.email as user_email
            FROM user_reviews ur
            JOIN users u ON ur.user_id = u.id
            WHERE ur.id = :feedback_id
        """)
        
        result = db.session.execute(query, {'feedback_id': feedback_id})
        feedback = result.fetchone()
        
        if not feedback:
            return jsonify({'error': 'Feedback not found'}), 404
        
        # Convert to dictionary
        feedback_dict = {
            'id': feedback.id,
            'review_type': feedback.review_type,
            'rating': feedback.rating,
            'review_text': feedback.review_text,
            'review_date': feedback.review_date.isoformat() if feedback.review_date else None,
            'is_verified': feedback.is_verified,
            'admin_response': feedback.admin_response,
            'admin_response_date': feedback.admin_response_date.isoformat() if feedback.admin_response_date else None,
            'user_name': feedback.user_name,
            'user_email': feedback.user_email
        }
        
        return jsonify(feedback_dict), 200
        
    except Exception as e:
        print(f"Error getting feedback by ID: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to get feedback'}), 500

# Unverify feedback (remove from homepage)
@app.route('/api/admin/feedback/unverify', methods=['POST'])
@require_auth
def unverify_feedback():
    try:
        current_user = request.user
        if current_user['user_type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        if not data or not data.get('feedback_id'):
            return jsonify({'error': 'Feedback ID is required'}), 400
        
        feedback_id = data['feedback_id']
        
        # Remove verification status (make it private again)
        query = text("""
            UPDATE user_reviews 
            SET is_verified = FALSE
            WHERE id = :id
        """)
        db.session.execute(query, {'id': feedback_id})
        db.session.commit()
        
        return jsonify({'message': 'Feedback removed from homepage successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error unverifying feedback: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to remove feedback from homepage'}), 500

# Add missing columns to user_reviews table
@app.route('/api/db/add-missing-columns', methods=['POST'])
def add_missing_columns():
    try:
        # Check if columns exist
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_reviews' 
            AND column_name IN ('verified_date', 'verified_by')
        """)
        
        result = db.session.execute(check_query)
        existing_columns = [row[0] for row in result]
        
        # Add verified_date column if it doesn't exist
        if 'verified_date' not in existing_columns:
            db.session.execute(text("ALTER TABLE user_reviews ADD COLUMN verified_date TIMESTAMP"))
            print("Added verified_date column")
        
        # Add verified_by column if it doesn't exist
        if 'verified_by' not in existing_columns:
            db.session.execute(text("ALTER TABLE user_reviews ADD COLUMN verified_by INTEGER REFERENCES users(id)"))
            print("Added verified_by column")
        
        db.session.commit()
        
        return jsonify({
            'message': 'Missing columns added successfully',
            'added_columns': [col for col in ['verified_date', 'verified_by'] if col not in existing_columns]
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error adding missing columns: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to add missing columns'}), 500

# Test database connection
@app.route('/api/test-db')
def test_db():
    try:
        # Test basic database operations
        user_count = User.query.count()
        return jsonify({
            'message': 'Database connection successful',
            'user_count': user_count,
            'tables': ['users', 'user_reviews', 'properties']
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Database connection failed: {str(e)}'}), 500

# Create database tables
@app.route('/api/init-db')
def init_db():
    try:
        db.create_all()
        return jsonify({'message': 'Database tables created successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to create tables: {str(e)}'}), 500

# Bookmark endpoints
@app.route('/api/bookmarks', methods=['GET'])
@require_auth
def get_user_bookmarks():
    """Get all bookmarks for the current user"""
    try:
        current_user = request.user
        
        # Get bookmarks directly from bookmarks table (simpler and more reliable)
        query = text("""
            SELECT 
                b.id,
                b.bookmark_type,
                b.reference_id,
                b.address,
                b.floor_area,
                b.level,
                b.unit_number,
                b.property_type,
                b.address_2,
                b.floor_area_2,
                b.level_2,
                b.unit_number_2,
                b.property_type_2,
                b.created_at
            FROM bookmarks b
            WHERE b.user_id = :user_id
            ORDER BY b.created_at DESC
        """)
        
        result = db.session.execute(query, {'user_id': current_user['user_id']})
        bookmarks = result.fetchall()
        
        # Group bookmarks by type
        bookmarked_addresses = []
        bookmarked_predictions = []
        bookmarked_comparisons = []
        
        for bookmark in bookmarks:
            if bookmark.bookmark_type == 'comparison':
                # For comparison bookmarks, include both properties
                bookmark_data = {
                    'id': bookmark.id,
                    'address': bookmark.address or 'Address not available',
                    'floor_area': bookmark.floor_area,
                    'level': bookmark.level,
                    'unit_number': bookmark.unit_number,
                    'property_type': bookmark.property_type or 'Property',
                    'address_2': bookmark.address_2 or 'Second address not available',
                    'floor_area_2': bookmark.floor_area_2,
                    'level_2': bookmark.level_2,
                    'unit_number_2': bookmark.unit_number_2,
                    'property_type_2': bookmark.property_type_2 or 'Property',
                    'bookmarked_date': bookmark.created_at.isoformat() if bookmark.created_at else None
                }
            else:
                # For property and prediction bookmarks
                bookmark_data = {
                    'id': bookmark.id,
                    'address': bookmark.address or 'Address not available',
                    'floor_area': bookmark.floor_area,
                    'level': bookmark.level,
                    'unit_number': bookmark.unit_number,
                    'property_type': bookmark.property_type or 'Property',
                    'bookmarked_date': bookmark.created_at.isoformat() if bookmark.created_at else None
                }
            
            if bookmark.bookmark_type == 'property':
                bookmarked_addresses.append(bookmark_data)
            elif bookmark.bookmark_type == 'prediction':
                bookmarked_predictions.append(bookmark_data)
            elif bookmark.bookmark_type == 'comparison':
                bookmarked_comparisons.append(bookmark_data)
        
        return jsonify({
            'bookmarked_addresses': bookmarked_addresses,
            'bookmarked_predictions': bookmarked_predictions,
            'bookmarked_comparisons': bookmarked_comparisons
        }), 200
        
    except Exception as e:
        print(f"Error getting bookmarks: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to get bookmarks'}), 500

@app.route('/api/bookmarks', methods=['POST'])
@require_auth
def create_bookmark():
    """Create a new bookmark"""
    try:
        current_user = request.user
        data = request.get_json()
        
        # Validate required fields
        if not data.get('bookmark_type') or not data.get('reference_id'):
            return jsonify({'error': 'Bookmark type and reference_id are required'}), 400
        
        # Check if bookmark already exists
        existing_bookmark = Bookmark.query.filter_by(
            user_id=current_user['user_id'],
            bookmark_type=data['bookmark_type'],
            reference_id=data['reference_id']
        ).first()
        
        if existing_bookmark:
            return jsonify({'error': 'Bookmark already exists'}), 400
        
        # Create new bookmark
        bookmark = Bookmark(
            user_id=current_user['user_id'],
            bookmark_type=data['bookmark_type'],
            reference_id=data['reference_id'],
            address=data.get('address'),  # Include address if provided
            floor_area=data.get('floor_area'),  # Include floor area if provided
            level=data.get('level'),  # Include level if provided
            unit_number=data.get('unit_number'),  # Include unit number if provided
            property_type=data.get('property_type'),  # Include property type if provided
            address_2=data.get('address_2'),  # Include second address for comparisons
            floor_area_2=data.get('floor_area_2'),  # Include second floor area for comparisons
            level_2=data.get('level_2'),  # Include second level for comparisons
            unit_number_2=data.get('unit_number_2'),  # Include second unit number for comparisons
            property_type_2=data.get('property_type_2')  # Include second property type for comparisons
        )
        
        db.session.add(bookmark)
        db.session.commit()
        
        return jsonify({
            'message': 'Bookmark created successfully',
            'bookmark_id': bookmark.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating bookmark: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to create bookmark'}), 500

@app.route('/api/bookmarks/<int:bookmark_id>', methods=['DELETE'])
@require_auth
def delete_bookmark(bookmark_id):
    """Delete a bookmark"""
    try:
        current_user = request.user
        
        # Get bookmark and verify ownership
        bookmark = Bookmark.query.filter_by(id=bookmark_id, user_id=current_user['user_id']).first()
        if not bookmark:
            return jsonify({'error': 'Bookmark not found'}), 404
        
        db.session.delete(bookmark)
        db.session.commit()
        
        return jsonify({'message': 'Bookmark deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting bookmark: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to delete bookmark'}), 500

# Add referral code column and generate codes for premium users
@app.route('/api/db/add-referral-codes', methods=['POST'])
def add_referral_codes():
    try:
        # Check if referral_code column exists
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'referral_code'
        """)
        
        result = db.session.execute(check_query)
        existing_columns = [row[0] for row in result]
        
        if 'referral_code' not in existing_columns:
            # Add referral_code column
            db.session.execute(text("ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE"))
            print("Added referral_code column")
        
        # Generate referral codes for premium users who don't have one
        update_query = text("""
            UPDATE users 
            SET referral_code = CONCAT('REF', LPAD(id::text, 6, '0'))
            WHERE user_type = 'premium' AND (referral_code IS NULL OR referral_code = '')
        """)
        
        db.session.execute(update_query)
        print("Generated referral codes for premium users")
        
        db.session.commit()
        
        return jsonify({
            'message': 'Referral codes added successfully',
            'added_column': 'referral_code' if 'referral_code' not in existing_columns else None,
            'codes_generated': True
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error adding referral codes: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to add referral codes: {str(e)}'}), 500

# Check database contents
@app.route('/api/db/check-contents', methods=['GET'])
def check_database_contents():
    try:
        # Check counts of different tables
        user_count = User.query.count()
        property_count = Property.query.count()
        prediction_count = PricePrediction.query.count()
        bookmark_count = Bookmark.query.count()
        
        return jsonify({
            'users': user_count,
            'properties': property_count,
            'price_predictions': prediction_count,
            'bookmarks': bookmark_count
        }), 200
        
    except Exception as e:
        print(f"Error checking database contents: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to check database: {str(e)}'}), 500

# Migration endpoint to add additional columns to bookmarks table
@app.route('/api/db/add-bookmark-details', methods=['POST'])
def add_bookmark_details():
    try:
        # Add multiple columns to bookmarks table if they don't exist
        columns_to_add = [
            ('address', 'VARCHAR(500)'),
            ('floor_area', 'DECIMAL(10,2)'),
            ('level', 'VARCHAR(50)'),
            ('unit_number', 'VARCHAR(50)'),
            ('property_type', 'VARCHAR(100)'),
            ('address_2', 'VARCHAR(500)'),
            ('floor_area_2', 'DECIMAL(10,2)'),
            ('level_2', 'VARCHAR(50)'),
            ('unit_number_2', 'VARCHAR(50)'),
            ('property_type_2', 'VARCHAR(100)')
        ]
        
        for column_name, column_type in columns_to_add:
            query = text(f"""
                ALTER TABLE bookmarks 
                ADD COLUMN IF NOT EXISTS {column_name} {column_type}
            """)
            db.session.execute(query)
            print(f"Added column: {column_name}")
        
        db.session.commit()
        return jsonify({'message': 'Additional bookmark columns added successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error adding bookmark columns: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to add bookmark columns: {str(e)}'}), 500

# Test endpoint to add sample bookmarks (for development only)
@app.route('/api/db/add-sample-bookmarks', methods=['POST'])
def add_sample_bookmarks():
    try:
        # Check if we have any users
        users = User.query.limit(1).all()
        if not users:
            return jsonify({'error': 'No users found. Please create a user first.'}), 400
        
        user_id = users[0].id
        
        # Add sample bookmarks with detailed property information for testing
        sample_bookmarks = [
            Bookmark(
                user_id=user_id, 
                bookmark_type='property', 
                reference_id=1,
                address='123 Jurong East Ave 1, Singapore 600123',
                floor_area=5000,
                level='Ground Floor',
                unit_number='A-01',
                property_type='Industrial Property'
            ),
            Bookmark(
                user_id=user_id, 
                bookmark_type='prediction', 
                reference_id=1,
                address='456 Tuas South Ave 2, Singapore 637456',
                floor_area=8000,
                level='Level 1',
                unit_number='B-15',
                property_type='Factory Building'
            ),
            Bookmark(
                user_id=user_id, 
                bookmark_type='comparison', 
                reference_id=1,
                address='789 Woodlands Industrial Park, Singapore 738789',
                floor_area=12000,
                level='Ground Floor',
                unit_number='C-03',
                property_type='Warehouse',
                address_2='321 Changi Business Park, Singapore 486321',
                floor_area_2=3000,
                level_2='Level 3',
                unit_number_2='D-22',
                property_type_2='Office Space'
            ),
        ]
        
        for bookmark in sample_bookmarks:
            # Check if bookmark already exists
            existing = Bookmark.query.filter_by(
                user_id=bookmark.user_id,
                bookmark_type=bookmark.bookmark_type,
                reference_id=bookmark.reference_id
            ).first()
            
            if not existing:
                db.session.add(bookmark)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Sample bookmarks added successfully',
            'bookmarks_added': len(sample_bookmarks)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error adding sample bookmarks: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to add sample bookmarks: {str(e)}'}), 500

# Endpoint to populate existing bookmarks with sample data
@app.route('/api/db/populate-bookmarks', methods=['POST'])
def populate_bookmarks():
    try:
        # Update existing bookmarks with sample data
        sample_data = [
            {
                'id': 1,
                'address': '123 Jurong East Ave 1, Singapore 600123',
                'floor_area': 5000,
                'level': 'Ground Floor',
                'unit_number': 'A-01',
                'property_type': 'Industrial Property'
            },
            {
                'id': 2,
                'address': '456 Tuas South Ave 2, Singapore 637456',
                'floor_area': 8000,
                'level': 'Level 1',
                'unit_number': 'B-15',
                'property_type': 'Factory Building'
            },
            {
                'id': 3,
                'address': '789 Woodlands Industrial Park, Singapore 738789',
                'floor_area': 12000,
                'level': 'Ground Floor',
                'unit_number': 'C-03',
                'property_type': 'Warehouse',
                'address_2': '321 Changi Business Park, Singapore 486321',
                'floor_area_2': 3000,
                'level_2': 'Level 3',
                'unit_number_2': 'D-22',
                'property_type_2': 'Office Space'
            },
            {
                'id': 4,
                'address': '123 Jurong East Ave 1, Singapore 600123',
                'floor_area': 5000,
                'level': 'Ground Floor',
                'unit_number': 'A-01',
                'property_type': 'Industrial Property'
            },
            {
                'id': 5,
                'address': '456 Tuas South Ave 2, Singapore 637456',
                'floor_area': 8000,
                'level': 'Level 1',
                'unit_number': 'B-15',
                'property_type': 'Factory Building'
            },
            {
                'id': 6,
                'address': '789 Woodlands Industrial Park, Singapore 738789',
                'floor_area': 12000,
                'level': 'Ground Floor',
                'unit_number': 'C-03',
                'property_type': 'Warehouse',
                'address_2': '321 Changi Business Park, Singapore 486321',
                'floor_area_2': 3000,
                'level_2': 'Level 3',
                'unit_number_2': 'D-22',
                'property_type_2': 'Office Space'
            }
        ]
        
        for data in sample_data:
            query = text("""
                UPDATE bookmarks 
                SET address = :address, 
                    floor_area = :floor_area, 
                    level = :level, 
                    unit_number = :unit_number, 
                    property_type = :property_type,
                    address_2 = :address_2,
                    floor_area_2 = :floor_area_2,
                    level_2 = :level_2,
                    unit_number_2 = :unit_number_2,
                    property_type_2 = :property_type_2
                WHERE id = :id
            """)
            db.session.execute(query, data)
        
        db.session.commit()
        return jsonify({'message': 'Bookmarks populated with sample data successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error populating bookmarks: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to populate bookmarks: {str(e)}'}), 500

# Bookmarks table already exists in database_fyp.sql
# No need to create it here

# Add admin response columns to user_reviews table
@app.route('/api/db/add-admin-response-columns', methods=['POST'])
def add_admin_response_columns():
    try:
        # Check if columns already exist
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_reviews' 
            AND column_name IN ('admin_response', 'admin_response_date', 'admin_id')
        """)
        
        result = db.session.execute(check_query)
        existing_columns = [row[0] for row in result]
        
        if 'admin_response' not in existing_columns:
            # Add admin_response column
            db.session.execute(text("ALTER TABLE user_reviews ADD COLUMN admin_response TEXT"))
            print("Added admin_response column")
        
        if 'admin_response_date' not in existing_columns:
            # Add admin_response_date column
            db.session.execute(text("ALTER TABLE user_reviews ADD COLUMN admin_response_date TIMESTAMP"))
            print("Added admin_response_date column")
        
        if 'admin_id' not in existing_columns:
            # Add admin_id column
            db.session.execute(text("ALTER TABLE user_reviews ADD COLUMN admin_id INTEGER REFERENCES users(id)"))
            print("Added admin_id column")
        
        if 'verified_date' not in existing_columns:
            # Add verified_date column
            db.session.execute(text("ALTER TABLE user_reviews ADD COLUMN verified_date TIMESTAMP"))
            print("Added verified_date column")
        
        if 'verified_by' not in existing_columns:
            # Add verified_by column
            db.session.execute(text("ALTER TABLE user_reviews ADD COLUMN verified_by INTEGER REFERENCES users(id)"))
            print("Added verified_by column")
        
        db.session.commit()
        return jsonify({'message': 'Admin response columns added successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error adding admin response columns: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to add columns: {str(e)}'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create tables if they don't exist
    app.run(debug=True, host='0.0.0.0', port=5000)
