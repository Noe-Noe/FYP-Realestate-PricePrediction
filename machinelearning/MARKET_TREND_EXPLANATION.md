# Market Trend Calculation - How It Works

This document explains how market trends are calculated and displayed in the application.

---

## Overview

Market trends show the price change percentage over a 4-year period (e.g., "+15.3%"). The system uses a **three-tier fallback approach** to calculate trends, trying the most accurate method first and falling back if data is insufficient.

---

## Three-Tier Calculation Approach

### Tier 1: Data-Based Trend (Most Accurate) ✅

**Function:** `calculate_ml_based_trend_with_data()`

**How It Works:**
1. **Filters Historical Transactions:**
   - Same property type as the property being analyzed
   - Same postal district (if available)
   - Last 4 years of transactions (minimum 5 transactions required)

2. **Groups Data by Year:**
   - Extracts year from `contract_date`
   - Calculates average price per year
   - Requires at least 2 years of data

3. **Calculates Linear Regression:**
   ```python
   slope, intercept, r_value, p_value, std_err = stats.linregress(normalized_years, prices)
   ```
   - Uses scipy's linear regression to find price trend line
   - Normalizes years to start from 0 for better regression fit

4. **Calculates Percentage Change:**
   ```python
   trend_percentage = ((end_price - start_price) / start_price) * 100
   ```
   - Compares first year average price vs. last year average price
   - Returns as percentage (e.g., "+15.3%" or "-2.1%")

5. **Data Quality Metrics:**
   - Logs R² (coefficient of determination) to measure fit quality
   - Shows number of transactions used
   - Example: `"📊 Data-based trend calculated: +15.3% over 3 years using 47 transactions (R²=0.823)"`

**Example Output:** `"+15.3%"` (meaning prices increased 15.3% over the period)

**Data Source:**
- **Commercial:** `machinelearning/commercial(everything teeco)/CommercialTransaction20250917124317.csv`
- **Industrial:** `machinelearning/industrial_2022toSep2025.csv`

**When Used:** 
- ✅ When there are ≥5 transactions in the past 4 years
- ✅ When transactions match property type and postal district
- ✅ When there are ≥2 years of data with transactions

---

### Tier 2: Historical Trend (Broader Data) 📊

**Function:** `calculate_historical_trend()`

**How It Works:**
1. **Broader Filtering:**
   - Same property type AND planning area
   - If no match, tries just property type
   - If still no match, tries just planning area
   - Optional: postal district filter

2. **Time Window:**
   - Last 4 years of transactions
   - Minimum 10 transactions required (less strict than Tier 1)

3. **Grouping & Regression:**
   - Groups by year, calculates average price per year
   - Uses linear regression on year vs. average price
   - Calculates percentage change from first to last year

4. **Fallback Logic:**
   - If <10 transactions in past 4 years, uses all available data
   - If <2 years of data, falls back to Tier 3

**Example Output:** `"+12.5%"`

**When Used:**
- When Tier 1 fails (insufficient district-specific data)
- When there's broader market data available
- When at least 2 years of data exist

---

### Tier 3: ML-Based Trend Simulation (Fallback) 🤖

**Function:** `calculate_ml_based_trend()`

**How It Works:**
1. **Gets Current ML Prediction:**
   - Uses the ML model to predict current price for the property

2. **Simulates Historical Prices:**
   - Applies market adjustments to simulate past prices:
     ```python
     market_adjustments = [
         -0.15,  # 4 years ago: -15% from current
         -0.10,  # 3 years ago: -10% from current  
         -0.05,  # 2 years ago: -5% from current
         -0.02,  # 1 year ago: -2% from current
         0.00    # Current: 0% (baseline)
     ]
     ```
   - Adds ±3% volatility to make it realistic

3. **Calculates Trend:**
   - Uses linear regression on simulated historical prices
   - Calculates percentage change

4. **Property-Specific Seed:**
   - Uses hash of address + property type + area as seed
   - Ensures consistent results for same property

**Example Output:** `"+8.7%"`

**When Used:**
- When no historical transaction data available
- When ML model is loaded and working
- As a last resort before Tier 4

---

### Tier 4: Fallback Trend (Default) 🎲

**Function:** `generate_fallback_trend()`

**How It Works:**
1. **Property Type Base Trends:**
   ```python
   base_trends = {
       'Office': (2, 8),           # 2-8% positive trend
       'Retail': (-1, 5),          # -1% to +5%
       'Shop House': (1, 6),       # 1-6%
       'Single-user Factory': (3, 10),
       'Multiple-user Factory': (2, 9),
       'Warehouse': (4, 12),
       'Business Parks': (1, 7)
   }
   ```

2. **Location Adjustments:**
   ```python
   location_adjustments = {
       'Central': +2%,   # Central areas trend higher
       'East': 0%,
       'West': -1%,
       'North': -2%,
       'South': +1%
   }
   ```

3. **Random but Consistent:**
   - Uses property type + planning area as seed
   - Generates random trend within defined range
   - Same property always gets same trend (deterministic)

**Example Output:** `"+5.2%"`

**When Used:**
- When all other methods fail
- When no historical data exists
- When ML model not available

---

## Trend Calculation Flow

```
┌─────────────────────────────────────────┐
│ Calculate Market Trend                  │
└──────────────┬──────────────────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Tier 1: Data-Based Trend │
    │ (Property Type + District)│
    └──────────┬───────────────┘
               │
    Has ≥5 transactions in past 4 years?
    AND ≥2 years of data?
               │
        ┌──────┴──────┐
       Yes           No
        │             │
        ▼             ▼
    Return      ┌──────────────────────────┐
    Trend       │ Tier 2: Historical Trend │
                │ (Property Type + Planning)│
                └──────────┬───────────────┘
                           │
            Has ≥10 transactions?
            AND ≥2 years of data?
                           │
                   ┌───────┴───────┐
                  Yes             No
                   │               │
                   ▼               ▼
               Return         ┌───────────────────────┐
               Trend          │ Tier 3: ML Simulation │
                              └──────────┬────────────┘
                                         │
                           ML Model available?
                                         │
                                 ┌───────┴───────┐
                                Yes             No
                                 │               │
                                 ▼               ▼
                             Return           ┌──────────────────────┐
                             Trend            │ Tier 4: Fallback    │
                                              │ (Property Type Based)│
                                              └──────────┬───────────┘
                                                         │
                                                      Return
                                                      Trend
```

---

## Data Requirements

### For Tier 1 (Best Accuracy):
- ✅ Transaction CSV files loaded in memory
- ✅ `contract_date` column with date data
- ✅ `price` column with transaction prices
- ✅ `property_type` column matching the property being analyzed
- ✅ `postal_district` column (optional but preferred)
- ✅ Minimum 5 transactions in past 4 years
- ✅ Minimum 2 years of data coverage

### For Tier 2 (Good Accuracy):
- ✅ Same as Tier 1, but can use broader filters
- ✅ Can match by planning_area instead of postal_district
- ✅ Minimum 10 transactions (less strict)

### For Tier 3 (Fallback):
- ✅ ML model loaded and working
- ✅ Can generate predictions for the property

### For Tier 4 (Last Resort):
- ✅ No data needed
- ✅ Uses property type and planning area only

---

## Code Locations

**File:** `machinelearning/ml_predictor_enhanced.py`

**Functions:**
1. `calculate_ml_based_trend_with_data()` - Lines 444-517
2. `calculate_ml_based_trend()` - Lines 519-584
3. `calculate_historical_trend()` - Lines 586-658
4. `generate_fallback_trend()` - Lines 660-697

**Called From:**
- `compute_metrics_for()` - Lines 754-770
- `analyze_industrial_market()` - Lines 1188-1200
- `analyze_commercial_market()` - Lines 1598-1611
- `analyze_market_generic()` - Lines 1888-1903

---

## Example Calculations

### Example 1: Data-Based Trend (Tier 1)
**Input:**
- Property: Office in District 1
- Transactions: 47 transactions in District 1 (Office) from 2021-2024
- Yearly averages:
  - 2021: $2,500,000 average
  - 2022: $2,650,000 average
  - 2023: $2,800,000 average
  - 2024: $2,900,000 average

**Calculation:**
```
Trend = ((2,900,000 - 2,500,000) / 2,500,000) × 100
      = (400,000 / 2,500,000) × 100
      = 16.0%
```

**Output:** `"+16.0%"`

### Example 2: Historical Trend (Tier 2)
**Input:**
- Property: Warehouse in Jurong West
- Transactions: 25 transactions (Warehouse) in Jurong West from 2020-2024
- Yearly averages:
  - 2020: $800,000
  - 2022: $850,000
  - 2024: $920,000

**Calculation:**
```
Trend = ((920,000 - 800,000) / 800,000) × 100
      = (120,000 / 800,000) × 100
      = 15.0%
```

**Output:** `"+15.0%"`

### Example 3: ML-Based Trend (Tier 3)
**Input:**
- Property: Single-User Factory
- Current ML Prediction: $1,200,000
- Simulated historical prices:
  - 4 years ago: $1,200,000 × 0.85 = $1,020,000
  - 3 years ago: $1,200,000 × 0.90 = $1,080,000
  - 2 years ago: $1,200,000 × 0.95 = $1,140,000
  - 1 year ago: $1,200,000 × 0.98 = $1,176,000
  - Current: $1,200,000

**Calculation:**
```
Trend = ((1,200,000 - 1,020,000) / 1,020,000) × 100
      = (180,000 / 1,020,000) × 100
      = 17.6%
```

**Output:** `"+17.6%"`

### Example 4: Fallback Trend (Tier 4)
**Input:**
- Property Type: Warehouse
- Planning Area: Jurong West (West region)
- Base trend range: 4-12%
- Location adjustment: -1% (West)
- Random seed: Based on "Warehouse_Jurong West"

**Calculation:**
```
Random trend = 7.5% (from 4-12% range)
Adjusted = 7.5% + (-1%) = 6.5%
```

**Output:** `"+6.5%"`

---

## Trend Display Format

**Positive Trends:** `"+15.3%"` (green, upward arrow)
**Negative Trends:** `"-2.1%"` (red, downward arrow)

**Period Shown:** "4 years" (always)

---

## Improvements & Recommendations

### Current Limitations:
1. ⚠️ Tier 1 requires exact postal district match - may miss similar areas
2. ⚠️ Tier 3 uses fixed market adjustments - not based on actual historical trends
3. ⚠️ Tier 4 is randomized - not based on real data

### Potential Enhancements:
1. ✅ Expand Tier 1 to include neighboring postal districts if insufficient data
2. ✅ Use actual historical ML predictions if available (store prediction history)
3. ✅ Add seasonality adjustments (Q1, Q2, Q3, Q4 trends)
4. ✅ Add market segment trends (luxury vs. standard properties)
5. ✅ Include confidence intervals for trend predictions
6. ✅ Show trend period dynamically (e.g., "3 years" if only 3 years of data available)

---

## Summary

**Market trends are calculated using a cascading approach:**

1. **Best:** Real transaction data from same property type + postal district (Tier 1)
2. **Good:** Real transaction data from same property type + planning area (Tier 2)
3. **Fallback:** ML model simulation with historical market adjustments (Tier 3)
4. **Last Resort:** Property type and location-based estimates (Tier 4)

The system automatically selects the best available method based on data availability, ensuring users always see a trend indicator even when historical data is limited.

