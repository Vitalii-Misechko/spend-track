'use strict';

module.exports = {
  require: 'ts-node/register',
  loader: 'ts-node/esm',
  spec: ['tests/**/*.test.ts'],
};