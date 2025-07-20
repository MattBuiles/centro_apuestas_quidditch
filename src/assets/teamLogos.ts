// Team logos imports
import gryffindorLogo from './Gryffindor_Logo.png';
import ravenclawLogo from './Ravenclaw_Logo.png';
import slytherinLogo from './Slytherin_Logo.png';
import hufflepuffLogo from './Hufflepuff_Logo.png';
import holyheadHarpiesLogo from './Holyhead Harpies_Logo.png';
import chudleyCannonLogo from './Chudley Cannons_Logo.png';

// Team logos mapping
export const teamLogos: Record<string, string> = {
  // Standard names
  'Gryffindor': gryffindorLogo,
  'Ravenclaw': ravenclawLogo,
  'Slytherin': slytherinLogo,
  'Hufflepuff': hufflepuffLogo,
  'Holyhead Harpies': holyheadHarpiesLogo,
  'Chudley Cannons': chudleyCannonLogo,
  
  // Alternative formats that might come from backend
  'gryffindor': gryffindorLogo,
  'ravenclaw': ravenclawLogo,
  'slytherin': slytherinLogo,
  'hufflepuff': hufflepuffLogo,
  'holyhead-harpies': holyheadHarpiesLogo,
  'chudley-cannons': chudleyCannonLogo,
  'holyhead_harpies': holyheadHarpiesLogo,
  'chudley_cannons': chudleyCannonLogo,
};

// Function to get team logo
export const getTeamLogo = (teamName: string): string | null => {
  const trimmedName = teamName.trim();
  
  // Try direct match first
  if (teamLogos[trimmedName]) {
    return teamLogos[trimmedName];
  }
  
  // Try normalized version (convert hyphens to spaces and title case)
  const normalizedName = trimmedName
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
    
  if (teamLogos[normalizedName]) {
    return teamLogos[normalizedName];
  }
  
  // Try case-insensitive match
  const lowerName = trimmedName.toLowerCase();
  const matchingKey = Object.keys(teamLogos).find(key => 
    key.toLowerCase() === lowerName
  );
  
  return matchingKey ? teamLogos[matchingKey] : null;
};

// Function to get team initial (fallback)
export const getTeamInitial = (teamName: string): string => {
  // For team names with hyphens or spaces, get the first letter of each word
  const words = teamName.replace(/[-_]/g, ' ').split(' ').filter(word => word.length > 0);
  if (words.length > 1) {
    return words.map(word => word.charAt(0).toUpperCase()).join('');
  }
  return teamName.charAt(0).toUpperCase();
};
