import http from 'k6/http'

// Read the reference doc for full options
export const options = {
  discardResponseBodies: true, // Discard, if you are not doing any checks with response
}

// The default exported function is gonna be picked up by k6 as the entry point for the test script.
// It will be executed repeatedly in "iterations" for the whole duration of the test.
export default function () {
  // Make a GET request to the target URL
  // In actual code, this should rotate between long list of actual users
  http.get('https://test-api.k6.io')
}
