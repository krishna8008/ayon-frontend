import { snakeCase } from 'lodash'

const mergeArrays = (arrays) => {
  const mergedArray = []
  const maxLength = Math.max(...arrays.map((arr) => arr.length))
  const uniqueItems = new Set()
  for (let i = 0; i < maxLength; i++) {
    const items = []
    for (const arr of arrays) {
      if (i < arr.length) {
        const item = arr[i]
        const itemId = snakeCase(item.name)
        if (!uniqueItems.has(itemId)) {
          items.push({ id: itemId, ...item })
          uniqueItems.add(itemId)
        }
      }
    }
    items.sort((a, b) => a.name.localeCompare(b.name))
    mergedArray.push(...items)
  }
  return mergedArray
}

export const getMergedFields = (projectInfo = {}, splitBy) => {
  // first get all the statuses
  const statuses = Object.values(projectInfo).map((project) => project[splitBy])
  //   then merge them into one array
  const mergedStatuses = mergeArrays(statuses)

  return mergedStatuses
}
