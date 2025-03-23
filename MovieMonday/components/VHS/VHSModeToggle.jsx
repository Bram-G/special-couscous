import React from 'react';

const VHSModeToggle = ({ enabled, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={onChange}
        className={`px-3 py-1 rounded ${enabled ? 'bg-primary text-white' : 'bg-gray-200'}`}
      >
        {enabled ? '3D' : '2D'} Mode
      </button>
    </div>
  );
};

export default VHSModeToggle;