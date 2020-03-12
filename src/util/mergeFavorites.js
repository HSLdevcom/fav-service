// @flow

export default function mergeFavorites(currentFavorites: Object, newFavorites: Array<Object>, store: string) {
  const newData = {}
  const currentData = Object.values(currentFavorites).filter((elem) => elem)
  newFavorites.forEach((favorite) => {
    let duplicateId;
    const isDuplicate = currentData.some((item) => {
      if (item.favoriteId !== favorite.favouriteId && ((item.gtfsId && item.gtfsId === favorite.gtfsId) || (item.gid && item.gid === favorite.gid))) {
        duplicateId = item.favouriteId
        return true
      }
    })
    if (isDuplicate) {
      newData[`${store}-${duplicateId}`] = {...favorite, favouriteId: duplicateId}
    } else {
      newData[`${store}-${favorite.favouriteId}`] = favorite
    }
  })
  return Object.assign(currentFavorites, newData)
}
