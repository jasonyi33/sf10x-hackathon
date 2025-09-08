#!/usr/bin/env node
// Normalize existing individuals.data.height values to a consistent x'y string (e.g., 5'10)
// Usage: node mobile/scripts/normalize-heights.js [--dry-run]

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

// Try to read Supabase config from env, else fall back to mobile/config/api.ts constants
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vhfyquescrbwbbvvhxdg.supabase.co/';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZnlxdWVzY3Jid2JidnZoeGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMjQ5NDksImV4cCI6MjA2OTcwMDk0OX0.3grO_YeaqeM73db9jzvBV0WyLBwuD_ynW9lH3Z4Os4g';

// Utilities copied from mobile/utils/height.ts (JS version)
const parseHeightToInches = (raw) => {
  if (raw === undefined || raw === null) return null;
  const value = String(raw).trim().toLowerCase();
  if (value.length === 0) return null;

  // Formats: 5'10, 5' 10", 5 ft 10 in
  const feetInchesRegex = /^\s*(\d+)\s*(?:'|ft|feet)\s*(?:(\d{1,2})\s*(?:\"|in|inches)?)?\s*$/;
  const feetMatch = value.match(feetInchesRegex);
  if (feetMatch) {
    const feet = parseInt(feetMatch[1], 10) || 0;
    const inches = feetMatch[2] ? parseInt(feetMatch[2], 10) : 0;
    const total = feet * 12 + inches;
    return Number.isFinite(total) ? total : null;
  }

  // Plain inches: 70, 70in
  const inchesRegex = /^\s*(\d{1,3})\s*(?:\"|in|inches)?\s*$/;
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

const inchesToFeetInchesString = (inchesTotal) => {
  const feet = Math.floor(inchesTotal / 12);
  const inches = Math.round(inchesTotal % 12);
  return `${feet}'${inches}`;
};

const normalizeHeightToStandardString = (raw) => {
  const inches = parseHeightToInches(raw);
  if (inches === null) return null;
  return inchesToFeetInchesString(inches);
};

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log(`🔗 Connected to Supabase: ${SUPABASE_URL}`);

  console.log('📥 Fetching individuals with any height in data...');
  const { data: individuals, error } = await supabase
    .from('individuals')
    .select('id, name, data')
    .not('data->>height', 'is', null);

  if (error) {
    console.error('❌ Query error:', error);
    process.exit(1);
  }

  if (!individuals || individuals.length === 0) {
    console.log('ℹ️ No individuals with height found. Nothing to normalize.');
    return;
  }

  console.log(`🧮 Found ${individuals.length} individuals with a height value.`);

  let updates = 0;
  for (const person of individuals) {
    const current = person.data?.height;
    const normalized = normalizeHeightToStandardString(current);
    if (!normalized) {
      continue; // skip invalid/empty heights
    }
    if (current === normalized) {
      continue; // already standard
    }

    console.log(`➡️  ${person.name || person.id}: ${current} -> ${normalized}`);
    updates += 1;

    if (!DRY_RUN) {
      const newData = { ...(person.data || {}), height: normalized };
      const { error: updateError } = await supabase
        .from('individuals')
        .update({ data: newData, updated_at: new Date().toISOString() })
        .eq('id', person.id);

      if (updateError) {
        console.error(`   ❌ Update failed for ${person.id}:`, updateError);
      } else {
        console.log('   ✅ Updated');
      }
    }
  }

  if (DRY_RUN) {
    console.log(`
💡 Dry run complete. ${updates} rows would be updated.
Run without --dry-run to apply changes.`);
  } else {
    console.log(`
✅ Done. ${updates} rows updated.`);
  }
}

main().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(1);
});

