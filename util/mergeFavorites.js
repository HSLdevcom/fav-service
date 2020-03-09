"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = mergeFavorites;

function mergeFavorites(currentFavorites, newFavorites, store) {
  const newData = {};
  newFavorites.forEach(favorite => {
    newData[`${store}-${favorite.favouriteId}`] = favorite;
  });
  return Object.assign(currentFavorites, newData);
}