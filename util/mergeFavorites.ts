import { uuid } from 'uuidv4';
import { Favourite, Favourites } from './types';
import filterFavorites from './filterFavorites';

export default function mergeFavorites(
  currentFavorites: Favourites,
  newFavorites: Array<Favourite>,
  store: string,
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
  const filteredNewKeys = Object.keys(filterFavorites(newData));
  const filteredOldKeys = Object.keys(filterFavorites(currentFavorites));
  const newKeys = Object.keys(newData);
  const oldKeys = Object.keys(currentFavorites);
  const reordered: Favourites = {};
  // Reorder favorites
  if (filteredOldKeys.every(key => filteredNewKeys.includes(key))) {
    newKeys.forEach(key => {
      reordered[key] = newData[key];
    });
    oldKeys.forEach(key => {
      if (!Object.keys(reordered).includes(key)) {
        reordered[key] = currentFavorites[key];
      }
    });
    return reordered;
  }
  return Object.assign(currentFavorites, newData);
}
