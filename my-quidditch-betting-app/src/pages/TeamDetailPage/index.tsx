import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import styles from './TeamDetailPage.module.css';
import { getTeamDetails } from '../../services/teamsService'; // Adjust path if necessary

interface Player {
  id: string;
  name: string;
  position: string;
  number?: number;
}
interface TeamDetails {
  id: string;
  name: string;
  logoChar: string;
  league: string;
  slogan: string;
  history: string;
  wins: number;
  titles: number;
  founded: number;
  roster: Player[];
  // Add more details
}

const mockTeamDetails: { [key: string]: TeamDetails } = {
  gryffindor: {
    id: 'gryffindor', name: 'Gryffindor', logoChar: 'G', league: 'Liga de Hogwarts', slogan: "Donde habitan los valientes de corazón", history: "Fundado por Godric Gryffindor, conocido por su coraje y caballerosidad.", wins: 152, titles: 7, founded: 990,
    roster: [ {id: 'hp', name: 'Harry Potter', position: 'Buscador', number: 7}, {id: 'kg', name: 'Katie Bell', position: 'Cazadora'} ]
  },
  slytherin: {
    id: 'slytherin', name: 'Slytherin', logoChar: 'S', league: 'Liga de Hogwarts', slogan: "Lograrás tus fines verdaderos", history: "Fundado por Salazar Slytherin, valora la ambición y la astucia.", wins: 145, titles: 6, founded: 990,
    roster: [ {id: 'dm', name: 'Draco Malfoy', position: 'Buscador'}, {id: 'mf', name: 'Marcus Flint', position: 'Cazador'} ]
  },
};

const TeamDetailPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history'); // history, idols, stats, roster, upcoming

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      if (teamId && mockTeamDetails[teamId]) {
        setTeam(mockTeamDetails[teamId]);
      } else {
        setTeam(null);
      }
      setIsLoading(false);
    }, 1000);
  }, [teamId]);

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  if (isLoading) return <LoadingSpinner />;
  if (!team) return <div className="text-center p-8">Equipo no encontrado.</div>;

  return (
    <div className="team-detail-page-container">
      <div className="back-navigation mb-4">
        <Link to="/teams" className="button button-outline button-sm inline-flex items-center">
          &larr; Volver a Equipos
        </Link>
      </div>

      <section className="team-header-detail card flex items-center gap-6 mb-6">
        <div className="team-logo-placeholder large text-4xl w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-2 border-primary-light">
          {team.logoChar}
        </div>
        <div className="team-info-main">
          <h1 className="text-3xl font-bold text-primary">{team.name}</h1>
          <p className="team-slogan text-md text-gray-600 italic">"{team.slogan}"</p>
          <p className="text-sm text-gray-500">Liga: {team.league} | Fundado: {team.founded}</p>
          <div className="team-quick-stats mt-4 flex gap-4">
            <div className="stat text-center">
              <div className="stat-value text-xl font-bold text-primary">{team.wins}</div>
              <div className="stat-label text-xs text-gray-500">Victorias</div>
            </div>
            <div className="stat text-center">
              <div className="stat-value text-xl font-bold text-primary">{team.titles}</div>
              <div className="stat-label text-xs text-gray-500">Títulos</div>
            </div>
          </div>
        </div>
      </section>

      <div className="team-content-tabs match-content-tabs card p-0"> {/* Reusing match tab style container */}
         <div className="flex border-b-2 border-gray-200 px-4">
            <button className={`tab-button ${activeTab === 'history' ? 'active' : ''}`} onClick={() => handleTabClick('history')}>Historia</button>
            <button className={`tab-button ${activeTab === 'roster' ? 'active' : ''}`} onClick={() => handleTabClick('roster')}>Plantilla</button>
            <button className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => handleTabClick('stats')}>Estadísticas</button>
            <button className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => handleTabClick('upcoming')}>Próximos Partidos</button>
        </div>

        <div className="p-6">
            <div id="history-tab" className={`tab-content ${activeTab === 'history' ? '' : 'hidden'}`}>
                <h2 className="text-xl font-bold text-primary mb-4">Historia del Equipo</h2>
                <p className="text-gray-700 leading-relaxed">{team.history}</p>
            </div>
            <div id="roster-tab" className={`tab-content ${activeTab === 'roster' ? '' : 'hidden'}`}>
                <h2 className="text-xl font-bold text-primary mb-4">Plantilla Actual</h2>
                {team.roster.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2">
                    {team.roster.map(player => (
                    <li key={player.id} className="text-gray-700">
                        <strong>{player.name}</strong> - {player.position} {player.number && `(#${player.number})`}
                    </li>
                    ))}
                </ul>
                ) : <p>Información de la plantilla no disponible.</p>}
            </div>
            <div id="stats-tab" className={`tab-content ${activeTab === 'stats' ? '' : 'hidden'}`}>
                <h2 className="text-xl font-bold text-primary mb-4">Estadísticas Acumuladas</h2>
                <p>Estadísticas detalladas del equipo aparecerán aquí...</p>
            </div>
            <div id="upcoming-tab" className={`tab-content ${activeTab === 'upcoming' ? '' : 'hidden'}`}>
                <h2 className="text-xl font-bold text-primary mb-4">Próximos Partidos</h2>
                <p>Lista de próximos partidos del equipo aparecerá aquí...</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetailPage;