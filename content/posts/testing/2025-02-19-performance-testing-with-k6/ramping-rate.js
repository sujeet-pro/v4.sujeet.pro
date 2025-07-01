import http from 'k6/http'

export const options = {
  discardResponseBodies: true,
  scenarios: {
    ramping_arrival_rate: {
      executor: 'ramping-arrival-rate',
      startRate: 1, // Initial RPS
      timeUnit: '1s',
      preAllocatedVUs: 5,
      maxVUs: 20,
      stages: [
        { duration: '5s', target: 5 }, // ramp-up to 5 RPS
        { duration: '10s', target: 5 }, // constant load at 5 RPS
        { duration: '5s', target: 10 }, // ramp-up to 10 RPS
        { duration: '10s', target: 10 }, // constant load at 10 RPS
        { duration: '5s', target: 15 }, // ramp-up to 15 RPS
        { duration: '10s', target: 15 }, // constant load at 15 RPS
      ],
    },
  },
}

export default function () {
  http.get('https://test-api.k6.io')
}
