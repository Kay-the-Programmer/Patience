
import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { WorkflowTemplate, WorkflowStep, Office, UserRole } from '../../types';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Breadcrumbs, { BreadcrumbItemType } from '../../components/common/Breadcrumbs'; 

const HomeIconBreadcrumb = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 10.707V17.5a1.5 1.5 0 01-1.5 1.5h-3.75a.75.75 0 01-.75-.75V13.5a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75V18a.75.75 0 01-.75.75H3.5A1.5 1.5 0 012 17.5V10.707a1 1 0 01.293-.707l7-7z" clipRule="evenodd" /></svg>;
const AdminIconBreadcrumb = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M7.83 1.15A.75.75 0 018.285 0h3.43a.75.75 0 01.456 1.15l-1.41 1.88a.75.75 0 00-.216.379l-.216 1.08a12.93 12.93 0 015.817 3.087c.193.18.294.43.294.691V13.5a.75.75 0 01-.75.75h-2.505a.75.75 0 01-.75-.75V12a1.5 1.5 0 00-1.5-1.5H9a1.5 1.5 0 00-1.5 1.5v1.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75V8.236c0-.26.1-.51.292-.691a12.93 12.93 0 015.818-3.087l-.216-1.08a.75.75 0 00-.216-.38L7.83 1.15zM10 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM6.39 14.913a.75.75 0 011.16-.914l.175.22a.75.75 0 01-.913 1.16l-.175-.22a.75.75 0 01-.247-.246zM14.448 14.22a.75.75 0 01-.247.246l-.175.22a.75.75 0 11-.914-1.16l.175-.22a.75.75 0 011.16.914z" clipRule="evenodd" /></svg>;

const WorkflowManagementPage: React.FC = () => {
  const { 
    workflowTemplates, 
    addWorkflowTemplate, 
    updateWorkflowTemplate, 
    deleteWorkflowTemplate, 
    offices,
    getOfficeById
  } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<WorkflowTemplate> | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [steps, setSteps] = useState<Partial<WorkflowStep>[]>([]);
  
  const [error, setError] = useState('');

  const [stepName, setStepName] = useState('');
  const [stepTargetOfficeId, setStepTargetOfficeId] = useState('');
  const [stepActionDescription, setStepActionDescription] = useState('');
  const [editingStepId, setEditingStepId] = useState<string | null>(null);


  useEffect(() => {
    if (currentUser?.role !== UserRole.ADMIN) {
      navigate('/'); 
    }
  }, [currentUser, navigate]);

  const officeOptions = offices.map(o => ({ value: o.id, label: o.name }));

  const resetStepForm = () => {
    setStepName('');
    setStepTargetOfficeId('');
    setStepActionDescription('');
    setEditingStepId(null);
  };

  const handleAddOrUpdateStep = () => {
    if (!stepName.trim() || !stepTargetOfficeId || !stepActionDescription.trim()) {
      setError('Step Name, Target Office, and Action Description are required for a step.');
      return;
    }
    setError('');
    if (editingStepId) { 
      setSteps(prevSteps => prevSteps.map(s => 
        s.id === editingStepId 
        ? { ...s, name: stepName, targetOfficeId: stepTargetOfficeId, actionDescription: stepActionDescription } 
        : s
      ));
    } else { 
      const newStep: Partial<WorkflowStep> = { 
        id: uuidv4(), 
        name: stepName, 
        targetOfficeId: stepTargetOfficeId, 
        actionDescription: stepActionDescription,
        order: steps.length + 1 
      };
      setSteps(prevSteps => [...prevSteps, newStep]);
    }
    resetStepForm();
  };

  const handleEditStep = (stepToEdit: Partial<WorkflowStep>) => {
    if (!stepToEdit.id) return;
    setEditingStepId(stepToEdit.id);
    setStepName(stepToEdit.name || '');
    setStepTargetOfficeId(stepToEdit.targetOfficeId || '');
    setStepActionDescription(stepToEdit.actionDescription || '');
    // Scroll to step editor if on small screen - document.getElementById('step-editor-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRemoveStep = (stepIdToRemove?: string) => {
    if (!stepIdToRemove) return;
    setSteps(prevSteps => prevSteps.filter(s => s.id !== stepIdToRemove).map((s, index) => ({...s, order: index + 1})));
    if (editingStepId === stepIdToRemove) { 
        resetStepForm();
    }
  };

  const openModalForCreate = () => {
    setCurrentTemplate(null);
    setTemplateName('');
    setTemplateDescription('');
    setSteps([]);
    resetStepForm();
    setError('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (template: WorkflowTemplate) => {
    setCurrentTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    setSteps(template.steps.map(s => ({...s}))); 
    resetStepForm();
    setError('');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentTemplate(null);
    resetStepForm();
    setError('');
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      setError('Template name cannot be empty.');
      return;
    }
    if (steps.length === 0) {
      setError('Workflow must have at least one step.');
      return;
    }
    setError('');

    const finalSteps: WorkflowStep[] = steps.map((s, index) => ({
        id: s.id || uuidv4(), 
        name: s.name!,
        targetOfficeId: s.targetOfficeId!,
        actionDescription: s.actionDescription!,
        order: index + 1,
    }));

    let result: WorkflowTemplate | null = null;
    if (currentTemplate && currentTemplate.id) { 
      result = updateWorkflowTemplate({ 
        id: currentTemplate.id, 
        name: templateName, 
        description: templateDescription, 
        steps: finalSteps 
      });
    } else { 
      result = addWorkflowTemplate({ 
        name: templateName, 
        description: templateDescription, 
        steps: finalSteps 
      });
    }
    
    if (result) {
        handleModalClose();
    } else {
        // Errors handled by snackbar from DataContext
    }
  };

  const handleDeleteTemplate = (id: string) => {
    // Confirmation and error handling by snackbar from DataContext
    deleteWorkflowTemplate(id); 
  };
  
  if (currentUser?.role !== UserRole.ADMIN) {
    return <div className="text-center p-8">Access Denied.</div>;
  }
  
  const PageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
  const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
  const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562 0c.143.023.286.044.431.06M5.25 5.79v-.03a3.375 3.375 0 013.375-3.375h2.25c.175 0 .346.026.52.075m3.14.075c.174-.049.345-.075.52-.075h2.25a3.375 3.375 0 013.375 3.375v.03" /></svg>;
  const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
  const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
  const StepIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-gray-600"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v18M9.75 3v18M15.75 3v18M21.75 3L18 5.25V3m0 18l3.75-2.25V21" /></svg>;

  const breadcrumbItems: BreadcrumbItemType[] = [
    { label: "Dashboard", path: "/", icon: <HomeIconBreadcrumb /> },
    { label: "Admin", icon: <AdminIconBreadcrumb /> },
    { label: "Manage Workflows" }
  ];

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center"><PageIcon />Manage Workflows</h1>
          <Button variant="primary" onClick={openModalForCreate} size="md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add New Workflow
          </Button>
        </div>

        {workflowTemplates.length === 0 ? (
          <p className="text-gray-500 text-sm sm:text-base">No workflow templates found. Please add one.</p>
        ) : (
          <ul className="space-y-3 sm:space-y-4">
            {workflowTemplates.map(template => (
              <li key={template.id} className="p-3 sm:p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start">
                  <div className="mb-2 sm:mb-0">
                      <h3 className="text-md sm:text-lg font-semibold text-gray-700">{template.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">{template.description || "No description"}</p>
                      <p className="text-xs text-gray-400 mt-1">Steps: {template.steps.length}</p>
                  </div>
                  <div className="space-x-2 flex-shrink-0 self-start sm:self-center">
                      <Button size="sm" variant="secondary" onClick={() => openModalForEdit(template)} icon={<EditIcon/>}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDeleteTemplate(template.id)} icon={<DeleteIcon/>}>Delete</Button>
                  </div>
                </div>
                {template.steps.length > 0 && (
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                      <h4 className="text-xs font-medium text-gray-600 mb-1">Steps:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                          {template.steps.sort((a,b) => a.order - b.order).map(step => (
                              <li key={step.id} className="text-gray-500">
                                  <span className="font-medium text-gray-600">{step.name}</span> (Office: {getOfficeById(step.targetOfficeId)?.name || 'N/A'}) - Action: {step.actionDescription}
                              </li>
                          ))}
                      </ol>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <Modal isOpen={isModalOpen} onClose={handleModalClose} title={
          <div className="flex items-center text-base sm:text-lg"><PageIcon /> {currentTemplate?.id ? 'Edit Workflow Template' : 'Add New Workflow Template'}</div>
          } size="xl">
          <div className="space-y-4 sm:space-y-6">
            {error && <div className="p-2 bg-red-100 text-red-700 rounded text-xs sm:text-sm">{error}</div>}
            <Input
              label="Template Name"
              id="templateName"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              required
              className="text-sm sm:text-base"
            />
            <Textarea
              label="Description (Optional)"
              id="templateDescription"
              value={templateDescription}
              onChange={e => setTemplateDescription(e.target.value)}
              className="text-sm sm:text-base"
            />

            <fieldset className="border border-gray-300 p-3 sm:p-4 rounded-md">
              <legend className="text-sm font-medium text-gray-700 px-1 flex items-center"><StepIcon /> Workflow Steps</legend>
              {steps.length > 0 && (
                <div className="mb-3 sm:mb-4 space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                  {steps.sort((a,b) => (a.order || 0) - (b.order || 0)).map((step, index) => (
                    <div key={step.id || index} className="p-2 sm:p-3 bg-gray-50 rounded-md border border-gray-200">
                      <div className="flex flex-col sm:flex-row justify-between items-start">
                          <div className="mb-1 sm:mb-0">
                              <p className="font-medium text-xs sm:text-sm text-gray-800">Step {index + 1}: {step.name}</p>
                              <p className="text-xs text-gray-600">Target Office: {getOfficeById(step.targetOfficeId!)?.name || 'N/A'}</p>
                              <p className="text-xs text-gray-600">Action: {step.actionDescription}</p>
                          </div>
                          <div className="space-x-1 self-start sm:self-center flex-shrink-0">
                              <Button type="button" variant="ghost" size="sm" onClick={() => handleEditStep(step)} icon={<EditIcon/>}>Edit</Button>
                              <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveStep(step.id)} icon={<DeleteIcon/>}>Remove</Button>
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div id="step-editor-section" className="p-2 sm:p-3 border border-dashed border-gray-300 rounded-md space-y-2 sm:space-y-3">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-600">{editingStepId ? 'Edit Step' : 'Add New Step'}</h4>
                  <Input label="Step Name" id="stepName" value={stepName} onChange={e => setStepName(e.target.value)} placeholder="e.g., Initial Review" className="text-sm sm:text-base" />
                  <Select label="Target Office for this Step" id="stepTargetOfficeId" value={stepTargetOfficeId} onChange={e => setStepTargetOfficeId(e.target.value)} options={officeOptions} required className="text-sm sm:text-base" />
                  <Textarea label="Action Description for this Step" id="stepActionDescription" value={stepActionDescription} onChange={e => setStepActionDescription(e.target.value)} placeholder="e.g., Verify all documents are present." className="text-sm sm:text-base" />
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                      {editingStepId && <Button type="button" variant="secondary" size="sm" onClick={resetStepForm} className="w-full sm:w-auto">Cancel Edit</Button>}
                      <Button type="button" variant={editingStepId ? "primary" : "secondary"} size="sm" onClick={handleAddOrUpdateStep} icon={<AddIcon/>} className="w-full sm:w-auto">
                          {editingStepId ? 'Update Step' : 'Add Step to List'}
                      </Button>
                  </div>
              </div>
              {steps.length === 0 && <p className="text-xs text-center text-gray-500 mt-2">No steps defined yet. Add at least one step.</p>}
            </fieldset>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2 sm:pt-4">
              <Button variant="secondary" onClick={handleModalClose} className="w-full sm:w-auto" size="md">Cancel</Button>
              <Button variant="primary" onClick={handleSaveTemplate} disabled={steps.length === 0} icon={<SaveIcon />} className="w-full sm:w-auto" size="md">Save Template</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default WorkflowManagementPage;