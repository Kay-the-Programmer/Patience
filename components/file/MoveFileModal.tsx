
import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { FileItem, Office } from '../../types';
import Modal from '../common/Modal';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import Input from '../common/Input'; // Added for Expected Completion Date
import { MOVEMENT_REASONS } from '../../constants'; // Added for reasons

interface MoveFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem;
  actionType: 'dispatch' | 'receive';
}

const MoveFileModal: React.FC<MoveFileModalProps> = ({ isOpen, onClose, file, actionType }) => {
  const { offices, moveFileToOutTray, receiveFileInInTray, getOfficeById } = useData();
  const { currentUser } = useAuth();

  const [destinationOfficeId, setDestinationOfficeId] = useState('');
  const [reason, setReason] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!currentUser) {
      setError("No user logged in.");
      return;
    }
    if (!reason) {
        setError('Please select a reason for this action.');
        return;
    }
    setError('');
    setIsLoading(true);

    let success = false;
    if (actionType === 'dispatch') {
      if (!destinationOfficeId) {
        setError('Please select a destination office.');
        setIsLoading(false);
        return;
      }
      if (destinationOfficeId === file.currentOfficeId) {
        setError('Destination office cannot be the same as the current office.');
        setIsLoading(false);
        return;
      }
      success = moveFileToOutTray(file.id, destinationOfficeId, reason, remarks, currentUser, expectedCompletionDate || undefined);
    } else if (actionType === 'receive') {
      success = receiveFileInInTray(file.id, reason, remarks, currentUser);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoading(false);

    if (success) {
      onClose();
    } else {
      setError(`Failed to ${actionType} file. Please check your inputs or permissions.`);
    }
  };

  const availableDestinationOffices = offices.filter(o => o.id !== file.currentOfficeId);
  const officeOptions = availableDestinationOffices.map(o => ({ value: o.id, label: o.name }));
  const reasonOptions = MOVEMENT_REASONS;

  const titleText = actionType === 'dispatch' ? `Dispatch File: ${file.id}` : `Receive File: ${file.id}`;
  const currentOfficeName = getOfficeById(file.currentOfficeId)?.name;
  const destinationOfficeNameForDisplay = actionType === 'receive' && file.destinationOfficeId ? getOfficeById(file.destinationOfficeId)?.name : '';


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titleText}>
      <div className="space-y-4">
        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
        
        <p><strong className="font-medium">File Title:</strong> {file.title}</p>
        <p><strong className="font-medium">Current Office:</strong> {currentOfficeName}</p>

        {actionType === 'dispatch' && (
          <>
            <Select
              label="Destination Office"
              id="destinationOfficeId"
              value={destinationOfficeId}
              onChange={e => setDestinationOfficeId(e.target.value)}
              options={officeOptions}
              required
            />
            <Input
              label="Expected Completion/Return Date (Optional)"
              id="expectedCompletionDate"
              type="date"
              value={expectedCompletionDate}
              onChange={e => setExpectedCompletionDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} // Today or future
            />
          </>
        )}
        {actionType === 'receive' && (
             <p><strong className="font-medium">Receiving into Office:</strong> {destinationOfficeNameForDisplay}</p>
        )}

        <Select
            label="Reason for Movement"
            id="reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            options={reasonOptions}
            required
        />

        <Textarea
          label="Remarks (Optional, especially if 'Other' reason selected)"
          id="remarks"
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading} disabled={isLoading}>
            {actionType === 'dispatch' ? 'Dispatch File' : 'Confirm Reception'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MoveFileModal;