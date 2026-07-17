/**
 * Build MongoDB skip/limit from query params
 * @param {{ page?: string, limit?: string }} query
 * @returns {{ skip: number, limit: number, page: number }}
 */
function paginate(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { skip, limit, page };
}

module.exports = { paginate };
