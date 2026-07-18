export const ROLES = { USER: "user", ADMIN: "admin" } as const;

export const ITEM_STATUS = { ACTIVE: "active", SOLD: "sold", ARCHIVED: "archived" } as const;

export const INTERACTION_TYPES = { VIEW: "view", FAVORITE: "favorite", PURCHASE: "purchase", RATING: "rating" } as const;

export const CONTENT_TYPES = { BLOG: "blog", PRODUCT_DESC: "product_desc", SOCIAL_POST: "social_post", DOCUMENTATION: "documentation" } as const;

export const CONTENT_LENGTHS = { SHORT: "short", MEDIUM: "medium", LONG: "long" } as const;

export const CONTENT_LENGTH_TOKENS: Record<string, number> = { short: 300, medium: 600, long: 1200 };

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_DATA_SIZE = 10 * 1024 * 1024;
