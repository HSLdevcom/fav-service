"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = mergeFavorites;

function mergeFavorites(currentFavorites, newFavorites, store) {
  const newData = {};
  const currentData = Object.values(currentFavorites).filter(elem => elem);
  const favouriteIds = currentData.map(elem => elem.favouriteId);
  const gtfsIds = currentData.map(elem => elem.gtfsId);
  const gids = currentData.map(elem => elem.gid);
  newFavorites.forEach(favorite => {
    // Update existing favourite
    if (favouriteIds.includes(favorite.favouriteId)) {
      currentFavorites[`${store}-${favorite.favouriteId}`] = favorite;
    } else if (!gtfsIds.includes(favorite.gtfsId) && !gids.includes(favorite.gid)) {
      newData[`${store}-${favorite.favouriteId}`] = favorite;
    }
  });
  return Object.assign(currentFavorites, newData);
}