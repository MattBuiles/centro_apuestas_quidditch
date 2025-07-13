import React from 'react';

interface MatchDetailedAnalysisProps {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    status: 'live' | 'upcoming' | 'finished' | 'scheduled' | 'postponed' | 'cancelled';
    date: Date | string;
    location?: string;
  };
  isLoading?: boolean;
}

interface TeamAnalysis {
  name: string;
  formRating: number;
  strengths: string[];
  weaknesses: string[];
  momentum: 'up' | 'down' | 'stable';
  winProbability: number;
}

const MatchDetailedAnalysis: React.FC<MatchDetailedAnalysisProps> = ({ match, isLoading = false }) => {
  
  const generateTeamAnalysis = (teamName: string, isHome: boolean): TeamAnalysis => {
    // Simulación básica basada en el nombre del equipo
    const baseRating = 40 + Math.floor(Math.random() * 40);
    const homeAdvantage = isHome ? 5 : 0;
    const formRating = Math.min(90, baseRating + homeAdvantage);
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    if (formRating > 70) {
      strengths.push('Ofensiva potente', 'Buena defensa');
    } else if (formRating > 50) {
      strengths.push('Equilibrio táctico');
    }
    
    if (formRating < 50) {
      weaknesses.push('Inconsistencia', 'Problemas defensivos');
    } else if (formRating < 70) {
      weaknesses.push('Falta de profundidad en plantilla');
    }
    
    const momentum: 'up' | 'down' | 'stable' = 
      formRating > 65 ? 'up' : formRating < 45 ? 'down' : 'stable';
    
    return {
      name: teamName,
      formRating,
      strengths,
      weaknesses,
      momentum,
      winProbability: 0 // Se calculará después
    };
  };

  const homeAnalysis = generateTeamAnalysis(match.homeTeam, true);
  const awayAnalysis = generateTeamAnalysis(match.awayTeam, false);
  
  // Calcular probabilidades de victoria
  const totalRating = homeAnalysis.formRating + awayAnalysis.formRating;
  homeAnalysis.winProbability = Math.round((homeAnalysis.formRating / totalRating) * 100);
  awayAnalysis.winProbability = Math.round((awayAnalysis.formRating / totalRating) * 100);

  const getMomentumIcon = (momentum: 'up' | 'down' | 'stable') => {
    switch (momentum) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getFormColor = (rating: number) => {
    if (rating >= 70) return 'text-green-400';
    if (rating >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-purple-300/20 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-purple-300/20 rounded w-full"></div>
                  <div className="h-4 bg-purple-300/20 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Análisis de equipos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[homeAnalysis, awayAnalysis].map((teamAnalysis, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-purple-100">{teamAnalysis.name}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-xl">{getMomentumIcon(teamAnalysis.momentum)}</span>
                <span className={`font-bold ${getFormColor(teamAnalysis.formRating)}`}>
                  {teamAnalysis.formRating}%
                </span>
              </div>
            </div>

            {/* Forma reciente */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-purple-200 mb-3 flex items-center">
                👥 Forma del Equipo
              </h4>
              <div className="flex space-x-1">
                {Array.from({ length: 5 }, (_, i) => {
                  const results = ['V', 'D', 'E', 'V', 'D'];
                  const colors = ['bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-red-500'];
                  return (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${colors[i]}`}
                    >
                      {results[i]}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fortalezas */}
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-green-400 mb-2 flex items-center">
                🛡️ Fortalezas
              </h4>
              <ul className="space-y-1">
                {teamAnalysis.strengths.length > 0 ? (
                  teamAnalysis.strengths.map((strength, i) => (
                    <li key={i} className="text-green-300 text-sm flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      {strength}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 text-sm">Sin fortalezas destacadas</li>
                )}
              </ul>
            </div>

            {/* Debilidades */}
            <div>
              <h4 className="text-lg font-semibold text-red-400 mb-2 flex items-center">
                ⚡ Áreas de Mejora
              </h4>
              <ul className="space-y-1">
                {teamAnalysis.weaknesses.length > 0 ? (
                  teamAnalysis.weaknesses.map((weakness, i) => (
                    <li key={i} className="text-red-300 text-sm flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      {weakness}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 text-sm">Sin debilidades identificadas</li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Predicción del partido */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-xl font-bold text-purple-100 mb-4 flex items-center">
          🎯 Análisis del Enfrentamiento
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-300 mb-2">
              {homeAnalysis.winProbability}%
            </div>
            <div className="text-sm text-gray-300">{homeAnalysis.name}</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-400 mb-2">vs</div>
            <div className="text-sm text-gray-300">Probabilidad de Victoria</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-300 mb-2">
              {awayAnalysis.winProbability}%
            </div>
            <div className="text-sm text-gray-300">{awayAnalysis.name}</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-purple-800/20 rounded-lg">
          <p className="text-purple-200 text-sm text-center">
            <span className="font-semibold">Clave del partido:</span> 
            {homeAnalysis.formRating > awayAnalysis.formRating 
              ? ` ${homeAnalysis.name} llega con mejor forma, pero ${awayAnalysis.name} podría sorprender.`
              : awayAnalysis.formRating > homeAnalysis.formRating
              ? ` ${awayAnalysis.name} está en mejor momento, aunque ${homeAnalysis.name} jugará en casa.`
              : ' Ambos equipos llegan en forma similar, será un partido muy equilibrado.'
            }
          </p>
        </div>
      </div>

      {/* Factores clave */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
        <h3 className="text-xl font-bold text-blue-100 mb-4">🔍 Factores Clave del Partido</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-blue-300 mb-3">Ventajas Locales</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>• Apoyo de la afición local</li>
              <li>• Conocimiento del terreno de juego</li>
              <li>• Sin presión de viaje</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-purple-300 mb-3">Estadísticas Destacadas</h4>
            <ul className="space-y-2 text-sm text-purple-200">
              <li>• Promedio de puntos por partido: 150-200</li>
              <li>• Capturas de Snitch esperadas: 1-2</li>
              <li>• Duración estimada: 90-120 minutos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetailedAnalysis;
