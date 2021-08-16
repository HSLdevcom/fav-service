import { AxiosRequestConfig } from 'axios';

enum FavouriteType {
  'route',
  'stop',
  'station',
  'place',
  'bikeStation',
}

export interface Favourite {
  favouriteId: string;
  type: FavouriteType;
  lastUpdated: number;
  gid?: string;
  gtfsId?: string;
  name?: string;
  address?: string;
  lat?: number;
  lon?: number;
  selectedIconId?: number;
  layer?: number;
  code?: string;
  networks?: Array<string>;
  stationId?: string;
}

export interface Favourites {
  [key: string]: Favourite;
}

export interface Cache {
  data?: Favourites;
}

export interface RedisSettings {
  redisHost?: string;
  redisPort?: number;
  redisPass?: string;
}

export interface HsldIdOptions extends AxiosRequestConfig {
  endpoint?: string;
}

export interface Schema {
  params: {
    id: string | undefined;
  };
  query: {
    store: string | undefined;
  };
  // method?: string | undefined;
}

export interface GetSchema {
  hslId: string | undefined;
  store: string | undefined;
}

export interface UpdateSchema {
  body: Array<Favourite>;
  hslId: string | undefined;
  store: string | undefined;
}

export interface DeleteSchema {
  body: Array<string>;
  hslId: string | undefined;
  store: string | undefined;
}
