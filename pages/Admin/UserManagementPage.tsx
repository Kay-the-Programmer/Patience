import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, UserRole } from '../../types';
import { INITIAL_OFFICES } from '../../constants';
import Button from '../../components/common/Button';
import Layout from '../../components/Layout';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

const UserManagementPage: React.FC = () => {
  const { users, deleteUser, addUser, updateUser, currentUser } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>(UserRole.OFFICE_USER);
  const [userOfficeId, setUserOfficeId] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  const officeOptions = INITIAL_OFFICES.map(office => ({
    value: office.id,
    label: office.name,
  }));

  const roleOptions = Object.values(UserRole).map(role => ({
    value: role,
    label: role,
  }));

  useEffect(() => {
    if (userRole !== UserRole.OFFICE_USER) {
      setUserOfficeId(undefined);
    }
  }, [userRole]);

  const resetFormState = () => {
    setUserName('');
    setUserRole(UserRole.OFFICE_USER);
    setUserOfficeId(INITIAL_OFFICES[0]?.id || undefined); // Default to first office if available
    setFormError(null);
    setEditingUser(null);
  };

  const getOfficeName = (officeId?: string): string => {
    if (!officeId) return 'N/A';
    const office = INITIAL_OFFICES.find(o => o.id === officeId);
    return office ? office.name : 'Unknown Office';
  };

  const handleDeleteUser = (userId: string) => {
    if (currentUser?.id === userId) {
      alert("You cannot delete the currently logged-in user from this interface.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId);
    }
  };

  const handleAddUserClick = () => {
    resetFormState();
    setIsAddModalOpen(true);
  };

  const handleEditUserClick = (user: User) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserRole(user.role);
    setUserOfficeId(user.officeId);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    resetFormState();
  };

  const handleSaveAddUser = () => {
    if (!userName.trim()) {
      setFormError("User name cannot be empty.");
      return;
    }
    if (userRole === UserRole.OFFICE_USER && !userOfficeId) {
      setFormError("Office must be selected for Office Users.");
      return;
    }

    addUser({
      name: userName.trim(),
      role: userRole,
      officeId: userRole === UserRole.OFFICE_USER ? userOfficeId : undefined,
    });
    handleCloseModals();
  };

  const handleSaveEditUser = () => {
    if (!editingUser) return;
    if (!userName.trim()) {
      setFormError("User name cannot be empty.");
      return;
    }
    if (userRole === UserRole.OFFICE_USER && !userOfficeId) {
      setFormError("Office must be selected for Office Users.");
      return;
    }

    updateUser(editingUser.id, {
      name: userName.trim(),
      role: userRole,
      officeId: userRole === UserRole.OFFICE_USER ? userOfficeId : undefined,
    });
    handleCloseModals();
  };


  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <Button variant="primary" onClick={handleAddUserClick}>
            Add New User
          </Button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Office
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length > 0 ? (
                users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getOfficeName(user.officeId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button variant="secondary" size="sm" onClick={() => handleEditUserClick(user)}>
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={currentUser?.id === user.id} // Disable deleting oneself
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add User Modal */}
        {isAddModalOpen && (
          <Modal title="Add New User" isOpen={isAddModalOpen} onClose={handleCloseModals}>
            <div className="space-y-4">
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <Input
                label="User Name"
                id="add-user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
              <Select
                label="User Role"
                id="add-user-role"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                options={roleOptions}
                required
              />
              {userRole === UserRole.OFFICE_USER && (
                <Select
                  label="Office"
                  id="add-user-office"
                  value={userOfficeId || ''}
                  onChange={(e) => setUserOfficeId(e.target.value)}
                  options={[{ value: '', label: 'Select Office', disabled: true }, ...officeOptions]}
                  required
                />
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveAddUser}>Save</Button>
            </div>
          </Modal>
        )}

        {/* Edit User Modal */}
        {isEditModalOpen && editingUser && (
          <Modal title={`Edit User: ${editingUser.name}`} isOpen={isEditModalOpen} onClose={handleCloseModals}>
            <div className="space-y-4">
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <Input
                label="User Name"
                id="edit-user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
              <Select
                label="User Role"
                id="edit-user-role"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                options={roleOptions}
                required
              />
              {userRole === UserRole.OFFICE_USER && (
                <Select
                  label="Office"
                  id="edit-user-office"
                  value={userOfficeId || ''}
                  onChange={(e) => setUserOfficeId(e.target.value)}
                  options={[{ value: '', label: 'Select Office', disabled: true }, ...officeOptions]}
                  required={userRole === UserRole.OFFICE_USER}
                />
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveEditUser}>Save Changes</Button>
            </div>
          </Modal>
        )}

      </div>
    </Layout>
  );
};

export default UserManagementPage;
