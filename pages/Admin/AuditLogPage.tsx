
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { MovementLog, MovementAction, User, Office } from '../../types';
import Input from '../../components/common/Input'; 
import Breadcrumbs, { BreadcrumbItemType } from '../../components/common/Breadcrumbs'; 

const HomeIconBreadcrumb = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 10.707V17.5a1.5 1.5 0 01-1.5 1.5h-3.75a.75.75 0 01-.75-.75V13.5a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75V18a.75.75 0 01-.75.75H3.5A1.5 1.5 0 012 17.5V10.707a1 1 0 01.293-.707l7-7z" clipRule="evenodd" /></svg>;
const AdminIconBreadcrumb = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M7.83 1.15A.75.75 0 018.285 0h3.43a.75.75 0 01.456 1.15l-1.41 1.88a.75.75 0 00-.216.379l-.216 1.08a12.93 12.93 0 015.817 3.087c.193.18.294.43.294.691V13.5a.75.75 0 01-.75.75h-2.505a.75.75 0 01-.75-.75V12a1.5 1.5 0 00-1.5-1.5H9a1.5 1.5 0 00-1.5 1.5v1.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75V8.236c0-.26.1-.51.292-.691a12.93 12.93 0 015.818-3.087l-.216-1.08a.75.75 0 00-.216-.38L7.83 1.15zM10 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM6.39 14.913a.75.75 0 011.16-.914l.175.22a.75.75 0 01-.913 1.16l-.175-.22a.75.75 0 01-.247-.246zM14.448 14.22a.75.75 0 01-.247.246l-.175.22a.75.75 0 11-.914-1.16l.175-.22a.75.75 0 011.16.914z" clipRule="evenodd" /></svg>;

const AuditLogPage: React.FC = () => {
  const { movementLogs, getOfficeById, MOCK_USERS: availableUsers } = useData(); // Use MOCK_USERS directly

  interface EnrichedMovementLog extends MovementLog {
    userName: string;
    fromOfficeName: string;
    toOfficeName: string;
    processedByOfficeName: string;
    actionDisplay: string;
  }

  const [sortColumn, setSortColumn] = useState<keyof EnrichedMovementLog>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState(''); 

  const getUserNameById = (userId: string): string => {
    const user = availableUsers.find(u => u.id === userId);
    return user ? user.name : userId; 
  };

  const formatActionDisplay = (action: MovementAction) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const enrichedLogs: EnrichedMovementLog[] = useMemo(() => {
    return movementLogs.map(log => ({
      ...log,
      userName: getUserNameById(log.userId),
      fromOfficeName: log.fromOfficeId ? getOfficeById(log.fromOfficeId)?.name || 'N/A' : 'N/A',
      toOfficeName: getOfficeById(log.toOfficeId)?.name || 'N/A',
      processedByOfficeName: log.processedByOfficeId ? getOfficeById(log.processedByOfficeId)?.name || 'N/A' : 'N/A',
      actionDisplay: formatActionDisplay(log.action),
    }));
  }, [movementLogs, availableUsers, getOfficeById]);

  const filteredAndSortedLogs = useMemo(() => {
    let logs: EnrichedMovementLog[] = enrichedLogs;

    if (searchTerm.trim()) {
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        logs = logs.filter(log => 
            log.id.toLowerCase().includes(lowerSearchTerm) ||
            log.fileId.toLowerCase().includes(lowerSearchTerm) ||
            log.actionDisplay.toLowerCase().includes(lowerSearchTerm) ||
            log.userName.toLowerCase().includes(lowerSearchTerm) ||
            log.fromOfficeName.toLowerCase().includes(lowerSearchTerm) ||
            log.toOfficeName.toLowerCase().includes(lowerSearchTerm) ||
            log.processedByOfficeName.toLowerCase().includes(lowerSearchTerm) ||
            (log.remarks && log.remarks.toLowerCase().includes(lowerSearchTerm))
        );
    }
    
    return logs.sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];

      let comparison = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });
  }, [enrichedLogs, searchTerm, sortColumn, sortDirection]);

  const handleSort = (columnName: keyof EnrichedMovementLog) => {
    if (sortColumn === columnName) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  const renderSortArrow = (columnName: keyof EnrichedMovementLog) => {
    if (sortColumn !== columnName) return null;
    return sortDirection === 'asc' ? '▲' : '▼';
  };

  const thClasses = "px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none";
  const PageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-gray-700"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;

  const breadcrumbItems: BreadcrumbItemType[] = [
    { label: "Dashboard", path: "/", icon: <HomeIconBreadcrumb /> },
    { label: "Admin", icon: <AdminIconBreadcrumb /> },
    { label: "File Activity Log" }
  ];

  return (
    <div className="max-w-full mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
      <Breadcrumbs items={breadcrumbItems} />
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center"><PageIcon/>File Activity Audit Log</h1>

      <div className="mb-4 p-3 sm:p-4 bg-white rounded-lg shadow">
        <Input 
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-2/3 md:w-1/2 lg:w-1/3 text-sm sm:text-base"
          aria-label="Search audit logs"
        />
      </div>

      {filteredAndSortedLogs.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          No audit logs found matching your criteria.
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={`${thClasses} hidden lg:table-cell`} onClick={() => handleSort('timestamp')}>Timestamp {renderSortArrow('timestamp')}</th>
                <th className={thClasses} onClick={() => handleSort('fileId')}>File ID {renderSortArrow('fileId')}</th>
                <th className={thClasses} onClick={() => handleSort('actionDisplay')}>Action {renderSortArrow('actionDisplay')}</th>
                <th className={`${thClasses} hidden sm:table-cell`} onClick={() => handleSort('userName')}>User {renderSortArrow('userName')}</th>
                <th className={`${thClasses} hidden md:table-cell`} onClick={() => handleSort('fromOfficeName')}>From Office {renderSortArrow('fromOfficeName')}</th>
                <th className={`${thClasses} hidden md:table-cell`} onClick={() => handleSort('toOfficeName')}>To Office {renderSortArrow('toOfficeName')}</th>
                <th className={`${thClasses} hidden lg:table-cell`} onClick={() => handleSort('processedByOfficeName')}>Processed By Office {renderSortArrow('processedByOfficeName')}</th>
                <th className={`${thClasses} hidden sm:table-cell`} onClick={() => handleSort('remarks')}>Remarks {renderSortArrow('remarks')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs text-gray-500 hidden lg:table-cell">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800">
                    <Link to={`/file/${log.fileId}`}>{log.fileId}</Link>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{log.actionDisplay}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">{log.userName}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">{log.fromOfficeName}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">{log.toOfficeName}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">{log.processedByOfficeName}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 truncate max-w-[100px] sm:max-w-xs hidden sm:table-cell" title={log.remarks || undefined}>{log.remarks || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
       <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
        Displaying {filteredAndSortedLogs.length} of {movementLogs.length} total log entries.
      </p>
    </div>
  );
};

export default AuditLogPage;