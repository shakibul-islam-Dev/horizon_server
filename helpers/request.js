function paginate(pageStr, limitStr, maxLimit = 50) {
  const page = Math.max(1, parseInt(pageStr) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(limitStr) || 12));
  return { page, limit, skip: (page - 1) * limit };
}

function buildMeta(page, limit, total) {
  const pages = Math.ceil(total / limit);
  return { page, limit, total, pages, hasNext: page < pages, hasPrev: page > 1 };
}

module.exports = { paginate, buildMeta };
