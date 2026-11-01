export const sendResponse = (res, { success = true, message = '', data = null, meta = null, statusCode = 200 }) => {
  res.status(statusCode).json({
    success,
    message,
    data,
    meta
  });
};
