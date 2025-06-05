import React from 'react';
import { Link } from 'react-router-dom';

interface DashboardMetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor?: string; // e.g., 'bg-blue-500'
  textColor?: string; // e.g., 'text-white'
  linkTo?: string;
  footerText?: string;
}

const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  title,
  value,
  icon,
  bgColor = 'bg-white',
  textColor = 'text-gray-800',
  linkTo,
  footerText
}) => {
  const cardContent = (
    <div className={`p-5 rounded-lg shadow-lg flex items-center space-x-4 ${bgColor} ${textColor} h-full transition-all hover:shadow-xl`}>
      <div className={`p-3 rounded-full ${bgColor === 'bg-white' ? 'bg-blue-100 text-blue-600' : 'bg-white bg-opacity-20'}`}>
        {icon}
      </div>
      <div>
        <p className={`text-sm font-medium ${bgColor === 'bg-white' ? 'text-gray-500' : 'opacity-80'}`}>{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        {footerText && <p className={`text-xs mt-1 ${bgColor === 'bg-white' ? 'text-gray-400' : 'opacity-70'}`}>{footerText}</p>}
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default DashboardMetricCard;
