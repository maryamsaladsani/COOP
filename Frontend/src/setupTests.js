import '@testing-library/jest-dom';

// Jest 27's jsdom test environment doesn't forward Node's TextEncoder/TextDecoder onto the
// global object — react-router-dom v7 needs them at import time. Polyfill from Node's own
// util module rather than pulling in an extra dependency.
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
