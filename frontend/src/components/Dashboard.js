import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import User from './user/user';
import AgentUser from './agent/AgentUser';
import SysAdmin from './system/SysAdmin';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has JWT token with retry mechanism
    const checkAuth = () => {
      const accessToken = localStorage.getItem('accessToken');
      const userType = localStorage.getItem('userType');
      
      console.log('Dashboard - accessToken:', accessToken);
      console.log('Dashboard - userType:', userType);
      
      if (!accessToken) {
        console.log('Dashboard - No access token, redirecting to landing page');
        navigate('/');
        return;
      }
      
      console.log('Dashboard - Authentication check completed, proceeding...');
    };

    // Check immediately
    checkAuth();
    
    // Also check after a short delay to handle timing issues
    const timer = setTimeout(checkAuth, 200);
    
    return () => clearTimeout(timer);

    // Check first-time status for different user types
    if (userType === 'free' || userType === 'premium') {
      // Check if user has completed first-time setup
      const userPreferences = localStorage.getItem('userPreferences');
      const isFirstTimeUser = !userPreferences || !JSON.parse(userPreferences).completed;
      
      if (isFirstTimeUser) {
        navigate('/first-time');
        return;
      }
    } else if (userType === 'agent') {
      // Check if agent has completed first-time setup (region selection)
      const agentRegions = localStorage.getItem('agentRegions');
      const isFirstTimeAgent = !agentRegions || !JSON.parse(agentRegions).completed;
      
      if (isFirstTimeAgent) {
        navigate('/first-time-agent');
        return;
      }
    }
    // SysAdmin users proceed directly to their dashboard
  }, [navigate]);

  // Monitor user type changes and redirect if needed
  useEffect(() => {
    const handleStorageChange = () => {
      const currentUserType = localStorage.getItem('userType');
      const currentPath = window.location.pathname;
      
      // If user is on premium dashboard but no longer premium, redirect to main dashboard
      if (currentPath === '/dashboard/premium' && currentUserType !== 'premium') {
        navigate('/dashboard');
      }
      
      // If user is on agent dashboard but no longer agent, redirect to main dashboard
      if (currentPath === '/dashboard/agent' && currentUserType !== 'agent') {
        navigate('/dashboard');
      }
      
      // If user is on admin dashboard but no longer admin, redirect to main dashboard
      if (currentPath === '/dashboard/sysadmin' && currentUserType !== 'admin') {
        navigate('/dashboard');
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on component mount
    handleStorageChange();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

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
