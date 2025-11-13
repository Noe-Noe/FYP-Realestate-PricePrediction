import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import api from '../../services/api';
import './EditSubscriptionPlans.css';

const EditSubscriptionPlans = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [comparisonFeatures, setComparisonFeatures] = useState([]);

  useEffect(() => {
    fetchSubscriptionPlans();
    fetchImportantFeatures();
  }, []);

  const fetchImportantFeatures = async () => {
    try {
      console.log('Fetching important features...');
      const response = await api.importantFeatures.getAll();
      console.log('Important features API response:', response);
      
      if (response.success) {
        // Transform the data to match the expected format
        const transformedFeatures = response.features.map(feature => ({
          id: feature.id,
          name: feature.feature_name
        }));
        console.log('Transformed features:', transformedFeatures);
        setComparisonFeatures(transformedFeatures);
        console.log('Set comparison features state:', transformedFeatures);
      } else {
        console.error('Failed to load important features:', response);
      }
    } catch (error) {
      console.error('Error fetching important features:', error);
    }
  };


  const fetchSubscriptionPlans = async () => {
    try {
      setLoading(true);
      const response = await api.subscriptionPlans.getAll();
      
      if (response.success) {
        // Transform the data to match the expected format
        const transformedPlans = response.plans.map(plan => ({
          id: plan.id,
          name: plan.plan_name,
          monthlyPrice: plan.monthly_price,
          yearlyPrice: plan.yearly_price,
          features: plan.features.map(feature => feature.feature_name),
          is_popular: plan.is_popular || false,
          is_active: plan.is_active || true
        }));
        
        setPlans(transformedPlans);
      } else {
        setMessage({ type: 'error', text: 'Failed to load subscription plans' });
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      setMessage({ type: 'error', text: 'Failed to load subscription plans' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      console.log('Starting to save subscription plans...');
      
      // Check if user is authenticated and is admin
      const token = localStorage.getItem('accessToken');
      const userType = localStorage.getItem('userType');
      
      console.log('Authentication check:');
      console.log('  Token exists:', !!token);
      console.log('  Token preview:', token ? token.substring(0, 20) + '...' : 'None');
      console.log('  User type:', userType);
      
      if (!token) {
        setMessage({ type: 'error', text: 'You must be logged in to save changes' });
        return;
      }
      
      if (userType !== 'admin') {
        setMessage({ type: 'error', text: 'You must be logged in as an admin to save changes' });
        return;
      }
      
      console.log('User token found, proceeding with save...');
      
      // Save each plan to the database
      for (const plan of plans) {
        console.log('Saving plan:', plan);
        
        // Fix plan type mapping
        let planType = 'free';
        if (plan.name.toLowerCase().includes('premium')) {
          planType = 'premium';
        } else if (plan.name.toLowerCase().includes('agent')) {
          planType = 'agent';
        }
        
        const planData = {
          plan_name: plan.name,
          plan_type: planType,
          monthly_price: parseFloat(plan.monthlyPrice) || 0,
          yearly_price: parseFloat(plan.yearlyPrice) || 0,
          description: `Professional ${plan.name.toLowerCase()} for property management`,
          is_active: plan.is_active || true,
          is_popular: plan.is_popular || false,
          display_order: plan.id,
          features: plan.features.map((feature, index) => ({
            feature_name: feature,
            feature_description: feature,
            is_included: true,
            display_order: index + 1
          }))
        };
        
        console.log('Plan data to save:', planData);
        
        try {
          if (plan.id && plan.id > 0) {
            // Update existing plan
            console.log('Updating existing plan with ID:', plan.id);
            console.log('Update URL will be:', `/admin/subscription-plans/${plan.id}`);
            const response = await api.subscriptionPlans.admin.update(plan.id, planData);
            console.log('Update response:', response);
          } else {
            // Create new plan
            console.log('Creating new plan');
            console.log('Create URL will be:', '/admin/subscription-plans');
            const response = await api.subscriptionPlans.admin.create(planData);
            console.log('Create response:', response);
          }
        } catch (apiError) {
          console.error('API Error for plan:', plan.name, apiError);
          console.error('Full error details:', apiError);
          throw new Error(`Failed to save plan "${plan.name}": ${apiError.message || apiError}`);
        }
      }
      
      // Save important features
      console.log('Saving important features:', comparisonFeatures);
      let displayOrderCounter = 1000; // Start from 1000 for new features
      
      for (const feature of comparisonFeatures) {
        console.log('Processing feature:', feature);
        
        // Skip empty features
        if (!feature.name || feature.name.trim() === '') {
          console.log('Skipping empty feature:', feature);
          continue;
        }
        
        const featureData = {
          feature_name: feature.name,
          feature_description: feature.name,
          display_order: feature.id > 1000 ? displayOrderCounter++ : feature.id
        };
        
        console.log('Feature data to save:', featureData);
        
        try {
          console.log('Feature ID analysis:');
          console.log('  Feature ID:', feature.id);
          console.log('  ID type:', typeof feature.id);
          console.log('  ID > 0:', feature.id > 0);
          console.log('  ID < 1000:', feature.id < 1000);
          console.log('  Should update:', feature.id && feature.id > 0 && typeof feature.id === 'number' && feature.id < 1000);
          
          if (feature.id && feature.id > 0 && typeof feature.id === 'number' && feature.id < 1000) {
            // Update existing feature (only if ID is from database, not generated)
            console.log('Updating existing feature with ID:', feature.id);
            const response = await api.importantFeatures.admin.update(feature.id, featureData);
            console.log('Feature update response:', response);
          } else {
            // Create new feature
            console.log('Creating new feature with ID:', feature.id);
            const response = await api.importantFeatures.admin.create(featureData);
            console.log('Feature create response:', response);
          }
        } catch (apiError) {
          console.error('API Error for feature:', feature.name, apiError);
          console.error('Full error details:', apiError);
          throw new Error(`Failed to save feature "${feature.name}": ${apiError.message || apiError}`);
        }
      }
      
      setMessage({ type: 'success', text: 'Subscription plans and important features updated successfully!' });
      
      // Refresh data
      await fetchSubscriptionPlans();
      await fetchImportantFeatures();
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error saving subscription plans:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to save changes: ${error.message || 'Unknown error'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (planId, field, value) => {
    setPlans(prevPlans => 
      prevPlans.map(plan => 
        plan.id === planId 
          ? { ...plan, [field]: value }
          : plan
      )
    );
  };

  const handleFeatureChange = (planId, featureIndex, value) => {
    setPlans(prevPlans => 
      prevPlans.map(plan => 
        plan.id === planId 
          ? {
              ...plan,
              features: plan.features.map((feature, index) => 
                index === featureIndex ? value : feature
              )
            }
          : plan
      )
    );
  };

  const addFeature = (planId) => {
    setPlans(prevPlans => 
      prevPlans.map(plan => 
        plan.id === planId 
          ? { ...plan, features: [...plan.features, ''] }
          : plan
      )
    );
  };

  const removeFeature = (planId, featureIndex) => {
    setPlans(prevPlans => 
      prevPlans.map(plan => 
        plan.id === planId 
          ? {
              ...plan,
              features: plan.features.filter((_, index) => index !== featureIndex)
            }
          : plan
      )
    );
  };

  const addComparisonFeature = () => {
    console.log('🔥 addComparisonFeature called!');
    const newFeature = {
      id: Date.now(),
      name: ''
    };
    console.log('Adding new comparison feature:', newFeature);
    setComparisonFeatures(prevFeatures => {
      const updated = [...prevFeatures, newFeature];
      console.log('Updated comparison features:', updated);
      console.log('Previous features count:', prevFeatures.length);
      console.log('New features count:', updated.length);
      return updated;
    });
    console.log('🔥 addComparisonFeature completed!');
  };

  const removeComparisonFeature = async (featureId) => {
    try {
      console.log('Removing comparison feature with ID:', featureId);
      
      // If it's a database feature (ID < 1000), delete from database
      if (featureId && typeof featureId === 'number' && featureId < 1000) {
        console.log('Deleting feature from database:', featureId);
        await api.importantFeatures.admin.delete(featureId);
        console.log('Successfully deleted feature from database');
      }
      
      // Remove from local state
      setComparisonFeatures(prevFeatures => {
        const updated = prevFeatures.filter(feature => feature.id !== featureId);
        console.log('Updated comparison features after removal:', updated);
        return updated;
      });
    } catch (error) {
      console.error('Error deleting feature:', error);
      setMessage({ type: 'error', text: 'Failed to delete feature' });
    }
  };

  const updateComparisonFeatureName = (featureId, name) => {
    console.log('Updating comparison feature name:', featureId, name);
    setComparisonFeatures(prevFeatures => {
      const updated = prevFeatures.map(feature =>
        feature.id === featureId
          ? { ...feature, name }
          : feature
      );
      console.log('Updated comparison features after name change:', updated);
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="user-dashboard">
        <Header />
        <div className="user-dashboard-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="user-main-content">
            <div className="edit-subscription-plans-loading">
              <p>Loading subscription plans...</p>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">Edit Subscription Plans</h1>
            <button 
              className="edit-subscription-plans-save-btn"
              onClick={handleSaveChanges}
            >
              Save Changes
            </button>
          </div>

          {message.text && (
            <div className={`component-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="subscription-plans-container">
            {plans.map((plan) => (
              <div key={plan.id} className={`subscription-plan-card ${plan.is_popular ? 'popular' : ''}`}>
                <div className="plan-header">
                  <h3 className="plan-title">{plan.name}</h3>
                  {plan.is_popular && <span className="popular-badge">Most Popular</span>}
                </div>

                <div className="plan-details">
                  <div className="plan-field">
                    <label>Plan Name:</label>
                    <input
                      type="text"
                      value={plan.name}
                      onChange={(e) => handlePlanChange(plan.id, 'name', e.target.value)}
                      className="plan-input"
                    />
                  </div>

                  <div className="plan-field">
                    <label>Monthly Price:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={plan.monthlyPrice}
                      onChange={(e) => handlePlanChange(plan.id, 'monthlyPrice', parseFloat(e.target.value))}
                      className="plan-input"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="plan-field">
                    <label>Yearly Price:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={plan.yearlyPrice}
                      onChange={(e) => handlePlanChange(plan.id, 'yearlyPrice', parseFloat(e.target.value))}
                      className="plan-input"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="plan-field">
                    <label>
                      <input
                        type="checkbox"
                        checked={plan.is_popular}
                        onChange={(e) => handlePlanChange(plan.id, 'is_popular', e.target.checked)}
                      />
                      Mark as Popular
                    </label>
                  </div>

                  <div className="plan-field">
                    <label>
                      <input
                        type="checkbox"
                        checked={plan.is_active}
                        onChange={(e) => handlePlanChange(plan.id, 'is_active', e.target.checked)}
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="plan-features">
                  <h4>Features:</h4>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(plan.id, index, e.target.value)}
                        className="feature-input"
                        placeholder="Enter feature"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(plan.id, index)}
                        className="remove-feature-btn"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addFeature(plan.id)}
                    className="add-feature-btn"
                  >
                    Add Feature
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Important Features Summary Section */}
          <div className="comparison-summary-section">
            <h2 className="comparison-summary-title">Important Features Summary</h2>

            <div className="comparison-features-section">
              <h3>Important Features</h3>
              <div style={{marginBottom: '10px', fontSize: '12px', color: '#666'}}>
                Current features count: {comparisonFeatures.length}
              </div>
              {comparisonFeatures.map((feature) => (
                <div key={feature.id} className="comparison-feature-item">
                  <div className="comparison-feature-name">
                    <input
                      type="text"
                      value={feature.name}
                      onChange={(e) => updateComparisonFeatureName(feature.id, e.target.value)}
                      className="comparison-feature-input"
                      placeholder="Feature name"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeComparisonFeature(feature.id)}
                    className="remove-comparison-feature-btn"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  console.log('🔥 Add Feature button clicked!');
                  addComparisonFeature();
                }}
                className="add-comparison-feature-btn"
              >
                Add Feature
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EditSubscriptionPlans;
