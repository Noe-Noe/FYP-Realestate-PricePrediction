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
                    # Handle property-type-specific models (new format)
                    if isinstance(model_data, dict) and model_data.get('is_property_type_specific'):
                        # Property-type-specific models: model_data['model'] is a dict of {property_type: model_info}
                        self.commercial_model = model_data.get('model')  # Dictionary of property-type models
                        self.commercial_model_data = model_data
                        property_types = model_data.get('property_types', [])
                        print(f"✅ Commercial model loaded (property-type-specific): {commercial_path}")
                        print(f"   Property types: {property_types}")
                        for prop_type in property_types:
                            if prop_type in model_data.get('model_info', {}):
                                info = model_data['model_info'][prop_type]
                                print(f"      {prop_type}: {info.get('n_features', '?')} features, R²={info.get('performance', {}).get('r2', 0):.4f}")
                    elif isinstance(model_data, dict):
                        # Single combined model (old format - less accurate)
                        self.commercial_model = model_data.get('model') or model_data.get('regressor') or model_data.get('pipeline')
                        self.commercial_model_data = model_data
                        print(f"✅ Commercial model loaded (single combined model): {commercial_path}")
                        print(f"   ⚠️ WARNING: Using less accurate combined model. Consider retraining with property-type-specific models.")
                    elif hasattr(model_data, 'predict'):
                        # Direct model object
                        self.commercial_model = model_data
                        self.commercial_model_data = {'model': model_data}
                        print(f"✅ Commercial model loaded: {commercial_path}")
                    else:
                        self.commercial_model = model_data
                        self.commercial_model_data = {'model': model_data}
                    print(f"✅ Commercial model loaded: {commercial_path}")
                except Exception as e:
                    print(f"⚠️ Error loading commercial model: {e}")
                    import traceback
                    traceback.print_exc()
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
            # Check if using property-type-specific models
            if (self.commercial_model_data and 
                self.commercial_model_data.get('is_property_type_specific') and
                isinstance(self.commercial_model, dict)):
                # Property-type-specific models: select the right one
                # Normalize property type name to match training data
                prop_type_normalized = self._normalize_property_type_for_commercial(property_type)
                
                if prop_type_normalized in self.commercial_model:
                    model_info = self.commercial_model[prop_type_normalized]
                    return model_info['model'], {
                        'model': model_info['model'],
                        'property_type': prop_type_normalized,
                        'feature_names_after_encoding': model_info['feature_names_after_encoding'],
                        'feature_columns': model_info['feature_columns'],
                        'categorical_columns': model_info['categorical_columns'],
                        'imputer': model_info['imputer'],
                        'is_property_type_specific': True,
                        'model_info': self.commercial_model_data.get('model_info', {}).get(prop_type_normalized, {})
                    }
                else:
                    # Fallback: use first available model or Office (most common)
                    available_types = list(self.commercial_model.keys())
                    fallback_type = 'Office' if 'Office' in available_types else available_types[0]
                    print(f"⚠️ Property type '{prop_type_normalized}' not found, using '{fallback_type}' model")
                    model_info = self.commercial_model[fallback_type]
                    return model_info['model'], {
                        'model': model_info['model'],
                        'property_type': fallback_type,
                        'feature_names_after_encoding': model_info['feature_names_after_encoding'],
                        'feature_columns': model_info['feature_columns'],
                        'categorical_columns': model_info['categorical_columns'],
                        'imputer': model_info['imputer'],
                        'is_property_type_specific': True,
                        'model_info': self.commercial_model_data.get('model_info', {}).get(fallback_type, {})
                    }
            else:
                # Single combined model (old format)
                return self.commercial_model, self.commercial_model_data
        elif category == 'industrial':
            return self.industrial_model, self.industrial_model_data
        else:
            return self.commercial_model, self.commercial_model_data  # Default
    
    def _normalize_property_type_for_commercial(self, property_type):
        """Normalize property type name to match training data format"""
        prop_type_lower = property_type.lower().strip()
        
        # Map variations to training data format
        if 'shop' in prop_type_lower and 'house' in prop_type_lower:
            return 'Shop House'
        elif 'retail' in prop_type_lower:
            return 'Retail'
        elif 'office' in prop_type_lower:
            return 'Office'
        else:
            # Default to Office (most common)
            return 'Office'
    
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
        
        # Region classification (matches notebook format exactly: 'Central Core', 'Rest Central', 'City Fringe', 'Outside Central')
        if postal_district <= 9:
            region_classification = 'Central Core'
        elif postal_district <= 16:
            region_classification = 'Rest Central'
        elif postal_district <= 21:
            region_classification = 'City Fringe'
        elif postal_district <= 28:
            region_classification = 'Outside Central'
        else:
            region_classification = 'Unknown'
        
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
            
            # Check if using property-type-specific models
            if model_data.get('is_property_type_specific'):
                # Property-type-specific model: use exact feature preparation from training
                feature_columns = model_data.get('feature_columns', [])
                categorical_columns = model_data.get('categorical_columns', [])
                expected_features = model_data.get('feature_names_after_encoding', [])
                imputer = model_data.get('imputer')
                
                # Step 1: Add all features that might be in training data
                # Add missing features with sensible defaults based on feature names
                for col in feature_columns:
                    if col not in feature_df.columns:
                        # Try to infer value or use default based on feature name
                        if 'Project Name' in col:
                            feature_df[col] = 'N.A.'
                        elif 'Planning Area' in col:
                            feature_df[col] = general_location
                        elif 'Region' in col:
                            feature_df[col] = region_classification
                        elif 'Area (SQFT)' in col:
                            feature_df[col] = area_sqm * 10.764  # Convert sqm to sqft
                        elif 'sale_date' in col.lower() or 'sale_year' in col.lower() or 'sale_month' in col.lower():
                            # Use current date if sale date features exist
                            import datetime
                            now = datetime.datetime.now()
                            if 'sale_year' in col.lower():
                                feature_df[col] = now.year
                            elif 'sale_month' in col.lower():
                                feature_df[col] = now.month
                            elif 'sale_quarter' in col.lower():
                                feature_df[col] = (now.month - 1) // 3 + 1
                            elif 'days_since' in col.lower():
                                feature_df[col] = 0  # Default to 0
                            else:
                                feature_df[col] = 0
                        elif 'is_' in col.lower() or col.lower().startswith('type_'):
                            # Binary/indicator features
                            feature_df[col] = 0
                        elif 'Floor_Category' in col:
                            # Floor category (already handled by Floor_Low, etc.)
                            feature_df[col] = 'floors_01_05'  # Default
                        else:
                            feature_df[col] = 0  # Default for numeric
                
                # Select only the feature_columns used during training
                feature_df_filtered = feature_df[[col for col in feature_columns if col in feature_df.columns]].copy()
                
                # Step 2: One-hot encode categorical features EXACTLY as in training (pd.get_dummies with drop_first=True)
                if categorical_columns:
                    # Use pd.get_dummies with drop_first=True (same as training)
                    feature_df_encoded = pd.get_dummies(
                        feature_df_filtered, 
                        columns=[col for col in categorical_columns if col in feature_df_filtered.columns],
                        drop_first=True
                    )
                else:
                    feature_df_encoded = feature_df_filtered.copy()
                
                # Step 3: Apply imputer (same as training)
                if imputer:
                    try:
                        feature_df_imputed = pd.DataFrame(
                            imputer.transform(feature_df_encoded),
                            columns=feature_df_encoded.columns,
                            index=feature_df_encoded.index
                        )
                    except Exception as e:
                        print(f"⚠️ Imputer transform failed: {e}, filling NaN with 0")
                        feature_df_imputed = feature_df_encoded.fillna(0)
                else:
                    feature_df_imputed = feature_df_encoded.fillna(0)
                
                # Step 4: Ensure all expected features are present (add missing with 0)
                for feat in expected_features:
                    if feat not in feature_df_imputed.columns:
                        feature_df_imputed[feat] = 0
                
                # Step 5: Reorder to match exact training feature order
                if expected_features:
                    feature_df = feature_df_imputed[expected_features]
                else:
                    feature_df = feature_df_imputed
                
                print(f"   Property-type-specific features: {len(feature_columns)} base → {len(expected_features)} after encoding")
            
            # Check if model is a Pipeline (sklearn pipeline includes preprocessing)
            elif isinstance(model_obj, Pipeline):
                # Pipeline handles preprocessing automatically, just return base features
                return feature_df
            
            # Check if model_data has feature names or preprocessor info (old format - single combined model)
            elif 'feature_names' in model_data:
                expected_features = model_data['feature_names']
                
                # One-hot encode categorical features using pd.get_dummies (same as training)
                categorical_cols = ['Property Type', 'Type of Area', 'Tenure', 
                                   'General_Location', 'Region_Classification',
                                   'Project Name', 'Planning Area', 'Region', 'Street Name']
                
                # Step 1: Add missing base features that might be in training data
                for col in categorical_cols:
                    if col not in feature_df.columns:
                        if 'Project Name' in col:
                            feature_df[col] = 'N.A.'
                        elif 'Planning Area' in col:
                            feature_df[col] = general_location
                        elif 'Region' in col:
                            feature_df[col] = region_classification
                        elif 'Street Name' in col:
                            # Extract street name from address
                            import re
                            street_match = re.search(r'([A-Z\s]+(?:STREET|ROAD|AVENUE|LANE|WAY|DRIVE|CRESCENT|PLACE|QUAY|WALK|CLOSE|PARK|GREEN|VIEW|GARDEN|CIRCUIT|RISE|HILL|GATE|LOOP|TERRACE|LINK|BOULEVARD|SQUARE|PROMENADE|CONCOURSE|CIRCLE|BEND|PASSAGE|GROVE|CORNER|PARKWAY|VILLAS|ESTATE|GARDENS|HEIGHTS|CREST|VIEWS|VALE|RIDGE|GREEN|PARKWAY|GARDENS|ESTATE|HEIGHTS|CREST|VIEWS|VALE|RIDGE))', address, re.IGNORECASE)
                            feature_df[col] = street_match.group(1).strip() if street_match else 'UNKNOWN STREET'
                
                # Add missing numeric features that might be in training data
                numeric_features_to_add = ['Area (SQFT)', 'sale_year', 'sale_month', 'sale_quarter', 
                                         'sale_dayofweek', 'days_since_first_sale', 'sale_date_missing',
                                         'Floor_Category_ML', 'Urban_Classification']
                for col in numeric_features_to_add:
                    if col not in feature_df.columns:
                        if 'Area (SQFT)' in col:
                            feature_df[col] = area_sqm * 10.764
                        elif 'sale_' in col.lower():
                            import datetime
                            now = datetime.datetime.now()
                            if 'sale_year' in col.lower():
                                feature_df[col] = now.year
                            elif 'sale_month' in col.lower():
                                feature_df[col] = now.month
                            elif 'sale_quarter' in col.lower():
                                feature_df[col] = (now.month - 1) // 3 + 1
                            elif 'sale_dayofweek' in col.lower():
                                feature_df[col] = now.weekday()
                            elif 'days_since' in col.lower():
                                feature_df[col] = 0
                            elif 'sale_date_missing' in col.lower():
                                feature_df[col] = 0
                        elif 'Floor_Category' in col:
                            feature_df[col] = 'floors_01_05'  # Default
                        elif 'Urban_Classification' in col:
                            # Infer from CBD distance
                            if cbd_distance <= 5:
                                feature_df[col] = 'CBD'
                            elif cbd_distance <= 10:
                                feature_df[col] = 'Urban'
                            elif cbd_distance <= 20:
                                feature_df[col] = 'Suburban'
                            else:
                                feature_df[col] = 'Rural'
                
                # Step 2: One-hot encode categorical features using pd.get_dummies (same as training)
                # Create a temporary dataframe with all numeric and categorical columns
                temp_df = feature_df.copy()
                
                # One-hot encode categorical columns (same method as training: pd.get_dummies with drop_first=True)
                categorical_cols_present = [col for col in categorical_cols if col in temp_df.columns]
                if categorical_cols_present:
                    temp_df_encoded = pd.get_dummies(
                        temp_df, 
                        columns=categorical_cols_present,
                        drop_first=True
                    )
                else:
                    temp_df_encoded = temp_df.copy()
                
                # Step 3: Match expected features (one-hot encoded columns)
                for feat_name in expected_features:
                    if feat_name not in temp_df_encoded.columns:
                        # Check if it's a one-hot encoded column that wasn't created
                        matched = False
                        for col in categorical_cols:
                            if feat_name.startswith(f'{col}_'):
                                # This is a one-hot column - check if base column exists
                                if col in temp_df.columns:
                                    # Try to create it using pd.get_dummies again
                                    value = str(temp_df[col].iloc[0])
                                    category_value = feat_name.replace(f'{col}_', '')
                                    # Set to 1 if it matches our value, 0 otherwise
                                    temp_df_encoded[feat_name] = 1 if str(category_value) == str(value) else 0
                                else:
                                    temp_df_encoded[feat_name] = 0
                                matched = True
                                break
                        
                        if not matched:
                            # Not a one-hot column, might be numeric or other feature
                            temp_df_encoded[feat_name] = 0
                
                # Step 4: Reorder to match expected feature order
                for feat in expected_features:
                    if feat not in temp_df_encoded.columns:
                        temp_df_encoded[feat] = 0
                
                feature_df = temp_df_encoded[expected_features]
            
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
            # NOTE: Commercial notebook trains on 'Unit Price ($ PSF)' - so model predicts PSF directly!
            # The notebook Cell 34 shows: target_column = 'Unit Price ($ PSF)'
            # So the model output is already in PSF (Price per Square Foot)
            
            prediction_value = float(prediction)
            category = self.get_property_type_category(property_type)
            
            # Commercial model: predicts PSF directly (as per notebook training target)
            # Industrial model: may predict total price or PSF depending on training
            if category == 'commercial':
                # Commercial model predicts PSF directly (target was 'Unit Price ($ PSF)')
                # Calculate total price from PSF
                area_sqft = area_sqm * 10.764  # 1 sqm = 10.764 sqft
                psf_calc = prediction_value  # Model already predicts PSF
                total_price = psf_calc * area_sqft
                
                print(f"\n🔍 Commercial Model: PSF Interpretation (matches notebook)")
                print(f"   Raw output: ${prediction_value:,.2f} PSF (direct prediction)")
                print(f"   Area: {area_sqm:.2f} sqm ({area_sqft:.2f} sqft)")
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
            # - Rental notebook converts PSM to PSF: df[col] = (df[col] / 10.7639).round(2)
            # - Then trains on "Median_PSF" = Price per Square Foot per month
            # So: prediction = PSF/month (price per square foot per month)
            prediction_value = float(prediction)
            
            # Model predicts PSF/month directly (after notebook conversion from PSM to PSF)
            # Convert area from sqm to sqft for calculation
            area_sqft = area_sqm * 10.764  # 1 sqm = 10.764 sqft
            psf_per_month = prediction_value  # Model already predicts PSF/month
            monthly_rental = psf_per_month * area_sqft
            
            print(f"🎯 Rental Price Prediction: PSF/month=${psf_per_month:,.2f}, Monthly Total=${monthly_rental:,.2f}/month (Area: {area_sqm:.2f} sqm = {area_sqft:.2f} sqft)")
            
            # Validate reasonable ranges
            # Typical monthly rental for 1000 sqft office: $2,000-$10,000
            # Typical PSM/month: $20-$150 (which translates to $2-$15 PSF/month)
            min_psf_per_month = 1  # Minimum $1 PSF/month
            max_psf_per_month = 20  # Maximum $20 PSF/month (very high-end)
            
            # Ensure rental is positive
            if monthly_rental < 0:
                print(f"⚠️ Warning: Model predicted negative rental ${monthly_rental:,.2f}, using absolute value")
                monthly_rental = abs(monthly_rental)
                psf_per_month = monthly_rental / area_sqft if area_sqft > 0 else 0
            
            # Validate PSF/month range (sanity check)
            if psf_per_month < min_psf_per_month:
                # If PSF/month is too low, adjust to minimum
                adjusted_monthly = area_sqft * min_psf_per_month
                print(f"⚠️ Warning: Predicted PSF/month ${psf_per_month:,.2f} is below minimum ${min_psf_per_month}, adjusting to ${adjusted_monthly:,.2f}/month")
                monthly_rental = adjusted_monthly
                psf_per_month = min_psf_per_month
            elif psf_per_month > max_psf_per_month:
                # If PSF/month is too high, cap at maximum
                adjusted_monthly = area_sqft * max_psf_per_month
                print(f"⚠️ Warning: Predicted PSF/month ${psf_per_month:,.2f} is above maximum ${max_psf_per_month}, capping to ${adjusted_monthly:,.2f}/month")
                monthly_rental = adjusted_monthly
                psf_per_month = max_psf_per_month
            
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

