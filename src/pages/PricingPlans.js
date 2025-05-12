// src/pages/PricingPlans.js
import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const PricingPlans = () => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'
  
  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 49,
      annualPrice: 470,
      features: [
        'Post up to 3 projects',
        'Basic analytics',
        'Standard support',
        'Email notifications',
        'Up to 3 team members',
      ],
      recommended: false,
      buttonText: 'Get Started',
      color: '#6c63ff'
    },
    {
      name: 'Professional',
      monthlyPrice: 99,
      annualPrice: 950,
      features: [
        'Post up to 10 projects',
        'Advanced analytics',
        'Priority support',
        'Applicant tracking',
        'Custom project templates',
        'Up to 10 team members',
        'Integration with ATS'
      ],
      recommended: true,
      buttonText: 'Start Free Trial',
      color: '#6c63ff'
    },
    {
      name: 'Enterprise',
      monthlyPrice: 249,
      annualPrice: 2390,
      features: [
        'Unlimited projects',
        'Premium analytics',
        'Dedicated account manager',
        'Custom branding',
        'API access',
        'Unlimited team members',
        'Single sign-on (SSO)',
        'Advanced reporting'
      ],
      recommended: false,
      buttonText: 'Contact Sales',
      color: '#6c63ff'
    }
  ];
  
  const calculateSavings = (monthly, annual) => {
    return Math.round(100 - ((annual / 12) * 100 / monthly));
  };
  
  return (
    <div>
      <Navigation />
      
      <div className="container" style={{ padding: '80px 0' }}>
        <div className="section-header">
          <div className="feature-badge">Pricing</div>
          <h2>Simple, Transparent Pricing</h2>
          <p>Choose the plan that works best for your company's needs</p>
        </div>
        
        {/* Billing Toggle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          margin: '40px 0'
        }}>
          <button 
            onClick={() => setBillingCycle('monthly')} 
            style={{ 
              background: billingCycle === 'monthly' ? 'linear-gradient(to right, var(--gradient-start), var(--gradient-end))' : 'transparent',
              color: billingCycle === 'monthly' ? 'white' : 'var(--dark)',
              border: billingCycle === 'monthly' ? 'none' : '1px solid #ddd',
              padding: '10px 20px',
              borderRadius: '50px 0 0 50px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.3s ease',
            }}
          >
            Monthly
          </button>
          <button 
            onClick={() => setBillingCycle('annual')} 
            style={{ 
              background: billingCycle === 'annual' ? 'linear-gradient(to right, var(--gradient-start), var(--gradient-end))' : 'transparent',
              color: billingCycle === 'annual' ? 'white' : 'var(--dark)',
              border: billingCycle === 'annual' ? 'none' : '1px solid #ddd',
              padding: '10px 20px',
              borderRadius: '0 50px 50px 0',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            Annual <span style={{ fontSize: '14px', opacity: '0.8' }}>Save up to 20%</span>
          </button>
        </div>
        
        {/* Pricing Cards */}
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '30px',
          marginTop: '30px'
        }}>
          {plans.map((plan, index) => (
            <div 
              key={index} 
              style={{ 
                borderRadius: '16px',
                border: plan.recommended ? `2px solid ${plan.color}` : '1px solid #eee',
                padding: '40px 30px',
                width: '320px',
                backgroundColor: 'white',
                position: 'relative',
                boxShadow: plan.recommended ? '0 20px 40px rgba(108, 99, 255, 0.1)' : '0 10px 30px rgba(0, 0, 0, 0.05)',
                transform: plan.recommended ? 'translateY(-10px)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {plan.recommended && (
                <div style={{ 
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: plan.color,
                  color: 'white',
                  padding: '5px 15px',
                  borderRadius: '50px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Most Popular
                </div>
              )}
              
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h3 style={{ 
                  color: plan.color, 
                  marginBottom: '5px',
                  fontSize: '24px'
                }}>
                  {plan.name}
                </h3>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  {plan.name === 'Starter' ? 'For small businesses' : 
                   plan.name === 'Professional' ? 'For growing companies' : 'For large organizations'}
                </p>
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: '700',
                  color: 'var(--dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '24px', marginRight: '5px' }}>$</span>
                  {billingCycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)}
                </div>
                <p style={{ color: '#666' }}>
                  per month
                  {billingCycle === 'annual' && (
                    <span style={{ 
                      display: 'block', 
                      fontSize: '14px',
                      color: '#22c55e',
                      marginTop: '5px'
                    }}>
                      Save {calculateSavings(plan.monthlyPrice, plan.annualPrice)}% with annual billing
                    </span>
                  )}
                </p>
                {billingCycle === 'annual' && (
                  <div style={{ 
                    fontSize: '14px', 
                    marginTop: '10px', 
                    color: '#666' 
                  }}>
                    ${plan.annualPrice} billed annually
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '30px' }}>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {plan.features.map((feature, i) => (
                    <li 
                      key={i} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        marginBottom: '12px',
                        color: '#555'
                      }}
                    >
                      <span style={{ 
                        marginRight: '10px', 
                        color: plan.color,
                        fontWeight: 'bold'
                      }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <Link 
                to={plan.name === 'Enterprise' ? '/contact-us' : '/register'} 
                className="btn" 
                style={{ 
                  display: 'block',
                  textAlign: 'center',
                  backgroundColor: plan.recommended ? plan.color : 'white',
                  color: plan.recommended ? 'white' : plan.color,
                  border: `2px solid ${plan.color}`,
                  borderRadius: '50px',
                  padding: '12px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none'
                }}
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>
        
        {/* Enterprise Banner */}
        <div style={{ 
          margin: '80px auto 0',
          maxWidth: '900px',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ 
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            top: '-150px',
            right: '-100px',
            zIndex: 0
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ marginBottom: '15px', fontSize: '28px' }}>Custom Enterprise Solution</h3>
            <p style={{ marginBottom: '25px', opacity: '0.9', maxWidth: '600px', margin: '0 auto 25px' }}>
              Need a tailored solution for your large enterprise? Our team will work with you to create a custom plan that meets your specific requirements.
            </p>
            <Link to="/contact-us" className="btn" style={{ 
              backgroundColor: 'white',
              color: 'var(--primary)',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '50px',
              fontWeight: '600',
              display: 'inline-block',
              textDecoration: 'none'
            }}>
              Contact Our Sales Team
            </Link>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div style={{ marginTop: '80px', maxWidth: '800px', margin: '80px auto 0' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '40px' }}>Frequently Asked Questions</h3>
          
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Can I upgrade or downgrade my plan later?</h4>
            <p>Yes, you can upgrade or downgrade your plan at any time. Changes will be applied immediately, and your billing will be prorated accordingly.</p>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Do you offer a free trial?</h4>
            <p>Yes, we offer a 14-day free trial on all our plans. No credit card required. You can try out all features before committing to a paid plan.</p>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>What payment methods do you accept?</h4>
            <p>We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans.</p>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Is there a setup fee?</h4>
            <p>No, there are no setup fees for any of our plans. You only pay for your subscription.</p>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>What if I need help setting up my company profile?</h4>
            <p>Our support team is available to help you set up your company profile and get started with posting projects. For Enterprise plans, we offer dedicated onboarding assistance.</p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PricingPlans;