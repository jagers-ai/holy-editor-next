const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root and packages
config.watchFolders = [workspaceRoot];

// Ensure metro resolves modules from the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Alias core package to source for TS transpilation
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  '@core': path.resolve(workspaceRoot, 'packages/core/src'),
};

module.exports = config;

