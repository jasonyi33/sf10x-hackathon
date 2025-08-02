export const getDangerScoreColor = (score: number): string => {
  if (score >= 0 && score <= 33) {
    return '#10B981'; // Green
  } else if (score >= 34 && score <= 66) {
    return '#F59E0B'; // Yellow
  } else {
    return '#EF4444'; // Red
  }
};

export const getDisplayDangerScore = (individual: { danger_score: number; danger_override?: number | null }): number => {
  return individual.danger_override !== null && individual.danger_override !== undefined 
    ? individual.danger_override 
    : individual.danger_score;
};

export const calculateDaysAgo = (dateString: string): number => {
  const lastSeen = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastSeen.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}; 