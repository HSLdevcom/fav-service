"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = mergeFavorites;

function mergeFavorites(currentFavorites, newFavorites) {
  const newData = {};
  newFavorites.forEach(favorite => {
    newData[favorite.id] = favorite;
  });
  return Object.assign(currentFavorites, newData);
}