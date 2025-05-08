// tests/_setup/globalTeardown.js
// Using more traditional dynamic import pattern to work with ESM
// TODO: replace with vitest globalTeardown once Vitest ≥1.4 supports it

export default async () => {
  try {
    // eslint-disable-next-line import/extensions
    const { disconnectPrisma } = await import('./prismaTestEnv.js');
    await disconnectPrisma();
    console.log('Test environment teardown complete');
  } catch (error) {
    if (process.env.DEBUG) {
      console.debug('Error during test environment teardown:', error);
    }
    console.log('Test environment teardown complete');
  }
};
