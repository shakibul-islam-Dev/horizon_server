export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function parsePagination(query: { page?: string; limit?: string }): PaginationParams {
  const page = Math.max(1, parseInt(query.page || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || "12")));
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const pages = Math.ceil(total / limit);
  return { page, limit, total, pages, hasNext: page < pages, hasPrev: page > 1 };
}
