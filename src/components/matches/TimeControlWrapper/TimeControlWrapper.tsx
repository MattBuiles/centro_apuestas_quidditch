import React from 'react';
import { FEATURES } from '@/config/features';
import { Match } from '@/types/league';

// Conditional imports
const VirtualTimeControl = React.lazy(() => import('../VirtualTimeControl'));
const LeagueTimeControl = React.lazy(() => import('../LeagueTimeControl'));

interface TimeControlWrapperProps {
  onTimeAdvanced?: (newDate: Date, simulatedMatches: Match[]) => void;
  onSeasonReset?: () => void;
}

/**
 * Wrapper component that conditionally loads either VirtualTimeControl (local)
 * or LeagueTimeControl (backend) based on feature configuration
 */
const TimeControlWrapper: React.FC<TimeControlWrapperProps> = (props) => {
  // Use backend version if league time backend is enabled
  if (FEATURES.USE_BACKEND_LEAGUE_TIME) {
    return (
      <React.Suspense fallback={<div>Cargando control de tiempo...</div>}>
        <LeagueTimeControl {...props} />
      </React.Suspense>
    );
  }

  // Use local version as fallback
  return (
    <React.Suspense fallback={<div>Cargando control de tiempo...</div>}>
      <VirtualTimeControl {...props} />
    </React.Suspense>
  );
};

export default TimeControlWrapper;
