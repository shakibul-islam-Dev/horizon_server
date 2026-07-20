function sendSuccess(res: any, message: any, data: any, meta: any, statusCode = 200) {
  const payload = { success: true, message } as any;
  if (data !== undefined) payload.data = data;
  if (meta) payload.meta = meta;
  res.status(statusCode).json(payload);
}

function sendError(res: any, statusCode: any, message: any) {
  res.status(statusCode).json({ success: false, message });
}

function sendCreated(res: any, message: any, data: any) {
  sendSuccess(res, message, data, undefined, 201);
}

module.exports = { sendSuccess, sendError, sendCreated };
