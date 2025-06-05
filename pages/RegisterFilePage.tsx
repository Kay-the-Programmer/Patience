
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Office, FileItem, UserRole, WorkflowTemplate } from '../types';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import Breadcrumbs, { BreadcrumbItemType } from '../components/common/Breadcrumbs'; 

// Breadcrumb Icons
const HomeIconBreadcrumb = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 10.707V17.5a1.5 1.5 0 01-1.5 1.5h-3.75a.75.75 0 01-.75-.75V13.5a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75V18a.75.75 0 01-.75.75H3.5A1.5 1.5 0 012 17.5V10.707a1 1 0 01.293-.707l7-7z" clipRule="evenodd" /></svg>;
const PlusCircleIconBreadcrumb = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" /></svg>;


const RegisterFilePage: React.FC = () => {
  const navigate = useNavigate();
  const { offices, registerFile, getOfficeById, workflowTemplates } = useData();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [originatingOfficeId, setOriginatingOfficeId] = useState('');
  const [assignedWorkflowTemplateId, setAssignedWorkflowTemplateId] = useState('');
  const [customMetadataKey, setCustomMetadataKey] = useState('');
  const [customMetadataValue, setCustomMetadataValue] = useState('');
  const [customMetadataPairs, setCustomMetadataPairs] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser?.role === UserRole.OFFICE_USER && currentUser.officeId && !assignedWorkflowTemplateId) {
      setOriginatingOfficeId(currentUser.officeId);
    } else if (!assignedWorkflowTemplateId) {
      setOriginatingOfficeId(''); 
    }
  }, [currentUser, assignedWorkflowTemplateId]);

  const officeOptions = offices.map(o => ({ value: o.id, label: o.name }));
  const workflowTemplateOptions = [
    { value: '', label: 'None (Standard Movement)' },
    ...workflowTemplates.map(wt => ({ value: wt.id, label: wt.name }))
  ];

  const handleAddMetadataPair = () => {
    if (customMetadataKey.trim() && customMetadataValue.trim()) {
      setCustomMetadataPairs(prev => ({ ...prev, [customMetadataKey.trim()]: customMetadataValue.trim() }));
      setCustomMetadataKey('');
      setCustomMetadataValue('');
    }
  };

  const handleRemoveMetadataPair = (keyToRemove: string) => {
    setCustomMetadataPairs(prev => {
      const { [keyToRemove]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title || !subject || !originatingOfficeId) {
      setError('Title, Subject, and True Originating Office are required.');
      return;
    }
    if (!currentUser) {
        setError('No user logged in.');
        return;
    }
    let finalOriginatingOfficeId = originatingOfficeId;
    if (currentUser.role === UserRole.OFFICE_USER && currentUser.officeId) {
        finalOriginatingOfficeId = currentUser.officeId; 
    }
     if (!finalOriginatingOfficeId) {
        setError('Originating office for the file must be specified.');
        return;
    }

    setIsLoading(true);
    
    const fileData: Omit<FileItem, 'id' | 'lastMovedAt' | 'currentTray' | 'currentOfficeId' | 'dateCreated' | 'workflowHistory' | 'attachments' | 'messages' | 'expectedCompletionDate'> = {
      title,
      subject,
      originatingOfficeId: finalOriginatingOfficeId, 
      customMetadata: customMetadataPairs,
    };

    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    const newFile = registerFile(fileData, currentUser, assignedWorkflowTemplateId || undefined);

    setIsLoading(false);
    if (newFile) {
      navigate(`/file/${newFile.id}`);
    } else {
      // Error already handled by snackbar in registerFile
    }
  };

  const isOriginatingOfficeDisabled = (currentUser?.role === UserRole.OFFICE_USER && !!currentUser.officeId);

  const breadcrumbItems: BreadcrumbItemType[] = [
    { label: "Dashboard", path: "/", icon: <HomeIconBreadcrumb /> },
    { label: "Register File", icon: <PlusCircleIconBreadcrumb /> }
  ];

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Register New File</h1>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <Input label="File Title" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="text-sm sm:text-base"/>
          <Textarea label="Subject / Description" id="subject" value={subject} onChange={e => setSubject(e.target.value)} required className="text-sm sm:text-base"/>
          
          <Select 
              label="Originating Office (True Origin)" 
              id="originatingOfficeId" 
              value={originatingOfficeId} 
              onChange={e => setOriginatingOfficeId(e.target.value)} 
              options={officeOptions} 
              required
              disabled={isOriginatingOfficeDisabled}
              className="text-sm sm:text-base"
          />
          {isOriginatingOfficeDisabled && (
              <p className="text-xs sm:text-sm text-gray-500">Originating office defaults to your current office: {getOfficeById(currentUser!.officeId!)?.name}</p>
          )}

          <Select
              label="Assign Workflow (Optional)"
              id="assignedWorkflowTemplateId"
              value={assignedWorkflowTemplateId}
              onChange={e => setAssignedWorkflowTemplateId(e.target.value)}
              options={workflowTemplateOptions}
              className="text-sm sm:text-base"
          />
          {assignedWorkflowTemplateId && (
              <p className="text-xs sm:text-sm text-green-600">
                  File will start in office: {
                      workflowTemplates.find(wt => wt.id === assignedWorkflowTemplateId)?.steps.sort((a,b)=>a.order-b.order)[0]?.targetOfficeId 
                      ? getOfficeById(workflowTemplates.find(wt => wt.id === assignedWorkflowTemplateId)!.steps.sort((a,b)=>a.order-b.order)[0].targetOfficeId)?.name
                      : 'N/A'
                  } (first step of workflow).
              </p>
          )}

          <fieldset className="border border-gray-300 p-3 sm:p-4 rounded-md">
              <legend className="text-sm font-medium text-gray-700 px-1">Custom Metadata (Optional)</legend>
              {Object.entries(customMetadataPairs).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between bg-gray-50 p-2 rounded mb-2 text-xs sm:text-sm">
                  <span><strong className="font-medium">{key}:</strong> {value}</span>
                  <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveMetadataPair(key)}>Remove</Button>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-end">
                <Input label="Field Name" id="customMetadataKey" value={customMetadataKey} onChange={e => setCustomMetadataKey(e.target.value)} placeholder="e.g., Reference No." className="text-sm sm:text-base"/>
                <Input label="Field Value" id="customMetadataValue" value={customMetadataValue} onChange={e => setCustomMetadataValue(e.target.value)} placeholder="e.g., XYZ/123" className="text-sm sm:text-base"/>
                <Button type="button" variant="secondary" onClick={handleAddMetadataPair} className="whitespace-nowrap h-9 sm:h-10 w-full sm:w-auto" size="sm">Add Pair</Button>
              </div>
          </fieldset>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={isLoading} className="w-full sm:w-auto" size="md">
                  Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading} className="w-full sm:w-auto" size="md">
                  Register File
              </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterFilePage;