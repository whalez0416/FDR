export type Mall = {
  id: string;
  name: string;
  city: string;
  district: string;
  address?: string;
  image_url: string;
  source_url?: string;
};

export type Restaurant = {
  id: string;
  mall_id: string;
  name: string;
  category: string;
  floor: string;
  image_url?: string;
  stroller_accessible: boolean;
  highchair_available: boolean;
  nursing_room_distance: number;
  description?: string;
  rating?: number;
};

export type Review = {
  id: string;
  restaurant_id: string;
  user_id: string;
  rating: number;
  content: string;
  kid_friendly_score: number;
  images: string[];
  created_at: string;
};
