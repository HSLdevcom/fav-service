// @flow
import {uuid} from 'uuidv4'

export default function mergeFavorites(currentFavorites: Object, newFavorites: Array<Object>, store: string) {
  const newData = {}
  const currentData = Object.values(currentFavorites).filter((elem) => elem)
  const prefix = store ? `${store}-` : ''
  newFavorites.forEach((favorite) => {
    let duplicate
    const isDuplicate = currentData.some((item) => {
      if (item.favouriteId === favorite.favouriteId) {
        duplicate = item.lastUpdated >= favorite.lastUpdated ? item : favorite
        return true
      }
    })
    if (isDuplicate) {
      newData[`${prefix}${duplicate.favouriteId}`] = duplicate
    } else if (favorite.favouriteId) {
      newData[`${prefix}${favorite.favouriteId}`] = favorite
    } else {
      const newFavorite = {...favorite, favouriteId: uuid()}
      newData[`${prefix}${newFavorite.favouriteId}`] = newFavorite
    }
  })
  return Object.assign(currentFavorites, newData)
}
