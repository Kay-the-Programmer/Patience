import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { Office, FileItem, MovementLog, FileTrayStatus, MovementAction, User, Notification, NotificationType, WorkflowTemplate, Attachment, FileMessage } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { INITIAL_OFFICES, FILE_ID_PREFIX, MOCK_USERS } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { useSnackbar } from './SnackbarContext'; // Import useSnackbar

const MAX_ATTACHMENT_SIZE_FOR_DATAURL = 500 * 1024; // 500KB

interface DataContextType {
  offices: Office[];
  addOffice: (name: string) => Office | null;
  updateOffice: (id: string, name: string) => Office | null;
  deleteOffice: (id: string) => boolean; // Will now initiate undoable delete
  getOfficeById: (id: string) => Office | undefined;
  
  files: FileItem[];
  registerFile: (data: Omit<FileItem, 'id' | 'lastMovedAt' | 'currentTray' | 'currentOfficeId' | 'dateCreated' | 'workflowHistory' | 'attachments' | 'messages' | 'expectedCompletionDate'>, registeringUser: User, workflowTemplateId?: string) => FileItem | null;
  getFileById: (id: string) => FileItem | undefined;
  
  movementLogs: MovementLog[];
  getMovementLogsForFile: (fileId: string) => MovementLog[];

  moveFileToOutTray: (fileId: string, destinationOfficeId: string, reason: string, remarks: string, user: User, expectedCompletionDate?: string) => boolean;
  receiveFileInInTray: (fileId: string, reason: string, remarks: string, user: User) => boolean;
  addCommentToFile: (fileId: string, commentText: string, user: User) => boolean;
  addAttachmentToFile: (fileId: string, fileObject: File, user: User) => Promise<Attachment | null>;
  deleteAttachmentFromFile: (fileId: string, attachmentId: string) => boolean; // Will now initiate undoable delete
  addMessageToFile: (fileId: string, senderId: string, messageText: string) => boolean;


  notifications: Notification[];
  getNotificationsForUser: (userId: string) => Notification[];
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: (userId: string) => void;

  workflowTemplates: WorkflowTemplate[];
  addWorkflowTemplate: (templateData: Omit<WorkflowTemplate, 'id'>) => WorkflowTemplate | null;
  updateWorkflowTemplate: (template: WorkflowTemplate) => WorkflowTemplate | null;
  deleteWorkflowTemplate: (templateId: string) => boolean; // Will now initiate undoable delete
  getWorkflowTemplateById: (templateId: string) => WorkflowTemplate | undefined;
  
  MOCK_USERS: User[]; // Expose MOCK_USERS for name resolution
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [offices, setOffices] = useLocalStorage<Office[]>('app_offices', INITIAL_OFFICES);
  const [files, setFiles] = useLocalStorage<FileItem[]>('app_files', []);
  const [movementLogs, setMovementLogs] = useLocalStorage<MovementLog[]>('app_movement_logs', []);
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('app_notifications', []);
  const [workflowTemplates, setWorkflowTemplates] = useLocalStorage<WorkflowTemplate[]>('app_workflow_templates', []);
  
  const { showSnackbar } = useSnackbar();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('app_offices') === null) {
        setOffices(INITIAL_OFFICES);
    }
    if (localStorage.getItem('app_workflow_templates') === null) {
        setWorkflowTemplates([]); 
    }
    setFiles(prevFiles => prevFiles.map(f => ({ 
      ...f, 
      attachments: f.attachments || [],
      messages: f.messages || [],
      expectedCompletionDate: f.expectedCompletionDate || null,
    })));
    setIsInitialized(true);
  }, [setOffices, setWorkflowTemplates, setFiles]);


  const getOfficeById = useCallback((id: string) => offices.find(o => o.id === id), [offices]);

  const addOffice = useCallback((name: string): Office | null => {
    if (!name.trim()) {
        showSnackbar('Office name cannot be empty.', 'error');
        return null;
    }
    if (offices.some(o => o.name.toLowerCase() === name.trim().toLowerCase())) {
        showSnackbar('Office name already exists.', 'error');
        return null;
    }
    const newOffice: Office = { id: uuidv4(), name: name.trim() };
    setOffices(prev => [...prev, newOffice]);
    showSnackbar(`Office "${newOffice.name}" added successfully.`, 'success');
    return newOffice;
  }, [offices, setOffices, showSnackbar]);

  const updateOffice = useCallback((id: string, name: string): Office | null => {
    if (!name.trim()) {
        showSnackbar('Office name cannot be empty.', 'error');
        return null;
    }
    if (offices.some(o => o.name.toLowerCase() === name.trim().toLowerCase() && o.id !== id)) {
        showSnackbar('Another office with this name already exists.', 'error');
        return null;
    }
    let updatedOffice: Office | null = null;
    setOffices(prev => prev.map(o => {
      if (o.id === id) {
        updatedOffice = { ...o, name: name.trim() };
        return updatedOffice;
      }
      return o;
    }));
    if (updatedOffice) {
      showSnackbar(`Office "${updatedOffice.name}" updated successfully.`, 'success');
    } else {
      showSnackbar('Failed to update office.', 'error');
    }
    return updatedOffice;
  }, [offices, setOffices, showSnackbar]);

  const deleteOffice = useCallback((id: string): boolean => {
    const officeToDelete = offices.find(o => o.id === id);
    if (!officeToDelete) {
      showSnackbar('Error: Office not found.', 'error');
      return false;
    }

    if (files.some(f => f.currentOfficeId === id || f.originatingOfficeId === id || f.destinationOfficeId === id)) {
        showSnackbar(`Cannot delete office "${officeToDelete.name}". It is associated with existing files.`, 'error', {duration: 6000});
        return false;
    }
    if (workflowTemplates.some(wt => wt.steps.some(step => step.targetOfficeId === id))) {
        showSnackbar(`Cannot delete office "${officeToDelete.name}". It is used in workflow steps.`, 'error', {duration: 6000});
        return false;
    }

    const performDelete = () => {
        setOffices(prev => prev.filter(o => o.id !== id));
        showSnackbar(`Office "${officeToDelete.name}" has been deleted.`, 'success');
    };

    showSnackbar(
      `Office "${officeToDelete.name}" will be deleted.`,
      'warning',
      {
        onUndo: () => {
          showSnackbar(`Deletion of office "${officeToDelete.name}" cancelled.`, 'info');
        },
        onCommit: performDelete,
        undoLabel: 'Undo Delete',
        duration: 7000
      }
    );
    return true; // Indicates deletion process initiated
  }, [offices, files, workflowTemplates, setOffices, showSnackbar]);

  const getWorkflowTemplateById = useCallback((templateId: string) => workflowTemplates.find(wt => wt.id === templateId), [workflowTemplates]);

  const addWorkflowTemplate = useCallback((templateData: Omit<WorkflowTemplate, 'id'>): WorkflowTemplate | null => {
    if (!templateData.name.trim()) {
        showSnackbar('Workflow template name cannot be empty.', 'error');
        return null;
    }
    if (workflowTemplates.some(wt => wt.name.toLowerCase() === templateData.name.trim().toLowerCase())) {
        showSnackbar('Workflow template name already exists.', 'error');
        return null;
    }
    if (templateData.steps.length === 0) {
        showSnackbar('Workflow template must have at least one step.', 'error');
        return null;
    }
    let orderCounter = 1;
    const processedSteps = templateData.steps.map(step => ({
        ...step,
        id: step.id || uuidv4(), 
        order: orderCounter++
    }));

    const newTemplate: WorkflowTemplate = { 
        id: uuidv4(), 
        ...templateData,
        steps: processedSteps.sort((a,b) => a.order - b.order)
    };
    setWorkflowTemplates(prev => [...prev, newTemplate]);
    showSnackbar(`Workflow template "${newTemplate.name}" created.`, 'success');
    return newTemplate;
  }, [workflowTemplates, setWorkflowTemplates, showSnackbar]);

  const updateWorkflowTemplate = useCallback((template: WorkflowTemplate): WorkflowTemplate | null => {
    if (!template.name.trim()) {
        showSnackbar('Workflow template name cannot be empty.', 'error');
        return null;
    }
    if (workflowTemplates.some(wt => wt.name.toLowerCase() === template.name.trim().toLowerCase() && wt.id !== template.id)) {
        showSnackbar('Another workflow template with this name already exists.', 'error');
        return null;
    }
     if (template.steps.length === 0) {
        showSnackbar('Workflow template must have at least one step.', 'error');
        return null;
    }
    let updatedTemplateResult: WorkflowTemplate | null = null;
    setWorkflowTemplates(prev => prev.map(wt => {
      if (wt.id === template.id) {
        let orderCounter = 1;
        const processedSteps = template.steps.map(step => ({
            ...step,
            id: step.id || uuidv4(),
            order: orderCounter++
        }));
        updatedTemplateResult = {...template, steps: processedSteps.sort((a,b) => a.order - b.order)};
        return updatedTemplateResult;
      }
      return wt;
    }));

    if (updatedTemplateResult) {
      showSnackbar(`Workflow template "${updatedTemplateResult.name}" updated.`, 'success');
    } else {
      showSnackbar('Failed to update workflow template.', 'error');
    }
    return updatedTemplateResult;
  }, [workflowTemplates, setWorkflowTemplates, showSnackbar]);

  const deleteWorkflowTemplate = useCallback((templateId: string): boolean => {
    const templateToDelete = workflowTemplates.find(wt => wt.id === templateId);
    if (!templateToDelete) {
      showSnackbar('Error: Workflow template not found.', 'error');
      return false;
    }
    if (files.some(f => f.workflowTemplateId === templateId)) {
        showSnackbar(`Cannot delete template "${templateToDelete.name}". It's assigned to files.`, 'error', {duration: 6000});
        return false;
    }

    const performDelete = () => {
        setWorkflowTemplates(prev => prev.filter(wt => wt.id !== templateId));
        showSnackbar(`Workflow template "${templateToDelete.name}" deleted.`, 'success');
    };
    
    showSnackbar(
        `Workflow template "${templateToDelete.name}" will be deleted.`,
        'warning',
        {
            onUndo: () => showSnackbar(`Deletion of "${templateToDelete.name}" cancelled.`, 'info'),
            onCommit: performDelete,
            undoLabel: 'Undo Delete',
            duration: 7000
        }
    );
    return true;
  }, [files, workflowTemplates, setWorkflowTemplates, showSnackbar]);

  const addSingleNotification = useCallback((
    targetUserId: string, 
    fileId: string, 
    message: string, 
    type: NotificationType,
    relatedFileTitle?: string,
    workflowStepName?: string
  ) => {
    const newNotification: Notification = {
      id: uuidv4(),
      userId: targetUserId,
      fileId,
      relatedFileTitle,
      message,
      type,
      timestamp: new Date().toISOString(),
      isRead: false,
      workflowStepName
    };
    setNotifications(prev => [...prev, newNotification]);
  }, [setNotifications]);

  const registerFile = useCallback((
    data: Omit<FileItem, 'id' | 'lastMovedAt' | 'currentTray' | 'currentOfficeId' | 'dateCreated' | 'workflowHistory' | 'attachments' | 'messages' | 'expectedCompletionDate'>, 
    registeringUser: User,
    assignedWorkflowTemplateId?: string
  ): FileItem | null => {
    if (!registeringUser.officeId && registeringUser.role !== 'ADMIN' && !assignedWorkflowTemplateId) { 
        showSnackbar("Office users must belong to an office to register files, unless a workflow dictates the initial office.", 'error', {duration: 6000});
        return null;
    }
    
    const now = new Date().toISOString();
    let newFile: FileItem = {
      ...data,
      id: `${FILE_ID_PREFIX}${uuidv4().substring(0,8).toUpperCase()}`,
      dateCreated: now,
      lastMovedAt: now,
      currentOfficeId: data.originatingOfficeId, 
      currentTray: FileTrayStatus.IN_TRAY,
      attachments: [],
      messages: [], 
      workflowTemplateId: null,
      currentWorkflowStepId: null,
      workflowHistory: [],
      expectedCompletionDate: null,
    };

    let movementLogAction = MovementAction.REGISTERED;
    let movementLogRemarks = `File registered in ${getOfficeById(newFile.originatingOfficeId)?.name || 'Unknown Office'}.`;
    let movementLogToOfficeId = newFile.originatingOfficeId;
    let movementLogProcessedByOfficeId = registeringUser.officeId || data.originatingOfficeId;

    if (assignedWorkflowTemplateId) {
        const workflow = getWorkflowTemplateById(assignedWorkflowTemplateId);
        if (workflow && workflow.steps.length > 0) {
            const firstStep = workflow.steps.sort((a,b) => a.order - b.order)[0];
            newFile = {
                ...newFile,
                workflowTemplateId: workflow.id,
                currentWorkflowStepId: firstStep.id,
                currentOfficeId: firstStep.targetOfficeId, 
                currentTray: FileTrayStatus.IN_TRAY, 
                workflowHistory: [{
                    stepId: firstStep.id,
                    completedAt: now, 
                    userId: registeringUser.id,
                    officeId: firstStep.targetOfficeId,
                    remarks: 'Workflow initiated.'
                }]
            };
            movementLogAction = MovementAction.WORKFLOW_STARTED;
            movementLogToOfficeId = firstStep.targetOfficeId;
            movementLogRemarks = `File registered and workflow "${workflow.name}" started. Initial step: "${firstStep.name}" at ${getOfficeById(firstStep.targetOfficeId)?.name}.`;
            movementLogProcessedByOfficeId = registeringUser.officeId || firstStep.targetOfficeId; 

            const firstStepOffice = getOfficeById(firstStep.targetOfficeId);
             if (firstStepOffice) {
                const usersInFirstStepOffice = MOCK_USERS.filter(u => u.officeId === firstStep.targetOfficeId && u.id !== registeringUser.id);
                usersInFirstStepOffice.forEach(targetUser => {
                    const message = `File "${newFile.title}" (${newFile.id}) has been assigned to your office for workflow step: "${firstStep.name}".`;
                    addSingleNotification(targetUser.id, newFile.id, message, NotificationType.WORKFLOW_ASSIGNMENT, newFile.title, firstStep.name);
                });
            }
        } else {
            showSnackbar("Selected workflow template is invalid or has no steps. File registered without workflow.", 'warning', {duration: 6000});
        }
    }
    
    setFiles(prev => [...prev, newFile]);

    const log: MovementLog = {
      id: uuidv4(),
      fileId: newFile.id,
      toOfficeId: movementLogToOfficeId,
      action: movementLogAction,
      timestamp: now,
      userId: registeringUser.id,
      remarks: movementLogRemarks,
      processedByOfficeId: movementLogProcessedByOfficeId,
      workflowStepName: newFile.currentWorkflowStepId ? getWorkflowTemplateById(newFile.workflowTemplateId!)?.steps.find(s => s.id === newFile.currentWorkflowStepId!)?.name : undefined,
      reason: movementLogAction === MovementAction.REGISTERED ? 'Initial Registration' : undefined,
    };
    setMovementLogs(prev => [...prev, log]);
    showSnackbar(`File "${newFile.title}" registered successfully with ID: ${newFile.id}.`, 'success', {duration: 6000});
    return newFile;
  }, [setFiles, setMovementLogs, getOfficeById, workflowTemplates, getWorkflowTemplateById, MOCK_USERS, showSnackbar, addSingleNotification]); 

  const getFileById = useCallback((id: string) => files.find(f => f.id === id), [files]);

  const getMovementLogsForFile = useCallback((fileId: string) => {
    return movementLogs.filter(log => log.fileId === fileId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [movementLogs]);

  const getNotificationsForUser = useCallback((userId: string): Notification[] => {
    return notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications]);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
  }, [setNotifications]);

  const markAllNotificationsAsRead = useCallback((userId: string) => {
    setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, isRead: true } : n));
  }, [setNotifications]);


  const moveFileToOutTray = useCallback((fileId: string, destinationOfficeId: string, reason: string, remarks: string, actingUser: User, expectedCompletionDate?: string): boolean => {
    const fileToMove = files.find(f => f.id === fileId);
    if (!fileToMove || !actingUser.officeId || !reason) {
        showSnackbar('Invalid operation: Missing file, user office, or reason.', 'error');
        return false;
    }

    if (fileToMove.workflowTemplateId && fileToMove.currentWorkflowStepId) {
        showSnackbar("This file is part of an active workflow. Standard dispatch is not allowed.", 'error', {duration: 6000});
        return false;
    }

    if (fileToMove.currentOfficeId !== actingUser.officeId || fileToMove.currentTray !== FileTrayStatus.IN_TRAY) {
        showSnackbar("File is not in your office's IN tray or action not allowed.", 'error', {duration: 6000});
        return false;
    }
    
    const now = new Date().toISOString();
    const previousCurrentOfficeId = fileToMove.currentOfficeId; 

    setFiles(prevFiles => prevFiles.map(f => 
      f.id === fileId 
        ? { ...f, currentTray: FileTrayStatus.OUT_TRAY, destinationOfficeId, lastMovedAt: now, expectedCompletionDate: expectedCompletionDate || null } 
        : f
    ));

    const log: MovementLog = {
      id: uuidv4(),
      fileId,
      fromOfficeId: previousCurrentOfficeId,
      toOfficeId: destinationOfficeId,
      action: MovementAction.MOVED_TO_OUT_TRAY,
      timestamp: now,
      userId: actingUser.id,
      remarks,
      processedByOfficeId: actingUser.officeId,
      reason,
    };
    setMovementLogs(prev => [...prev, log]);

    const destinationOffice = getOfficeById(destinationOfficeId);
    const sendingOffice = getOfficeById(previousCurrentOfficeId);
    showSnackbar(`File "${fileToMove.title}" dispatched to ${destinationOffice?.name || 'Unknown'}.`, 'success');

    if (destinationOffice && sendingOffice) {
      const usersInDestinationOffice = MOCK_USERS.filter(u => u.officeId === destinationOfficeId && u.id !== actingUser.id);
      usersInDestinationOffice.forEach(targetUser => {
        let message = `File "${fileToMove.title}" (${fileToMove.id}) has been dispatched from ${sendingOffice.name} to your office (${destinationOffice.name}) and is awaiting receipt. Reason: ${reason}.`;
        if (expectedCompletionDate) {
            message += ` Expected by: ${new Date(expectedCompletionDate).toLocaleDateString()}.`;
        }
        addSingleNotification(targetUser.id, fileId, message, NotificationType.ARRIVAL, fileToMove.title);
      });
    }
    return true;
  }, [files, setFiles, setMovementLogs, getOfficeById, addSingleNotification, MOCK_USERS, showSnackbar]); 

  const receiveFileInInTray = useCallback((fileId: string, reason: string, remarks: string, actingUser: User): boolean => {
    const fileToReceive = files.find(f => f.id === fileId);
    if (!fileToReceive || !actingUser.officeId || !reason) {
        showSnackbar('Invalid operation: Missing file, user office, or reason.', 'error');
        return false;
    }

     if (fileToReceive.workflowTemplateId && fileToReceive.currentWorkflowStepId) {
        showSnackbar("This file is part of an active workflow. Standard reception is not allowed.", 'error', {duration: 6000});
        return false;
    }

    if (fileToReceive.destinationOfficeId !== actingUser.officeId || fileToReceive.currentTray !== FileTrayStatus.OUT_TRAY) {
        showSnackbar("File is not pending receipt at your office or is not in an OUT tray.", 'error', {duration: 6000});
        return false;
    }
    
    const now = new Date().toISOString();
    const officeThatSentFileId = fileToReceive.currentOfficeId; 

    setFiles(prevFiles => prevFiles.map(f => 
      f.id === fileId 
        ? { ...f, currentOfficeId: actingUser.officeId!, currentTray: FileTrayStatus.IN_TRAY, destinationOfficeId: null, lastMovedAt: now, expectedCompletionDate: null }
        : f
    ));

    const log: MovementLog = {
      id: uuidv4(),
      fileId,
      fromOfficeId: officeThatSentFileId, 
      toOfficeId: actingUser.officeId!, 
      action: MovementAction.RECEIVED_IN_IN_TRAY,
      timestamp: now,
      userId: actingUser.id,
      remarks,
      processedByOfficeId: actingUser.officeId!,
      reason,
    };
    setMovementLogs(prev => [...prev, log]);
    showSnackbar(`File "${fileToReceive.title}" received successfully.`, 'success');
    
    const sendingOffice = getOfficeById(officeThatSentFileId);
    const receivingOffice = getOfficeById(actingUser.officeId);
    if (sendingOffice && receivingOffice) {
      const usersInSendingOffice = MOCK_USERS.filter(u => u.officeId === officeThatSentFileId && u.id !== actingUser.id);
      usersInSendingOffice.forEach(targetUser => {
        const message = `File "${fileToReceive.title}" (${fileToReceive.id}) that your office (${sendingOffice.name}) dispatched to ${receivingOffice.name} has been received.`;
        addSingleNotification(targetUser.id, fileId, message, NotificationType.CONFIRMATION, fileToReceive.title);
      });
    }
    return true;
  }, [files, setFiles, setMovementLogs, getOfficeById, addSingleNotification, MOCK_USERS, showSnackbar]); 

  const addCommentToFile = useCallback((fileId: string, commentText: string, user: User): boolean => {
    const file = files.find(f => f.id === fileId);
    if (!file || !commentText.trim() || !user) {
        showSnackbar('Cannot add empty comment or user not found.', 'error');
        return false;
    }

    const now = new Date().toISOString();
    const log: MovementLog = {
      id: uuidv4(),
      fileId,
      toOfficeId: file.currentOfficeId, 
      action: MovementAction.COMMENT_ADDED,
      timestamp: now,
      userId: user.id,
      remarks: commentText.trim(),
      processedByOfficeId: user.officeId || file.currentOfficeId, 
    };
    setMovementLogs(prev => [...prev, log]);
    showSnackbar('Comment added successfully.', 'success');
    return true;
  }, [files, setMovementLogs, showSnackbar]);

  const addAttachmentToFile = useCallback(async (fileId: string, fileObject: File, user: User): Promise<Attachment | null> => {
    const targetFile = files.find(f => f.id === fileId);
    if (!targetFile || !fileObject || !user) {
        showSnackbar('File, file object, or user missing.', 'error');
        return null;
    }

    let dataUrl: string | undefined = undefined;
    if (fileObject.type.startsWith('image/') && fileObject.size < MAX_ATTACHMENT_SIZE_FOR_DATAURL) {
      try {
        dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(fileObject);
        });
      } catch (error) {
        console.error("Error reading file as Data URL:", error);
        showSnackbar('Error processing image for preview.', 'warning');
      }
    }

    const newAttachment: Attachment = {
      id: uuidv4(),
      fileId,
      fileName: fileObject.name,
      mimeType: fileObject.type,
      size: fileObject.size,
      uploadedAt: new Date().toISOString(),
      uploadedByUserId: user.id,
      dataUrl,
    };

    setFiles(prevFiles => prevFiles.map(f => 
      f.id === fileId 
        ? { ...f, attachments: [...(f.attachments || []), newAttachment] } 
        : f
    ));
    showSnackbar(`Attachment "${newAttachment.fileName}" added.`, 'success');
    return newAttachment;
  }, [files, setFiles, showSnackbar]);

  const deleteAttachmentFromFile = useCallback((fileId: string, attachmentId: string): boolean => {
    const file = files.find(f => f.id === fileId);
    const attachment = file?.attachments.find(att => att.id === attachmentId);

    if (!file || !attachment) {
      showSnackbar('Attachment not found for deletion.', 'error');
      return false;
    }
    
    const performDelete = () => {
        setFiles(prevFiles => prevFiles.map(f => {
          if (f.id === fileId) {
            return { ...f, attachments: (f.attachments || []).filter(att => att.id !== attachmentId) };
          }
          return f;
        }));
        showSnackbar(`Attachment "${attachment.fileName}" deleted.`, 'success');
    };

    showSnackbar(
        `Attachment "${attachment.fileName}" will be deleted.`,
        'warning',
        {
            onUndo: () => showSnackbar(`Deletion of "${attachment.fileName}" cancelled.`, 'info'),
            onCommit: performDelete,
            undoLabel: 'Undo Delete',
            duration: 7000
        }
    );
    return true;
  }, [files, setFiles, showSnackbar]);

  const addMessageToFile = useCallback((fileId: string, senderId: string, messageText: string): boolean => {
    if (!messageText.trim() || !senderId) {
        showSnackbar('Message cannot be empty.', 'error');
        return false;
    }
    
    let success = false;
    setFiles(prevFiles => prevFiles.map(f => {
      if (f.id === fileId) {
        const newMessage: FileMessage = {
          id: uuidv4(),
          senderId,
          message: messageText.trim(),
          timestamp: new Date().toISOString(),
        };
        success = true;
        return { ...f, messages: [...(f.messages || []), newMessage] };
      }
      return f;
    }));
    if(success) {
        showSnackbar('Message sent.', 'success', {duration: 2000});
    } else {
        showSnackbar('Failed to send message.', 'error');
    }
    return success;
  }, [files, setFiles, showSnackbar]);


  if (!isInitialized) {
    return <div className="text-center p-4">Loading data...</div>;
  }

  return (
    <DataContext.Provider value={{ 
      offices, addOffice, updateOffice, deleteOffice, getOfficeById,
      files, registerFile, getFileById,
      movementLogs, getMovementLogsForFile,
      moveFileToOutTray, receiveFileInInTray, addCommentToFile, addAttachmentToFile, deleteAttachmentFromFile, addMessageToFile,
      notifications, getNotificationsForUser, markNotificationAsRead, markAllNotificationsAsRead,
      workflowTemplates, addWorkflowTemplate, updateWorkflowTemplate, deleteWorkflowTemplate, getWorkflowTemplateById,
      MOCK_USERS
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};