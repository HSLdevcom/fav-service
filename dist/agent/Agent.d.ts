import { AxiosResponse } from 'axios';
import { Favourites } from '../util/types';
export declare const getDataStorage: (id: string | undefined) => Promise<{
    [key: string]: string;
}>;
export declare const createDataStorage: (id: string | undefined) => Promise<string>;
export declare const getFavorites: (dsId: string | undefined) => Promise<Favourites>;
export declare const updateFavorites: (dsId: string | undefined, favorites: Favourites) => Promise<AxiosResponse>;
export declare const deleteFavorites: (dsId: string | undefined, keys: Array<string>, store: string | undefined) => Promise<AxiosResponse<string>[]>;
export declare const deleteExpiredNotes: (dsId: string | undefined, favorites: Favourites) => Promise<AxiosResponse<string>[]>;
