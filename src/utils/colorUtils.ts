// Función para convertir códigos HEX a nombres de colores legibles
export function hexToColorName(hex: string): string {
  const colorMapping: { [key: string]: string } = {
    // Rojos
    "#FF0000": "rojo",
    "#8B0000": "rojo oscuro",
    "#DC143C": "carmesí",
    "#B22222": "rojo ladrillo",
    "#CD5C5C": "rojo indio",
    "#F08080": "salmón claro",
    "#FA8072": "salmón",
    "#E9967A": "salmón oscuro",
    "#FF6347": "tomate",
    "#FF4500": "rojo anaranjado",
    "#740001": "rojo granate",
    
    // Azules
    "#0000FF": "azul",
    "#000080": "azul marino",
    "#191970": "azul medianoche",
    "#4169E1": "azul real",
    "#4682B4": "azul acero",
    "#87CEEB": "azul cielo",
    "#ADD8E6": "azul claro",
    "#B0C4DE": "azul acero claro",
    "#87CEFA": "azul cielo claro",
    "#6495ED": "azul aciano",
    "#1E90FF": "azul profundo",
    "#00BFFF": "azul cielo profundo",
    "#0E1A40": "azul ravenclaw",
    
    // Verdes
    "#008000": "verde",
    "#006400": "verde oscuro",
    "#228B22": "verde bosque",
    "#32CD32": "verde lima",
    "#00FF00": "verde lima",
    "#7CFC00": "verde césped",
    "#9ACD32": "verde amarillento",
    "#00FF7F": "verde primavera",
    "#00FA9A": "verde primavera medio",
    "#90EE90": "verde claro",
    "#98FB98": "verde pálido",
    "#8FBC8F": "verde mar oscuro",
    "#2E8B57": "verde mar",
    "#3CB371": "verde mar medio",
    "#20B2AA": "verde mar claro",
    "#66CDAA": "aguamarina medio",
    "#7FFFD4": "aguamarina",
    "#40E0D0": "turquesa",
    "#48D1CC": "turquesa medio",
    "#00CED1": "turquesa oscuro",
    "#50C878": "verde esmeralda",
    "#1A472A": "verde slytherin",
    "#008080": "verde azulado",
    "#556B2F": "verde oliva oscuro",
    
    // Amarillos y dorados
    "#FFFF00": "amarillo",
    "#FFD700": "dorado",
    "#FFA500": "naranja",
    "#FF8C00": "naranja oscuro",
    "#FF7F50": "coral",
    "#F0E68C": "caqui",
    "#BDB76B": "caqui oscuro",
    "#DAA520": "vara de oro",
    "#B8860B": "vara de oro oscuro",
    "#CD853F": "cobre",
    "#D2691E": "chocolate",
    "#F4A460": "arenoso",
    "#DEB887": "madera",
    "#F5DEB3": "trigo",
    "#FFE4B5": "mocasín",
    "#FFDEAD": "navajo blanco",
    "#FFEFD5": "papaya",
    "#FFF8DC": "cornsilk",
    "#FFFACD": "limón chiffon",
    "#FAFAD2": "vara de oro claro",
    "#ECB939": "amarillo dorado",
    "#D3A625": "dorado vibrante",
    "#FF6600": "naranja brillante",
    
    // Morados y violetas
    "#800080": "morado",
    "#4B0082": "índigo",
    "#483D8B": "pizarra azul oscuro",
    "#6A5ACD": "pizarra azul",
    "#7B68EE": "pizarra azul medio",
    "#9370DB": "morado medio",
    "#8A2BE2": "azul violeta",
    "#9400D3": "violeta oscuro",
    "#9932CC": "orquídea oscura",
    "#BA55D3": "orquídea medio",
    "#DA70D6": "orquídea",
    "#EE82EE": "violeta",
    "#DDA0DD": "ciruela",
    "#D8BFD8": "cardo",
    "#E6E6FA": "lavanda",
    "#F0F8FF": "azul alice",
    "#F5F5DC": "beige",
    "#6A0DAD": "morado real",
    
    // Marrones
    "#A52A2A": "marrón",
    "#8B4513": "marrón silla",
    "#A0522D": "siena",
    "#BC8F8F": "rosa rosado",
    "#708090": "pizarra gris",
    "#778899": "pizarra gris claro",
    "#372E29": "marrón oscuro",
    "#946B2D": "bronce",
    
    // Grises y neutros
    "#000000": "negro",
    "#FFFFFF": "blanco",
    "#F5F5F5": "humo blanco",
    "#DCDCDC": "gainsboro",
    "#D3D3D3": "gris claro",
    "#C0C0C0": "plata",
    "#A9A9A9": "gris oscuro",
    "#808080": "gris",
    "#696969": "gris tenue",
    "#2F4F4F": "pizarra gris oscuro",
    "#5D5D5D": "plata oscura",
    
    // Rosas
    "#FFC0CB": "rosa",
    "#FFB6C1": "rosa claro",
    "#FF69B4": "rosa fuerte",
    "#FF1493": "rosa profundo",
    "#DB7093": "violeta rojo pálido",
    "#C71585": "violeta rojo medio"
  };
  
  // Normalizar el código HEX (mayúsculas)
  const normalizedHex = hex.toUpperCase();
  
  // Buscar en el mapeo
  return colorMapping[normalizedHex] || hex;
}

// Función para obtener múltiples colores convertidos
export function convertTeamColors(colors: string[]): string[] {
  return colors.map(color => {
    // Si ya es un nombre de color (no empieza con #), devolverlo tal como está
    if (!color.startsWith('#')) {
      return color;
    }
    return hexToColorName(color);
  });
}

// Función para formatear colores de equipo para mostrar
export function formatTeamColors(colors: string[]): string {
  if (!colors || colors.length === 0) {
    return "Colores no definidos";
  }
  
  const convertedColors = convertTeamColors(colors);
  
  if (convertedColors.length === 1) {
    return convertedColors[0];
  } else if (convertedColors.length === 2) {
    return `${convertedColors[0]} y ${convertedColors[1]}`;
  } else {
    const lastColor = convertedColors[convertedColors.length - 1];
    const otherColors = convertedColors.slice(0, -1);
    return `${otherColors.join(', ')} y ${lastColor}`;
  }
}
