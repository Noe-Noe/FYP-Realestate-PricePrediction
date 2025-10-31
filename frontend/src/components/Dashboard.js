import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import User from './user/user';
import AgentUser from './agent/AgentUser';
import SysAdmin from './system/SysAdmin';
import { onboardingAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user has JWT token and handle first-time logic
    const checkAuth = async () => {
      console.log('🔍 Dashboard - Starting authentication check...');
      
      const accessToken = localStorage.getItem('accessToken');
      const userType = localStorage.getItem('userType');
      
      console.log('🔍 Dashboard - accessToken:', accessToken ? '✅ Present' : '❌ Missing');
      console.log('🔍 Dashboard - userType:', userType);
      
      if (!accessToken) {
        console.log('❌ Dashboard - No access token, redirecting to landing page');
        navigate('/');
        return;
      }
      
      console.log('✅ Dashboard - Authentication check completed, proceeding...');
      
      try {
        // Check first-time status for different user types
        if (userType === 'free' || userType === 'premium') {
          console.log('👤 Dashboard - Checking first-time user status...');
          // Check if user has completed first-time setup
          const userPreferences = localStorage.getItem('userPreferences');
          const isFirstTimeUser = !userPreferences || !JSON.parse(userPreferences).completed;
          
          console.log('🔍 Dashboard - userPreferences:', userPreferences);
          console.log('🔍 Dashboard - isFirstTimeUser:', isFirstTimeUser);
          
          if (isFirstTimeUser) {
            console.log('🆕 Dashboard - First time user, redirecting to first-time setup');
            navigate('/first-time');
            return;
          } else {
            console.log('✅ Dashboard - User has completed onboarding');
          }
        } else if (userType === 'agent') {
          console.log('🏢 Dashboard - Checking first-time agent status...');
          // Check if agent has completed first-time setup (region selection)
          const agentRegions = localStorage.getItem('agentRegions');
          const isFirstTimeAgentLocal = !agentRegions || !JSON.parse(agentRegions).completed;
          
          console.log('🔍 Dashboard - agentRegions:', agentRegions);
          console.log('🔍 Dashboard - isFirstTimeAgentLocal:', isFirstTimeAgentLocal);
          
          if (isFirstTimeAgentLocal) {
            console.log('🆕 Dashboard - First time agent, checking database...');
            // Check database to confirm first-time status
            try {
              const response = await onboardingAPI.checkAgentStatus();
              console.log('🔍 Dashboard - Database response:', response);
              
              if (response.first_time_agent) {
                console.log('🆕 Dashboard - First time agent (confirmed by DB), redirecting to agent setup');
                navigate('/first-time-agent');
                return;
              } else {
                // Agent has completed onboarding, set localStorage and proceed
                const agentRegionsData = {
                  regions: [],
                  completed: true,
                  timestamp: new Date().toISOString()
                };
                localStorage.setItem('agentRegions', JSON.stringify(agentRegionsData));
                console.log('✅ Dashboard - Agent onboarding completed, proceeding to dashboard');
              }
            } catch (error) {
              console.error('❌ Dashboard - Error checking agent status:', error);
              // Fallback to localStorage check
              if (isFirstTimeAgentLocal) {
                console.log('🆕 Dashboard - Fallback: First time agent, redirecting to agent setup');
                navigate('/first-time-agent');
                return;
              }
            }
          } else {
            console.log('✅ Dashboard - Agent has completed onboarding');
          }
        }
        // SysAdmin users proceed directly to their dashboard
        
        // If we reach here, user is authenticated and has completed onboarding
        console.log('✅ Dashboard - User fully authenticated and onboarded, showing dashboard');
        setIsCheckingAuth(false);
        
      } catch (error) {
        console.error('❌ Dashboard - Error in auth check:', error);
        // On error, redirect to login
        navigate('/');
      }
    };

    // Check auth once
    checkAuth();
  }, [navigate]);

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // Get user type from localStorage
  const userType = localStorage.getItem('userType') || 'free';

  // Render appropriate dashboard based on user type
  switch (userType) {
    case 'agent':
      return <AgentUser />;
    case 'admin':
      return <SysAdmin />;
    case 'free':
    case 'premium':
    default:
      return <User />;
  }
};

export default Dashboard;
