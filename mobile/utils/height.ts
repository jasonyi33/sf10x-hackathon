export const parseHeightToInches = (raw: any): number | null => {
  if (raw === undefined || raw === null) return null;
  const value = String(raw).trim().toLowerCase();
  if (value.length === 0) return null;

  // Formats: 5'10, 5’10, 5′10, 5' 10", 5 ft 10 in
  // Accept feet markers: ' (ASCII), ’ (U+2019), ′ (U+2032)
  // Accept inch markers: " (ASCII), ” (U+201D), ″ (U+2033), or words in/inches
  const feetInchesRegex = /^(?:\s*)(\d+)(?:\s*)(?:['’′]|ft|feet)(?:\s*)(?:(\d{1,2})(?:\s*)(?:["”″]|in|inches)?)?(?:\s*)$/;
  const feetMatch = value.match(feetInchesRegex);
  if (feetMatch) {
    const feet = parseInt(feetMatch[1], 10) || 0;
    const inches = feetMatch[2] ? parseInt(feetMatch[2], 10) : 0;
    const total = feet * 12 + inches;
    return Number.isFinite(total) ? total : null;
  }

  // Plain inches: 70, 70in
  const inchesRegex = /^(?:\s*)(\d{1,3})(?:\s*)(?:["”″]|in|inches)?(?:\s*)$/;
  const inchesMatch = value.match(inchesRegex);
  if (inchesMatch) {
    const total = parseInt(inchesMatch[1], 10);
    return Number.isFinite(total) ? total : null;
  }

  // Meters/centimeters: 1.78m, 178cm
  const metersRegex = /^\s*(\d+(?:\.\d+)?)\s*m\s*$/;
  const metersMatch = value.match(metersRegex);
  if (metersMatch) {
    const meters = parseFloat(metersMatch[1]);
    const total = Math.round(meters * 39.3701);
    return Number.isFinite(total) ? total : null;
  }
  const cmRegex = /^\s*(\d{2,3})\s*cm\s*$/;
  const cmMatch = value.match(cmRegex);
  if (cmMatch) {
    const cm = parseInt(cmMatch[1], 10);
    const total = Math.round(cm * 0.393701);
    return Number.isFinite(total) ? total : null;
  }

  return null;
};

export const inchesToFeetInchesString = (inchesTotal: number): string => {
  const feet = Math.floor(inchesTotal / 12);
  const inches = Math.round(inchesTotal % 12);
  return `${feet}'${inches}`;
};

export const normalizeHeightToStandardString = (raw: any): string | null => {
  const inches = parseHeightToInches(raw);
  if (inches === null) return null;
  return inchesToFeetInchesString(inches);
};
