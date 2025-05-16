import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { applyCalibration } from '../../../lib/utils/calibration';
import fs from 'fs';
import path from 'path';

describe('calibration mapping', () => {
  // Setup a mock calibration file for testing
  const mockCalibPath = path.resolve('calibration/calibration.json');
  const origCalibContent = fs.existsSync(mockCalibPath) 
    ? fs.readFileSync(mockCalibPath, 'utf-8') 
    : null;
  
  beforeAll(() => {
    // Ensure the calibration directory exists
    const calibDir = path.dirname(mockCalibPath);
    if (!fs.existsSync(calibDir)) {
      fs.mkdirSync(calibDir, { recursive: true });
    }
    
    // Create a test calibration mapping
    const mockMapping = {
      "//": "Test mapping for unit tests",
      "x": [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
      "y": [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]
    };
    
    fs.writeFileSync(mockCalibPath, JSON.stringify(mockMapping, null, 2));
  });
  
  afterAll(() => {
    // Restore original calibration file if it existed
    if (origCalibContent) {
      fs.writeFileSync(mockCalibPath, origCalibContent);
    } else if (fs.existsSync(mockCalibPath)) {
      fs.unlinkSync(mockCalibPath);
    }
  });
  
  it('maps raw score to nearest calibrated bucket', () => {
    expect(applyCalibration(4.2)).toBe(4);
    expect(applyCalibration(-4.9)).toBe(-5);
  });
  
  it('returns exact match for values in the mapping', () => {
    expect(applyCalibration(3)).toBe(3);
    expect(applyCalibration(-2)).toBe(-2);
    expect(applyCalibration(0)).toBe(0);
  });
  
  it('handles edge cases properly', () => {
    // Values smaller than the smallest bucket
    expect(applyCalibration(-6)).toBe(-5);
    
    // Values larger than the largest bucket
    expect(applyCalibration(6)).toBe(5);
    
    // Zero
    expect(applyCalibration(0)).toBe(0);
  });
  
  it('correctly applies piece-wise constant interpolation', () => {
    // For values between buckets, should return the lower bucket value
    expect(applyCalibration(1.7)).toBe(1);
    expect(applyCalibration(-2.3)).toBe(-3);
  });
});
