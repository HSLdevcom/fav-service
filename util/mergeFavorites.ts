import { uuid } from 'uuidv4';
import { Favourite, Favourites } from './types';
import filterFavorites from './filterFavorites';

export default function mergeFavorites(
  currentFavorites: Favourites,
  newFavorites: Array<Favourite>,
  store: string,
  type: string | undefined = undefined,
): Favourites {
  const newData: Favourites = {};
  const currentData = Object.values(currentFavorites).filter(elem => elem);
  const prefix = store ? `${store}-` : '';
  newFavorites.forEach(favorite => {
    let duplicate!: Favourite;
    const isDuplicate = currentData.some(existingFav => {
      if (
        existingFav.favouriteId === favorite.favouriteId ||
        (existingFav.gtfsId &&
          favorite.gtfsId &&
          existingFav.gtfsId === favorite.gtfsId) ||
        (existingFav.stationId &&
          favorite.stationId &&
          existingFav.stationId === favorite.stationId) ||
        (existingFav.noteId &&
          favorite.noteId &&
          existingFav.noteId === favorite.noteId) ||
        (existingFav.postalCode &&
          favorite.postalCode &&
          existingFav.postalCode === favorite.postalCode)
      ) {
        duplicate =
          String(existingFav.type) !== 'note' &&
          existingFav.lastUpdated >= favorite.lastUpdated
            ? existingFav
            : { ...favorite, favouriteId: existingFav.favouriteId };
        return true;
      }
    });
    if (isDuplicate) {
      newData[`${prefix}${duplicate.favouriteId}`] = duplicate;
    } else if (favorite.favouriteId) {
      newData[`${prefix}${favorite.favouriteId}`] = favorite;
    } else {
      const newFavorite = { ...favorite, favouriteId: uuid() };
      newData[`${prefix}${newFavorite.favouriteId}`] = newFavorite;
    }
  });
  const newKeys = Object.keys(filterFavorites(newData, type));
  const oldKeys = Object.keys(filterFavorites(currentFavorites));
  // Reorder favorites
  if (oldKeys.every(key => newKeys.includes(key))) {
    return newData;
  }
  return Object.assign(currentFavorites, newData);
}
