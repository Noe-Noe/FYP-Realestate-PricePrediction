import React, { useState, useEffect } from 'react';
import './SubscriptionPlans.css';
import api from '../../services/api';

const SubscriptionPlans = () => {
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const [plans, setPlans] = useState([]);
  const [importantFeatures, setImportantFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
    fetchImportantFeatures();
  }, []);

  useEffect(() => {
    if (plans.length > 0) {
      console.log('Updating prices for billing cycle:', yearlyBilling ? 'yearly' : 'monthly');
      // Update prices when billing cycle changes
      const updatedPlans = plans.map(plan => {
        console.log('Updating plan prices:', plan.name, 'monthly:', plan.monthlyPrice, 'yearly:', plan.yearlyPrice);
        
        return {
          ...plan,
          price: yearlyBilling ? `$${plan.yearlyPrice || plan.monthlyPrice * 12}` : `$${plan.monthlyPrice}`,
          originalPrice: yearlyBilling ? `$${plan.monthlyPrice * 12}` : null
        };
      });
      console.log('Updated plans with new prices:', updatedPlans);
      setPlans(updatedPlans);
    }
  }, [yearlyBilling]);

  const fetchPlans = async () => {
    try {
      console.log('Fetching subscription plans from API...');
      const response = await api.subscriptionPlans.getAll();
      console.log('API Response:', response);
      
      if (response.success) {
        // Transform the data to match the expected format
        const transformedPlans = response.plans.map(plan => {
          console.log('Processing plan:', plan);
          
          // Remove duplicate features
          const uniqueFeatures = [...new Set(plan.features.map(feature => feature.feature_name))];
          
          const transformedPlan = {
            id: plan.plan_type,
            name: plan.plan_name,
            price: yearlyBilling ? `$${plan.yearly_price}` : `$${plan.monthly_price}`,
            originalPrice: yearlyBilling ? `$${plan.monthly_price * 12}` : null,
            icon: getPlanIcon(plan.plan_type),
            features: uniqueFeatures,
            badge: plan.is_popular ? 'Most Popular' : plan.plan_type === 'premium' ? 'Best Value' : null,
            buttonText: plan.plan_type === 'free' ? 'Get Started Free' : 'Choose Plan',
            isPopular: plan.is_popular || false,
            // Store raw data for price calculations
            monthlyPrice: plan.monthly_price,
            yearlyPrice: plan.yearly_price
          };
          
          console.log('Transformed plan:', transformedPlan);
          return transformedPlan;
        });
        
        console.log('All transformed plans:', transformedPlans);
        setPlans(transformedPlans);
      } else {
        console.error('API response not successful:', response);
        setPlans(getDefaultPlans());
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      // Fallback to default plans if API fails
      setPlans(getDefaultPlans());
    } finally {
      setLoading(false);
    }
  };

  const fetchImportantFeatures = async () => {
    try {
      console.log('Fetching important features from API...');
      const response = await api.importantFeatures.getAll();
      console.log('Important features API response:', response);
      
      if (response.success) {
        const features = response.features.map(feature => feature.feature_name);
        console.log('Important features:', features);
        setImportantFeatures(features);
      } else {
        console.error('Failed to load important features');
        // Fallback to default features
        setImportantFeatures([
          '30-day money-back guarantee',
          'Cancel anytime',
          '99.9% uptime SLA',
          'GDPR compliant'
        ]);
      }
    } catch (error) {
      console.error('Error fetching important features:', error);
      // Fallback to default features
      setImportantFeatures([
        '30-day money-back guarantee',
        'Cancel anytime',
        '99.9% uptime SLA',
        'GDPR compliant'
      ]);
    }
  };

  const getPlanIcon = (planType) => {
    const icons = {
      'free': "https://cdn-icons-png.flaticon.com/512/3135/3135712.png",
      'premium': "https://cdn-icons-png.flaticon.com/512/3135/3135713.png",
      'agent': "https://cdn-icons-png.flaticon.com/512/3135/3135714.png"
    };
    return icons[planType] || icons['free'];
  };

  const handlePlanClick = (planName) => {
    const message = `To access the ${planName} plan, please register for an account.`;
    const userChoice = window.confirm(message + '\n\nWould you like to register now?');
    
    if (userChoice) {
      // Redirect to signup page
      window.location.href = '/signup';
    }
  };

  const getDefaultPlans = () => [
    {
      id: 'free',
      name: "Free",
      price: "$0",
      icon: "https://cdn-icons-png.flaticon.com/512/3135/3135712.png",
      features: [
        "Basic property valuations",
        "Up to 5 properties", 
        "Standard reports",
        "Email support",
        "Mobile app access"
      ],
      badge: "Most Popular",
      buttonText: "Get Started Free"
    },
    {
      id: 'premium',
      name: "Premium",
      price: yearlyBilling ? "$24" : "$29",
      originalPrice: yearlyBilling ? "$29" : null,
      icon: "https://cdn-icons-png.flaticon.com/512/3135/3135713.png",
      features: [
        "Everything in Free",
        "Unlimited properties",
        "Advanced analytics", 
        "Custom reports",
        "Priority support",
        "API access",
        "Team collaboration"
      ],
      badge: "Best Value",
      featured: true,
      buttonText: "Choose Premium"
    },
    {
      id: 'agent',
      name: "Agent",
      price: yearlyBilling ? "$79" : "$99",
      originalPrice: yearlyBilling ? "$99" : null,
      icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
      features: [
        "Everything in Premium",
        "Client management",
        "Lead generation tools",
        "Commission tracking",
        "Marketing automation",
        "Dedicated account manager",
        "White-label solutions"
      ],
      badge: "Professional",
      buttonText: "Choose Agent"
    }
  ];

  const getYearlySavings = (plan) => {
    // Always return null to hide yearly savings
    return null;
  };

  return (
    <div className="landing-page">
      <section className="subscription-plans" id="plans">
        <div className="plans-container">
          <div className="plans-header">
            <h2 className="section-title">Choose Your Perfect Plan</h2>
            <p className="section-subtitle">
              Select the plan that best fits your needs
            </p>
          </div>

          <div className="pricing-toggle">
            <button 
              className={`toggle-btn ${!yearlyBilling ? 'active' : ''}`}
              onClick={() => setYearlyBilling(false)}
            >
              Monthly
            </button>
            <button 
              className={`toggle-btn ${yearlyBilling ? 'active' : ''}`}
              onClick={() => setYearlyBilling(true)}
            >
              Yearly
            </button>
          </div>

          <div className="plans-grid">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={`plan-card ${plan.isPopular ? 'popular' : ''}`}
              >
                {/* Only show badge if plan is not marked as popular (popular plans use CSS ::before for "Most Popular") */}
                {plan.badge && !plan.isPopular && (
                  <div className="plan-badge">{plan.badge}</div>
                )}
                
                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price-container">
                    <div className="plan-price">
                      <span className="price-amount">{plan.price}</span>
                      <span className="price-period">{yearlyBilling ? '/year' : '/month'}</span>
                    </div>
                    {plan.originalPrice && (
                      <div className="original-price">
                        <span>was {plan.originalPrice}{yearlyBilling ? '/year' : '/month'}</span>
                      </div>
                    )}
                    {getYearlySavings(plan) && (
                      <div className="yearly-savings">
                        {getYearlySavings(plan)}
                      </div>
                    )}
                  </div>
                  <img src={plan.icon} alt={plan.name} className="plan-icon" />
                </div>
                
                <div className="plan-features">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="feature-item">
                      <span className="checkmark">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button 
                  className="plan-button"
                  onClick={() => handlePlanClick(plan.name)}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>

          <div className="plan-comparison">
            <h4>All plans include:</h4>
            <div className="comparison-features">
              {importantFeatures.map((feature, index) => (
                <span key={index}>✓ {feature}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SubscriptionPlans;
