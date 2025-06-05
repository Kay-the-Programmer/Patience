
import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar'; // Import Sidebar
import { useAuth } from '../contexts/AuthContext';
import SnackbarContainer from './common/SnackbarContainer'; // Import SnackbarContainer

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16"> {/* pt-16 for navbar height */}
        {currentUser && <Sidebar />} {/* Conditionally render Sidebar */}
        <main className={`flex-grow p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto ${currentUser ? 'md:ml-64' : ''}`}> {/* Adjust ml if sidebar is present, responsive padding */}
          {children}
        </main>
      </div>
      <SnackbarContainer /> {/* Add SnackbarContainer here */}
    </div>
  );
};

export default Layout;