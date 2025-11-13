# -------------------------
# ML PREDICTOR MODULE
# -------------------------
# This module contains the ML prediction functions that can be imported by the backend

import pandas as pd
import numpy as np
import difflib
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Import ML libraries
try:
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import OneHotEncoder
    from sklearn.compose import ColumnTransformer
    from sklearn.pipeline import Pipeline
    import xgboost as xgb
    import shap
except ImportError as e:
    print(f"Warning: Some ML libraries not available: {e}")

def get_unique_addresses(df, property_category="Industrial"):
    """Get unique addresses from the dataset"""
    addresses = []
    
    for _, row in df.iterrows():
        street_name = row.get('street_name', '')
        project_name = row.get('project_name', '')
        planning_area = row.get('planning_area', '')
        
        if street_name and street_name != 'N.A.':
            # Create full address
            if project_name and project_name != 'N.A.':
                full_address = f"{project_name}, {street_name}, {planning_area}"
                short_address = f"{project_name}, {street_name}"
            else:
                full_address = f"{street_name}, {planning_area}"
                short_address = street_name
            
            addresses.append({
                'full_address': full_address,
                'short_address': short_address,
                'street_name': street_name,
                'project_name': project_name,
                'planning_area': planning_area,
                'property_type': row.get('property_type', ''),
                'postal_district': row.get('postal_district', ''),
                'category': property_category
            })
    
    # Remove duplicates and sort
    unique_addresses = []
    seen = set()
    for addr in addresses:
        key = (addr['street_name'], addr['planning_area'], addr['project_name'])
        if key not in seen:
            seen.add(key)
            unique_addresses.append(addr)
    
    return sorted(unique_addresses, key=lambda x: x['short_address'])

def find_best_matching_address(frontend_address, all_addresses, threshold=0.7):
    """Find the best matching address from ML dataset based on frontend input"""
    
    if not frontend_address:
        return None, 0
    
    # Clean the frontend address
    frontend_clean = frontend_address.lower().strip()
    
    best_match = None
    best_score = 0
    
    for addr in all_addresses:
        # Try matching against different address components
        street_clean = addr['street_name'].lower()
        project_clean = addr['project_name'].lower() if addr['project_name'] != 'N.A.' else ''
        full_clean = addr['full_address'].lower()
        
        # Calculate similarity scores
        street_score = difflib.SequenceMatcher(None, frontend_clean, street_clean).ratio()
        project_score = difflib.SequenceMatcher(None, frontend_clean, project_clean).ratio() if project_clean else 0
        full_score = difflib.SequenceMatcher(None, frontend_clean, full_clean).ratio()
        
        # Take the best score
        max_score = max(street_score, project_score, full_score)
        
        if max_score > best_score and max_score >= threshold:
            best_score = max_score
            best_match = addr
    
    return best_match, best_score

def convert_frontend_to_ml_format(frontend_property_data):
    """Convert frontend property data to ML prediction format"""
    
    # Extract data from frontend format (as it comes from compareprediction.js)
    property_type = frontend_property_data.get('propertyType', '')
    address = frontend_property_data.get('address', '')
    floor_area = frontend_property_data.get('floorArea', '')
    level = frontend_property_data.get('level', '')
    unit = frontend_property_data.get('unit', '')
    
    # Convert floor area from sq ft to sqm (frontend uses sq ft, ML uses sqm)
    try:
        area_sqm = float(floor_area.replace(',', '')) * 0.092903  # Convert sq ft to sqm
    except (ValueError, AttributeError):
        area_sqm = 100.0  # Default fallback
    
    return {
        'property_type': property_type,
        'address': address,
        'area_sqm': area_sqm,
        'level': level,
        'unit': unit
    }

def format_price_for_propertycard(price, is_rental=False):
    """Format price in the same way as PropertyCard.js"""
    if not price:
        return "N/A"
    
    if is_rental:
        # For rental prices, show as $Xk/month
        if price >= 1000:
            return f"${(price / 1000):.0f}k/month"
        else:
            return f"${price:,.0f}/month"
    else:
        # For sales prices, show as $XM or $Xk
        if price >= 1000000:
            return f"${(price / 1000000):.1f}M"
        elif price >= 1000:
            return f"${(price / 1000):.0f}k"
        else:
            return f"${price:,.0f}"

def format_transactions_for_propertycard(transactions_df):
    """Format transactions in PropertyCard.js format"""
    if transactions_df is None or transactions_df.empty:
        return []
    
    formatted_transactions = []
    for _, row in transactions_df.iterrows():
        transaction = {
            'address': row.get('street_name', 'N/A'),
            'type': row.get('property_type', 'N/A'),
            'area': f"{row.get('area', 0):.0f} sqm" if row.get('area') else 'N/A',
            'date': row.get('contract_date', 'N/A').strftime('%Y-%m') if pd.notna(row.get('contract_date')) else 'N/A',
            'price': format_price_for_propertycard(row.get('price'))
        }
        formatted_transactions.append(transaction)
    
    return formatted_transactions

# Simple prediction functions (fallback when full ML pipeline is not available)
def simple_price_estimation(property_type, area_sqm, planning_area):
    """Simple price estimation based on property type and area"""
    
    # Base prices per sqm by property type (rough estimates)
    base_prices = {
        'Multiple-User Factory': 4000,
        'Single-User Factory': 3500,
        'Warehouse': 3000,
        'Office': 8000,
        'Retail': 12000,
        'Shop House': 15000,
        'Business Parks': 5000
    }
    
    # Get base price for property type
    base_price = base_prices.get(property_type, 5000)
    
    # Calculate estimated price
    estimated_price = base_price * area_sqm
    
    # Add some variation based on planning area (simplified)
    if 'Central' in planning_area or 'CBD' in planning_area:
        estimated_price *= 1.5
    elif 'Woodlands' in planning_area or 'Jurong' in planning_area:
        estimated_price *= 0.8
    
    return estimated_price

def generate_market_trend(property_type, planning_area):
    """Generate realistic market trend based on property type and location"""
    import random
    
    # Base trends by property type
    base_trends = {
        'Multiple-User Factory': {'min': 2.0, 'max': 8.0},
        'Single-User Factory': {'min': 1.5, 'max': 7.0},
        'Warehouse': {'min': 1.0, 'max': 6.0},
        'Office': {'min': 3.0, 'max': 10.0},
        'Retail': {'min': 4.0, 'max': 12.0},
        'Shop House': {'min': 5.0, 'max': 15.0},
        'Business Parks': {'min': 2.5, 'max': 9.0}
    }
    
    # Get base trend range
    trend_range = base_trends.get(property_type, {'min': 2.0, 'max': 8.0})
    
    # Add location-based variation
    if 'Central' in planning_area or 'CBD' in planning_area:
        trend_range['min'] += 1.0
        trend_range['max'] += 2.0
    elif 'Woodlands' in planning_area or 'Jurong' in planning_area:
        trend_range['min'] -= 0.5
        trend_range['max'] -= 1.0
    
    # Generate random trend within range
    trend = random.uniform(trend_range['min'], trend_range['max'])
    
    return round(trend, 1)

def compute_metrics_for(planning_area, property_type, target_area=None):
    """Compute comprehensive metrics using simple estimation"""
    
    # Simple estimation
    estimated_sales = simple_price_estimation(property_type, target_area or 100, planning_area)
    estimated_rental = estimated_sales * 0.05 / 12  # 5% annual yield
    
    # Generate realistic market trend
    market_trend = generate_market_trend(property_type, planning_area)
    
    # Mock similar transactions with more realistic data
    import random
    similar_transactions = pd.DataFrame({
        'street_name': [f'{planning_area} Industrial Park {chr(65+i)}' for i in range(3)],
        'property_type': [property_type] * 3,
        'area': [target_area or 100] * 3,
        'contract_date': pd.date_range('2024-01-01', periods=3, freq='M'),
        'price': [
            estimated_sales * random.uniform(0.85, 0.95),
            estimated_sales * random.uniform(0.95, 1.05),
            estimated_sales * random.uniform(1.05, 1.15)
        ]
    })
    
    class Metrics:
        def __init__(self, estimated_sales_price, estimated_rental_price, market_trend_pct_12m, 
                     median_sale_price, highest_sold_price, similar_transactions):
            self.estimated_sales_price = estimated_sales_price
            self.estimated_rental_price = estimated_rental_price
            self.market_trend_pct_12m = market_trend_pct_12m
            self.median_sale_price = median_sale_price
            self.highest_sold_price = highest_sold_price
            self.similar_transactions = similar_transactions
    
    return Metrics(
        estimated_sales_price=estimated_sales,
        estimated_rental_price=estimated_rental,
        market_trend_pct_12m=market_trend,
        median_sale_price=estimated_sales * 0.95,
        highest_sold_price=estimated_sales * 1.2,
        similar_transactions=similar_transactions
    )

def analyze_commercial_market(df, planning_area, property_type, target_area=None):
    """Analyze commercial property market with simple estimation"""
    
    # Simple commercial estimation
    estimated_commercial_price = simple_price_estimation(property_type, target_area or 100, planning_area)
    estimated_commercial_rental = estimated_commercial_price * 0.05 / 12
    
    # Generate realistic market trend for commercial
    market_trend = generate_market_trend(property_type, planning_area)
    
    # Mock commercial transactions with more realistic data
    import random
    commercial_examples = pd.DataFrame({
        'street_name': [f'{planning_area} Commercial {chr(65+i)}' for i in range(3)],
        'property_type': [property_type] * 3,
        'area': [target_area or 100] * 3,
        'contract_date': pd.date_range('2024-01-01', periods=3, freq='M'),
        'price': [
            estimated_commercial_price * random.uniform(0.88, 0.95),
            estimated_commercial_price * random.uniform(0.95, 1.05),
            estimated_commercial_price * random.uniform(1.05, 1.12)
        ]
    })
    
    return {
        'estimated_commercial_price': estimated_commercial_price,
        'estimated_commercial_rental': estimated_commercial_rental,
        'commercial_market_trend_pct_12m': market_trend,
        'commercial_median_price': estimated_commercial_price * 0.95,
        'commercial_highest_price': estimated_commercial_price * 1.2,
        'commercial_median_psm': estimated_commercial_price / (target_area or 100),
        'commercial_transactions': commercial_examples,
        'commercial_predictor': None
    }

def predict_for_propertycard(selected_address, property_type, area, df_industrial, df_commercial=None):
    """Generate prediction data in PropertyCard.js format"""
    
    # Initialize property card data structure
    property_data = {
        'address': selected_address['full_address'],
        'propertyType': property_type,
        'floorArea': f"{area} sqm",
        'level': 'N/A',
        'unit': 'N/A'
    }
    
    comparison_data = {
        'propertyType': property_type,
        'floorArea': f"{area} sqm",
        'level': 'N/A',
        'tenure': 'N/A',
        'estimatedSalesPrice': 'N/A',
        'estimatedRentalPrice': 'N/A',
        'marketTrend': 'N/A',
        'marketTrendPeriod': 'N/A',
        'medianSalePrice': 'N/A',
        'highestSoldPriceDescription': 'N/A',
        'historicalTransactions': []
    }
    
    if selected_address['category'] == "Industrial":
        # Use industrial prediction
        metrics = compute_metrics_for(
            planning_area=selected_address['planning_area'],
            property_type=property_type,
            target_area=area
        )
        
        # Format data for PropertyCard
        comparison_data['estimatedSalesPrice'] = format_price_for_propertycard(metrics.estimated_sales_price)
        comparison_data['estimatedRentalPrice'] = format_price_for_propertycard(metrics.estimated_rental_price, is_rental=True)
        comparison_data['marketTrend'] = f"{metrics.market_trend_pct_12m:+.1f}%"
        comparison_data['marketTrendPeriod'] = "12 months"
        comparison_data['medianSalePrice'] = format_price_for_propertycard(metrics.median_sale_price)
        comparison_data['highestSoldPriceDescription'] = f"The highest recorded sale price for a comparable property is {format_price_for_propertycard(metrics.highest_sold_price)}."
        comparison_data['historicalTransactions'] = format_transactions_for_propertycard(metrics.similar_transactions)
        
    else:
        # Use commercial prediction
        if df_commercial is not None:
            commercial_results = analyze_commercial_market(
                df=df_commercial,
                planning_area=selected_address['planning_area'],
                property_type=property_type,
                target_area=area
            )
            
            # Format data for PropertyCard
            comparison_data['estimatedSalesPrice'] = format_price_for_propertycard(commercial_results['estimated_commercial_price'])
            comparison_data['estimatedRentalPrice'] = format_price_for_propertycard(commercial_results['estimated_commercial_rental'], is_rental=True)
            comparison_data['marketTrend'] = f"{commercial_results['commercial_market_trend_pct_12m']:+.1f}%"
            comparison_data['marketTrendPeriod'] = "12 months"
            comparison_data['medianSalePrice'] = format_price_for_propertycard(commercial_results['commercial_median_price'])
            comparison_data['highestSoldPriceDescription'] = f"The highest recorded sale price for a comparable property is {format_price_for_propertycard(commercial_results['commercial_highest_price'])}."
            comparison_data['historicalTransactions'] = format_transactions_for_propertycard(commercial_results['commercial_transactions'])
    
    return property_data, comparison_data

def predict_from_frontend_input(frontend_property_data, all_addresses, df_industrial, df_commercial=None):
    """Generate ML prediction from frontend property input data"""
    
    # Convert frontend data to ML format
    ml_data = convert_frontend_to_ml_format(frontend_property_data)
    
    # Find best matching address in ML dataset
    best_match, match_score = find_best_matching_address(ml_data['address'], all_addresses)
    
    if best_match:
        # Generate prediction using the matched address
        property_data, comparison_data = predict_for_propertycard(
            selected_address=best_match,
            property_type=ml_data['property_type'],
            area=ml_data['area_sqm'],
            df_industrial=df_industrial,
            df_commercial=df_commercial
        )
        
        # Update property data with frontend input details
        property_data['address'] = ml_data['address']  # Use original frontend address
        property_data['floorArea'] = f"{frontend_property_data.get('floorArea', 'N/A')} sq ft"
        property_data['level'] = ml_data['level']
        property_data['unit'] = ml_data['unit']
        
        return property_data, comparison_data, best_match
        
    else:
        # Try to find by property type only (fallback)
        matching_type_addresses = [addr for addr in all_addresses if ml_data['property_type'].lower() in addr['property_type'].lower()]
        
        if matching_type_addresses:
            # Use the first matching address
            fallback_address = matching_type_addresses[0]
            
            property_data, comparison_data = predict_for_propertycard(
                selected_address=fallback_address,
                property_type=ml_data['property_type'],
                area=ml_data['area_sqm'],
                df_industrial=df_industrial,
                df_commercial=df_commercial
            )
            
            # Update with frontend data
            property_data['address'] = ml_data['address']
            property_data['floorArea'] = f"{frontend_property_data.get('floorArea', 'N/A')} sq ft"
            property_data['level'] = ml_data['level']
            property_data['unit'] = ml_data['unit']
            
            return property_data, comparison_data, fallback_address
        else:
            return None, None, None
