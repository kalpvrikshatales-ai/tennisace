import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },    // Ramp-up to 100
    { duration: '3m', target: 1000 },   // Ramp-up to 1,000
    { duration: '5m', target: 5000 },   // Ramp-up to 5,000
    { duration: '3m', target: 10000 },  // Peak: 10,000 concurrent
    { duration: '2m', target: 0 },      // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

const API = 'https://tennisace-api.onrender.com';

export default function () {
  const endpoints = [
    `${API}/matches/live`,
    `${API}/players/rankings?type=ATP&limit=50`,
    `${API}/feed/results?limit=30`,
    `${API}/feed/fixtures?limit=30`,
    `${API}/tournaments`,
  ];

  // Randomly select endpoint
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  const res = http.get(endpoint);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has content': (r) => r.body.length > 0,
  });

  sleep(1);
}
