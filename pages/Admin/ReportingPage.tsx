
import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { MovementLog, MovementAction, FileItem, FileTrayStatus, Office, User } from '../../types';
import { Link } from 'react-router-dom';
import SimpleBarChart from '../../components/charts/SimpleBarChart'; 
import Breadcrumbs, { BreadcrumbItemType } from '../../components/common/Breadcrumbs'; 

function formatDuration(ms: number): string {
  if (isNaN(ms) || ms < 0) return 'N/A';
  if (ms === 0) return '0s';

  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  
  return parts.length > 0 ? parts.join(' ') : '<1s';
}

const STAGNANT_FILE_THRESHOLD_DAYS = 3; 
const STAGNANT_FILE_THRESHOLD_MS = STAGNANT_FILE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

const SectionTitle: React.FC<{ title: string; icon?: React.ReactNode; className?: string }> = ({ title, icon, className="text-lg sm:text-xl" }) => (
  <div className={`flex items-center mb-3 sm:mb-4 ${className}`}>
    {icon && <span className="mr-2 sm:mr-3 text-gray-600">{icon}</span>}
    <h2 className="font-semibold text-gray-700">{title}</h2>
  </div>
);

const HomeIconBreadcrumb = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 10.707V17.5a1.5 1.5 0 01-1.5 1.5h-3.75a.75.75 0 01-.75-.75V13.5a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75V18a.75.75 0 01-.75.75H3.5A1.5 1.5 0 012 17.5V10.707a1 1 0 01.293-.707l7-7z" clipRule="evenodd" /></svg>;
const AdminIconBreadcrumb = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M7.83 1.15A.75.75 0 018.285 0h3.43a.75.75 0 01.456 1.15l-1.41 1.88a.75.75 0 00-.216.379l-.216 1.08a12.93 12.93 0 015.817 3.087c.193.18.294.43.294.691V13.5a.75.75 0 01-.75.75h-2.505a.75.75 0 01-.75-.75V12a1.5 1.5 0 00-1.5-1.5H9a1.5 1.5 0 00-1.5 1.5v1.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75V8.236c0-.26.1-.51.292-.691a12.93 12.93 0 015.818-3.087l-.216-1.08a.75.75 0 00-.216-.38L7.83 1.15zM10 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM6.39 14.913a.75.75 0 011.16-.914l.175.22a.75.75 0 01-.913 1.16l-.175-.22a.75.75 0 01-.247-.246zM14.448 14.22a.75.75 0 01-.247.246l-.175.22a.75.75 0 11-.914-1.16l.175-.22a.75.75 0 011.16.914z" clipRule="evenodd" /></svg>;

const ReportingPage: React.FC = () => {
  const { files, movementLogs, offices, getOfficeById, MOCK_USERS } = useData();

  const getUserById = (userId: string): User | undefined => MOCK_USERS.find(u => u.id === userId);

  const movementStatistics = useMemo(() => {
    const stats = {
      [MovementAction.REGISTERED]: 0,
      [MovementAction.MOVED_TO_OUT_TRAY]: 0,
      [MovementAction.RECEIVED_IN_IN_TRAY]: 0,
      [MovementAction.COMMENT_ADDED]: 0,
      [MovementAction.WORKFLOW_STARTED]: 0,
    };
    movementLogs.forEach(log => {
      if (stats[log.action as keyof typeof stats] !== undefined) { 
        stats[log.action as keyof typeof stats]++;
      }
    });
    return stats;
  }, [movementLogs]);

  const movementStatsChartData = useMemo(() => [
    { label: 'Registered', value: movementStatistics[MovementAction.REGISTERED] + movementStatistics[MovementAction.WORKFLOW_STARTED], color: '#60a5fa' },
    { label: 'To OUT Tray', value: movementStatistics[MovementAction.MOVED_TO_OUT_TRAY], color: '#fbbf24' },
    { label: 'To IN Tray', value: movementStatistics[MovementAction.RECEIVED_IN_IN_TRAY], color: '#34d399' },
    { label: 'Comments', value: movementStatistics[MovementAction.COMMENT_ADDED], color: '#a78bfa' },
  ], [movementStatistics]);


  const averageTransitTimes = useMemo(() => {
    const transitData: { [key: string]: { totalTime: number; count: number } } = {};
    const sortedLogs = [...movementLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const dispatchedMap = new Map<string, MovementLog>();

    sortedLogs.forEach(log => {
        if (log.action === MovementAction.MOVED_TO_OUT_TRAY && log.fromOfficeId && log.toOfficeId) {
            dispatchedMap.set(`${log.fileId}_${log.fromOfficeId}_${log.toOfficeId}`, log);
        } else if (log.action === MovementAction.RECEIVED_IN_IN_TRAY && log.fromOfficeId && log.toOfficeId) {
            const dispatchKey = `${log.fileId}_${log.fromOfficeId}_${log.toOfficeId}`;
            const dispatchLog = dispatchedMap.get(dispatchKey);
            if (dispatchLog) {
                const transitTime = new Date(log.timestamp).getTime() - new Date(dispatchLog.timestamp).getTime();
                if (transitTime >= 0) {
                    const key = `${dispatchLog.fromOfficeId}_${dispatchLog.toOfficeId}`;
                    if (!transitData[key]) transitData[key] = { totalTime: 0, count: 0 };
                    transitData[key].totalTime += transitTime;
                    transitData[key].count++;
                }
                dispatchedMap.delete(dispatchKey);
            }
        }
    });
    
    return Object.entries(transitData).map(([key, data]) => {
      const [fromOfficeId, toOfficeId] = key.split('_');
      return {
        fromOffice: getOfficeById(fromOfficeId)?.name || 'Unknown',
        toOffice: getOfficeById(toOfficeId)?.name || 'Unknown',
        averageTime: data.count > 0 ? data.totalTime / data.count : 0,
        count: data.count,
      };
    }).filter(item => item.count > 0);
  }, [movementLogs, getOfficeById]);

  const filesPerOfficeAndTray = useMemo(() => {
    const stats: { [officeId: string]: { name: string; inTray: number; outTray: number; total: number } } = {};
    offices.forEach(office => {
      stats[office.id] = { name: office.name, inTray: 0, outTray: 0, total: 0 };
    });
    files.forEach(file => {
      if (stats[file.currentOfficeId]) {
        if (file.currentTray === FileTrayStatus.IN_TRAY) stats[file.currentOfficeId].inTray++;
        else if (file.currentTray === FileTrayStatus.OUT_TRAY) stats[file.currentOfficeId].outTray++;
        stats[file.currentOfficeId].total++;
      }
    });
    return Object.values(stats);
  }, [files, offices]);
  
  const filesPerOfficeChartData = useMemo(() => 
    filesPerOfficeAndTray.flatMap(office => [
      { label: `${office.name} (IN)`, value: office.inTray, color: '#34d399' }, 
      { label: `${office.name} (OUT)`, value: office.outTray, color: '#fbbf24' }  
    ]).filter(d => d.value > 0) 
  , [filesPerOfficeAndTray]);

  const averageTimeInInTrayPerOffice = useMemo(() => {
    const officeInTrayTimes: { [officeId: string]: { totalDuration: number, count: number } } = {};
    const fileEnterInTrayTimes: { [fileOfficeKey: string]: string } = {}; 

    const sortedLogs = [...movementLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sortedLogs.forEach(log => {
      const fileOfficeKey = `${log.fileId}_${log.toOfficeId}`; 
      const fileLeavingOfficeKey = `${log.fileId}_${log.fromOfficeId}`; 

      if ( (log.action === MovementAction.RECEIVED_IN_IN_TRAY || log.action === MovementAction.REGISTERED || log.action === MovementAction.WORKFLOW_STARTED) && log.toOfficeId ) {
        fileEnterInTrayTimes[fileOfficeKey] = log.timestamp;
      } else if ( (log.action === MovementAction.MOVED_TO_OUT_TRAY || log.action === MovementAction.WORKFLOW_STEP_COMPLETED || log.action === MovementAction.WORKFLOW_COMPLETED ) && log.fromOfficeId && fileEnterInTrayTimes[fileLeavingOfficeKey] ) {
        const enterTime = new Date(fileEnterInTrayTimes[fileLeavingOfficeKey]).getTime();
        const leaveTime = new Date(log.timestamp).getTime();
        const duration = leaveTime - enterTime;

        if (duration >= 0) {
          if (!officeInTrayTimes[log.fromOfficeId]) {
            officeInTrayTimes[log.fromOfficeId] = { totalDuration: 0, count: 0 };
          }
          officeInTrayTimes[log.fromOfficeId].totalDuration += duration;
          officeInTrayTimes[log.fromOfficeId].count++;
        }
        delete fileEnterInTrayTimes[fileLeavingOfficeKey]; 
      }
    });

    return Object.entries(officeInTrayTimes).map(([officeId, data]) => ({
      officeName: getOfficeById(officeId)?.name || 'Unknown Office',
      averageDuration: data.count > 0 ? data.totalDuration / data.count : 0,
      filesProcessed: data.count,
    })).filter(item => item.filesProcessed > 0);
  }, [movementLogs, getOfficeById]);

  const potentiallyStagnantFiles = useMemo(() => {
    return files
      .filter(file => file.currentTray === FileTrayStatus.IN_TRAY)
      .map(file => {
        const timeInCurrentTray = Date.now() - new Date(file.lastMovedAt).getTime();
        return { ...file, timeInCurrentTray };
      })
      .filter(file => file.timeInCurrentTray > STAGNANT_FILE_THRESHOLD_MS)
      .sort((a,b) => b.timeInCurrentTray - a.timeInCurrentTray);
  }, [files]);

  const userActivitySummary = useMemo(() => {
    const userStats: { [userId: string]: { 
        userName: string, 
        officeName: string, 
        registered: number, 
        dispatched: number, 
        received: number, 
        comments: number 
    } } = {};

    MOCK_USERS.forEach(user => {
        userStats[user.id] = {
            userName: user.name,
            officeName: user.officeId ? getOfficeById(user.officeId)?.name || 'N/A' : 'Admin/N/A',
            registered: 0,
            dispatched: 0,
            received: 0,
            comments: 0,
        };
    });

    movementLogs.forEach(log => {
      if (userStats[log.userId]) {
        switch (log.action) {
          case MovementAction.REGISTERED:
          case MovementAction.WORKFLOW_STARTED: 
            userStats[log.userId].registered++;
            break;
          case MovementAction.MOVED_TO_OUT_TRAY:
            userStats[log.userId].dispatched++;
            break;
          case MovementAction.RECEIVED_IN_IN_TRAY:
            userStats[log.userId].received++;
            break;
          case MovementAction.COMMENT_ADDED:
            userStats[log.userId].comments++;
            break;
        }
      }
    });
    return Object.values(userStats).filter(
        s => s.registered > 0 || s.dispatched > 0 || s.received > 0 || s.comments > 0
    );
  }, [movementLogs, MOCK_USERS, getOfficeById]);


  const renderTableSection = (
    title: string, 
    headers: string[], 
    data: (React.ReactNode)[][], 
    icon: React.ReactNode,
    emptyMessage: string = "No data available for this report.",
    columnVisibility?: string[] // e.g. ['always', 'sm', 'md', 'lg'] matching headers length
  ) => (
    <div className="bg-white shadow-md rounded-lg p-3 sm:p-4 md:p-6">
      <SectionTitle title={title} icon={icon} />
      {data.length === 0 ? (
        <p className="text-gray-500 text-sm sm:text-base">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header, index) => (
                  <th key={index} className={`px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    columnVisibility && columnVisibility[index] === 'sm' ? 'hidden sm:table-cell' : 
                    columnVisibility && columnVisibility[index] === 'md' ? 'hidden md:table-cell' :
                    columnVisibility && columnVisibility[index] === 'lg' ? 'hidden lg:table-cell' : ''
                  }`}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className={`px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700 ${
                      columnVisibility && columnVisibility[cellIndex] === 'sm' ? 'hidden sm:table-cell' : 
                      columnVisibility && columnVisibility[cellIndex] === 'md' ? 'hidden md:table-cell' :
                      columnVisibility && columnVisibility[cellIndex] === 'lg' ? 'hidden lg:table-cell' : ''
                    }`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
  
  const transitTimeData = averageTransitTimes.map(item => [
    item.fromOffice,
    item.toOffice,
    formatDuration(item.averageTime),
    item.count,
  ]);

  const avgTimeInTrayData = averageTimeInInTrayPerOffice.map(item => [
    item.officeName,
    formatDuration(item.averageDuration),
    item.filesProcessed,
  ]);

  const stagnantFilesData = potentiallyStagnantFiles.map(file => [
    <Link to={`/file/${file.id}`} className="text-blue-600 hover:text-blue-800 flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H6.938c-.214 0-.425.023-.631.068m11.562 0a48.108 48.108 0 00-3.478-.397m-12.562 0c.143.023.286.044.431.06M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      {file.id}
    </Link>,
    file.title,
    getOfficeById(file.currentOfficeId)?.name || 'N/A',
    formatDuration(file.timeInCurrentTray),
    new Date(file.lastMovedAt).toLocaleDateString(),
  ]);

  const userActivityData = userActivitySummary.map(user => [
    user.userName,
    user.officeName,
    user.registered,
    user.dispatched,
    user.received,
    user.comments,
  ]);
  
  const iconBaseClass = "w-5 h-5 sm:w-6 sm:h-6";
  const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconBaseClass}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
  const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconBaseClass}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const OfficeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconBaseClass}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 12.75h6M9 18.75h6" /></svg>;
  const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconBaseClass}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
  const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconBaseClass}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;

  const breadcrumbItems: BreadcrumbItemType[] = [
    { label: "Dashboard", path: "/", icon: <HomeIconBreadcrumb /> },
    { label: "Admin", icon: <AdminIconBreadcrumb /> },
    { label: "Reports & Analytics" }
  ];

  return (
    <div className="max-w-full mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-gray-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Reports & Analytics</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg p-3 sm:p-4 md:p-6">
        <SectionTitle title="Overall File Movement Statistics" icon={<ChartIcon />} />
        <div className="w-full overflow-x-auto">
             <SimpleBarChart data={movementStatsChartData} title="File Movements" height={250} />
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-3 sm:p-4 md:p-6">
        <SectionTitle title="Current File Counts per Office & Tray" icon={<OfficeIcon />} />
        <div className="w-full overflow-x-auto">
            <SimpleBarChart data={filesPerOfficeChartData} title="Files per Office (IN/OUT)" height={Math.max(250, filesPerOfficeChartData.length * 20)} />
        </div>
      </div>

      {renderTableSection(
        "Average Transit Times Between Offices",
        ["From Office", "To Office", "Average Transit Time", "Completed Transits"],
        transitTimeData,
        <ClockIcon />,
        "No completed transit data available yet.",
        ['always', 'always', 'always', 'sm']
      )}
      
      {renderTableSection(
        `Average Time Files Spend in IN Tray (per Office)`,
        ["Office Name", "Avg Duration IN Tray", "Files Processed"],
        avgTimeInTrayData,
        <ClockIcon />,
        "No data on IN tray processing times yet.",
        ['always', 'always', 'sm']
      )}

      {renderTableSection(
        `Potentially Stagnant Files (in IN Tray > ${STAGNANT_FILE_THRESHOLD_DAYS} days)`,
        ["File ID", "Title", "Current Office", "Time in IN Tray", "Last Moved"],
        stagnantFilesData,
        <AlertIcon />,
        `No files currently in IN Tray for more than ${STAGNANT_FILE_THRESHOLD_DAYS} days.`,
        ['always', 'always', 'sm', 'md', 'lg']
      )}

      {renderTableSection(
        "User Activity Summary",
        ["User Name", "Office", "Registered", "Dispatched", "Received", "Comments"],
        userActivityData,
        <UsersIcon />,
        "No user activity recorded yet.",
        ['always', 'sm', 'always', 'always', 'always', 'md']
      )}

    </div>
  );
};

export default ReportingPage;