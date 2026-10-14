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
