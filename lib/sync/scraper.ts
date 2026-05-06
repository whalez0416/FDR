import { Restaurant } from '@/types';

/**
 * Interface for Mall Scrapers
 * Each mall (The Hyundai, Lotte, etc.) will have its own implementation
 */
export interface IMallScraper {
  mallName: string;
  baseUrl: string;
  
  /**
   * Fetches the raw list of restaurants from the mall's official website
   */
  fetchRestaurants(): Promise<ScrapedRestaurant[]>;
  
  /**
   * Maps raw data to our internal database format
   */
  transform(data: any): ScrapedRestaurant;
}

export interface ScrapedRestaurant {
  name: string;
  category: string;
  floor: string;
  status: 'OPEN' | 'CLOSED';
  imageUrl?: string;
  // Parenthood data might need manual verification or separate source
  stroller_accessible?: boolean;
  highchair_available?: boolean;
}

/**
 * Base class for scrapers to share common utilities
 */
export abstract class BaseScraper implements IMallScraper {
  abstract mallName: string;
  abstract baseUrl: string;

  async fetchRestaurants(): Promise<ScrapedRestaurant[]> {
    throw new Error('Method not implemented.');
  }

  transform(data: any): ScrapedRestaurant {
    throw new Error('Method not implemented.');
  }
}
