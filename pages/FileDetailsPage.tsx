
import React, { useState, useEffect, ChangeEvent, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData} from "@/contexts/DataContext.tsx";
import { useAuth } from '@/contexts/AuthContext';
import { FileItem, MovementLog, UserRole, FileTrayStatus, WorkflowTemplate, WorkflowStep, MovementAction } from '@/types';
import Button from '@/components/common/Button';
import Textarea from '@/components/common/Textarea';
import Input from '@/components/common/Input';
import MoveFileModal from '../components/file/MoveFileModal';
import { MOVEMENT_REASONS } from '@/constants';
import Breadcrumbs, { BreadcrumbItemType } from '@/components/common/Breadcrumbs';

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper to format timestamp for display
const formatDisplayTimestamp = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getReasonLabel = (reasonValue?: string): string | undefined => {
    return MOVEMENT_REASONS.find(r => r.value === reasonValue)?.label || reasonValue;
};

const SectionTitleWithIcon: React.FC<{ title: string; icon: React.ReactNode; className?: string }> = ({ title, icon, className="text-lg sm:text-xl" }) => (
  <div className={`flex items-center font-semibold text-gray-700 mb-3 sm:mb-4 ${className}`}>
    <span className="mr-2 sm:mr-3 text-gray-500">{icon}</span>
    {title}
  </div>
);

const HomeIconBreadcrumb = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 10.707V17.5a1.5 1.5 0 01-1.5 1.5h-3.75a.75.75 0 01-.75-.75V13.5a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75V18a.75.75 0 01-.75.75H3.5A1.5 1.5 0 012 17.5V10.707a1 1 0 01.293-.707l7-7z" clipRule="evenodd" /></svg>;
const FileIconBreadcrumb = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6.707a2.001 2.001 0 00-.586-1.414l-2.292-2.293A2.002 2.002 0 0012.208 2H4zm7.5 1.5V6h2.292L11.5 3.5zM6 8.75a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75zm0 3a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75zm0 3a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>;


const FileDetailsPage: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { 
    getFileById, 
    getMovementLogsForFile, 
    getOfficeById, 
    getWorkflowTemplateById, 
    addCommentToFile, 
    addAttachmentToFile, 
    deleteAttachmentFromFile,
    addMessageToFile, 
    MOCK_USERS 
  } = useData(); 
  const { currentUser } = useAuth(); 

  const [file, setFile] = useState<FileItem | null>(null);
  const [movementHistory, setMovementHistory] = useState<MovementLog[]>([]);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  const [workflowTemplate, setWorkflowTemplate] = useState<WorkflowTemplate | null>(null);
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState<WorkflowStep | null>(null);

  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const [selectedFileForAttachment, setSelectedFileForAttachment] = useState<File | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const [newMessage, setNewMessage] = useState(''); 
  const [isSendingMessage, setIsSendingMessage] = useState(false); 


  const refreshFileAndHistory = useCallback(() => {
    if (fileId) {
      const foundFile = getFileById(fileId);
      if (foundFile) {
        setFile(foundFile);
        setMovementHistory(getMovementLogsForFile(fileId));

        if (foundFile.workflowTemplateId) {
          const wfTemplate = getWorkflowTemplateById(foundFile.workflowTemplateId);
          setWorkflowTemplate(wfTemplate || null);
          if (wfTemplate && foundFile.currentWorkflowStepId) {
            const wfStep = wfTemplate.steps.find(s => s.id === foundFile.currentWorkflowStepId);
            setCurrentWorkflowStep(wfStep || null);
          } else {
            setCurrentWorkflowStep(null);
          }
        } else {
          setWorkflowTemplate(null);
          setCurrentWorkflowStep(null);
        }
      } else {
        console.error("File not found after action");
        navigate('/404-file-not-found', { replace: true }); 
      }
    }
  }, [fileId, getFileById, getMovementLogsForFile, getWorkflowTemplateById, navigate]);

  useEffect(() => {
    refreshFileAndHistory();
  }, [refreshFileAndHistory, fileId]); 

  const handleDispatchReceiveClose = () => {
    setIsMoveModalOpen(false);
    refreshFileAndHistory(); 
  };

  const canDispatch = useMemo(() => {
    if (!file || !currentUser || currentUser.role !== UserRole.OFFICE_USER || !currentUser.officeId) return false;
    return currentUser.officeId === file.currentOfficeId && file.currentTray === FileTrayStatus.IN_TRAY && !file.workflowTemplateId;
  }, [file, currentUser]);

  const canReceive = useMemo(() => {
    if (!file || !currentUser || currentUser.role !== UserRole.OFFICE_USER || !currentUser.officeId) return false;
    return currentUser.officeId === file.destinationOfficeId && file.currentTray === FileTrayStatus.OUT_TRAY && !file.workflowTemplateId;
  }, [file, currentUser]);
  
  const getUserNameById = (userId: string): string => MOCK_USERS.find(u => u.id === userId)?.name || userId;

  const isOverdue = useMemo(() => {
    if (file?.expectedCompletionDate && (file.currentTray === FileTrayStatus.OUT_TRAY || (file.currentTray === FileTrayStatus.IN_TRAY && file.currentOfficeId === file.destinationOfficeId) )) {
        const today = new Date();
        today.setHours(0,0,0,0); 
        const expectedDate = new Date(file.expectedCompletionDate);
        return expectedDate < today;
    }
    return false;
  }, [file]);


  const handleAddComment = async () => {
    if (!file || !newComment.trim() || !currentUser) return;
    setIsSubmittingComment(true);
    const success = addCommentToFile(file.id, newComment, currentUser);
    if (success) {
      setNewComment('');
      refreshFileAndHistory(); 
    } else {
      // Snackbar will show error from DataContext
    }
    setIsSubmittingComment(false);
  };

  const handleAttachmentUpload = async () => {
    if (!file || !selectedFileForAttachment || !currentUser) return;
    setIsUploadingAttachment(true);
    const newAttachment = await addAttachmentToFile(file.id, selectedFileForAttachment, currentUser);
    if (newAttachment) {
      setSelectedFileForAttachment(null);
      const fileInput = document.getElementById('attachment-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = ""; 
      refreshFileAndHistory();
    } else {
      // Snackbar will show error from DataContext
    }
    setIsUploadingAttachment(false);
  };
  
  const handleDeleteAttachment = (attachmentId: string) => {
    if (!file) return;
    // Confirmation is handled by Snackbar in DataContext
    const success = deleteAttachmentFromFile(file.id, attachmentId);
    if (success) { // If deletion process initiated
      // State will update if deletion confirmed via snackbar
      // For immediate UI feedback if needed, could optimistically update or wait for snackbar commit
    }
  };

  const handleSendMessage = async () => {
    if (!file || !newMessage.trim() || !currentUser) return;
    setIsSendingMessage(true);
    const success = addMessageToFile(file.id, currentUser.id, newMessage);
    if (success) {
      setNewMessage('');
      refreshFileAndHistory();
    } else {
       // Snackbar will show error
    }
    setIsSendingMessage(false);
  };

  const getAttachmentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-500"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
    }
    if (mimeType === 'application/pdf') {
      return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
    }
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5A2.25 2.25 0 006.75 19.5h7.5m0-12.75h3.75M19.5 14.25v2.25A2.25 2.25 0 0117.25 19.5h-2.25m-7.5 0L15 12.75M15 12.75L12.75 15m2.25-2.25V6.75M12 19.5h3.75m-3.75 0L9.75 12.75M9.75 12.75L12 15m-2.25-2.25V6.75" /></svg>;
  };

  const getMovementActionIcon = (action: MovementAction) => {
    switch(action) {
      case MovementAction.REGISTERED:
      case MovementAction.WORKFLOW_STARTED:
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case MovementAction.MOVED_TO_OUT_TRAY:
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
      case MovementAction.RECEIVED_IN_IN_TRAY:
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.12a2.25 2.25 0 002.15 2.92h15a2.25 2.25 0 002.15-2.92l-2.412-7.752A2.25 2.25 0 0017.088 3.75H15m0-2.25h-3.75m3.75 2.25L15 1.5M15 1.5l-3.75-1.5M15 1.5V4.5" /></svg>;
      case MovementAction.COMMENT_ADDED:
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-3.862 8.25-8.625 8.25S3.75 16.556 3.75 12D3.75 7.444 7.612 3.75 12.375 3.75S21 7.444 21 12z" /></svg>;
      case MovementAction.WORKFLOW_STEP_COMPLETED:
      case MovementAction.WORKFLOW_COMPLETED:
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;
    }
  };


  if (!file) {
    return <div className="text-center p-8 text-xl">Loading file details or file not found...</div>;
  }

  const breadcrumbItems: BreadcrumbItemType[] = [
    { label: "Dashboard", path: "/", icon: <HomeIconBreadcrumb /> },
    { label: "File", path: `/file/${file.id}`, icon: <FileIconBreadcrumb /> },
    { label: file.id }
  ];

  const originatingOffice = getOfficeById(file.originatingOfficeId);
  const currentOffice = getOfficeById(file.currentOfficeId);
  const destinationOffice = file.destinationOfficeId ? getOfficeById(file.destinationOfficeId) : null;

  const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
  const WorkflowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
  const AttachmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3.375 3.375 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81" /></svg>;
  const CommentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3.68-3.091A9.75 9.75 0 0112.155 11.25H6.568c-1.007 0-1.837-.857-1.837-1.909V6.75c0-1.052.83-1.909 1.837-1.909h9.376c.97 0 1.795.728 1.997 1.676A7.5 7.5 0 0120.25 8.511z" /></svg>;
  const MessageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75A.375.375 0 118.25 9.375a.375.375 0 01.375.375zm0 0H8.25m5.563-.375a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h.001M12 3.75c-4.418 0-8 2.866-8 6.403v4.461a.75.75 0 00.75.75h14.5a.75.75 0 00.75-.75v-4.461c0-3.537-3.582-6.403-8-6.403zM12 15.75H4.5v-3.403c0-2.22.992-4.153 2.663-5.242a9.923 9.923 0 014.837-1.354h.001c1.77.09 3.44.695 4.837 1.354C18.508 8.246 19.5 10.177 19.5 12.397v3.353H12z" /></svg>;
  const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
  const OverdueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;


  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 break-words">{file.title}</h1>
            <p className="text-xs sm:text-sm text-gray-500">File ID: {file.id}</p>
          </div>
          <div className="mt-3 sm:mt-0 flex space-x-2 self-start sm:self-center">
            {canDispatch && <Button variant="primary" onClick={() => setIsMoveModalOpen(true)} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>} size="sm">Dispatch</Button>}
            {canReceive && <Button variant="primary" onClick={() => setIsMoveModalOpen(true)} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.12a2.25 2.25 0 002.15 2.92h15a2.25 2.25 0 002.15-2.92l-2.412-7.752A2.25 2.25 0 0017.088 3.75H15m0-2.25h-3.75m3.75 2.25L15 1.5M15 1.5l-3.75-1.5M15 1.5V4.5" /></svg>} size="sm">Receive</Button>}
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4"><strong className="font-medium">Subject:</strong> {file.subject}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <SectionTitleWithIcon title="File Information" icon={<InfoIcon />} />
          <dl className="space-y-2 text-sm sm:text-base">
            <div><dt className="font-medium text-gray-600">Originating Office:</dt><dd className="text-gray-800">{originatingOffice?.name || 'N/A'}</dd></div>
            <div><dt className="font-medium text-gray-600">Date Created:</dt><dd className="text-gray-800">{new Date(file.dateCreated).toLocaleDateString()}</dd></div>
            <div><dt className="font-medium text-gray-600">Current Office:</dt><dd className="text-gray-800">{currentOffice?.name || 'N/A'}</dd></div>
            <div>
                <dt className="font-medium text-gray-600">Current Tray:</dt>
                <dd className={`font-semibold inline-flex items-center ${file.currentTray === FileTrayStatus.IN_TRAY ? 'text-green-600' : 'text-yellow-600'}`}>
                    {file.currentTray === FileTrayStatus.IN_TRAY ? 
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.12a2.25 2.25 0 002.15 2.92h15a2.25 2.25 0 002.15-2.92l-2.412-7.752A2.25 2.25 0 0017.088 3.75H15M4.5 3.75L4.5 7.5M7.5 3.75L7.5 7.5M10.5 3.75L10.5 7.5M13.5 3.75L13.5 7.5M16.5 3.75L16.5 7.5M19.5 3.75L19.5 7.5" /></svg> :
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></svg>
                    }
                    {file.currentTray === FileTrayStatus.IN_TRAY ? 'IN Tray' : 'OUT Tray'}
                </dd>
            </div>
            {file.destinationOfficeId && destinationOffice && (
              <div><dt className="font-medium text-gray-600">Destination Office:</dt><dd className="text-gray-800">{destinationOffice.name}</dd></div>
            )}
            {file.expectedCompletionDate && (
              <div>
                <dt className="font-medium text-gray-600">Expected Completion:</dt>
                <dd className={`${isOverdue ? 'text-red-600 font-bold' : 'text-gray-800'}`}>
                  {new Date(file.expectedCompletionDate).toLocaleDateString()}
                  {isOverdue && <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full inline-flex items-center"><OverdueIcon />OVERDUE</span>}
                </dd>
              </div>
            )}
            <div><dt className="font-medium text-gray-600">Last Moved At:</dt><dd className="text-gray-800">{new Date(file.lastMovedAt).toLocaleString()}</dd></div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <SectionTitleWithIcon title="Workflow Status" icon={<WorkflowIcon />} />
          {workflowTemplate && currentWorkflowStep ? (
            <dl className="space-y-2 text-sm sm:text-base">
              <div><dt className="font-medium text-gray-600">Workflow Name:</dt><dd className="text-gray-800">{workflowTemplate.name}</dd></div>
              <div><dt className="font-medium text-gray-600">Current Step:</dt><dd className="text-gray-800">{currentWorkflowStep.name}</dd></div>
              <div><dt className="font-medium text-gray-600">Step Target Office:</dt><dd className="text-gray-800">{getOfficeById(currentWorkflowStep.targetOfficeId)?.name || 'N/A'}</dd></div>
              <div><dt className="font-medium text-gray-600">Step Action:</dt><dd className="text-gray-800">{currentWorkflowStep.actionDescription}</dd></div>
            </dl>
          ) : (
            <p className="text-gray-500 text-sm sm:text-base">This file is not currently part of an active workflow.</p>
          )}
        </div>
      </div>

      {Object.keys(file.customMetadata || {}).length > 0 && (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <SectionTitleWithIcon title="Custom Metadata" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6" /></svg>} />
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-2 text-sm sm:text-base">
                {Object.entries(file.customMetadata || {}).map(([key, value]) => (
                    <div key={key} className="py-1"><dt className="font-medium text-gray-600">{key}:</dt><dd className="text-gray-800 break-all">{value}</dd></div>
                ))}
            </dl>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <SectionTitleWithIcon title="Attachments" icon={<AttachmentIcon />} />
        <div className="mb-3 sm:mb-4 space-y-2">
            <Input 
                type="file" 
                id="attachment-upload" 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSelectedFileForAttachment(e.target.files ? e.target.files[0] : null)}
                aria-label="Select file for attachment"
                className="text-sm"
            />
            {selectedFileForAttachment && (
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <p className="text-xs sm:text-sm text-gray-600">Selected: {selectedFileForAttachment.name} ({formatFileSize(selectedFileForAttachment.size)})</p>
                    <Button onClick={handleAttachmentUpload} isLoading={isUploadingAttachment} size="sm" disabled={isUploadingAttachment} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>}>
                        {isUploadingAttachment ? 'Uploading...' : 'Upload'}
                    </Button>
                </div>
            )}
        </div>
        {(file.attachments || []).length === 0 ? (
            <p className="text-gray-500 text-sm sm:text-base">No attachments for this file.</p>
        ) : (
            <ul className="space-y-2 sm:space-y-3">
                {(file.attachments || []).map(att => (
                    <li key={att.id} className="p-2 sm:p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between items-start">
                        <div className="flex-grow mb-2 sm:mb-0 flex items-start">
                            <span className="mr-2 pt-0.5">{getAttachmentIcon(att.mimeType)}</span>
                            <div>
                                <p className="font-medium text-sm sm:text-base text-blue-600 break-all">{att.fileName}</p>
                                <p className="text-xs text-gray-500">
                                    Size: {formatFileSize(att.size)} | Uploaded: {new Date(att.uploadedAt).toLocaleDateString()} by {getUserNameById(att.uploadedByUserId)}
                                </p>
                                {att.dataUrl && att.mimeType.startsWith('image/') && (
                                    <img src={att.dataUrl} alt={`Preview of ${att.fileName}`} className="mt-2 max-h-24 sm:max-h-32 max-w-xs rounded border border-gray-300" />
                                )}
                            </div>
                        </div>
                         {currentUser?.id === att.uploadedByUserId || currentUser?.role === UserRole.ADMIN ? (
                            <Button variant="danger" size="sm" onClick={() => handleDeleteAttachment(att.id)} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562 0c.143.023.286.044.431.06M5.25 5.79v-.03a3.375 3.375 0 013.375-3.375h2.25c.175 0 .346.026.52.075m3.14.075c.174-.049.345-.075.52-.075h2.25a3.375 3.375 0 013.375 3.375v.03" /></svg>}>Delete</Button>
                         ): null}
                    </li>
                ))}
            </ul>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <SectionTitleWithIcon title="Add Comment to History" icon={<CommentIcon />} />
        <div className="space-y-2 sm:space-y-3">
            <Textarea 
                id="newComment" 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type your comment here..."
                label="New Comment"
                rows={2}
                className="text-sm sm:text-base"
            />
            <Button onClick={handleAddComment} isLoading={isSubmittingComment} disabled={isSubmittingComment || !newComment.trim()} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>} size="sm">
                {isSubmittingComment ? 'Submitting...' : 'Add Comment'}
            </Button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <SectionTitleWithIcon title="Messages / Discussion" icon={<MessageIcon />} />
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 max-h-80 sm:max-h-96 overflow-y-auto pr-2">
          {(file.messages || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No messages for this file yet.</p>
          ) : (
            (file.messages || []).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(msg => (
              <div key={msg.id} className={`p-2 sm:p-3 rounded-lg flex items-start space-x-2 ${msg.senderId === currentUser?.id ? 'bg-blue-50 ml-auto' : 'bg-gray-100 mr-auto'} max-w-[85%]`}>
                <span className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm ${msg.senderId === currentUser?.id ? 'bg-blue-500' : 'bg-gray-400'}`}>
                  {getUserNameById(msg.senderId).substring(0,1)}
                </span>
                <div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className="text-xs mt-1">
                    <span className="font-medium text-gray-600">{getUserNameById(msg.senderId)}</span>
                    <span className="text-gray-400"> - {formatDisplayTimestamp(msg.timestamp)}</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-3 sm:mt-4 border-t pt-3 sm:pt-4">
          <Textarea
            id="newMessage"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            label="Send a new message"
            rows={2}
            className="text-sm sm:text-base"
          />
          <Button 
            onClick={handleSendMessage} 
            isLoading={isSendingMessage} 
            disabled={isSendingMessage || !newMessage.trim()}
            className="mt-2"
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>}
            size="sm"
          >
            {isSendingMessage ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <SectionTitleWithIcon title="File Movement History & Comments" icon={<HistoryIcon />} />
        {movementHistory.length === 0 ? (
          <p className="text-gray-500 text-sm sm:text-base">No movement history recorded for this file.</p>
        ) : (
          <ul className="space-y-3 sm:space-y-4">
            {movementHistory.map(log => (
              <li key={log.id} className="p-3 sm:p-4 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <span className="flex-shrink-0 pt-0.5">{getMovementActionIcon(log.action)}</span>
                  <div className="flex-grow text-xs sm:text-sm">
                    <p className="font-semibold text-gray-800">
                      {log.action.replace(/_/g, ' ')}
                      {log.action === MovementAction.COMMENT_ADDED && `: ${log.remarks}`}
                    </p>
                    <p className="text-gray-500">
                      By: {getUserNameById(log.userId)} 
                      {log.processedByOfficeId && ` (Office: ${getOfficeById(log.processedByOfficeId)?.name || 'N/A'})`}
                    </p>
                    <p className="text-gray-500">Date: {new Date(log.timestamp).toLocaleString()}</p>
                    {log.reason && <p className="text-gray-500">Reason: <span className="font-medium">{getReasonLabel(log.reason) || log.reason}</span></p>}
                    {log.action !== MovementAction.COMMENT_ADDED && log.fromOfficeId && <p className="text-gray-500">From: {getOfficeById(log.fromOfficeId)?.name || 'N/A'}</p>}
                    {log.action !== MovementAction.COMMENT_ADDED && <p className="text-gray-500">To: {getOfficeById(log.toOfficeId)?.name || 'N/A'}</p>}
                    {log.action !== MovementAction.COMMENT_ADDED && log.remarks && <p className="text-gray-500">Remarks: {log.remarks}</p>}
                    {log.workflowStepName && <p className="text-purple-600">Workflow Step: {log.workflowStepName}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isMoveModalOpen && (canDispatch || canReceive) && (
        <MoveFileModal
          isOpen={isMoveModalOpen}
          onClose={handleDispatchReceiveClose}
          file={file}
          actionType={canDispatch ? 'dispatch' : 'receive'}
        />
      )}

      <div className="mt-6 sm:mt-8 text-center">
        <Button variant="secondary" onClick={() => navigate(-1)} size="sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default FileDetailsPage;
