/** @format */

import $ajax from '@helper/ajax'

function requestUrl(path) {
  return `/api/${path}`
}

export default {
  getNiceLinks(data) {
    return $ajax.get(requestUrl('getNiceLinks'), data)
  },

  addNiceLinks(data) {
    return $ajax.post(requestUrl('addNiceLinks'), data)
  },

  updateNiceLinks(data) {
    return $ajax.post(requestUrl('updateNiceLinks'), data)
  },

  deleteNiceLinks(data) {
    return $ajax.post(requestUrl('deleteNiceLinks'), data)
  },

  getAllLinks(data) {
    return $ajax.get(requestUrl('getAllLinks'), data)
  },

  getAllLinksCount(data) {
    return $ajax.get(requestUrl('getAllLinksCount'), data)
  }
}
