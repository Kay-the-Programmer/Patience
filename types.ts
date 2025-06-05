export enum FileTrayStatus {
  IN_TRAY = 'IN_TRAY',
  OUT_TRAY = 'OUT_TRAY',
  // Consider if a WORKFLOW_PENDING status is needed or if IN_TRAY at step's office is sufficient
}

export enum UserRole {
  ADMIN = 'ADMIN',
  OFFICE_USER = 'OFFICE_USER',
}

export type Office = {
  id: string;
  name: string;
}

export interface WorkflowStep {
  id: string; // Unique ID for the step within a workflow template
  name: string; // e.g., "Legal Review", "Manager Approval"
  targetOfficeId: string;
  actionDescription: string; // e.g., "Review contract for compliance", "Approve budget"
  order: number; // To define the sequence of steps
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

export interface WorkflowFileHistoryEntry {
  stepId: string; // ID of the WorkflowStep completed
  completedAt: string; // ISO string timestamp
  userId: string; // User who completed the step
  officeId: string; // Office where the step was completed
  remarks?: string;
}

export interface Attachment {
  id: string;
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number; // in bytes
  uploadedAt: string; // ISO string timestamp
  uploadedByUserId: string;
  dataUrl?: string; // For image previews, if applicable and small enough
}

export interface FileMessage { // Added for file-specific internal messages
  id: string;
  senderId: string;
  message: string;
  timestamp: string; // ISO string timestamp
}

export interface FileItem {
  id: string;
  title: string;
  subject: string;
  dateCreated: string; // ISO string
  originatingOfficeId: string;
  currentOfficeId: string;
  currentTray: FileTrayStatus;
  lastMovedAt: string; // ISO string
  destinationOfficeId?: string | null; 
  customMetadata?: Record<string, string>;
  attachments: Attachment[]; 
  messages?: FileMessage[]; 

  // Workflow related fields
  workflowTemplateId?: string | null;
  currentWorkflowStepId?: string | null;
  workflowHistory?: WorkflowFileHistoryEntry[];

  // Deeper Tracking
  expectedCompletionDate?: string | null; // ISO date string
}

export enum MovementAction {
  REGISTERED = 'REGISTERED',
  MOVED_TO_OUT_TRAY = 'MOVED_TO_OUT_TRAY',
  RECEIVED_IN_IN_TRAY = 'RECEIVED_IN_IN_TRAY',
  WORKFLOW_STARTED = 'WORKFLOW_STARTED',
  WORKFLOW_STEP_COMPLETED = 'WORKFLOW_STEP_COMPLETED', // Future use
  WORKFLOW_COMPLETED = 'WORKFLOW_COMPLETED', // Future use
  COMMENT_ADDED = 'COMMENT_ADDED', 
}

export interface MovementLog {
  id: string;
  fileId: string;
  fromOfficeId?: string | null; 
  toOfficeId: string; 
  action: MovementAction;
  timestamp: string; // ISO string
  userId: string; 
  remarks?: string;
  processedByOfficeId?: string; 
  // For workflow related movements, remarks can detail the step
  workflowStepName?: string; 
  reason?: string; // Reason for movement/status change
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  officeId?: string; 
}

export enum NotificationType {
  ARRIVAL = 'ARRIVAL', 
  CONFIRMATION = 'CONFIRMATION', 
  WORKFLOW_ASSIGNMENT = 'WORKFLOW_ASSIGNMENT', // File assigned to your office for a workflow step
  FILE_OVERDUE = 'FILE_OVERDUE', // Notification for overdue files
}

export interface Notification {
  id: string;
  userId: string; 
  fileId: string;
  relatedFileTitle?: string;
  message: string;
  timestamp: string; // ISO string
  isRead: boolean;
  type: NotificationType;
  workflowStepName?: string; // For workflow notifications
}

// Snackbar types
export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

export interface SnackbarMessage {
  id: string;
  message: string;
  type: SnackbarType;
  duration?: number; // in ms
  onUndo?: () => void;
  onCommit?: () => void; // Called if snackbar closes without undo
  undoLabel?: string;
}

export interface SnackbarContextType {
  snackbars: SnackbarMessage[];
  showSnackbar: (
    message: string, 
    type: SnackbarType, 
    options?: { 
      duration?: number; 
      onUndo?: () => void;
      onCommit?: () => void;
      undoLabel?: string;
    }
  ) => void;
  hideSnackbar: (id: string) => void;
}