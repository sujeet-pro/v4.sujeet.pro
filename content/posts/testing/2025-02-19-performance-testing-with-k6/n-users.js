import http from 'k6/http'

export const options = {
  discardResponseBodies: true,
  VUs: 5,
  duration: '10s',
}

export default function () {
  http.get('https://test-api.k6.io')
}
