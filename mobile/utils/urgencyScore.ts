export const getUrgencyScoreColor = (score: number): string => {
  if (score >= 0 && score <= 33) {
    return '#10B981'; // Green
  } else if (score >= 34 && score <= 66) {
    return '#F59E0B'; // Yellow
  } else {
    return '#EF4444'; // Red
  }
};

export const getDisplayUrgencyScore = (individual: { urgency_score: number; urgency_override?: number | null }): number => {
  return individual.urgency_override !== null && individual.urgency_override !== undefined 
    ? individual.urgency_override 
    : individual.urgency_score;
};

export const calculateDaysAgo = (dateString: string): number => {
  const lastSeen = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastSeen.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}; 