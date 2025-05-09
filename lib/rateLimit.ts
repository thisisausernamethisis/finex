export const createRateLimiter = () => ({
  limit : async () => true,
  check : () => true,
});
