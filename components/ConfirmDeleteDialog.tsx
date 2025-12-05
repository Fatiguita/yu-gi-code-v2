
import React from 'react';

interface ConfirmDeleteDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  sessionName: string;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({ onConfirm, onCancel, sessionName }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
      <div className="bg-surface-1 p-6 rounded-lg shadow-2xl w-full max-w-sm text-main" onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-delete-title" className="text-2xl font-bold text-danger mb-4 text-center">Confirm Deletion</h3>
        <p className="text-center text-muted mb-6">
          Are you sure you want to permanently delete the session: <strong className="text-accent">{sessionName}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-4 mt-6">
          <button onClick={onCancel} className="flex-1 bg-secondary hover:brightness-110 text-white font-bold py-2 px-4 rounded-full">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 bg-danger hover:brightness-110 text-white font-bold py-2 px-4 rounded-full">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteDialog;
