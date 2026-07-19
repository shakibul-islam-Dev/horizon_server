function sendSuccess(res, message, data, meta, statusCode = 200) {
  const payload = { success: true, message };
  if (data !== undefined) payload.data = data;
  if (meta) payload.meta = meta;
  res.status(statusCode).json(payload);
}

function sendError(res, statusCode, message) {
  res.status(statusCode).json({ success: false, message });
}

function sendCreated(res, message, data) {
  sendSuccess(res, message, data, undefined, 201);
}

module.exports = { sendSuccess, sendError, sendCreated };
