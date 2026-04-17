import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ProgressToastProps {
  status: 'loading' | 'success' | 'error' | null;
  progress: number;
  message?: string;
  onClose: () => void;
}

/**
 * ProgressToast: Determinate progress notification for dashboard updates.
 * Clean, minimal design with smooth determinate progress bar.
 */
export const ProgressToast: React.FC<ProgressToastProps> = ({ status, progress, message, onClose }) => {
  const [internalProgress, setInternalProgress] = useState(0);

  // Smoothly sync internal progress with prop updates
  useEffect(() => {
    if (status === 'loading') {
      setInternalProgress(progress);
    } else if (status === 'success') {
      setInternalProgress(100);
    } else {
      setInternalProgress(0);
    }
  }, [progress, status]);

  if (!status) return null;

  return (
    <div className={`progress-toast ${status} fade-in-right`}>
      <div className="toast-body">
        <div className="toast-icon">
          {status === 'loading' && <Loader2 className="spinning" size={20} />}
          {status === 'success' && <CheckCircle2 size={20} />}
          {status === 'error' && <AlertCircle size={20} />}
        </div>
        
        <div className="toast-content">
          <h4 className="toast-title">
            {status === 'loading' ? 'Fetching student records...' : 
             status === 'success' ? 'Sync Completed' : 'Update Failed'}
          </h4>
          <p className="toast-subtitle">
            {message || (status === 'loading' ? 'Syncing profile with portal' : 
                        status === 'success' ? 'Your dashboard is up to date.' : 
                        'Something went wrong.')}
          </p>
        </div>

        <button className="toast-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      {/* Minimal Determinate Progress Bar (8px height) with smooth easing */}
      <div className="toast-progress-container">
        <div 
          className="toast-progress-fill" 
          style={{ 
            width: `${internalProgress}%`,
          }} 
        />
      </div>
    </div>
  );
};
