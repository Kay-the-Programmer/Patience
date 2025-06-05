
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Select from '../components/common/Select'; // Reusing Select for user picking
import { APP_TITLE } from '../constants';

const LoginPage: React.FC = () => {
  const { login, availableUsers } = useAuth();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const userOptions = availableUsers.map(user => ({
    value: user.id,
    label: `${user.name} (${user.role})`,
  }));

  const handleLogin = async () => {
    if (!selectedUserId) {
      setError('Please select a user to login.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    // Simulate async login
    await new Promise(resolve => setTimeout(resolve, 300));

    const success = login(selectedUserId);
    setIsLoading(false);

    if (success) {
      navigate('/');
    } else {
      setError('Login failed. User not found.'); // Should not happen with MOCK_USERS
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">{APP_TITLE}</h1>
          <p className="mt-2 text-sm text-gray-600">Please sign in to continue</p>
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
        
        <div className="space-y-4">
          <Select
            label="Select User"
            id="user-select"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            options={userOptions}
            required
            className="w-full"
          />
          <Button 
            onClick={handleLogin} 
            variant="primary" 
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading || !selectedUserId}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </div>
        <p className="text-xs text-center text-gray-500 mt-4">
          This is a demo. Select any user to proceed.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
