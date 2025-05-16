import fs from 'fs';
import path from 'path';

const calibPath = path.resolve('calibration/calibration.json');

interface Mapping { x: number[]; y: number[]; }
let mapping: Mapping | null = null;

/**
 * Loads the calibration mapping from the JSON file
 * Caches the mapping after first load for better performance
 * 
 * @returns The mapping object with x and y coordinate arrays
 */
function loadMapping(): Mapping {
  if (!mapping) mapping = JSON.parse(fs.readFileSync(calibPath, 'utf-8'));
  return mapping!;
}

/**
 * Clamps a raw impact score (−5…5) through an isotonic regression mapping
 * Uses piece-wise constant interpolation to find the nearest calibrated value
 * 
 * @param raw The raw uncalibrated impact score
 * @returns The calibrated impact score
 */
export function applyCalibration(raw: number): number {
  const { x, y } = loadMapping();
  
  // Find nearest neighbor (piece-wise constant)
  // Find the first x value that is greater than or equal to raw
  const idx = x.findIndex(v => v >= raw);
  
  // If no such value exists (raw is larger than all x values), return the last y value
  if (idx === -1) return y[y.length - 1];
  
  // If the found index is 0 and raw is less than the first x value,
  // return the first y value
  if (idx === 0 && raw < x[0]) return y[0];
  
  // If we found an exact match, return the corresponding y value
  if (x[idx] === raw) return y[idx];
  
  // Otherwise, we need to interpolate between the two nearest points
  // Since we're using piece-wise constant interpolation, we take the y value
  // of the lower x value (the bucket raw falls into)
  const lowerIdx = idx - 1;
  return y[lowerIdx];
}
