import React, { useState } from 'react';
import { RefreshCw, Clock } from 'lucide-react';

interface UpdateButtonProps {
  onClick: () => void;
  isLoading: boolean;
  cooldownActive: boolean;
  formattedCooldown: string;
}

/**
 * UpdateButton: The main CTA for triggering a dashboard refresh.
 * Features a pulsing glow animation on login and a cooldown timer state.
 */
export const UpdateButton: React.FC<UpdateButtonProps> = ({ 
  onClick, 
  isLoading, 
  cooldownActive, 
  formattedCooldown 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Glow is active only if not loading, not on cooldown, no hover, and no previous interaction
  const showGlow = !isLoading && !cooldownActive && !isHovered && !hasInteracted;

  const handleClick = () => {
    if (isLoading || cooldownActive) return;
    setHasInteracted(true);
    onClick();
  };

  return (
    <button 
      className={`update-dashboard-btn ${showGlow ? 'glow-cta' : ''} ${cooldownActive ? 'cooldown' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading || cooldownActive}
      title={cooldownActive ? `Cooldown active. Next update in ${formattedCooldown}` : 'Refresh dashboard data'}
    >
      <div className="btn-content">
        {cooldownActive ? (
          <>
            <Clock size={18} className="btn-icon" />
            <span>Next update in {formattedCooldown}</span>
          </>
        ) : (
          <>
            <RefreshCw size={18} className={`btn-icon ${isLoading ? 'spinning' : ''}`} />
            <span>{isLoading ? 'Updating...' : 'Update Dashboard'}</span>
          </>
        )}
      </div>
    </button>
  );
};
