// filepath: d:\Coding\Projects\centro_apuestas_quidditch\my-quidditch-betting-app\src\pages\StandingsPage\index.tsx
import React, { useState } from 'react'; // Added React import
import Button from '@/components/common/Button'; // Assuming Button component path

// Mock data - replace with actual data fetching
const mockStandings = [
  { position: 1, teamName: 'Gryffindor', played: 10, won: 8, drawn: 1, lost: 1, points: 25, logo: 'G' },
  { position: 2, teamName: 'Ravenclaw', played: 10, won: 7, drawn: 1, lost: 2, points: 22, logo: 'R' },
  { position: 3, teamName: 'Slytherin', played: 10, won: 5, drawn: 2, lost: 3, points: 17, logo: 'S' },
  { position: 4, teamName: 'Hufflepuff', played: 10, won: 4, drawn: 2, lost: 4, points: 14, logo: 'H' },
  { position: 5, teamName: 'Chudley Cannons', played: 10, won: 2, drawn: 1, lost: 7, points: 7, logo: 'C' },
];

const StandingsPage = () => {
  const [filter, setFilter] = useState('current'); // 'current' or 'historical'

  return (
    <div className="standings-page-container">
      <section className="page-header card mb-8 p-6 text-center"> {/* Using card class */}
        <h2 className="text-3xl font-bold text-primary">Clasificación de la Liga</h2>
        <p className="text-gray-600 mt-2">Consulta la tabla de posiciones actualizada</p>
      </section>
      
      <section className="standings-section card p-6"> {/* Using card class */}
        <div className="standings-filters flex gap-2 mb-6">
          <Button 
            variant={filter === 'current' ? 'primary' : 'outline'} 
            onClick={() => setFilter('current')}
          >
            Temporada actual
          </Button>
          <Button 
            variant={filter === 'historical' ? 'primary' : 'outline'} 
            onClick={() => setFilter('historical')}
          >
            Histórico
          </Button>
        </div>
        
        {filter === 'current' ? (
          <table className="standings-table w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 font-semibold text-sm text-gray-700 border-b">Posición</th>
                <th className="p-3 font-semibold text-sm text-gray-700 border-b">Equipo</th>
                <th className="p-3 font-semibold text-sm text-gray-700 border-b text-center">PJ</th>
                <th className="p-3 font-semibold text-sm text-gray-700 border-b text-center">PG</th>
                <th className="p-3 font-semibold text-sm text-gray-700 border-b text-center">PE</th>
                <th className="p-3 font-semibold text-sm text-gray-700 border-b text-center">PP</th>
                <th className="p-3 font-semibold text-sm text-gray-700 border-b text-center">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {mockStandings.map((team) => (
                <tr key={team.teamName} className="standing-row hover:bg-gray-50 border-b">
                  <td className="p-3 text-gray-700 text-center">{team.position}</td>
                  <td className="p-3 text-gray-700">
                    <div className="team-info flex items-center gap-2">
                      <div className="team-logo-placeholder small w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                        {team.logo}
                      </div>
                      <span>{team.teamName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-700 text-center">{team.played}</td>
                  <td className="p-3 text-gray-700 text-center">{team.won}</td>
                  <td className="p-3 text-gray-700 text-center">{team.drawn}</td>
                  <td className="p-3 text-gray-700 text-center">{team.lost}</td>
                  <td className="p-3 text-gray-700 font-bold text-center">{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600 text-center p-4">El histórico de clasificaciones estará disponible próximamente.</p>
        )}
      </section>
    </div>
  );
};

export default StandingsPage;