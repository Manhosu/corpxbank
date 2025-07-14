const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurações para melhorar performance e estabilidade
config.resolver.assetExts.push(
  // Adicionar extensões de assets
  'bin',
  'txt',
  'jpg',
  'png',
  'json',
  'svg'
);

module.exports = config;