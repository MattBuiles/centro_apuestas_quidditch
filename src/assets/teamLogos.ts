// Team logos imports
import gryffindorLogo from './Gryffindor_Logo.png';
import ravenclawLogo from './Ravenclaw_Logo.png';
import slytherinLogo from './Slytherin_Logo.png';
import hufflepuffLogo from './Hufflepuff_Logo.png';
import holyheadHarpiesLogo from './Holyhead Harpies_Logo.png';
import chudleyCannonLogo from './Chudley Cannons_Logo.png';

// Team logos mapping
export const teamLogos: Record<string, string> = {
  'Gryffindor': gryffindorLogo,
  'Ravenclaw': ravenclawLogo,
  'Slytherin': slytherinLogo,
  'Hufflepuff': hufflepuffLogo,
  'Holyhead Harpies': holyheadHarpiesLogo,
  'Chudley Cannons': chudleyCannonLogo,
};

// Function to get team logo
export const getTeamLogo = (teamName: string): string | null => {
  const normalizedTeamName = teamName.trim();
  return teamLogos[normalizedTeamName] || null;
};

// Function to get team initial (fallback)
export const getTeamInitial = (teamName: string): string => {
  return teamName.charAt(0).toUpperCase();
};
