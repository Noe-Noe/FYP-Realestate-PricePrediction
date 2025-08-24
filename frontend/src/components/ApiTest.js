import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';

const ApiTest = () => {
  const { 
    properties, 
    fetchProperties, 
    loading, 
    error, 
    clearError,
    user,
    isAuthenticated,
    login,
    logout 
  } = useApi();
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    // Fetch properties when component mounts
    fetchProperties();
  }, [fetchProperties]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(loginForm);
      setLoginForm({ email: '', password: '' });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>API Connection Test</h2>
      
      {/* Error Display */}
      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={clearError}
            style={{ 
              marginLeft: '10px', 
              padding: '5px 10px', 
              backgroundColor: '#c62828', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Authentication Section */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>Authentication Test</h3>
        
        {isAuthenticated ? (
          <div>
            <p><strong>Logged in as:</strong> {user?.email}</p>
            <button 
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                style={{ padding: '8px', width: '200px', marginRight: '10px' }}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                style={{ padding: '8px', width: '200px', marginRight: '10px' }}
                required
              />
              <button 
                type="submit"
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
            <small>Use any email/password for testing (will create new user)</small>
          </form>
        )}
      </div>

      {/* Properties Section */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>Properties API Test</h3>
        
        {loading ? (
          <p>Loading properties...</p>
        ) : (
          <div>
            <p><strong>Properties found:</strong> {properties.length}</p>
            {properties.length > 0 ? (
              <ul>
                {properties.map(prop => (
                  <li key={prop.id}>
                    <strong>{prop.title}</strong> - {prop.city}, {prop.state} - ${prop.asking_price}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No properties found. The database is empty.</p>
            )}
          </div>
        )}
      </div>

      {/* API Status */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#e8f5e8', 
        borderRadius: '8px'
      }}>
        <h3>API Status</h3>
        <p><strong>Backend URL:</strong> http://localhost:5000</p>
        <p><strong>Frontend URL:</strong> http://localhost:3000</p>
        <p><strong>Connection:</strong> {error ? '❌ Error' : '✅ Connected'}</p>
      </div>
    </div>
  );
};

export default ApiTest;
