
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { FileItem, UserRole, FileTrayStatus, Office } from '../types';
import FileListItem from '../components/file/FileListItem';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Select from '../components/common/Select';

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { files, offices, getOfficeById } = useData();
  
  // Basic search
  const [searchTerm, setSearchTerm] = useState('');

  // Advanced search state
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advFilterCurrentOfficeId, setAdvFilterCurrentOfficeId] = useState<string>('');
  const [advFilterOriginatingOfficeId, setAdvFilterOriginatingOfficeId] = useState<string>('');
  const [advFilterTrayStatus, setAdvFilterTrayStatus] = useState<FileTrayStatus | ''>('');
  const [advFilterDateFrom, setAdvFilterDateFrom] = useState<string>('');
  const [advFilterDateTo, setAdvFilterDateTo] = useState<string>('');

  const userOffice = useMemo(() => {
    if (currentUser?.officeId) {
      return getOfficeById(currentUser.officeId);
    }
    return undefined;
  }, [currentUser, getOfficeById]);

  const officeOptionsForFilter = useMemo(() => [
    { value: '', label: 'All Offices' },
    ...offices.map(o => ({ value: o.id, label: o.name }))
  ], [offices]);

  const trayStatusOptions: {value: FileTrayStatus | '', label: string}[] = [
    { value: '', label: 'All Trays' },
    { value: FileTrayStatus.IN_TRAY, label: 'IN Tray' },
    { value: FileTrayStatus.OUT_TRAY, label: 'OUT Tray' },
];

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      // Basic search logic
      const searchLower = searchTerm.toLowerCase().trim();
      if (searchLower) {
        const originatingOfficeName = getOfficeById(file.originatingOfficeId)?.name.toLowerCase() || '';
        const currentOfficeName = getOfficeById(file.currentOfficeId)?.name.toLowerCase() || '';
        const destinationOfficeName = file.destinationOfficeId ? getOfficeById(file.destinationOfficeId)?.name.toLowerCase() : '';

        const matchesBasicSearch = (
          file.id.toLowerCase().includes(searchLower) ||
          file.title.toLowerCase().includes(searchLower) ||
          file.subject.toLowerCase().includes(searchLower) ||
          originatingOfficeName.includes(searchLower) ||
          currentOfficeName.includes(searchLower) ||
          (destinationOfficeName && destinationOfficeName.includes(searchLower))
        );
        if (!matchesBasicSearch) return false;
      }

      // Advanced search logic
      if (advFilterCurrentOfficeId && file.currentOfficeId !== advFilterCurrentOfficeId) {
        return false;
      }
      if (advFilterOriginatingOfficeId && file.originatingOfficeId !== advFilterOriginatingOfficeId) {
        return false;
      }
      if (advFilterTrayStatus && file.currentTray !== advFilterTrayStatus) {
        return false;
      }
      if (advFilterDateFrom) {
        const fileDate = new Date(file.lastMovedAt);
        const fromDate = new Date(advFilterDateFrom);
        fromDate.setHours(0,0,0,0); // Start of the 'from' day
        if (fileDate < fromDate) return false;
      }
      if (advFilterDateTo) {
        const fileDate = new Date(file.lastMovedAt);
        const toDate = new Date(advFilterDateTo);
        toDate.setHours(23,59,59,999); // End of the 'to' day
        if (fileDate > toDate) return false;
      }

      return true; // All conditions met
    });
  }, [
    files, 
    searchTerm, 
    getOfficeById, 
    advFilterCurrentOfficeId, 
    advFilterOriginatingOfficeId, 
    advFilterTrayStatus, 
    advFilterDateFrom, 
    advFilterDateTo
  ]);
  
  const handleClearAdvancedFilters = () => {
    setAdvFilterCurrentOfficeId('');
    setAdvFilterOriginatingOfficeId('');
    setAdvFilterTrayStatus('');
    setAdvFilterDateFrom('');
    setAdvFilterDateTo('');
    // Optionally clear basic search too: setSearchTerm('');
  };

  const filesInMyInTray = useMemo(() => {
    if (currentUser?.role === UserRole.OFFICE_USER && currentUser.officeId) {
      return filteredFiles.filter(file => file.currentOfficeId === currentUser.officeId && file.currentTray === FileTrayStatus.IN_TRAY);
    }
    return [];
  }, [filteredFiles, currentUser]);

  const filesInMyOutTray = useMemo(() => { 
    if (currentUser?.role === UserRole.OFFICE_USER && currentUser.officeId) {
      return filteredFiles.filter(file => file.currentOfficeId === currentUser.officeId && file.currentTray === FileTrayStatus.OUT_TRAY);
    }
    return [];
  }, [filteredFiles, currentUser]);

  const incomingFilesForMyOffice = useMemo(() => { 
    if (currentUser?.role === UserRole.OFFICE_USER && currentUser.officeId) {
      return filteredFiles.filter(file => file.destinationOfficeId === currentUser.officeId && file.currentTray === FileTrayStatus.OUT_TRAY);
    }
    return [];
  }, [filteredFiles, currentUser]);

  const adminAllFiles = useMemo(() => {
    if (currentUser?.role === UserRole.ADMIN) {
      return filteredFiles;
    }
    return [];
  }, [filteredFiles, currentUser]);

  if (!currentUser) {
    return <div className="text-center p-8 text-xl">Loading user or redirecting to login...</div>;
  }

  const renderFileList = (fileList: FileItem[], title: string, listType: 'in-tray' | 'out-tray' | 'incoming' | 'all') => (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">{title}</h2>
      {fileList.length === 0 ? (
        <p className="text-gray-500">No files match the current criteria in this category.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Office</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tray Status</th>
                 {listType !== 'in-tray' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination Office</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Moved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fileList.map(file => (
                <FileListItem key={file.id} file={file} listType={listType} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Dashboard {userOffice ? `- ${userOffice.name}` : (currentUser.role === UserRole.ADMIN ? '- Administrator View' : '')}
        </h1>
        {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.OFFICE_USER) && (
        <Link to="/register-file">
          <Button variant="primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Register New File
          </Button>
        </Link>
        )}
      </div>

      {/* Basic Search Input */}
      <div className="p-4 bg-white rounded-lg shadow">
        <Input 
          type="text"
          placeholder="Search by File ID, Title, Subject, Office..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
          aria-label="Basic file search"
        />
      </div>
      
      {/* Advanced Search Section */}
      <div className="p-4 bg-white rounded-lg shadow">
        <button
          onClick={() => setShowAdvancedSearch(prev => !prev)}
          aria-expanded={showAdvancedSearch}
          aria-controls="advanced-search-panel"
          className="w-full flex justify-between items-center text-left py-2 px-3 bg-gray-50 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <span className="font-medium text-gray-700">Advanced Filters</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 text-gray-500 transform transition-transform duration-150 ${showAdvancedSearch ? 'rotate-180' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showAdvancedSearch && (
          <div id="advanced-search-panel" className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
              <Select
                label="Current Office"
                id="advFilterCurrentOfficeId"
                value={advFilterCurrentOfficeId}
                onChange={e => setAdvFilterCurrentOfficeId(e.target.value)}
                options={officeOptionsForFilter}
              />
              <Select
                label="Originating Office"
                id="advFilterOriginatingOfficeId"
                value={advFilterOriginatingOfficeId}
                onChange={e => setAdvFilterOriginatingOfficeId(e.target.value)}
                options={officeOptionsForFilter}
              />
              <Select
                label="Tray Status"
                id="advFilterTrayStatus"
                value={advFilterTrayStatus}
                onChange={e => setAdvFilterTrayStatus(e.target.value as FileTrayStatus | '')}
                options={trayStatusOptions}
              />
              <Input
                type="date"
                label="Last Moved From"
                id="advFilterDateFrom"
                value={advFilterDateFrom}
                onChange={e => setAdvFilterDateFrom(e.target.value)}
                max={advFilterDateTo} // Prevent from date from being after to date
              />
              <Input
                type="date"
                label="Last Moved To"
                id="advFilterDateTo"
                value={advFilterDateTo}
                onChange={e => setAdvFilterDateTo(e.target.value)}
                min={advFilterDateFrom} // Prevent to date from being before from date
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={handleClearAdvancedFilters} size="sm">
                Clear Advanced Filters
              </Button>
            </div>
          </div>
        )}
      </div>


      {currentUser.role === UserRole.OFFICE_USER && userOffice && (
        <>
          {renderFileList(filesInMyInTray, `My Office's IN Tray (${userOffice.name})`, 'in-tray')}
          {renderFileList(incomingFilesForMyOffice, `Incoming Files for ${userOffice.name}`, 'incoming')}
          {renderFileList(filesInMyOutTray, `My Office's OUT Tray (${userOffice.name}) - Files Dispatched`, 'out-tray')}
        </>
      )}

      {currentUser.role === UserRole.ADMIN && (
        renderFileList(adminAllFiles, "All Registered Files", 'all')
      )}
    </div>
  );
};

export default DashboardPage;
