import { Favourite, Favourites } from '../util/types';

const filterFavourites = (
  favourites: Favourites,
  type: string | undefined = undefined,
): Array<Favourite> => {
  const types = type?.split(',');
  const keys = Object.keys(favourites);
  const responseArray: Array<Favourite> = keys.map((key: string) => {
    return Object(favourites)[key];
  });
  const defaultTypes = ['route', 'stop', 'station', 'place', 'bikeStation'];
  const filteredArray: Array<Favourite> = responseArray.filter(item => {
    const itemType = String(item.type);
    if (
      item &&
      ((!types && defaultTypes.includes(itemType)) ||
        (types && types?.includes(itemType)))
    ) {
      return true;
    }
    return false;
  });
  return filteredArray;
};

export default filterFavourites;
