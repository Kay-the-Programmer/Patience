
import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Office, UserRole } from '../../types';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs, { BreadcrumbItemType } from '../../components/common/Breadcrumbs'; 

const HomeIconBreadcrumb = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 10.707V17.5a1.5 1.5 0 01-1.5 1.5h-3.75a.75.75 0 01-.75-.75V13.5a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75V18a.75.75 0 01-.75.75H3.5A1.5 1.5 0 012 17.5V10.707a1 1 0 01.293-.707l7-7z" clipRule="evenodd" /></svg>;
const AdminIconBreadcrumb = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M7.83 1.15A.75.75 0 018.285 0h3.43a.75.75 0 01.456 1.15l-1.41 1.88a.75.75 0 00-.216.379l-.216 1.08a12.93 12.93 0 015.817 3.087c.193.18.294.43.294.691V13.5a.75.75 0 01-.75.75h-2.505a.75.75 0 01-.75-.75V12a1.5 1.5 0 00-1.5-1.5H9a1.5 1.5 0 00-1.5 1.5v1.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75V8.236c0-.26.1-.51.292-.691a12.93 12.93 0 015.818-3.087l-.216-1.08a.75.75 0 00-.216-.38L7.83 1.15zM10 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM6.39 14.913a.75.75 0 011.16-.914l.175.22a.75.75 0 01-.913 1.16l-.175-.22a.75.75 0 01-.247-.246zM14.448 14.22a.75.75 0 01-.247.246l-.175.22a.75.75 0 11-.914-1.16l.175-.22a.75.75 0 011.16.914z" clipRule="evenodd" /></svg>;

const OfficeManagementPage: React.FC = () => {
  const { offices, addOffice, updateOffice, deleteOffice: deleteOfficeData } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOffice, setCurrentOffice] = useState<Office | null>(null);
  const [officeName, setOfficeName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser?.role !== UserRole.ADMIN) {
      navigate('/'); 
    }
  }, [currentUser, navigate]);

  const openModalForCreate = () => {
    setCurrentOffice(null);
    setOfficeName('');
    setError('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (office: Office) => {
    setCurrentOffice(office);
    setOfficeName(office.name);
    setError('');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentOffice(null);
    setOfficeName('');
    setError('');
  };

  const handleSaveOffice = () => {
    if (!officeName.trim()) {
      setError('Office name cannot be empty.');
      return;
    }
    setError('');

    let result: Office | null = null;
    if (currentOffice) { 
      result = updateOffice(currentOffice.id, officeName);
    } else { 
      result = addOffice(officeName);
    }
    
    if (result) {
        handleModalClose();
    } else {
      // Error shown via snackbar from DataContext
    }
  };

  const handleDeleteOffice = (id: string) => {
    // Confirmation handled by snackbar in DataContext
    deleteOfficeData(id);
  };
  
  if (currentUser?.role !== UserRole.ADMIN) {
    return <div className="text-center p-8">Access Denied.</div>;
  }
  
  const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
  const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562 0c.143.023.286.044.431.06M5.25 5.79v-.03a3.375 3.375 0 013.375-3.375h2.25c.175 0 .346.026.52.075m3.14.075c.174-.049.345-.075.52-.075h2.25a3.375 3.375 0 013.375 3.375v.03" /></svg>;
  const PageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 12.75h6M9 18.75h6" /></svg>;
  const ModalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 12.75h6M9 18.75h6" /></svg>;

  const breadcrumbItems: BreadcrumbItemType[] = [
    { label: "Dashboard", path: "/", icon: <HomeIconBreadcrumb /> },
    { label: "Admin", icon: <AdminIconBreadcrumb /> },
    { label: "Manage Offices" }
  ];

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center"><PageIcon />Manage Offices</h1>
          <Button variant="primary" onClick={openModalForCreate} size="md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add New Office
          </Button>
        </div>

        {offices.length === 0 ? (
          <p className="text-gray-500 text-sm sm:text-base">No offices found. Please add one.</p>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {offices.map(office => (
              <li key={office.id} className="p-3 sm:p-4 border border-gray-200 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 transition-colors gap-2 sm:gap-0">
                <span className="text-gray-700 text-sm sm:text-base">{office.name}</span>
                <div className="space-x-2 flex-shrink-0 self-end sm:self-center">
                  <Button size="sm" variant="secondary" onClick={() => openModalForEdit(office)} icon={<EditIcon />}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteOffice(office.id)} icon={<DeleteIcon />}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Modal isOpen={isModalOpen} onClose={handleModalClose} title={
          <div className="flex items-center text-base sm:text-lg"><ModalIcon /> {currentOffice ? 'Edit Office' : 'Add New Office'}</div>
        } size="md">
          <div className="space-y-4">
            {error && <div className="p-2 bg-red-100 text-red-700 rounded text-xs sm:text-sm">{error}</div>}
            <Input
              label="Office Name"
              id="officeName"
              value={officeName}
              onChange={e => setOfficeName(e.target.value)}
              required
              className="text-sm sm:text-base"
            />
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
              <Button variant="secondary" onClick={handleModalClose} className="w-full sm:w-auto" size="md">Cancel</Button>
              <Button variant="primary" onClick={handleSaveOffice} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>} className="w-full sm:w-auto" size="md">Save Office</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default OfficeManagementPage;