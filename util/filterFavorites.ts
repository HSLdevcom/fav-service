import { Favourite, Favourites } from '../util/types';

const filterFavorites = (
  favorites: Favourites,
  type: string | undefined = undefined,
): Array<Favourite> => {
  const keys = Object.keys(favorites);
  const responseArray: Array<Favourite> = keys.map((key: string) => {
    return Object(favorites)[key];
  });
  const filteredArray: Array<Favourite> = responseArray.filter(item => {
    const itemType = String(item.type);
    if (
      item &&
      ((!type && !['note', 'postalCode'].includes(itemType)) ||
        (type && itemType === type))
    ) {
      return true;
    }
    return false;
  });
  return filteredArray;
};

export default filterFavorites;
