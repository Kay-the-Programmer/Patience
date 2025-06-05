import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItemType { // Renamed to avoid conflict if BreadcrumbItem is used elsewhere
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItemType[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm">
      <ol className="flex items-center space-x-1.5 text-gray-500">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.icon && <span className="mr-1.5 h-4 w-4 flex-shrink-0">{item.icon}</span>}
            {item.path && index < items.length - 1 ? (
              <Link 
                to={item.path} 
                className="hover:text-blue-700 hover:underline transition-colors duration-150"
              >
                {item.label}
              </Link>
            ) : (
              <span className={` ${index === items.length - 1 ? "font-medium text-gray-700" : "text-gray-500"}`}>
                {item.label}
              </span>
            )}
            {index < items.length - 1 && (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 ml-1.5 text-gray-400 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;