"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const filterFavorites = (favorites, type = undefined) => {
    const types = type === null || type === void 0 ? void 0 : type.split(',');
    const keys = Object.keys(favorites);
    const responseArray = keys.map((key) => {
        return Object(favorites)[key];
    });
    const filteredArray = responseArray.filter(item => {
        const itemType = String(item.type);
        if (item &&
            ((!types && !['note', 'postalCode'].includes(itemType)) ||
                (types && (types === null || types === void 0 ? void 0 : types.includes(itemType))))) {
            return true;
        }
        return false;
    });
    return filteredArray;
};
exports.default = filterFavorites;
