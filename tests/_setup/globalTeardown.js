// tests/_setup/globalTeardown.js
// Jest global teardown in CommonJS format

module.exports = async () => {
  try {
    // Dynamic import for ESM module
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
