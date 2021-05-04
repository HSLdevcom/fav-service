"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = mergeFavorites;

var _uuidv = require("uuidv4");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function mergeFavorites(currentFavorites, newFavorites, store) {
  const newData = {};
  const currentData = Object.values(currentFavorites).filter(elem => elem);
  const prefix = store ? `${store}-` : '';
  newFavorites.forEach(favorite => {
    let duplicate;
    const isDuplicate = currentData.some(item => {
      if (item.favouriteId === favorite.favouriteId || item.gtfsId && favorite.gtfsId && item.gtfsId === favorite.gtfsId) {
        duplicate = !favorite.favouriteId || item.lastUpdated >= favorite.lastUpdated ? item : favorite;
        return true;
      }
    });

    if (isDuplicate) {
      newData[`${prefix}${duplicate.favouriteId}`] = duplicate;
    } else if (favorite.favouriteId) {
      newData[`${prefix}${favorite.favouriteId}`] = favorite;
    } else {
      const newFavorite = _objectSpread(_objectSpread({}, favorite), {}, {
        favouriteId: (0, _uuidv.uuid)()
      });

      newData[`${prefix}${newFavorite.favouriteId}`] = newFavorite;
    }
  });
  const newKeys = Object.keys(newData);
  const oldKeys = Object.keys(currentFavorites); // Reorder favorites

  if (oldKeys.every(key => newKeys.includes(key))) {
    return newData;
  }

  return Object.assign(currentFavorites, newData);
}