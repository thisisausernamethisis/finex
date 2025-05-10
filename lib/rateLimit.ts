export const createRateLimiter = () => ({
  limit : async () => true,
  check : () => true,
});

// For test mocks
export const __resetRateLimit = () => {};
