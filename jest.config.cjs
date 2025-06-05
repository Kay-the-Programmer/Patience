module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS imports
    '^@/(.*)$': '<rootDir>/$1' // Handle path aliases like @/components
  },
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};
