/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';

interface InlineRenameProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  textClassName?: string;
}

export const InlineRename: React.FC<InlineRenameProps> = ({ 
  value, 
  onSave, 
  className = "", 
  textClassName = "" 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (tempValue.trim() && tempValue !== value) {
      onSave(tempValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTempValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`} onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave(e);
            if (e.key === 'Escape') handleCancel(e);
          }}
          className="flex-1 bg-white dark:bg-slate-800 border border-corporate-accent rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-corporate-accent/20"
        />
        <button 
          onClick={handleSave}
          className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
        >
          <Check size={14} />
        </button>
        <button 
          onClick={handleCancel}
          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 group/rename ${className}`}>
      <span className={textClassName}>{value}</span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsEditing(true);
        }}
        className="p-1 text-slate-400 hover:text-corporate-accent hover:bg-corporate-accent/5 rounded transition-all opacity-0 group-hover/rename:opacity-100"
        title="Rename"
      >
        <Edit2 size={12} />
      </button>
    </div>
  );
};
