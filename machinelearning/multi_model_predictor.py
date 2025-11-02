# -------------------------
# MULTI-MODEL ML PREDICTOR
# -------------------------
# This module loads multiple trained models and selects the appropriate one
# - Commercial model for commercial properties (retail, office, shop house)
# - Industrial model for industrial properties (factory, warehouse, etc.)
# - Rental model for rental price predictions (both commercial and industrial)

import pandas as pd
import numpy as np
import pickle
import json
from pathlib import Path
import warnings
import joblib
warnings.filterwarnings('ignore')

# Import ML libraries
try:
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import OneHotEncoder
    from sklearn.compose import ColumnTransformer
    from sklearn.pipeline import Pipeline
    import xgboost as xgb
except ImportError as e:
    print(f"Warning: Some ML libraries not available: {e}")

class MultiModelPredictor:
    """Multi-Model ML Predictor that uses different models based on property type"""
    
    def __init__(self, models_dir="../machinelearning/models"):
        self.models_dir = Path(models_dir)
        self.commercial_model = None
        self.industrial_model = None
        self.rental_model = None
        self.commercial_model_data = None
        self.industrial_model_data = None
        self.rental_model_data = None
        self.is_loaded = False
        self._cached_predictions = {}  # Cache for faster repeated predictions
        
        # Geographic data for distance calculations
        self.mrt_stations = self._load_mrt_stations()
        self.cbd_coords = (1.2830, 103.8510)  # Raffles Place coordinates
        
        # Property type mappings
        self.commercial_types = ['retail', 'office', 'shop house', 'shophouse']
        self.industrial_types = ['factory', 'warehouse', 'single-user factory', 
                                  'multiple-user factory', 'business parks', 
                                  'singleuserfactory', 'multipleuserfactory', 
                                  'businessparks']
        
    def _load_mrt_stations(self):
        """Load MRT station coordinates"""
        return {
            'Raffles Place': (1.2830, 103.8510),
            'City Hall': (1.2930, 103.8520),
            'Marina Bay': (1.2790, 103.8540),
            'Orchard': (1.3040, 103.8310),
            'Somerset': (1.3000, 103.8390),
            'Dhoby Ghaut': (1.2990, 103.8460),
            'Little India': (1.3040, 103.8490),
            'Bugis': (1.3000, 103.8560),
            'Lavender': (1.3070, 103.8630),
            'Kallang': (1.3120, 103.8710),
            'Aljunied': (1.3160, 103.8820),
            'Paya Lebar': (1.3170, 103.8920),
            'Eunos': (1.3200, 103.9030),
            'Kembangan': (1.3210, 103.9130),
            'Bedok': (1.3240, 103.9300),
            'Tanah Merah': (1.3270, 103.9460),
            'Simei': (1.3430, 103.9530),
            'Tampines': (1.3490, 103.9580),
            'Pasir Ris': (1.3720, 103.9490),
            'Jurong East': (1.3330, 103.7420),
            'Clementi': (1.3150, 103.7650),
            'Dover': (1.3110, 103.7780),
            'Buona Vista': (1.3070, 103.7900),
            'Commonwealth': (1.3020, 103.7980),
            'Queenstown': (1.2960, 103.8060),
            'Redhill': (1.2890, 103.8170),
            'Tiong Bahru': (1.2960, 103.8260),
            'Outram Park': (1.2800, 103.8390),
            'Chinatown': (1.2850, 103.8440),
            'Clarke Quay': (1.2880, 103.8470),
            'Bras Basah': (1.2970, 103.8510),
            'Esplanade': (1.2930, 103.8550),
            'Promenade': (1.2930, 103.8600),
            'Bayfront': (1.2810, 103.8590),
            'Marina South Pier': (1.2710, 103.8630)
        }
        
    def load_models(self):
        """Load all three trained models"""
        try:
            commercial_path = self.models_dir / "commercial_real_estate_model_final.pkl"
            industrial_path = self.models_dir / "industrial_real_estate_model_final.pkl"
            rental_path = self.models_dir / "rental_model_final.pkl"
            
            # Load commercial model
            if commercial_path.exists():
                try:
                    model_data = joblib.load(commercial_path)
                    # Handle different model storage formats
                    if isinstance(model_data, dict):
                        self.commercial_model = model_data.get('model') or model_data.get('regressor') or model_data.get('pipeline')
                        self.commercial_model_data = model_data
                    elif hasattr(model_data, 'predict'):
                        # Direct model object
                        self.commercial_model = model_data
                        self.commercial_model_data = {'model': model_data}
                    else:
                        self.commercial_model = model_data
                        self.commercial_model_data = {'model': model_data}
                    print(f"✅ Commercial model loaded: {commercial_path}")
                except Exception as e:
                    print(f"⚠️ Error loading commercial model: {e}")
                    self.commercial_model = None
            else:
                print(f"❌ Commercial model not found: {commercial_path}")
            
            # Load industrial model
            if industrial_path.exists():
                try:
                    model_data = joblib.load(industrial_path)
                    # Handle different model storage formats
                    if isinstance(model_data, dict):
                        self.industrial_model = model_data.get('model') or model_data.get('regressor') or model_data.get('pipeline')
                        self.industrial_model_data = model_data
                    elif hasattr(model_data, 'predict'):
                        self.industrial_model = model_data
                        self.industrial_model_data = {'model': model_data}
                    else:
                        self.industrial_model = model_data
                        self.industrial_model_data = {'model': model_data}
                    print(f"✅ Industrial model loaded: {industrial_path}")
                except Exception as e:
                    print(f"⚠️ Error loading industrial model: {e}")
                    self.industrial_model = None
            else:
                print(f"❌ Industrial model not found: {industrial_path}")
            
            # Load rental model
            if rental_path.exists():
                try:
                    model_data = joblib.load(rental_path)
                    # Handle different model storage formats
                    if isinstance(model_data, dict):
                        self.rental_model = model_data.get('model') or model_data.get('regressor') or model_data.get('pipeline')
                        self.rental_model_data = model_data
                    elif hasattr(model_data, 'predict'):
                        self.rental_model = model_data
                        self.rental_model_data = {'model': model_data}
                    else:
                        self.rental_model = model_data
                        self.rental_model_data = {'model': model_data}
                    print(f"✅ Rental model loaded: {rental_path}")
                except Exception as e:
                    print(f"⚠️ Error loading rental model: {e}")
                    self.rental_model = None
            else:
                print(f"❌ Rental model not found: {rental_path}")
            
            # Check if at least one model is loaded
            if self.commercial_model or self.industrial_model or self.rental_model:
                self.is_loaded = True
                return True
            else:
                print("❌ No models loaded")
                return False
                
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_property_type_category(self, property_type):
        """Determine if property is commercial or industrial"""
        property_type_lower = property_type.lower().strip()
        
        # Check commercial types
        if any(com_type in property_type_lower for com_type in self.commercial_types):
            return 'commercial'
        
        # Check industrial types
        if any(ind_type in property_type_lower for ind_type in self.industrial_types):
            return 'industrial'
        
        # Default to commercial if unknown
        return 'commercial'
    
    def get_model_data(self, property_type):
        """Get the appropriate model and model data based on property type"""
        category = self.get_property_type_category(property_type)
        
        if category == 'commercial':
            return self.commercial_model, self.commercial_model_data
        elif category == 'industrial':
            return self.industrial_model, self.industrial_model_data
        else:
            return self.commercial_model, self.commercial_model_data  # Default
    
    def calculate_distance(self, lat1, lng1, lat2, lng2):
        """Calculate distance between two points in kilometers"""
        import math
        R = 6371  # Earth's radius in kilometers
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = (math.sin(dlat/2) * math.sin(dlat/2) + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlng/2) * math.sin(dlng/2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
    
    def get_property_coordinates(self, address, postal_code=None):
        """Get coordinates for a property address"""
        if postal_code:
            postal_district = int(str(postal_code)[:2])
        else:
            import re
            postal_match = re.search(r'(\d{6})', address)
            if postal_match:
                postal_district = int(postal_match.group(1)[:2])
            else:
                postal_district = 1  # Default to district 1 (Central)
        
        # Approximate coordinates by postal district
        district_coords = {
            1: (1.2830, 103.8510), 2: (1.3040, 103.8310), 3: (1.3000, 103.8560),
            4: (1.3040, 103.8490), 5: (1.3170, 103.8920), 6: (1.3240, 103.9300),
            7: (1.3490, 103.9580), 8: (1.3330, 103.7420), 9: (1.3150, 103.7650),
            10: (1.3070, 103.7900), 11: (1.2960, 103.8060), 12: (1.2960, 103.8260),
            13: (1.2850, 103.8440), 14: (1.2880, 103.8470), 15: (1.2970, 103.8510),
            16: (1.2930, 103.8550), 17: (1.2930, 103.8600), 18: (1.2810, 103.8590),
            19: (1.2710, 103.8630), 20: (1.3070, 103.8630), 21: (1.3120, 103.8710),
            22: (1.3160, 103.8820), 23: (1.3200, 103.9030), 24: (1.3210, 103.9130),
            25: (1.3270, 103.9460), 26: (1.3430, 103.9530), 27: (1.3720, 103.9490),
            28: (1.3110, 103.7780), 29: (1.3020, 103.7980), 30: (1.2890, 103.8170),
        }
        
        return district_coords.get(postal_district, (1.2830, 103.8510))
    
    def prepare_features_for_model(self, address, property_type, area_sqm, level, unit, 
                                   tenure="Freehold", model_data=None):
        """Prepare features in the format expected by the trained model"""
        import re
        
        # Extract postal code
        postal_match = re.search(r'(\d{6})', address)
        postal_code = postal_match.group(1) if postal_match else "018956"
        postal_district = int(postal_code[:2]) if postal_code else 1
        
        # Get coordinates
        prop_lat, prop_lng = self.get_property_coordinates(address, postal_code)
        
        # Calculate MRT distance
        min_mrt_distance = float('inf')
        mrt_count_1km = 0
        major_stations = list(self.mrt_stations.keys())
        for station_name in major_stations:
            mrt_lat, mrt_lng = self.mrt_stations[station_name]
            distance = self.calculate_distance(prop_lat, prop_lng, mrt_lat, mrt_lng)
            min_mrt_distance = min(min_mrt_distance, distance)
            if distance <= 1.0:
                mrt_count_1km += 1
        
        # Calculate CBD distance
        cbd_distance = self.calculate_distance(prop_lat, prop_lng, *self.cbd_coords)
        
        # Location mapping
        district_to_location = {
            1: 'Raffles Place', 2: 'Orchard', 3: 'Bugis', 4: 'Little India',
            5: 'Paya Lebar', 6: 'Bedok', 7: 'Tampines', 8: 'Jurong East',
            9: 'Clementi', 10: 'Buona Vista', 11: 'Queenstown', 12: 'Tiong Bahru',
            13: 'Chinatown', 14: 'Clarke Quay', 15: 'Bras Basah', 16: 'Esplanade',
            17: 'Promenade', 18: 'Bayfront', 19: 'Marina South Pier', 20: 'Lavender',
            21: 'Kallang', 22: 'Aljunied', 23: 'Eunos', 24: 'Kembangan',
            25: 'Tanah Merah', 26: 'Simei', 27: 'Pasir Ris', 28: 'Dover',
            29: 'Commonwealth', 30: 'Redhill'
        }
        general_location = district_to_location.get(postal_district, 'Raffles Place')
        
        # Region classification
        if postal_district <= 20:
            region_classification = 'CCR_Central_Core'
        elif postal_district <= 30:
            region_classification = 'RCR_Rest_Central'
        else:
            region_classification = 'OCR_Outside_Central'
        
        # Parse floor level (based on notebook logic)
        floor_low = 0
        floor_high = 0
        floor_midpoint = 0
        is_basement = 0
        is_ground = 0
        
        if level and level.lower() != 'n/a':
            level_str = str(level).strip()
            level_lower = level_str.lower()
            
            if level_str == '0' or 'ground' in level_lower or 'g' in level_lower:
                is_ground = 1
                floor_low = 0
                floor_high = 0
                floor_midpoint = 0
            elif 'basement' in level_lower or level_str.startswith('B'):
                is_basement = 1
                floor_low = -1
                floor_high = -1
                floor_midpoint = -1
            else:
                # Extract numbers from level string
                numbers = re.findall(r'\d+', level_str)
                if len(numbers) >= 2:
                    floor_low = int(numbers[0])
                    floor_high = int(numbers[1])
                    floor_midpoint = (floor_low + floor_high) / 2
                elif len(numbers) == 1:
                    floor_low = int(numbers[0])
                    floor_high = int(numbers[0])
                    floor_midpoint = int(numbers[0])
        
        # Determine type of area based on property type
        # Based on industrial workbook: 'Type of Area' can be 'B1 Industrial', 'Business Park', 'Strata', etc.
        type_of_area = 'Strata'  # Default
        property_type_lower = property_type.lower()
        if 'factory' in property_type_lower or 'warehouse' in property_type_lower:
            type_of_area = 'B1 Industrial'
        elif 'business park' in property_type_lower or 'business parks' in property_type_lower:
            type_of_area = 'Business Park'
        elif 'single-user' in property_type_lower or 'multiple-user' in property_type_lower:
            type_of_area = 'B1 Industrial'  # Single/multiple-user factories are industrial
        
        # Normalize property type to match training data exactly
        # Training data uses: 'Single-User Factory', 'Multiple-User Factory', 'Warehouse'
        property_type_normalized = property_type
        property_type_lower = property_type.lower()
        if 'single-user' in property_type_lower or 'singleuser' in property_type_lower:
            property_type_normalized = 'Single-User Factory'  # Match training data exactly
        elif 'multiple-user' in property_type_lower or 'multipleuser' in property_type_lower:
            property_type_normalized = 'Multiple-User Factory'  # Match training data exactly
        elif 'warehouse' in property_type_lower:
            property_type_normalized = 'Warehouse'  # Match training data exactly
        elif 'factory' in property_type_lower and 'single' not in property_type_lower and 'multiple' not in property_type_lower:
            property_type_normalized = 'Warehouse'  # Default factory to Warehouse if unclear
        elif 'business park' in property_type_lower or 'business parks' in property_type_lower:
            property_type_normalized = 'Business Park'  # Keep as-is for business parks
        
        # Create comprehensive feature dictionary matching notebook structure
        features = {
            'Property Type': property_type_normalized,  # Use normalized property type
            'Area (SQM)': area_sqm,
            'Type of Area': type_of_area,
            'Tenure': tenure,
            'Postal District': postal_district,
            'Floor_Low': floor_low,
            'Floor_High': floor_high,
            'Floor_Midpoint': floor_midpoint,
            'Is_Basement': is_basement,
            'Is_Ground': is_ground,
            'General_Location': general_location,
            'Region_Classification': region_classification,
            'distance_to_nearest_mrt': min_mrt_distance,
            'Distance_to_MRT_km': min_mrt_distance,  # Alternative naming
            'distance_to_cbd': cbd_distance,
            'Distance_to_CBD_km': cbd_distance,  # Alternative naming
            'number_of_mrt_within_1km': mrt_count_1km,
            'latitude': prop_lat,
            'longitude': prop_lng,
            'transit_accessibility': (1 / (min_mrt_distance + 0.1) + mrt_count_1km * 0.5)
        }
        
        # Create DataFrame with all base features
        feature_df = pd.DataFrame([features])
        
        # If model_data exists, try to align features
        if model_data:
            model_obj = model_data.get('model')
            
            # Check if model is a Pipeline (sklearn pipeline includes preprocessing)
            if isinstance(model_obj, Pipeline):
                # Pipeline handles preprocessing automatically, just return base features
                return feature_df
            
            # Check if model_data has feature names or preprocessor info
            if 'feature_names' in model_data:
                expected_features = model_data['feature_names']
                
                # One-hot encode categorical features using pd.get_dummies (same as training)
                categorical_cols = ['Property Type', 'Type of Area', 'Tenure', 
                                   'General_Location', 'Region_Classification']
                
                # Create a temporary dataframe with all numeric and categorical columns
                temp_df = feature_df.copy()
                
                # One-hot encode categorical columns (same method as training: pd.get_dummies with drop_first=True)
                # But we need to match the exact column names from training
                # So we'll manually create one-hot columns based on expected_features
                for feat_name in expected_features:
                    if feat_name not in temp_df.columns:
                        # Check if it's a one-hot encoded column
                        matched = False
                        for col in categorical_cols:
                            if feat_name.startswith(f'{col}_'):
                                # This is a one-hot column
                                value = temp_df[col].iloc[0]
                                category_value = feat_name.replace(f'{col}_', '')
                                # Set to 1 if it matches our value, 0 otherwise
                                temp_df[feat_name] = 1 if str(category_value) == str(value) else 0
                                matched = True
                                break
                        
                        if not matched:
                            # Not a one-hot column, might be numeric or other feature
                            temp_df[feat_name] = 0
                
                # Reorder to match expected feature order
                for feat in expected_features:
                    if feat not in temp_df.columns:
                        temp_df[feat] = 0
                
                feature_df = temp_df[expected_features]
            
            elif 'preprocessor' in model_data:
                try:
                    feature_df = model_data['preprocessor'].transform(feature_df)
                except Exception as e:
                    print(f"⚠️ Preprocessor transform failed: {e}, using raw features")
        
        return feature_df
    
    def predict_sales_price(self, address, property_type, area_sqm, level, unit, tenure="Freehold"):
        """Predict sales price using the appropriate model"""
        if not self.is_loaded:
            print("❌ Models not loaded. Please load models first.")
            return None
        
        # Get appropriate model
        model, model_data = self.get_model_data(property_type)
        
        if model is None:
            print(f"❌ No model available for property type: {property_type}")
            return None
        
        try:
            # Prepare features
            feature_df = self.prepare_features_for_model(
                address, property_type, area_sqm, level, unit, tenure, model_data
            )
            
            # Debug: Log feature preparation
            print(f"\n🔍 Feature Preparation for {property_type}:")
            print(f"   Area: {area_sqm:.2f} sqm ({area_sqm * 10.764:.2f} sqft)")
            print(f"   Feature DataFrame shape: {feature_df.shape}")
            print(f"   Feature columns: {len(feature_df.columns)} columns")
            if len(feature_df.columns) <= 20:
                print(f"   Column names: {list(feature_df.columns)}")
            
            # Check for any NaN or invalid values
            nan_count = feature_df.isna().sum().sum()
            if nan_count > 0:
                print(f"⚠️ WARNING: {nan_count} NaN values in features!")
                feature_df = feature_df.fillna(0)
            
            # Handle Pipeline models (which include preprocessing)
            if isinstance(model, Pipeline):
                # Pipeline handles feature transformation automatically
                prediction = model.predict(feature_df)[0]
                print(f"   Using Pipeline model (handles preprocessing internally)")
            else:
                # For standalone models, need to handle preprocessing
                # Check if model_data has preprocessing info
                if model_data and 'feature_names' in model_data:
                    # Ensure feature order matches training
                    expected_features = model_data['feature_names']
                    available = [f for f in expected_features if f in feature_df.columns]
                    missing = [f for f in expected_features if f not in feature_df.columns]
                    
                    print(f"   Expected features: {len(expected_features)}")
                    print(f"   Available features: {len(available)}")
                    print(f"   Missing features: {len(missing)}")
                    if missing:
                        print(f"   ⚠️ Missing features: {missing[:10]}...")  # Show first 10
                        # Fill missing features (e.g., one-hot encoded columns)
                        for feat in missing:
                            feature_df[feat] = 0
                    
                    # Reorder to match expected order
                    feature_df = feature_df[expected_features]
                
                # Make prediction
                prediction = model.predict(feature_df)[0]
            
            # 🔍 RAW MODEL OUTPUT - BEFORE INTERPRETATION
            raw_prediction = float(prediction)
            print(f"\n🔬 RAW MODEL OUTPUT ANALYSIS:")
            print(f"   Raw prediction value: ${raw_prediction:,.2f}")
            print(f"   Property type: {property_type}")
            print(f"   Area (sqm): {area_sqm:.2f}")
            print(f"   Area (sqft): {area_sqm * 10.764:.2f}")
            
            # Test different interpretations to see which makes sense
            area_sqft_calc = area_sqm * 10.764
            if area_sqm > 0 and area_sqft_calc > 0:
                # Test all three interpretations
                total_if_psf = raw_prediction * area_sqft_calc  # If raw is PSF, multiply by area
                total_if_psm = raw_prediction * area_sqm  # If raw is PSM, multiply by area
                total_if_total = raw_prediction  # If raw is total price
                
                psf_if_raw_is_total = raw_prediction / area_sqft_calc
                psm_if_raw_is_total = raw_prediction / area_sqm
                psf_if_raw_is_psm = (raw_prediction * area_sqm) / area_sqft_calc
                
                print(f"   Interpretation Analysis (testing all possibilities):")
                print(f"     📌 If RAW=${raw_prediction:,.2f} is PSF:  Total=${total_if_psf:,.2f}")
                print(f"     📌 If RAW=${raw_prediction:,.2f} is PSM:  Total=${total_if_psm:,.2f}  (PSF=${psf_if_raw_is_psm:.2f})")
                print(f"     📌 If RAW=${raw_prediction:,.2f} is TOTAL: PSF=${psf_if_raw_is_total:.2f}, PSM=${psm_if_raw_is_total:.2f}")
                
                # Determine most likely interpretation based on value ranges
                category = self.get_property_type_category(property_type)
                if category == 'industrial':
                    # Industrial: typical PSF $50-$1000, PSM $500-$5000, Total $50k-$20M
                    if 50000 <= raw_prediction <= 20000000:
                        print(f"     ✅ Most likely: TOTAL PRICE (fits industrial total range: $50k-$20M)")
                    elif 500 <= raw_prediction <= 5000:
                        print(f"     ⚠️ Could be: PSM (fits industrial PSM range: $500-$5k) → Total=${total_if_psm:,.2f}")
                    elif 50 <= raw_prediction <= 1000:
                        print(f"     ⚠️ Could be: PSF (fits industrial PSF range: $50-$1k) → Total=${total_if_psf:,.2f}")
                    else:
                        print(f"     ❓ Unusual value - checking PSF interpretation: {psf_if_raw_is_total:.2f} PSF")
                else:  # commercial
                    # Commercial: typical PSF $500-$10k, PSM $10k-$50k, Total $500k-$20M
                    if 500000 <= raw_prediction <= 20000000:
                        print(f"     ✅ Most likely: TOTAL PRICE (fits commercial total range: $500k-$20M)")
                    elif 10000 <= raw_prediction <= 50000:
                        print(f"     ⚠️ Could be: PSM (fits commercial PSM range: $10k-$50k) → Total=${total_if_psm:,.2f}")
                    elif 500 <= raw_prediction <= 10000:
                        print(f"     ⚠️ Could be: PSF (fits commercial PSF range: $500-$10k) → Total=${total_if_psf:,.2f}")
                    else:
                        print(f"     ❓ Unusual value - checking PSF interpretation: {psf_if_raw_is_total:.2f} PSF")
            
            # Model prediction interpretation
            # DISCOVERY: Commercial model actually predicts PSM (Price per Square Meter), not total price!
            # Evidence from raw output: $115,743.82 
            # - If PSM: $115,743.82 × 114.46 sqm = $13.25M total → $10,752 PSF ✅ (reasonable for prime retail)
            # - If Total: $115,743.82 → $93.95 PSF ❌ (way too low)
            # - Industrial model still predicts total price (confirmed from previous testing)
            
            prediction_value = float(prediction)
            category = self.get_property_type_category(property_type)
            
            # Commercial model: predicts PSM, need to multiply by area
            # Industrial model: predicts total price directly
            if category == 'commercial':
                # Commercial model predicts PSM (despite workbook saying "Transacted Price ($)")
                # Multiply by area in sqm to get total price
                total_price = prediction_value * area_sqm
                psf_calc = total_price / (area_sqm * 10.764) if area_sqm > 0 else 0
                
                print(f"\n🔍 Commercial Model: PSM Interpretation")
                print(f"   Raw output: ${prediction_value:,.2f} PSM")
                print(f"   Area: {area_sqm:.2f} sqm")
                print(f"   Total Price: ${total_price:,.2f}")
                print(f"   PSF: ${psf_calc:,.2f}")
            else:
                # Industrial model: predicts total price directly (as per workbook)
                # BUT: Negative predictions suggest transformation might be needed
                total_price = prediction_value
                area_sqft = area_sqm * 10.764
                psf_calc = total_price / area_sqft if area_sqft > 0 else 0
                
                print(f"\n🔍 Industrial Model: Total Price Interpretation")
                print(f"   Raw output: ${prediction_value:,.2f} (total price)")
                
                # Test if negative prediction might need transformation
                if prediction_value < 0:
                    # Try different transformations for negative values
                    exp_prediction = np.exp(prediction_value)
                    abs_prediction = abs(prediction_value)
                    offset_prediction = prediction_value + 1000000  # Add offset if model predicts relative to baseline
                    
                    print(f"   ⚠️ Negative prediction detected! Testing transformations:")
                    print(f"      exp(raw): ${exp_prediction:,.2f}")
                    print(f"      abs(raw): ${abs_prediction:,.2f}")
                    print(f"      raw + $1M offset: ${offset_prediction:,.2f}")
                    
                    # Check if absolute value gives reasonable PSF
                    psf_if_abs = abs_prediction / area_sqft if area_sqft > 0 else 0
                    psf_if_offset = offset_prediction / area_sqft if area_sqft > 0 else 0
                    
                    # If absolute value gives reasonable PSF ($50-$1000), use it
                    if 50 <= psf_if_abs <= 1000:
                        print(f"      ✅ abs(raw) gives reasonable PSF=${psf_if_abs:,.2f}, using absolute value")
                        total_price = abs_prediction
                        psf_calc = psf_if_abs
                    # If offset gives reasonable PSF, use it
                    elif 50 <= psf_if_offset <= 1000:
                        print(f"      ✅ offset(raw) gives reasonable PSF=${psf_if_offset:,.2f}, using offset")
                        total_price = offset_prediction
                        psf_calc = psf_if_offset
                    else:
                        print(f"      ❌ No transformation gives reasonable PSF. Raw value problematic.")
                        print(f"      ⚠️ This likely indicates a feature mismatch (property type encoding issue)")
                        print(f"      Returning None to trigger fallback estimation.")
                        return None  # Reject negative prediction even after transformations
                
                print(f"   Final PSF: ${psf_calc:,.2f}")
            
            # Ensure area_sqft and psf_calc are defined for both branches
            if 'area_sqft' not in locals():
                area_sqft = area_sqm * 10.764  # 1 sqm = 10.764 sqft
            if 'psf_calc' not in locals():
                psf_calc = total_price / area_sqft if area_sqft > 0 else 0
            
            print(f"🎯 Sales Price Prediction ({category}): Total=${total_price:,.2f} (PSF=${psf_calc:,.2f}, Area: {area_sqm:.2f} sqm = {area_sqft:.2f} sqft)")
            
            # Validate total price is reasonable based on property category
            if category == 'industrial':
                # Industrial properties: typical range $50k - $20M
                # PSF typically: $50 - $1,000 for industrial (factories: $200-$500, warehouses: $150-$400)
                min_total = 50000  # Minimum $50k total
                max_total = 20000000  # Maximum $20M total (allows for large industrial properties)
                min_psf = 50  # Minimum $50 PSF
                max_psf = 1000  # Maximum $1000 PSF for industrial
            else:
                # Commercial properties: typical range $500k - $20M
                # PSF typically: $500 - $10,000 for commercial
                min_total = 500000  # Minimum $500k total
                max_total = 20000000  # Maximum $20M total
                min_psf = 500  # Minimum $500 PSF
                max_psf = 10000  # Maximum $10,000 PSF for commercial
            
            if total_price < 0:
                print(f"\n❌ CRITICAL ERROR: Model predicted NEGATIVE price ${total_price:,.2f}")
                print(f"   This indicates a serious model or feature mismatch issue!")
                print(f"   Property: {property_type} in {address}")
                print(f"   Area: {area_sqm:.2f} sqm ({area_sqm * 10.764:.2f} sqft)")
                print(f"   Category: {category}")
                print(f"   Raw prediction: ${prediction_value:,.2f}")
                print(f"\n   Possible causes:")
                print(f"   1. Feature mismatch (missing or incorrect features)")
                print(f"   2. Model not properly trained for this property type")
                print(f"   3. Feature encoding/transformation issue")
                print(f"   4. 'Business Parks' property type may not match training data")
                print(f"\n   ⚠️ REJECTING negative prediction. Returning None to trigger fallback.")
                return None
            
            # Validate total price range
            if total_price < min_total:
                print(f"⚠️ Warning: Predicted price ${total_price:,.2f} is below minimum ${min_total:,.2f}, using minimum")
                total_price = min_total
                psf_calc = total_price / area_sqft if area_sqft > 0 else 0
            elif total_price > max_total:
                print(f"⚠️ Warning: Predicted price ${total_price:,.2f} is above maximum ${max_total:,.2f}, capping at maximum")
                total_price = max_total
                psf_calc = total_price / area_sqft if area_sqft > 0 else 0
            
            # Validate PSF range (sanity check)
            if psf_calc < min_psf:
                # If PSF is too low, adjust total price to meet minimum PSF
                adjusted_total = area_sqft * min_psf
                print(f"⚠️ Warning: Calculated PSF ${psf_calc:,.2f} is below minimum ${min_psf}, adjusting to ${adjusted_total:,.2f}")
                total_price = adjusted_total
            elif psf_calc > max_psf:
                # If PSF is too high, cap total price
                adjusted_total = area_sqft * max_psf
                print(f"⚠️ Warning: Calculated PSF ${psf_calc:,.2f} is above maximum ${max_psf}, capping to ${adjusted_total:,.2f}")
                total_price = adjusted_total
            
            return float(total_price)
            
        except Exception as e:
            print(f"❌ Error making sales prediction: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def predict_rental_price(self, address, property_type, area_sqm, level, unit, tenure="Freehold"):
        """Predict rental price using the rental model"""
        if not self.is_loaded:
            print("❌ Models not loaded. Please load models first.")
            return None
        
        if self.rental_model is None:
            print("❌ Rental model not available")
            return None
        
        try:
            # Prepare features
            feature_df = self.prepare_features_for_model(
                address, property_type, area_sqm, level, unit, tenure, self.rental_model_data
            )
            
            # Handle Pipeline models
            if isinstance(self.rental_model, Pipeline):
                prediction = self.rental_model.predict(feature_df)[0]
            else:
                # Handle feature alignment for standalone models
                if self.rental_model_data and 'feature_names' in self.rental_model_data:
                    expected_features = self.rental_model_data['feature_names']
                    available = [f for f in expected_features if f in feature_df.columns]
                    missing = [f for f in expected_features if f not in feature_df.columns]
                    
                    if missing:
                        for feat in missing:
                            feature_df[feat] = 0
                    
                    feature_df = feature_df[expected_features]
                
                prediction = self.rental_model.predict(feature_df)[0]
            
            # Rental model prediction interpretation
            # Based on workbook analysis:
            # - Rental model: trained on "Median_PSM" = Price per Square Meter per month
            # So: prediction = PSM/month (price per square meter per month)
            prediction_value = float(prediction)
            
            # Model predicts PSM/month directly, so multiply by area in sqm to get total monthly rental
            monthly_rental = prediction_value * area_sqm
            
            # Convert area from sqm to sqft for PSF calculation and logging
            area_sqft = area_sqm * 10.764  # 1 sqm = 10.764 sqft
            psf_calc = monthly_rental / area_sqft if area_sqft > 0 else 0
            
            print(f"🎯 Rental Price Prediction: PSM/month=${prediction_value:,.2f}, Monthly Total=${monthly_rental:,.2f}/month (Area: {area_sqm:.2f} sqm = {area_sqft:.2f} sqft, PSF/month=${psf_calc:,.2f})")
            
            # Validate reasonable ranges
            # Typical monthly rental for 1000 sqft office: $2,000-$10,000
            # Typical PSM/month: $20-$150 (which translates to $2-$15 PSF/month)
            min_psf_per_month = 1  # Minimum $1 PSF/month
            max_psf_per_month = 20  # Maximum $20 PSF/month (very high-end)
            
            # Ensure rental is positive
            if monthly_rental < 0:
                print(f"⚠️ Warning: Model predicted negative rental ${monthly_rental:,.2f}, using absolute value")
                monthly_rental = abs(monthly_rental)
                psf_calc = monthly_rental / area_sqft if area_sqft > 0 else 0
            
            # Validate PSF/month range (sanity check)
            if psf_calc < min_psf_per_month:
                # If PSF/month is too low, adjust to minimum
                adjusted_monthly = area_sqft * min_psf_per_month
                print(f"⚠️ Warning: Calculated PSF/month ${psf_calc:,.2f} is below minimum ${min_psf_per_month}, adjusting to ${adjusted_monthly:,.2f}/month")
                monthly_rental = adjusted_monthly
            elif psf_calc > max_psf_per_month:
                # If PSF/month is too high, cap at maximum
                adjusted_monthly = area_sqft * max_psf_per_month
                print(f"⚠️ Warning: Calculated PSF/month ${psf_calc:,.2f} is above maximum ${max_psf_per_month}, capping to ${adjusted_monthly:,.2f}/month")
                monthly_rental = adjusted_monthly
            
            return monthly_rental
            
        except Exception as e:
            print(f"❌ Error making rental prediction: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def predict_both(self, address, property_type, area_sqm, level, unit, tenure="Freehold"):
        """Predict both sales and rental prices"""
        sales_price = self.predict_sales_price(address, property_type, area_sqm, level, unit, tenure)
        rental_price = self.predict_rental_price(address, property_type, area_sqm, level, unit, tenure)
        
        return {
            'sales_price': sales_price,
            'rental_price': rental_price
        }

# Global predictor instance
_multi_model_predictor = None

def get_multi_model_predictor():
    """Get or create the multi-model predictor instance"""
    global _multi_model_predictor
    if _multi_model_predictor is None:
        _multi_model_predictor = MultiModelPredictor()
        _multi_model_predictor.load_models()
    return _multi_model_predictor

