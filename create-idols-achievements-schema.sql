-- Add tables for historical idols and team achievements
-- This script will extend the existing database schema

-- Team Historical Idols table
CREATE TABLE IF NOT EXISTS team_idols (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  period TEXT NOT NULL,
  years_active INTEGER,
  description TEXT,
  achievements TEXT, -- JSON array
  legendary_stats TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Team Achievements table (for dynamic achievements beyond the basic JSON field)
CREATE TABLE IF NOT EXISTS team_achievements (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  year INTEGER,
  category TEXT, -- 'championship', 'record', 'honor', 'special'
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_idols_team_id ON team_idols(team_id);
CREATE INDEX IF NOT EXISTS idx_team_achievements_team_id ON team_achievements(team_id);
CREATE INDEX IF NOT EXISTS idx_team_achievements_category ON team_achievements(category);

-- Insert sample data for historical idols
INSERT OR IGNORE INTO team_idols (id, team_id, name, position, period, years_active, description, achievements, legendary_stats) VALUES
-- Gryffindor Idols
('gryff-idol-1', 'gryffindor', 'James Potter', 'Cazador', '1971-1978', 7, 'El padre de Harry Potter y uno de los cazadores más talentosos en la historia de Gryffindor. Su liderazgo como capitán y sus habilidades excepcionales lo convierten en una leyenda del equipo.', '["Capitán del equipo durante 3 años", "Récord de goles en una temporada: 127", "Medalla al Mérito Deportivo"]', 'Capitán destacado: 85% victorias, 127 goles en temporada récord'),
('gryff-idol-2', 'gryffindor', 'Charlie Weasley', 'Buscador', '1987-1991', 4, 'El hermano mayor de Ron que se convirtió en una leyenda como Buscador. Su valentía y determinación lo llevaron a ser uno de los mejores buscadores de la historia escolar.', '["Buscador más rápido de su generación", "Capturó la Snitch en 47 partidos consecutivos", "Récord de captura más rápida: 3 minutos"]', 'Captura promedio: 12 minutos, 94% tasa de éxito'),
('gryff-idol-3', 'gryffindor', 'Godric Gryffindor', 'Fundador/Cazador', '990-1020', 30, 'El mismísimo fundador, cuyo valor y caballerosidad establecieron los estándares del equipo. Su legado trasciende el deporte.', '["Fundador de la casa", "Creador de las primeras tácticas de Quidditch", "Poseedor de la espada de Gryffindor"]', 'Fundador - Estadísticas inmensurables'),

-- Slytherin Idols
('slyth-idol-1', 'slytherin', 'Tom Riddle', 'Cazador', '1943-1950', 7, 'Antes de convertirse en el Señor Tenebroso, Tom Riddle era un estudiante brillante y un jugador de Quidditch excepcional. Su inteligencia estratégica revolucionó el juego.', '["Capitán más joven de la historia", "Estratega táctico revolucionario", "Jugador del año en múltiples ocasiones"]', 'Líder natural: 91% victorias como capitán, innovador táctico'),
('slyth-idol-2', 'slytherin', 'Salazar Slytherin', 'Fundador/Estratega', '990-1020', 30, 'El fundador de Slytherin, cuya astucia y ambición definieron el estilo de juego del equipo. Sus estrategias siguen siendo estudiadas hasta hoy.', '["Fundador de la casa", "Creador del sistema de juego estratégico", "Maestro de la táctica defensiva"]', 'Fundador - Arquitecto del juego moderno'),

-- Ravenclaw Idols
('raven-idol-1', 'ravenclaw', 'Rowena Ravenclaw', 'Fundadora/Estratega', '990-1020', 30, 'La fundadora original, cuya inteligencia excepcional revolucionó el Quidditch. Sus innovaciones tácticas sentaron las bases del juego moderno.', '["Fundadora de la casa", "Creadora de la Snitch Dorada moderna", "Inventora de las jugadas aéreas complejas"]', 'Fundadora - Innovadora del deporte'),
('raven-idol-2', 'ravenclaw', 'Filius Flitwick', 'Cazador', '1955-1962', 7, 'Aunque pequeño en estatura, Flitwick era un gigante en el campo de Quidditch. Su precisión y habilidad técnica lo convirtieron en leyenda.', '["Cazador más técnico de su era", "Maestro de la precisión en pases", "Innovador en jugadas aéreas"]', 'Precisión legendaria: 97% pases completados'),

-- Hufflepuff Idols
('huff-idol-1', 'hufflepuff', 'Helga Hufflepuff', 'Fundadora/Guardiana', '990-1020', 30, 'La fundadora de Hufflepuff, que estableció los valores de lealtad y trabajo duro que caracterizan al equipo. Su legado perdura en cada jugador.', '["Fundadora de la casa", "Creadora del Fair Play en Quidditch", "Primera en establecer reglas de deportividad"]', 'Fundadora - Guardiana del honor deportivo'),
('huff-idol-2', 'hufflepuff', 'Cedric Diggory', 'Buscador', '1991-1995', 4, 'El joven héroe cuyo valor y nobleza inspiraron a toda una generación. Su trágica muerte no opacó su brillante carrera como buscador.', '["Campeón de Hogwarts", "Buscador más noble de su generación", "Símbolo de coraje y lealtad"]', 'Captura heroica: 78% éxito, líder natural'),

-- Professional Teams
('chudley-idol-1', 'chudley', 'Roderick Plumpton', 'Buscador', '1921-1939', 18, 'Leyenda absoluta y héroe de la única victoria de liga de los Cannons. Su captura ganadora en 1922 sigue siendo el momento más glorioso del equipo.', '["Único título de liga de los Cannons (1922)", "Buscador más querido en la historia del equipo", "Récord de captura más emotiva"]', 'Captura histórica en Final 1922, 79% tasa de éxito en carrera'),
('chudley-idol-2', 'chudley', 'Joey Jenkins', 'Buscador', '2018-Presente', 7, 'El Buscador actual cuya determinación y habilidad bajo presión han devuelto la competitividad a los Cannons en los últimos años.', '["Buscador estrella actual", "Especialista en capturas bajo presión", "Líder del resurgimiento del equipo"]', 'Captura promedio: 18 minutos, 71% tasa de éxito'),

('harpies-idol-1', 'harpies', 'Gwenog Jones', 'Golpeadora', '1998-2015', 17, 'La capitana más exitosa en la historia de las Harpies. Su liderazgo feroz y habilidades incomparables como Golpeadora llevaron al equipo a su época dorada.', '["Capitana durante 10 años", "Mejor Golpeadora de la Liga (5 veces)", "Líder histórica del equipo más exitoso"]', 'Liderazgo legendario: 87% victorias como capitana'),
('harpies-idol-2', 'harpies', 'Glynnis Griffiths', 'Cazadora', '2019-Presente', 6, 'La joven estrella que representa el futuro brillante de las Harpies. Su talento natural y determinación la convierten en una de las jugadoras más prometedoras.', '["Estrella emergente del Quidditch", "Mejor jugadora joven del año", "Prometedora futura capitana"]', '89% precisión en pases, 67 goles en su primera temporada completa');

-- Insert sample achievements
INSERT OR IGNORE INTO team_achievements (id, team_id, title, description, year, category) VALUES
-- Gryffindor Achievements
('gryff-ach-1', 'gryffindor', 'Campeón de la Copa de las Casas', 'Victoria en el torneo inter-casas', 2022, 'championship'),
('gryff-ach-2', 'gryffindor', 'Récord de la captura más rápida', 'Snitch capturada en tiempo récord', 2021, 'record'),
('gryff-ach-3', 'gryffindor', 'Premio al Fair Play', 'Reconocimiento por excelencia deportiva', 2020, 'honor'),

-- Slytherin Achievements
('slyth-ach-1', 'slytherin', 'Campeón de Liga Intercasas', 'Dominio en competencias inter-casas', 2023, 'championship'),
('slyth-ach-2', 'slytherin', 'Mejor defensa histórica', 'Menor cantidad de puntos recibidos en una temporada', 2022, 'record'),
('slyth-ach-3', 'slytherin', 'Estrategia más innovadora', 'Revolución en tácticas de juego', 2021, 'special'),

-- Ravenclaw Achievements
('raven-ach-1', 'ravenclaw', 'Campeón de Torneos Académicos', 'Victoria en competencias académicas deportivas', 2023, 'championship'),
('raven-ach-2', 'ravenclaw', 'Sistema de Vuelo Helicoidal', 'Innovación en técnicas de vuelo', 2020, 'special'),
('raven-ach-3', 'ravenclaw', 'Premio a la Excelencia Táctica', 'Reconocimiento por innovación estratégica', 2022, 'honor'),

-- Hufflepuff Achievements
('huff-ach-1', 'hufflepuff', 'Campeón de Resistencia', 'Victoria en torneos de resistencia', 2021, 'championship'),
('huff-ach-2', 'hufflepuff', 'Temporada invicta en casa', 'Sin derrotas en estadio propio', 2020, 'record'),
('huff-ach-3', 'hufflepuff', 'Premio al Espíritu Deportivo', 'Reconocimiento por deportividad', 2022, 'honor');

-- Display confirmation
SELECT 'Database schema updated successfully' as message;
