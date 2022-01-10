"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4_1 = require("uuidv4");
const filterFavorites_1 = require("./filterFavorites");
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
                    existingFav.stationId === favorite.stationId) ||
                (existingFav.noteId &&
                    favorite.noteId &&
                    existingFav.noteId === favorite.noteId) ||
                (existingFav.postalCode &&
                    favorite.postalCode &&
                    existingFav.postalCode === favorite.postalCode)) {
                duplicate =
                    String(existingFav.type) !== 'note' &&
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
    const filteredNewKeys = Object.keys(filterFavorites_1.default(newData));
    const filteredOldKeys = Object.keys(filterFavorites_1.default(currentFavorites));
    const newKeys = Object.keys(newData);
    const oldKeys = Object.keys(currentFavorites);
    const reordered = {};
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
exports.default = mergeFavorites;