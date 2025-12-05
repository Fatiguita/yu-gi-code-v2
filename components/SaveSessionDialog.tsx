import React, { useState } from 'react';

interface SaveSessionDialogProps {
  onSave: (name: string) => void;
  onClose: () => void;
  defaultName: string;
}

const SaveSessionDialog: React.FC<SaveSessionDialogProps> = ({ onSave, onClose, defaultName }) => {
  const [name, setName] = useState(defaultName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-1 p-6 rounded-lg shadow-2xl w-full max-w-sm text-main" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-accent mb-6 text-center">Save Session</h3>
        <form onSubmit={handleSubmit}>
          <label htmlFor="session-name" className="block text-sm font-bold text-muted mb-2">
            Session Name
          </label>
          <input
            id="session-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input w-full py-2 px-3 rounded-md"
            autoFocus
          />
          <div className="flex gap-4 mt-6">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveSessionDialog;
