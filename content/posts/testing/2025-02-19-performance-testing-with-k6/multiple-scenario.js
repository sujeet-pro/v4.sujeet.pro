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
      ],
    },
    constant_request_rate: {
      executor: 'constant-arrival-rate',
      rate: 10, // This should be the target RPS you want to achieve
      timeUnit: '1s',
      duration: '30s', // It could be '30m', '2h' etc
      preAllocatedVUs: 5, // No. of users to start with
      maxVUs: 20, // Maximum number of Virtual Users
    },
  },
}

export default function () {
  http.get('https://test-api.k6.io')
}
