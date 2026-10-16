/**
 * Centralized Category Label Formatting for AquaTrack Mobile
 * Provides consistent, human-friendly titles for all ticket categories
 * across both Consumer/Resident and Sub-Admin/Technician screens.
 */

export const CATEGORY_LABELS = {
  PIPELINE_BREACH_PRESSURE_DROP: 'Pipeline Breach / Pressure Drop',
  HIGH_TURBIDITY: 'High Turbidity',
  HIGH_MINERAL_CONTENT_TDS: 'High Mineral Content/TDS',
  CHEMICAL_DISCOLORATION_CONTAMINATION: 'Chemical Discoloration / Contamination',
  UNCLASSIFIED_INFRASTRUCTURE_ANOMALY: 'Infrastructure Anomaly',
  IOT_NODE_OFFLINE: 'IoT Node Offline',
  WATER_QUALITY: 'Water Quality',
  LEAKAGE: 'Pipe Leakage',
  PIPE_BURST: 'Main Burst',
  LOW_PRESSURE: 'Low Pressure',
  NO_WATER: 'Water Outage',
  BILLING_ISSUE: 'Billing / Meter',
};

export const CATEGORY_FAMILIAR_KEYWORDS = {
  PIPELINE_BREACH_PRESSURE_DROP: [
    'Low Water Pressure',
    'Weak Water Flow',
    'Pipe Leak / Burst',
    'Water Interruption',
  ],
  HIGH_TURBIDITY: [
    'Brown / Muddy Water',
    'Cloudy Tap Water',
    'Dirt / Sediments in Water',
    'Murky Water',
  ],
  HIGH_MINERAL_CONTENT_TDS: [
    'Salty or Metallic Taste',
    'Hard Water',
    'White Chalky Residue',
    'Scale Buildup',
  ],
  CHEMICAL_DISCOLORATION_CONTAMINATION: [
    'Chemical / Bleach Odor',
    'Strong Chlorine Smell',
    'Yellow / Green Tint',
    'Unusual Water Taste',
  ],
  UNCLASSIFIED_INFRASTRUCTURE_ANOMALY: [
    'General Water Service Issue',
    'Faulty Water Meter',
    'Damaged Valve',
    'Unusual Pipe Noise',
  ],
  IOT_NODE_OFFLINE: [
    'Sensor Offline',
    'Telemetry Interruption',
    'Automated Monitoring Alert',
  ],
  WATER_QUALITY: [
    'Unpleasant Taste or Odor',
    'Cloudy or Off-Color Water',
  ],
  LEAKAGE: [
    'Dripping Pipe',
    'Water Puddle / Seepage',
    'Leaking Joint',
  ],
  PIPE_BURST: [
    'Main Pipe Rupture',
    'Gushing Water',
    'Flooded Street',
  ],
  LOW_PRESSURE: [
    'Low Water Pressure',
    'Weak Flow',
    'Trickling Faucet',
  ],
  NO_WATER: [
    'No Water Supply',
    'Complete Interruption',
    'Dry Faucets',
  ],
  BILLING_ISSUE: [
    'Billing Discrepancy',
    'Meter Reading Concern',
  ],
};

/**
 * Formats a category enum or string into its authoritative human-readable label.
 * @param {string|null|undefined} cat
 * @returns {string}
 */
export function formatCategory(cat) {
  if (!cat) return 'Unclassified';
  const upper = String(cat).trim().toUpperCase();
  if (CATEGORY_LABELS[upper]) {
    return CATEGORY_LABELS[upper];
  }
  return String(cat)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns consumer-friendly keywords and indicators for a given category.
 * @param {string|null|undefined} cat
 * @returns {string[]}
 */
export function getCategoryFamiliarKeywords(cat) {
  if (!cat) return ['Water Issue', 'Service Concern'];
  const upper = String(cat).trim().toUpperCase();
  if (CATEGORY_FAMILIAR_KEYWORDS[upper]) {
    return CATEGORY_FAMILIAR_KEYWORDS[upper];
  }
  return ['Water Issue', 'Service Concern'];
}
