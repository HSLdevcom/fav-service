// @flow

export default function mergeFavorites(currentFavorites: Object, newFavorites: Array<Object>, store: string) {
  const newData = {}
  const currentData = Object.values(currentFavorites).filter((elem) => elem)
  const favouriteIds = currentData.map((elem) => elem.favouriteId)
  const gtfsIds = currentData.map((elem) => elem.gtfsId)
  const gids = currentData.map((elem) => elem.gid)
  newFavorites.forEach((favorite) => {
    // Update existing favourite
    if (favouriteIds.includes(favorite.favouriteId)) {
      currentFavorites[`${store}-${favorite.favouriteId}`] = favorite
    } else if (!gtfsIds.includes(favorite.gtfsId) && !gids.includes(favorite.gid)) {
      newData[`${store}-${favorite.favouriteId}`] = favorite
    }
  })
  return Object.assign(currentFavorites, newData)
}
