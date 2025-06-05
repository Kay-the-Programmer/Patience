
import { User, Office, UserRole } from './types';

export const APP_TITLE = "Online File Tracking System";

export const INITIAL_OFFICES: Office[] = [
  { id: 'office-it', name: 'IT Department' },
  { id: 'office-hr', name: 'Human Resources' },
  { id: 'office-finance', name: 'Finance Department' },
  { id: 'office-records', name: 'Records Unit' },
];

export const MOCK_USERS: User[] = [
  { id: 'user-admin', name: 'Admin User', role: UserRole.ADMIN },
  { id: 'user-it-1', name: 'Alice (IT)', role: UserRole.OFFICE_USER, officeId: 'office-it' },
  { id: 'user-hr-1', name: 'Bob (HR)', role: UserRole.OFFICE_USER, officeId: 'office-hr' },
  { id: 'user-finance-1', name: 'Carol (Finance)', role: UserRole.OFFICE_USER, officeId: 'office-finance' },
  { id: 'user-records-1', name: 'Dave (Records)', role: UserRole.OFFICE_USER, officeId: 'office-records'},
];

export const FILE_ID_PREFIX = "ZFTS-"; // Zambian File Tracking System

export const MOVEMENT_REASONS = [
  { value: 'FOR_REVIEW', label: 'For Review' },
  { value: 'FOR_APPROVAL', label: 'For Approval' },
  { value: 'FOR_SIGNATURE', label: 'For Signature' },
  { value: 'FOR_INFORMATION', label: 'For Information/Consultation' },
  { value: 'ROUTINE_TRANSFER', label: 'Routine Transfer' },
  { value: 'ARCHIVAL', label: 'For Archival' },
  { value: 'CORRECTION', label: 'For Correction/Amendment' },
  { value: 'RESPONSE_TO_QUERY', label: 'Response to Query' },
  { value: 'OTHER', label: 'Other (Specify in Remarks)' },
];
