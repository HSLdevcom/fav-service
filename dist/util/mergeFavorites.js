"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4_1 = require("uuidv4");
function mergeFavorites(currentFavorites, newFavorites, store) {
    const newData = {};
    const currentData = Object.values(currentFavorites).filter(elem => elem);
    const prefix = store ? `${store}-` : '';
    newFavorites.forEach(favorite => {
        let duplicate;
        const isDuplicate = currentData.some(existingFav => {
            if (existingFav.favouriteId === favorite.favouriteId ||
                (existingFav.gtfsId &&
                    favorite.gtfsId &&
                    existingFav.gtfsId === favorite.gtfsId) ||
                (existingFav.stationId &&
                    favorite.stationId &&
                    existingFav.stationId === favorite.stationId)) {
                duplicate =
                    existingFav.lastUpdated >= favorite.lastUpdated
                        ? existingFav
                        : Object.assign(Object.assign({}, favorite), { favouriteId: existingFav.favouriteId });
                return true;
            }
        });
        if (isDuplicate) {
            newData[`${prefix}${duplicate.favouriteId}`] = duplicate;
        }
        else if (favorite.favouriteId) {
            newData[`${prefix}${favorite.favouriteId}`] = favorite;
        }
        else {
            const newFavorite = Object.assign(Object.assign({}, favorite), { favouriteId: uuidv4_1.uuid() });
            newData[`${prefix}${newFavorite.favouriteId}`] = newFavorite;
        }
    });
    const newKeys = Object.keys(newData);
    const oldKeys = Object.keys(currentFavorites);
    // Reorder favorites
    if (oldKeys.every(key => newKeys.includes(key))) {
        return newData;
    }
    return Object.assign(currentFavorites, newData);
}
exports.default = mergeFavorites;
