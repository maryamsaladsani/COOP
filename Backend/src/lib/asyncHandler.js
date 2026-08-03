// Express 4 doesn't catch rejected promises from async route handlers — an unhandled
// rejection there just hangs the request (or crashes the process) instead of reaching
// the error-handling middleware in app.js. Wrap async handlers with this so thrown/rejected
// errors reach `next(err)` and get a proper response.

function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
