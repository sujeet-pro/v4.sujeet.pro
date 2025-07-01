import http from 'k6/http'

export const options = {
  discardResponseBodies: true,
  iterations: 10, // Run this 10 times
}

export default function () {
  http.get('https://test-api.k6.io')
}
