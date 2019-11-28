// @flow

export default function mergeFavorites(currentFavorites: Object, newFavorites: Array<Object>) {
  const newData = {}
  newFavorites.forEach((favorite) => {
    newData[favorite.id] = favorite
  })
  return Object.assign(currentFavorites, newData)
}
