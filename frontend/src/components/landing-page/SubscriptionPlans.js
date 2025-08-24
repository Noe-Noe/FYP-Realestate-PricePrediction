import React, { useState } from 'react';
import './SubscriptionPlans.css';

const SubscriptionPlans = () => {
  const [yearlyBilling, setYearlyBilling] = useState(false);

  const handlePlanClick = (planName) => {
    const message = `To access the ${planName} plan, please register for an account.`;
    const userChoice = window.confirm(message + '\n\nWould you like to register now?');
    
    if (userChoice) {
      // Redirect to signup page
      window.location.href = '/signup';
    }
  };

  const plans = [
    {
      id: 'free',
      name: "Free",
      price: "$0",
      icon: "https://cdn-icons-png.flaticon.com/512/3135/3135712.png",
      description: "Perfect for getting started",
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
      description: "For growing businesses",
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
      description: "For real estate professionals",
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
    if (plan.name === "Free" || !yearlyBilling) return null;
    const basePrice = parseInt(plan.originalPrice?.replace('$', '') || plan.price.replace('$', ''));
    const savings = Math.round(basePrice * 0.2 * 12);
    return `Save $${savings}/year`;
  };

  return (
    <div className="landing-page">
      <section className="subscription-plans" id="plans">
        <div className="plans-container">
          <div className="plans-header">
            <h2 className="section-title">Choose Your Perfect Plan</h2>
            <p className="section-subtitle">
              Select the plan that best fits your property management needs
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
              <span className="save-badge">Save 20%</span>
            </button>
          </div>

          <div className="plans-grid">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={`plan-card ${plan.featured ? 'highlighted' : ''}`}
              >
                {plan.badge && (
                  <div className="plan-badge">{plan.badge}</div>
                )}
                
                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-description">{plan.description}</p>
                  <div className="plan-price-container">
                    <div className="plan-price">
                      <span className="price-amount">{plan.price}</span>
                      <span className="price-period">/month</span>
                    </div>
                    {plan.originalPrice && (
                      <div className="original-price">
                        <span>was {plan.originalPrice}/month</span>
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
              <span>✓ 30-day money-back guarantee</span>
              <span>✓ Cancel anytime</span>
              <span>✓ 99.9% uptime SLA</span>
              <span>✓ GDPR compliant</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SubscriptionPlans;
