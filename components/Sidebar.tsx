
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const Sidebar: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return null; 
  }

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
    ${isActive 
      ? 'bg-blue-600 text-white' 
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  const iconClasses = "w-5 h-5 mr-3";

  return (
    <aside className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-gray-800 text-white flex flex-col p-4 space-y-2 md:block hidden shadow-lg">
      <nav className="flex-grow">
        <NavLink to="/" className={navLinkClasses} end>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClasses}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v18h18V3H3.75zm0 0h18M3.75 9h18M3.75 15h18M9.75 3v18m4.5-18v18" />
          </svg>
          Dashboard
        </NavLink>

        {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.OFFICE_USER) && (
          <NavLink to="/register-file" className={navLinkClasses}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClasses}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Register File
          </NavLink>
        )}

        {currentUser.role === UserRole.ADMIN && (
          <>
            <NavLink to="/admin/offices" className={navLinkClasses}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClasses}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 12.75h6M9 18.75h6" />
              </svg>
              Manage Offices
            </NavLink>
            <NavLink to="/admin/workflows" className={navLinkClasses}> {/* New Link for Workflows */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClasses}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 12h9.75m-9.75 6h9.75M3.75 6H7.5m-3.75 6H7.5m-3.75 6H7.5" />
              </svg>
              Workflow Management
            </NavLink>
            <NavLink to="/admin/audit-log" className={navLinkClasses}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClasses}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              File Activity Log
            </NavLink>
            <NavLink to="/admin/reports" className={navLinkClasses}> 
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClasses}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM21 21l-5.197-5.197" /> 
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
              Reports & Analytics
            </NavLink>
          </>
        )}
      </nav>
      <div className="mt-auto p-2 border-t border-gray-700">
        <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} OFTS</p>
      </div>
    </aside>
  );
};

export default Sidebar;