export const createRateLimiter = () => ({
  limit : async (res?: { headers: any }) => {
    if (res) {
      res.headers.set('X-RateLimit-Limit', '100');
      res.headers.set('X-RateLimit-Remaining', '99');
      res.headers.set('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 60));
    }
    return true;
  },
  check : () => true,
});
