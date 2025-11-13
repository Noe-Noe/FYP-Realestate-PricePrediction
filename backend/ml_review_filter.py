"""
ML Review and Feedback Filter Service
Automatically filters and classifies reviews/feedback using trained ML model
"""
import os
import re
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

# Import textblob and download NLTK data if needed
try:
    from textblob import TextBlob
except ImportError:
    TextBlob = None
    print("Warning: TextBlob not available")

# Download NLTK data if needed for textblob
try:
    import nltk
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        print("Downloading NLTK punkt tokenizer...")
        nltk.download('punkt', quiet=True)
    try:
        nltk.data.find('tokenizers/punkt_tab')
    except LookupError:
        try:
            nltk.download('punkt_tab', quiet=True)
        except:
            pass  # punkt_tab might not exist in older NLTK versions
except ImportError:
    pass  # NLTK not available, TextBlob will handle it

# Path to the ML model
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    'machinelearning',
    'models',
    'feedback_review_model20251031_2355.pkl'
)

class MLReviewFilter:
    """ML-based review and feedback filter"""
    
    def __init__(self):
        self.model = None
        self.label_encoder = None
        self.model_type = None
        self.vectorizer = None
        self.load_model()
    
    def load_model(self):
        """Load the trained ML model"""
        try:
            if not os.path.exists(MODEL_PATH):
                print(f"Warning: Model file not found at {MODEL_PATH}")
                return False
            
            # Suppress version warnings during loading
            import warnings
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", category=UserWarning)
                model_assets = joblib.load(MODEL_PATH)
            
            self.model = model_assets.get('model')
            self.label_encoder = model_assets.get('label_encoder')
            self.model_type = 'pipeline'  # The saved model is a pipeline
            self.vectorizer = model_assets.get('vectorizer')  # May not exist for pipeline
            
            if self.model and self.label_encoder:
                # Validate that the model is actually usable by checking if it's fitted
                try:
                    # Try a simple validation - check if the model has the required attributes
                    # For pipeline models, we need to check if transformers are fitted
                    if hasattr(self.model, 'steps') or hasattr(self.model, 'named_steps'):
                        # It's a pipeline - validate by trying to transform a dummy input
                        test_input = pd.DataFrame([{
                            'cleaned_text': 'test',
                            'text_length': 4,
                            'word_count': 1,
                            'textblob_polarity': 0.0,
                            'textblob_subjectivity': 0.0,
                            'extracted_stars': 0,
                            'day_of_week': 0,
                            'month': 1
                        }])
                        # Try to transform (this will fail if not fitted)
                        _ = self.model.predict(test_input)
                        print("ML Model validated successfully - model is fitted and ready")
                    else:
                        # Simple model - check if it has predict method
                        if hasattr(self.model, 'predict'):
                            print("ML Model loaded successfully - simple model")
                except Exception as validation_error:
                    print(f"Warning: Model loaded but validation failed: {validation_error}")
                    print("Model may not work correctly due to version mismatch")
                    # Don't return False - let it try, but log the warning
                
                # Debug: Print label encoder info
                if hasattr(self.label_encoder, 'classes_'):
                    print(f"ML Model loaded successfully. Label classes: {self.label_encoder.classes_}")
                else:
                    print(f"ML Model loaded successfully from {MODEL_PATH}")
                return True
            else:
                print("Warning: Model loaded but missing required components")
                return False
        except Exception as e:
            print(f"Error loading ML model: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def preprocess_text(self, text):
        """Preprocess text for ML prediction"""
        if pd.isna(text) or text is None:
            return ""
        
        text = str(text).lower()
        # Remove special characters and digits
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def extract_star_rating(self, text):
        """Extract star rating from text"""
        if pd.isna(text) or text is None:
            return None
            
        text = str(text).lower()
        patterns = [
            r'(\d+)\s*stars?',
            r'rating\s*[:\-]?\s*(\d+)',
            r'(\d+)/\d+\s*(?:stars?|rating)',
            r'\b(\d+)\s*out of\s*\d+\s*stars?'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            if matches:
                return int(matches[0])
        return None
    
    def predict_single(self, text, date_time=None, rating=None):
        """
        Predict sentiment for a single text
        
        Args:
            text: Review or feedback text
            date_time: Optional datetime object
            rating: Optional numeric rating (1-5)
        
        Returns:
            tuple: (sentiment, confidence, extracted_stars)
        """
        if not self.model or not self.label_encoder:
            return "Unknown", 0.0, None
        
        try:
            # Use rating if provided, otherwise extract from text
            stars = rating if rating is not None else self.extract_star_rating(text)
            
            # Prepare features
            cleaned_text = self.preprocess_text(text)
            text_length = len(cleaned_text)
            word_count = len(cleaned_text.split())
            
            # TextBlob sentiment
            if TextBlob:
                textblob_polarity = TextBlob(str(text)).sentiment.polarity
                textblob_subjectivity = TextBlob(str(text)).sentiment.subjectivity
            else:
                # Fallback if TextBlob is not available
                textblob_polarity = 0.0
                textblob_subjectivity = 0.0
            
            # Time-based features
            if date_time is None:
                date_time = datetime.now()
            
            if isinstance(date_time, str):
                date_time = pd.to_datetime(date_time)
            
            day_of_week = date_time.weekday() if hasattr(date_time, 'weekday') else datetime.now().weekday()
            month = date_time.month if hasattr(date_time, 'month') else datetime.now().month
            
            # Create DataFrame with same structure as training data
            single_data = pd.DataFrame([{
                'cleaned_text': cleaned_text,
                'text_length': text_length,
                'word_count': word_count,
                'textblob_polarity': textblob_polarity,
                'textblob_subjectivity': textblob_subjectivity,
                'extracted_stars': stars if stars is not None else 0,
                'day_of_week': day_of_week,
                'month': month
            }])
            
            # Predict using pipeline
            prediction = self.model.predict(single_data)[0]
            probability = self.model.predict_proba(single_data)[0]
            
            # Decode prediction - use classes_ attribute directly
            try:
                # The prediction is an integer index (0 or 1)
                # Label encoder classes_ contains the labels in order: ['Negative', 'Positive'] or ['Positive', 'Negative']
                if hasattr(self.label_encoder, 'classes_'):
                    if isinstance(prediction, (int, np.integer)) and 0 <= prediction < len(self.label_encoder.classes_):
                        sentiment = self.label_encoder.classes_[prediction]
                    else:
                        # Fallback: use probability to determine
                        if len(probability) >= 2:
                            # Find which class has higher probability
                            max_prob_idx = np.argmax(probability)
                            if max_prob_idx < len(self.label_encoder.classes_):
                                sentiment = self.label_encoder.classes_[max_prob_idx]
                            else:
                                sentiment = "Unknown"
                        else:
                            sentiment = "Unknown"
                else:
                    # Fallback if no classes_ attribute
                    sentiment = "Unknown"
            except Exception as e:
                print(f"Label decoder error: {e}, prediction: {prediction}, prediction type: {type(prediction)}")
                # Final fallback: use probability distribution
                if len(probability) >= 2:
                    max_prob_idx = int(np.argmax(probability))
                    # Common convention: 0=Negative, 1=Positive
                    sentiment = "Positive" if max_prob_idx == 1 else "Negative"
                else:
                    sentiment = "Unknown"
            
            # Get confidence from probability array
            if isinstance(prediction, (int, np.integer)) and 0 <= prediction < len(probability):
                confidence = float(probability[prediction])
            else:
                # Use max probability as confidence
                confidence = float(np.max(probability))
            
            return sentiment, confidence, stars
            
        except Exception as e:
            error_msg = str(e)
            if "not fitted" in error_msg.lower() or "idf vector" in error_msg.lower():
                print(f"Prediction error: Model not properly fitted - likely due to scikit-learn version mismatch")
                print(f"  Error details: {error_msg}")
                print(f"  Please ensure scikit-learn version matches the training environment (>=1.7.1)")
            else:
                print(f"Prediction error: {e}")
                import traceback
                traceback.print_exc()
            return "Unknown", 0.0, None
    
    def is_spam_or_low_quality(self, text):
        """
        Check if text appears to be spam or low quality
        
        Returns:
            tuple: (is_spam: bool, reason: str)
        """
        if not text or pd.isna(text):
            return True, "Empty text"
        
        text_str = str(text).strip()
        
        # 1. Minimum length check
        if len(text_str) < 10:
            return True, f"Too short ({len(text_str)} chars < 10)"
        
        # 2. Word count check
        words = text_str.split()
        if len(words) < 3:
            return True, f"Too few words ({len(words)} < 3)"
        
        # 3. Check for repeated characters (e.g., "ttttt", "aaaaa")
        for i in range(len(text_str) - 4):
            if len(set(text_str[i:i+5])) == 1:
                return True, "Repeated characters detected"
        
        # 4. Check for mostly single characters (e.g., "t e s t")
        if len([w for w in words if len(w) == 1]) > len(words) * 0.5:
            return True, "Too many single-character words"
        
        # 5. Check for common spam patterns
        spam_patterns = [
            r'^(test|testtt|ttttt|aaaa|zzzz|hhhh)$',
            r'^[a-z]{1,3}$',  # Very short single words
        ]
        text_lower = text_str.lower()
        for pattern in spam_patterns:
            if re.match(pattern, text_lower):
                return True, "Spam pattern detected"
        
        # 6. Check for meaningful content (has at least some words longer than 3 chars)
        meaningful_words = [w for w in words if len(w) > 3]
        if len(meaningful_words) == 0:
            return True, "No meaningful words"
        
        return False, ""
    
    def is_legit_review(self, text, date_time=None, rating=None, min_confidence=0.7, min_stars=3):
        """
        Check if a review/feedback is legitimate (positive with high confidence and quality checks)
        
        Args:
            text: Review or feedback text
            date_time: Optional datetime object
            rating: Optional numeric rating (1-5)
            min_confidence: Minimum confidence threshold (default 0.7)
            min_stars: Minimum star rating (default 3)
        
        Returns:
            dict: {
                'is_legit': bool,
                'sentiment': str,
                'confidence': float,
                'stars': int or None,
                'reason': str
            }
        """
        # First check for spam/low quality
        is_spam, spam_reason = self.is_spam_or_low_quality(text)
        if is_spam:
            # Still get sentiment for display, but mark as not legit
            sentiment, confidence, stars = self.predict_single(text, date_time, rating)
            return {
                'is_legit': False,
                'sentiment': sentiment,
                'confidence': confidence,
                'stars': stars,
                'reason': f"Low quality/spam: {spam_reason}"
            }
        
        sentiment, confidence, stars = self.predict_single(text, date_time, rating)
        
        # Consider legit if:
        # 1. Positive sentiment
        # 2. High confidence (>= min_confidence)
        # 3. Either has stars >= min_stars OR very high confidence (>0.8)
        is_legit = (
            sentiment == 'Positive' and
            confidence >= min_confidence and
            (
                (stars is not None and stars >= min_stars) or
                confidence > 0.85 or  # Raised threshold slightly
                stars is None  # If no stars, rely on confidence only
            )
        )
        
        reason = ""
        if sentiment != 'Positive':
            reason = f"Negative sentiment ({sentiment})"
        elif confidence < min_confidence:
            reason = f"Low confidence ({confidence:.2f} < {min_confidence})"
        elif stars is not None and stars < min_stars:
            reason = f"Low rating ({stars} < {min_stars} stars)"
        else:
            reason = "Positive sentiment with high confidence"
        
        return {
            'is_legit': is_legit,
            'sentiment': sentiment,
            'confidence': confidence,
            'stars': stars,
            'reason': reason
        }
    
    def filter_legit_reviews(self, reviews_list, min_confidence=0.7, min_stars=3):
        """
        Filter a list of reviews to return only legitimate ones
        
        Args:
            reviews_list: List of dicts with 'review_text' or 'message', 'review_date' or 'created_at', 'rating'
            min_confidence: Minimum confidence threshold
            min_stars: Minimum star rating
        
        Returns:
            tuple: (legit_reviews, all_reviews_with_predictions)
        """
        if not self.model:
            return [], reviews_list
        
        legit_reviews = []
        all_with_predictions = []
        
        for review in reviews_list:
            # Extract text
            text = review.get('review_text') or review.get('message', '')
            
            # Extract date
            date_time = review.get('review_date') or review.get('created_at')
            
            # Extract rating
            rating = review.get('rating')
            
            # Get prediction
            result = self.is_legit_review(text, date_time, rating, min_confidence, min_stars)
            
            # Add prediction to review
            review_with_prediction = review.copy()
            review_with_prediction['ml_sentiment'] = result['sentiment']
            review_with_prediction['ml_confidence'] = result['confidence']
            review_with_prediction['ml_extracted_stars'] = result['stars']
            review_with_prediction['ml_is_legit'] = result['is_legit']
            review_with_prediction['ml_reason'] = result['reason']
            
            all_with_predictions.append(review_with_prediction)
            
            # Add to legit list if legit
            if result['is_legit']:
                legit_reviews.append(review_with_prediction)
        
        return legit_reviews, all_with_predictions


# Global instance
_ml_filter_instance = None

def get_ml_filter():
    """Get or create the global ML filter instance"""
    global _ml_filter_instance
    if _ml_filter_instance is None:
        _ml_filter_instance = MLReviewFilter()
    return _ml_filter_instance

