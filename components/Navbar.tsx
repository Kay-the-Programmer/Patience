import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { APP_TITLE } from '../constants';
import Button from './common/Button'; // Using Button for logout
import NotificationBell from './notifications/NotificationBell'; // Import NotificationBell

const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); 
  };

  return (
    <nav className="bg-gray-700 text-white shadow-lg fixed w-full z-20 top-0 h-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold hover:text-gray-300 transition-colors">
              {APP_TITLE}
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <NotificationBell /> 
                <span className="text-sm hidden sm:inline">Welcome, {currentUser.name}</span>
                <Button onClick={handleLogout} variant="secondary" size="sm">
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login" className="hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;