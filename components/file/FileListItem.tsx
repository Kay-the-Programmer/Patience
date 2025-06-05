
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileItem, FileTrayStatus, UserRole, WorkflowTemplate, WorkflowStep } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import MoveFileModal from './MoveFileModal';

interface FileListItemProps {
  file: FileItem;
  listType: 'in-tray' | 'out-tray' | 'incoming' | 'all';
}

const FileListItem: React.FC<FileListItemProps> = ({ file, listType }) => {
  const { getOfficeById, getWorkflowTemplateById } = useData();
  const { currentUser } = useAuth();
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  const currentOfficeName = getOfficeById(file.currentOfficeId)?.name || 'N/A';
  const destinationOfficeName = file.destinationOfficeId ? getOfficeById(file.destinationOfficeId)?.name : 'N/A';
  
  const workflowInfo = useMemo(() => {
    if (file.workflowTemplateId) {
      const template = getWorkflowTemplateById(file.workflowTemplateId);
      if (template) {
        const currentStep = file.currentWorkflowStepId ? template.steps.find(s => s.id === file.currentWorkflowStepId) : null;
        return {
          templateName: template.name,
          currentStepName: currentStep?.name || 'N/A',
          currentStepOffice: currentStep ? (getOfficeById(currentStep.targetOfficeId)?.name || 'N/A') : 'N/A'
        };
      }
    }
    return null;
  }, [file.workflowTemplateId, file.currentWorkflowStepId, getWorkflowTemplateById, getOfficeById]);

  const isFileInActiveWorkflow = !!workflowInfo;

  const isOverdue = useMemo(() => {
    if (file.expectedCompletionDate && (file.currentTray === FileTrayStatus.OUT_TRAY || (file.currentTray === FileTrayStatus.IN_TRAY && file.currentOfficeId === file.destinationOfficeId))) {
      const today = new Date();
      today.setHours(0,0,0,0); 
      const expectedDate = new Date(file.expectedCompletionDate);
      expectedDate.setHours(0,0,0,0); 
      return expectedDate < today;
    }
    return false;
  }, [file.expectedCompletionDate, file.currentTray, file.currentOfficeId, file.destinationOfficeId]);

  const canDispatch = currentUser?.role === UserRole.OFFICE_USER &&
                      currentUser.officeId === file.currentOfficeId &&
                      file.currentTray === FileTrayStatus.IN_TRAY &&
                      listType === 'in-tray' &&
                      !isFileInActiveWorkflow;

  const canReceive = currentUser?.role === UserRole.OFFICE_USER &&
                     currentUser.officeId === file.destinationOfficeId &&
                     file.currentTray === FileTrayStatus.OUT_TRAY &&
                     listType === 'incoming' &&
                     !isFileInActiveWorkflow;
  
  const TrayStatusIcon = () => {
    if (isFileInActiveWorkflow) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-purple-600 inline">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
    }
    if (file.currentTray === FileTrayStatus.IN_TRAY) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-green-600 inline">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.12a2.25 2.25 0 002.15 2.92h15a2.25 2.25 0 002.15-2.92l-2.412-7.752A2.25 2.25 0 0017.088 3.75H15M4.5 3.75L4.5 7.5M7.5 3.75L7.5 7.5M10.5 3.75L10.5 7.5M13.5 3.75L13.5 7.5M16.5 3.75L16.5 7.5M19.5 3.75L19.5 7.5" />
        </svg>
      );
    }
    return ( 
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-yellow-600 inline">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
      </svg>
    );
  };

  const actionButton = () => {
    const iconSizeClass = "w-3 h-3 sm:w-4 sm:h-4";
    if (canDispatch) {
      return <Button size="sm" variant="primary" onClick={() => setIsMoveModalOpen(true)} icon={
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconSizeClass}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
      }>Dispatch</Button>;
    }
    if (canReceive) {
      return <Button size="sm" variant="primary" onClick={() => setIsMoveModalOpen(true)} icon={
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconSizeClass}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.12a2.25 2.25 0 002.15 2.92h15a2.25 2.25 0 002.15-2.92l-2.412-7.752A2.25 2.25 0 0017.088 3.75H15m0-2.25h-3.75m3.75 2.25L15 1.5M15 1.5l-3.75-1.5M15 1.5V4.5" />
        </svg>
      }>Receive</Button>;
    }
     if (isFileInActiveWorkflow) {
        return <span className="text-xs text-purple-600 italic inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${iconSizeClass} mr-1`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            In Workflow
            </span>;
    }
    return null;
  };


  return (
    <>
      <tr className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50 hover:bg-red-100' : ''}`}>
        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800">
          <Link to={`/file/${file.id}`}>{file.id}</Link>
        </td>
        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{file.title}</td>
        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
            {currentOfficeName}
            {workflowInfo && <div className="text-xs text-purple-500 mt-1">Step: {workflowInfo.currentStepName}</div>}
        </td>
        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
          <span className={`px-1.5 sm:px-2 py-0.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
            isFileInActiveWorkflow ? 'bg-purple-100 text-purple-800' : 
            (file.currentTray === FileTrayStatus.IN_TRAY ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')
          }`}>
            <TrayStatusIcon />
            {isFileInActiveWorkflow ? `WORKFLOW (${file.currentTray.replace('_TRAY', '')})` : (file.currentTray === FileTrayStatus.IN_TRAY ? 'IN Tray' : 'OUT Tray')}
          </span>
          {isOverdue && 
            <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-red-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-0.5 sm:mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                OVERDUE
            </span>
          }
        </td>
        {listType !== 'in-tray' && (
          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
            {(file.currentTray === FileTrayStatus.OUT_TRAY && file.destinationOfficeId && !workflowInfo) ? destinationOfficeName : 'N/A'}
          </td>
        )}
        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
          {new Date(file.lastMovedAt).toLocaleDateString()}
          {file.expectedCompletionDate && (
             <div className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-400'}`}>Exp: {new Date(file.expectedCompletionDate).toLocaleDateString()}</div>
          )}
        </td>
        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium space-x-1 sm:space-x-2">
          <Link to={`/file/${file.id}`} className="text-indigo-600 hover:text-indigo-900 inline-flex items-center text-xs sm:text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            View
          </Link>
          {actionButton()}
        </td>
      </tr>
      {isMoveModalOpen && (canDispatch || canReceive) && (
        <MoveFileModal
          isOpen={isMoveModalOpen}
          onClose={() => setIsMoveModalOpen(false)}
          file={file}
          actionType={canDispatch ? 'dispatch' : 'receive'}
        />
      )}
    </>
  );
};

export default FileListItem;