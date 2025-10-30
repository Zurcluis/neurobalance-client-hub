/**
 * Extrai o primeiro e último nome de um nome completo
 * @param fullName - Nome completo do cliente
 * @returns String com primeiro e último nome, ou nome completo se tiver apenas um nome
 */
export const getFirstAndLastName = (fullName: string): string => {
  if (!fullName || fullName.trim() === '') {
    return '';
  }

  const nameParts = fullName.trim().split(/\s+/);
  
  // Se tiver apenas um nome, retorna ele mesmo
  if (nameParts.length === 1) {
    return nameParts[0];
  }
  
  // Se tiver dois nomes, retorna ambos
  if (nameParts.length === 2) {
    return nameParts.join(' ');
  }
  
  // Se tiver mais de dois nomes, retorna primeiro e último
  return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
};
