import http from 'k6/http'

export const options = {
  discardResponseBodies: true,
  stages: [
    { duration: '5s', target: 10 }, // traffic ramp-up from 1 to 10 users over 5 sec
    { duration: '10s', target: 10 }, // stay at 100 users for 10 minutes
  ],
}

export default function () {
  http.get('https://test-api.k6.io')
}
