// @flow
import {uuid} from 'uuidv4'

export default function mergeFavorites(currentFavorites: Object, newFavorites: Array<Object>, store: string) {
  const newData = {}
  const currentData = Object.values(currentFavorites).filter((elem) => elem)
  const prefix = store ? `${store}-` : ''
  newFavorites.forEach((favorite) => {
    let duplicate
    const isDuplicate = currentData.some((existingFav) => {
      if (existingFav.favouriteId === favorite.favouriteId ||
        (existingFav.gtfsId && favorite.gtfsId && existingFav.gtfsId === favorite.gtfsId) ||
        (existingFav.stationId && favorite.stationId && existingFav.stationId === favorite.stationId)) {
        duplicate = existingFav.lastUpdated >= favorite.lastUpdated ? existingFav : { ...favorite, favouriteId: existingFav.favouriteId }
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
  const newKeys = Object.keys(newData)
  const oldKeys = Object.keys(currentFavorites)
  // Reorder favorites
  if (oldKeys.every((key) => newKeys.includes(key))) {
    return newData
  }
  return Object.assign(currentFavorites, newData)
}
