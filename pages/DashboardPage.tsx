
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { FileItem, UserRole, FileTrayStatus, Office, MovementLog, MovementAction } from '../types';
import FileListItem from '../components/file/FileListItem';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard'; // New Import

const SectionTitleWithIcon: React.FC<{ title: string; icon?: React.ReactNode; className?: string }> = ({ title, icon, className = "text-xl sm:text-2xl" }) => ( // Responsive title
  <div className={`flex items-center font-semibold text-gray-700 mb-3 sm:mb-4 ${className}`}>
    {icon && <span className="mr-2 sm:mr-3 text-gray-500">{icon}</span>}
    {title}
  </div>
);

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { files, offices, getOfficeById, movementLogs, MOCK_USERS } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
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

  const isFileOverdue = (file: FileItem): boolean => {
    if (file.expectedCompletionDate) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const expectedDate = new Date(file.expectedCompletionDate);
      expectedDate.setHours(0,0,0,0); // Compare date part only
      
      return expectedDate < today && 
             (file.currentTray === FileTrayStatus.OUT_TRAY || 
              (file.currentTray === FileTrayStatus.IN_TRAY && file.currentOfficeId === file.destinationOfficeId));
    }
    return false;
  };

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
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

      if (advFilterCurrentOfficeId && file.currentOfficeId !== advFilterCurrentOfficeId) return false;
      if (advFilterOriginatingOfficeId && file.originatingOfficeId !== advFilterOriginatingOfficeId) return false;
      if (advFilterTrayStatus && file.currentTray !== advFilterTrayStatus) return false;
      if (advFilterDateFrom) {
        const fileDate = new Date(file.lastMovedAt);
        const fromDate = new Date(advFilterDateFrom);
        fromDate.setHours(0,0,0,0);
        if (fileDate < fromDate) return false;
      }
      if (advFilterDateTo) {
        const fileDate = new Date(file.lastMovedAt);
        const toDate = new Date(advFilterDateTo);
        toDate.setHours(23,59,59,999);
        if (fileDate > toDate) return false;
      }
      return true; 
    });
  }, [
    files, searchTerm, getOfficeById, advFilterCurrentOfficeId, 
    advFilterOriginatingOfficeId, advFilterTrayStatus, advFilterDateFrom, advFilterDateTo
  ]);
  
  const handleClearAdvancedFilters = () => {
    setAdvFilterCurrentOfficeId('');
    setAdvFilterOriginatingOfficeId('');
    setAdvFilterTrayStatus('');
    setAdvFilterDateFrom('');
    setAdvFilterDateTo('');
  };

  // Office User Metrics
  const myInTrayCount = useMemo(() => 
    currentUser?.officeId ? files.filter(f => f.currentOfficeId === currentUser.officeId && f.currentTray === FileTrayStatus.IN_TRAY).length : 0,
  [files, currentUser]);

  const recentlyMovedFromMyOutTrayCount = useMemo(() => {
    if (!currentUser?.officeId) return 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDispatchLogs = movementLogs.filter(log => 
      log.action === MovementAction.MOVED_TO_OUT_TRAY && 
      log.fromOfficeId === currentUser.officeId &&
      new Date(log.timestamp) >= sevenDaysAgo
    );
    return new Set(recentDispatchLogs.map(log => log.fileId)).size;
  }, [movementLogs, currentUser]);

  const myOverdueFilesCount = useMemo(() => {
    if (!currentUser?.officeId) return 0;
    return files.filter(f => 
      (f.currentOfficeId === currentUser.officeId || f.originatingOfficeId === currentUser.officeId || f.destinationOfficeId === currentUser.officeId) && isFileOverdue(f)
    ).length;
  }, [files, currentUser, isFileOverdue]);
  
  const incomingForMyOfficeCount = useMemo(() => 
    currentUser?.officeId ? files.filter(f => f.destinationOfficeId === currentUser.officeId && f.currentTray === FileTrayStatus.OUT_TRAY).length : 0,
  [files, currentUser]);

  const topFilesInMyInTray = useMemo(() => 
    currentUser?.officeId ? files.filter(f => f.currentOfficeId === currentUser.officeId && f.currentTray === FileTrayStatus.IN_TRAY).sort((a,b) => new Date(b.lastMovedAt).getTime() - new Date(a.lastMovedAt).getTime()).slice(0,3) : [],
  [files, currentUser]);

  const topMyOverdueFiles = useMemo(() => 
    currentUser?.officeId ? files.filter(f => (f.currentOfficeId === currentUser.officeId || f.originatingOfficeId === currentUser.officeId || f.destinationOfficeId === currentUser.officeId) && isFileOverdue(f)).sort((a,b) => new Date(a.expectedCompletionDate!).getTime() - new Date(b.expectedCompletionDate!).getTime()).slice(0,3) : [],
  [files, currentUser, isFileOverdue]);

  const topRecentlyDispatchedByMe = useMemo(() => {
    if (!currentUser?.officeId) return [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dispatchedFileIds = new Set(movementLogs
      .filter(log => log.action === MovementAction.MOVED_TO_OUT_TRAY && log.fromOfficeId === currentUser.officeId && new Date(log.timestamp) >= sevenDaysAgo)
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(log => log.fileId)
    );
    return Array.from(dispatchedFileIds).map(id => files.find(f => f.id === id)).filter(Boolean).slice(0,3) as FileItem[];
  }, [movementLogs, files, currentUser]);

  // Admin Metrics
  const totalActiveFiles = files.length;
  const totalFilesInInTrays = files.filter(f => f.currentTray === FileTrayStatus.IN_TRAY).length;
  const totalFilesInOutTrays = files.filter(f => f.currentTray === FileTrayStatus.OUT_TRAY).length;
  const totalSystemOverdueFiles = files.filter(isFileOverdue).length;
  const totalOfficesCount = offices.length;
  const totalUsersCount = MOCK_USERS.length;
  const filesMovedTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return movementLogs.filter(log => new Date(log.timestamp).toDateString() === today).length;
  }, [movementLogs]);
  const topRecentlyRegisteredFiles = useMemo(() => 
    files.sort((a,b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()).slice(0,5),
  [files]);

  const filesInMyInTrayList = useMemo(() => {
    if (currentUser?.role === UserRole.OFFICE_USER && currentUser.officeId) {
      return filteredFiles.filter(file => file.currentOfficeId === currentUser.officeId && file.currentTray === FileTrayStatus.IN_TRAY);
    }
    return [];
  }, [filteredFiles, currentUser]);

  const filesInMyOutTrayList = useMemo(() => { 
    if (currentUser?.role === UserRole.OFFICE_USER && currentUser.officeId) {
      return filteredFiles.filter(file => file.currentOfficeId === currentUser.officeId && file.currentTray === FileTrayStatus.OUT_TRAY);
    }
    return [];
  }, [filteredFiles, currentUser]);

  const incomingFilesForMyOfficeList = useMemo(() => { 
    if (currentUser?.role === UserRole.OFFICE_USER && currentUser.officeId) {
      return filteredFiles.filter(file => file.destinationOfficeId === currentUser.officeId && file.currentTray === FileTrayStatus.OUT_TRAY);
    }
    return [];
  }, [filteredFiles, currentUser]);

  const adminAllFilesList = useMemo(() => {
    if (currentUser?.role === UserRole.ADMIN) {
      return filteredFiles;
    }
    return [];
  }, [filteredFiles, currentUser]);

  if (!currentUser) {
    return <div className="text-center p-8 text-xl">Loading user or redirecting to login...</div>;
  }

  const renderMainFileList = (fileList: FileItem[], title: string, listType: 'in-tray' | 'out-tray' | 'incoming' | 'all', icon: React.ReactNode) => (
    <div className="mb-6 sm:mb-8 p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow-md">
      <SectionTitleWithIcon title={title} icon={icon} />
      {fileList.length === 0 ? (
        <p className="text-gray-500 text-sm sm:text-base">No files match the current criteria in this category.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File ID</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Current Office</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tray Status</th>
                 {listType !== 'in-tray' && <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Destination Office</th>}
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Last Moved</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
  
  // Icons
  const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 sm:w-9 sm:h-9"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>;
  const InTrayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-7 sm:h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.12a2.25 2.25 0 002.15 2.92h15a2.25 2.25 0 002.15-2.92l-2.412-7.752A2.25 2.25 0 0017.088 3.75H15M4.5 3.75L4.5 7.5M7.5 3.75L7.5 7.5M10.5 3.75L10.5 7.5M13.5 3.75L13.5 7.5M16.5 3.75L16.5 7.5M19.5 3.75L19.5 7.5" /></svg>;
  const OutTrayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-7 sm:h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></svg>;
  const IncomingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-7 sm:h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
  const AllFilesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-7 sm:h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
  const OverdueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-7 sm:h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
  const RegisterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1 sm:mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5A2.25 2.25 0 006.75 19.5h7.5m4.125-7.5h-4.125m0 0V9m0 4.125l2.25-2.25M19.5 12l-2.25 2.25" /></svg>;
  const OfficeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-7 sm:h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 12.75h6M9 18.75h6" /></svg>;
  const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-7 sm:h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
  const MovementTodayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-7 sm:h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-3.75h.008v.008H12v-.008z" /></svg>;
  const QuickLinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;

  const renderQuickListItem = (file: FileItem, contextText?: string) => (
    <li key={file.id} className="py-1.5 sm:py-2 border-b border-gray-100 last:border-b-0">
      <Link to={`/file/${file.id}`} className="group">
        <p className="text-sm font-medium text-blue-600 group-hover:text-blue-800 truncate">{file.title}</p>
        <p className="text-xs text-gray-500 group-hover:text-gray-700">
          ID: {file.id} {contextText && `| ${contextText}`}
        </p>
      </Link>
    </li>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center">
            <HomeIcon />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 ml-2 sm:ml-3">
            Dashboard {userOffice ? `- ${userOffice.name}` : (currentUser.role === UserRole.ADMIN ? '- Administrator View' : '')}
            </h1>
        </div>
        {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.OFFICE_USER) && (
        <Link to="/register-file">
          <Button variant="primary" icon={<RegisterIcon />} size="md">
            Register New File
          </Button>
        </Link>
        )}
      </div>

      {/* Personalized Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {currentUser.role === UserRole.OFFICE_USER && (
          <>
            <DashboardMetricCard title="My IN Tray" value={myInTrayCount} icon={<InTrayIcon />} bgColor="bg-blue-500" textColor="text-white" footerText="Files awaiting your action" />
            <DashboardMetricCard title="Recently Sent (7d)" value={recentlyMovedFromMyOutTrayCount} icon={<OutTrayIcon />} bgColor="bg-green-500" textColor="text-white" footerText="Files dispatched by your office" />
            <DashboardMetricCard title="Incoming for My Office" value={incomingForMyOfficeCount} icon={<IncomingIcon />} bgColor="bg-yellow-500" textColor="text-gray-800" footerText="Files en route to you" />
            <DashboardMetricCard title="My Overdue Files" value={myOverdueFilesCount} icon={<OverdueIcon />} bgColor="bg-red-500" textColor="text-white" footerText="Files needing urgent attention" />
          </>
        )}
        {currentUser.role === UserRole.ADMIN && (
          <>
            <DashboardMetricCard title="Total Active Files" value={totalActiveFiles} icon={<AllFilesIcon/>} bgColor="bg-indigo-500" textColor="text-white" />
            <DashboardMetricCard title="System IN Trays" value={totalFilesInInTrays} icon={<InTrayIcon/>} />
            <DashboardMetricCard title="System OUT Trays" value={totalFilesInOutTrays} icon={<OutTrayIcon/>} />
            <DashboardMetricCard title="System Overdue" value={totalSystemOverdueFiles} icon={<OverdueIcon/>} bgColor="bg-red-100" textColor="text-red-700" />
            <DashboardMetricCard title="Registered Offices" value={totalOfficesCount} icon={<OfficeIcon/>} linkTo="/admin/offices" />
            <DashboardMetricCard title="Registered Users" value={totalUsersCount} icon={<UsersIcon/>} />
            <DashboardMetricCard title="File Movements Today" value={filesMovedTodayCount} icon={<MovementTodayIcon />} />
          </>
        )}
      </div>

      {/* Personalized Quick Lists/Links Section */}
      {currentUser.role === UserRole.OFFICE_USER && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-3 sm:p-4 bg-white rounded-lg shadow">
            <SectionTitleWithIcon title="Action Required" icon={<InTrayIcon />} className="text-lg sm:text-xl" />
            {topFilesInMyInTray.length > 0 ? (
              <ul className="space-y-1">{topFilesInMyInTray.map(f => renderQuickListItem(f, `Received: ${new Date(f.lastMovedAt).toLocaleDateString()}`))}</ul>
            ) : <p className="text-sm text-gray-500">Your IN tray is clear!</p>}
          </div>
          <div className="p-3 sm:p-4 bg-white rounded-lg shadow">
            <SectionTitleWithIcon title="My Overdue Files" icon={<OverdueIcon />} className="text-lg sm:text-xl" />
            {topMyOverdueFiles.length > 0 ? (
              <ul className="space-y-1">{topMyOverdueFiles.map(f => renderQuickListItem(f, `Due: ${new Date(f.expectedCompletionDate!).toLocaleDateString()}`))}</ul>
            ) : <p className="text-sm text-gray-500">No overdue files.</p>}
          </div>
          <div className="p-3 sm:p-4 bg-white rounded-lg shadow">
            <SectionTitleWithIcon title="Recently Dispatched by Me" icon={<OutTrayIcon />} className="text-lg sm:text-xl" />
            {topRecentlyDispatchedByMe.length > 0 ? (
              <ul className="space-y-1">{topRecentlyDispatchedByMe.map(f => renderQuickListItem(f, `Sent: ${new Date(f.lastMovedAt).toLocaleDateString()}`))}</ul>
            ) : <p className="text-sm text-gray-500">No recent dispatches.</p>}
          </div>
        </div>
      )}

      {currentUser.role === UserRole.ADMIN && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-3 sm:p-4 bg-white rounded-lg shadow">
                <SectionTitleWithIcon title="Recently Registered Files" icon={<RegisterIcon/>} className="text-lg sm:text-xl" />
                {topRecentlyRegisteredFiles.length > 0 ? (
                <ul className="space-y-1">{topRecentlyRegisteredFiles.map(f => renderQuickListItem(f, `Registered: ${new Date(f.dateCreated).toLocaleDateString()}`))}</ul>
                ) : <p className="text-sm text-gray-500">No files registered yet.</p>}
            </div>
            <div className="p-3 sm:p-4 bg-white rounded-lg shadow">
                <SectionTitleWithIcon title="Quick Admin Links" icon={<QuickLinkIcon />} className="text-lg sm:text-xl" />
                <div className="space-y-1 sm:space-y-2">
                    <Link to="/admin/offices"><Button variant="ghost" className="w-full justify-start text-sm sm:text-base">Manage Offices</Button></Link>
                    <Link to="/admin/workflows"><Button variant="ghost" className="w-full justify-start text-sm sm:text-base">Manage Workflows</Button></Link>
                    <Link to="/admin/audit-log"><Button variant="ghost" className="w-full justify-start text-sm sm:text-base">View Audit Log</Button></Link>
                    <Link to="/admin/reports"><Button variant="ghost" className="w-full justify-start text-sm sm:text-base">View Reports</Button></Link>
                </div>
            </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="p-3 sm:p-4 bg-white rounded-lg shadow">
        <Input 
          type="text"
          placeholder="Search by File ID, Title, Subject, Office..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-3 sm:mb-4"
          aria-label="Basic file search"
        />
        <button
          onClick={() => setShowAdvancedSearch(prev => !prev)}
          aria-expanded={showAdvancedSearch}
          aria-controls="advanced-search-panel"
          className="w-full flex justify-between items-center text-left py-2 px-3 bg-gray-50 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <span className="font-medium text-sm sm:text-base text-gray-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 12h9.75m-9.75 6h9.75M3.75 6H7.5m-3.75 6H7.5m-3.75 6H7.5" /></svg>
            Advanced Filters
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 text-gray-500 transform transition-transform duration-150 ${showAdvancedSearch ? 'rotate-180' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showAdvancedSearch && (
          <div id="advanced-search-panel" className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 sm:gap-x-4 gap-y-4 sm:gap-y-6">
              <Select label="Current Office" id="advFilterCurrentOfficeId" value={advFilterCurrentOfficeId} onChange={e => setAdvFilterCurrentOfficeId(e.target.value)} options={officeOptionsForFilter} />
              <Select label="Originating Office" id="advFilterOriginatingOfficeId" value={advFilterOriginatingOfficeId} onChange={e => setAdvFilterOriginatingOfficeId(e.target.value)} options={officeOptionsForFilter} />
              <Select label="Tray Status" id="advFilterTrayStatus" value={advFilterTrayStatus} onChange={e => setAdvFilterTrayStatus(e.target.value as FileTrayStatus | '')} options={trayStatusOptions} />
              <Input type="date" label="Last Moved From" id="advFilterDateFrom" value={advFilterDateFrom} onChange={e => setAdvFilterDateFrom(e.target.value)} max={advFilterDateTo} />
              <Input type="date" label="Last Moved To" id="advFilterDateTo" value={advFilterDateTo} onChange={e => setAdvFilterDateTo(e.target.value)} min={advFilterDateFrom} />
            </div>
            <div className="mt-4 sm:mt-6 flex justify-end">
              <Button variant="secondary" onClick={handleClearAdvancedFilters} size="sm" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562 0c.143.023.286.044.431.06M5.25 5.79v-.03a3.375 3.375 0 013.375-3.375h2.25c.175 0 .346.026.52.075m3.14.075c.174-.049.345-.075.52-.075h2.25a3.375 3.375 0 013.375 3.375v.03" /></svg>}>
                Clear Advanced Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main File Lists */}
      {currentUser.role === UserRole.OFFICE_USER && userOffice && (
        <>
          {renderMainFileList(filesInMyInTrayList, `My Office's IN Tray (${userOffice.name})`, 'in-tray', <InTrayIcon/>)}
          {renderMainFileList(incomingFilesForMyOfficeList, `Incoming Files for ${userOffice.name}`, 'incoming', <IncomingIcon/>)}
          {renderMainFileList(filesInMyOutTrayList, `My Office's OUT Tray (${userOffice.name}) - Files Dispatched`, 'out-tray', <OutTrayIcon/>)}
        </>
      )}

      {currentUser.role === UserRole.ADMIN && (
        renderMainFileList(adminAllFilesList, "All Registered Files (Filtered)", 'all', <AllFilesIcon/>)
      )}
    </div>
  );
};

export default DashboardPage;