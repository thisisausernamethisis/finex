// Mock for the lib/rateLimit module
// Use jest.mock to automatically mock the module
jest.mock('../../lib/rateLimit', () => ({
  createRateLimiter: jest.fn().mockReturnValue({
    limit: jest.fn().mockResolvedValue(true)
  })
}));

export const createRateLimiter = jest.fn().mockReturnValue({
  limit: jest.fn().mockResolvedValue(true)
});
