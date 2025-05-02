import { v4 as uuidv4 } from 'uuid';
import { Favourite, Favourites } from './types.js';
import filterFavourites from './filterFavourites.js';

export default function mergeFavourites(
  currentFavourites: Favourites,
  newFavourites: Array<Favourite>,
  store: string,
): Favourites {
  const newData: Favourites = {};
  const currentData = Object.values(currentFavourites).filter(elem => elem);
  const prefix = store ? `${store}-` : '';
  newFavourites.forEach(favourite => {
    let duplicate!: Favourite;
    const isDuplicate = currentData.some(existingFav => {
      if (
        existingFav.favouriteId === favourite.favouriteId ||
        (existingFav.gtfsId &&
          favourite.gtfsId &&
          existingFav.gtfsId === favourite.gtfsId) ||
        (existingFav.stationId &&
          favourite.stationId &&
          existingFav.stationId === favourite.stationId) ||
        (existingFav.noteId &&
          favourite.noteId &&
          existingFav.noteId === favourite.noteId) ||
        (existingFav.postalCode &&
          favourite.postalCode &&
          existingFav.postalCode === favourite.postalCode)
      ) {
        duplicate =
          String(existingFav.type) !== 'note' &&
          existingFav.lastUpdated >= favourite.lastUpdated
            ? existingFav
            : { ...favourite, favouriteId: existingFav.favouriteId };
        return true;
      }
    });
    if (isDuplicate) {
      newData[`${prefix}${duplicate.favouriteId}`] = duplicate;
    } else if (favourite.favouriteId) {
      newData[`${prefix}${favourite.favouriteId}`] = favourite;
    } else {
      const newFavourite = { ...favourite, favouriteId: uuidv4() };
      newData[`${prefix}${newFavourite.favouriteId}`] = newFavourite;
    }
  });
  const filteredNewKeys = Object.keys(filterFavourites(newData));
  const filteredOldKeys = Object.keys(filterFavourites(currentFavourites));
  const newKeys = Object.keys(newData);
  const oldKeys = Object.keys(currentFavourites);
  const reordered: Favourites = {};
  // Reorder favourites
  if (filteredOldKeys.every(key => filteredNewKeys.includes(key))) {
    newKeys.forEach(key => {
      reordered[key] = newData[key];
    });
    oldKeys.forEach(key => {
      if (!Object.keys(reordered).includes(key)) {
        reordered[key] = currentFavourites[key];
      }
    });
    return reordered;
  }
  return Object.assign(currentFavourites, newData);
}
