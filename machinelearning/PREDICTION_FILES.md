# Files Used for Property Price Predictions

This document lists all data files, model files, and Python modules used in the prediction pipeline.

## 📊 ML Models (PKL Files)

Location: `machinelearning/models/`

1. **`commercial_real_estate_model_final.pkl`**
   - Purpose: Predicts sales prices for commercial properties (Retail, Office, Shop House)
   - Predicts: Price per Square Meter (PSM)
   - Used for: Commercial property sales price predictions

2. **`industrial_real_estate_model_final.pkl`**
   - Purpose: Predicts sales prices for industrial properties (Factory, Warehouse, etc.)
   - Predicts: Total Price
   - Used for: Industrial property sales price predictions (Single-user Factory, Multiple-user Factory, Business Parks)

3. **`rental_model_final.pkl`**
   - Purpose: Predicts rental prices for both commercial and industrial properties
   - Predicts: Price per Square Meter per Month (PSM/month)
   - Used for: All property rental price predictions

---

## 📁 Transaction Data (CSV Files)

### Industrial Transaction Data
**File:** `machinelearning/industrial_2022toSep2025.csv`
- Purpose: Historical industrial property transaction data for market analysis
- Used for: 
  - Finding similar transactions
  - Calculating median PSF for validation
  - Market trend analysis
- Contains: Project name, street name, property type, price, area, unit price PSM, contract date, tenure, postal district, floor level, planning area

### Commercial Transaction Data
**File:** `machinelearning/commercial(everything teeco)/CommercialTransaction20250917124317.csv`
- Purpose: Historical commercial property transaction data for market analysis
- Used for:
  - Finding similar transactions
  - Calculating median PSF for validation
  - Market trend analysis
- Contains: Project name, street name, property type, transacted price, area (SQFT), unit price PSF, sale date, postal district, floor level

---

## 📋 Rental Market Data (CSV Files)

Location: `machinelearning/commercial(rental)/`

### Retail Rental Data
**File:** `CommercialRetailRental.csv` (3,755 records)
- Purpose: Market rental rates for retail properties
- Used for: Retail property rental validation and adjustment
- Contains:
  - Postal District
  - Floor Level (B1 & Below, Level 1, Level 2 & 3, Level 4 & Above)
  - Floor Area (SQM) ranges (30 & Below, >30-100, >100-300, >300)
  - Median ($PSM) rental rates
  - Reference Period (e.g., 2025Q2)

### Office Rental Data
**File:** `CommercialOfficeRental.csv` (356 records)
- Purpose: Market rental rates for office properties
- Used for: Office property rental validation and adjustment
- Contains:
  - Location (Central Area, Fringe Area, Outside Central Region)
  - Building Class (Category 1, Category 2)
  - Floor Area (SQM) ranges (100 & Below, >100-200, >200-500, >500-1000, >1000)
  - Median ($PSM) rental rates
  - Reference Period (e.g., 2025Q2)

---

## 🗺️ Geographic Reference Data

**File:** `machinelearning/sg cordinates/sg_postal_districts.csv`
- Purpose: Maps postal sectors (first 2 digits of postal code) to postal districts (1-28)
- Used for: Extracting postal district from address for filtering similar transactions
- Contains: Postal Sector, Postal District mapping

---

## 🐍 Python Modules (.py Files)

### Core Prediction Modules

1. **`backend/app.py`** (Main Backend)
   - Purpose: Flask application that handles API requests
   - Role: Entry point for predictions via `/api/predict-price` endpoint
   - Responsibilities:
     - Loads and caches all ML models and data files
     - Calls prediction functions from ML modules
     - Manages caching for performance (`_ml_cache`)
     - Returns formatted predictions to frontend
   - Key Functions:
     - `run_ml_prediction()`: Main prediction orchestrator
     - Loads all CSV files (industrial, commercial, rental data)
     - Imports and initializes ML predictor modules

2. **`machinelearning/multi_model_predictor.py`**
   - Purpose: Loads and manages the three ML models (Commercial, Industrial, Rental)
   - Role: Model loader and basic prediction interface
   - Key Functions:
     - `load_models()`: Loads all three .pkl model files
     - `predict_sales_price()`: Uses commercial or industrial model based on property type
     - `predict_rental_price()`: Uses rental model
     - `predict_both()`: Returns both sales and rental predictions
   - Model Files Used:
     - `commercial_real_estate_model_final.pkl`
     - `industrial_real_estate_model_final.pkl`
     - `rental_model_final.pkl`

3. **`machinelearning/ml_predictor_enhanced.py`** (Main Prediction Logic)
   - Purpose: Enhanced predictor with market validation and transaction analysis
   - Role: Orchestrates full prediction pipeline with validation
   - Key Functions:
     - `predict_for_propertycard()`: Main entry point for property card predictions
     - `analyze_industrial_market()`: Validates industrial predictions against transaction data
     - `analyze_commercial_market()`: Validates commercial predictions against transaction data
     - `find_market_rental_rate()`: Looks up rental rates from CSV files (Retail/Office only)
     - `get_unique_addresses()`: Extracts addresses from transaction data
   - Responsibilities:
     - Compares ML predictions with actual transaction medians
     - Adjusts predictions if difference >50% (blends with market data)
     - Finds similar transactions for display
     - Calculates market trends
     - Handles rental rate lookups and validation
     - Falls back to rule-of-thumb (0.4% of sales) for industrial rentals

4. **`machinelearning/ml_predictor.py`** (Legacy/Older Version)
   - Purpose: Appears to be an older version of the predictor
   - Status: May not be actively used in current pipeline
   - Note: Current system primarily uses `ml_predictor_enhanced.py`

---

## 📝 Summary

### For Sales Price Predictions:
1. **ML Models**: `commercial_real_estate_model_final.pkl` OR `industrial_real_estate_model_final.pkl` (based on property type)
2. **Validation Data**: 
   - Industrial → `industrial_2022toSep2025.csv`
   - Commercial → `CommercialTransaction20250917124317.csv`
3. **Geographic Data**: `sg_postal_districts.csv`

### For Rental Price Predictions:
1. **ML Model**: `rental_model_final.pkl`
2. **Validation Data** (if Retail/Office):
   - Retail → `CommercialRetailRental.csv`
   - Office → `CommercialOfficeRental.csv`
3. **Fallback**: Rule-of-thumb (0.4% of sales price per month) for Industrial and when market data unavailable

### Notes:
- Rental CSV data is **only used for Retail and Office** properties
- Industrial properties use rule-of-thumb calculation (0.4% of sales per month)
- All predictions are validated against actual transaction data before being returned
- ML predictions are adjusted if they differ >50% from market medians

---

## 🔄 Prediction Flow

```
Frontend Request
    ↓
backend/app.py (/api/predict-price)
    ↓
    1. Loads & caches:
       - ML models (.pkl files) via multi_model_predictor.py
       - Transaction CSV files (industrial, commercial)
       - Rental CSV files (retail, office)
       - Postal district mapping
    ↓
    2. Calls ml_predictor_enhanced.py:
       - predict_for_propertycard()
    ↓
    3. ml_predictor_enhanced.py:
       a) Gets ML predictions from multi_model_predictor.py
          - predict_sales_price() → uses commercial/industrial model
          - predict_rental_price() → uses rental model
    ↓
       b) Finds market rental rate (if Retail/Office):
          - find_market_rental_rate() → queries rental CSV files
    ↓
       c) Validates predictions:
          - analyze_industrial_market() → compares with industrial_2022toSep2025.csv
          - analyze_commercial_market() → compares with CommercialTransaction20250917124317.csv
    ↓
       d) Adjusts if needed (>50% difference):
          - Blends ML prediction with market median
    ↓
    4. Returns formatted result to backend/app.py
    ↓
    5. backend/app.py returns JSON to frontend
```

