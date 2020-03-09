// @flow

export default function mergeFavorites(currentFavorites: Object, newFavorites: Array<Object>, store: string) {
  const newData = {}
  newFavorites.forEach((favorite) => {
    newData[`${store}-${favorite.favouriteId}`] = favorite
  })
  return Object.assign(currentFavorites, newData)
}
