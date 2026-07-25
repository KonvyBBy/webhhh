export interface LztItem {
  item_id: number;
  title: string;
  price: number;
  currency: { value: string; symbol: string };
  category: { title: string };
  user: { user_id: number; username: string };
  created_at: string;
  bump_time: number;
  item_status: string;
  tags: { tag_id: number; tag: string; type: string }[];
  public_tags: { tag_id: number; tag: string }[];
  guarantee: string;
  item_domain: string;
  stats: { views: number; orders_count: number };
  images: { url: string }[];
  video_review: string;
  steam_data?: Record<string, unknown> | null;
  item_origin: string;
  country: string;
  email_login_data: string;
  email_provider: string;
}

export interface LztItemDetail extends LztItem {
  description: string;
  item_origin: string;
  country: string;
  email_login_data: string;
  email_provider: string;
  short_description: string;
  attributes: { title: string; value: string; tooltip?: string }[];
  steam_data: Record<string, unknown> | null;
  autobump: { status: boolean; next_bump_time: number } | null;
  can: { favorite: boolean; edit: boolean; delete: boolean; bump: boolean };
}

export interface LztCategory {
  id: number;
  title: string;
  url: string;
  count?: number;
}

export interface LztUserProfile {
  user_id: number;
  username: string;
  avatar: string;
  market: {
    rating: number;
    sells_count: number;
    buys_count: number;
    sympathies: number;
    balance: number;
    hold: number;
    currency: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

export type LztApiResponse<T> = Record<string, T | unknown> & {
  system_info?: {
    rate_limit: { limit: number; remaining: number; reset: number };
    time: number;
    log_id: number;
  };
};
