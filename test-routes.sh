#!/bin/bash

# Test script to verify SPA routing without browser
# This script sends HTTP requests to check if our SPA routing configuration works

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PORT=8000
BASE_URL="http://localhost:$PORT"

echo -e "${BLUE}Testing SPA routing on $BASE_URL ${NC}"
echo "================================="

# Function to check if the response contains our test content
check_response() {
  local url=$1
  local response=$(curl -s "$url")
  
  if [[ $response == *"This is a simple SPA routing test"* ]]; then
    echo -e "${GREEN}✓ $url - Success! Response contains expected content${NC}"
    return 0
  else
    echo -e "${RED}✗ $url - Failed! Response doesn't contain expected content${NC}"
    return 1
  fi
}

# Test home route
echo -e "\n${BLUE}Testing home route:${NC}"
check_response "$BASE_URL/"

# Test other routes that should be handled by the SPA
echo -e "\n${BLUE}Testing SPA routes:${NC}"
check_response "$BASE_URL/test"
check_response "$BASE_URL/items"
check_response "$BASE_URL/settings"
check_response "$BASE_URL/this-route-doesnt-exist"

echo -e "\n${BLUE}Test completed.${NC}"
echo "If all tests show '✓ Success', the SPA routing is working correctly!"
echo "If any test shows '✗ Failed', the server isn't properly routing all requests to the SPA."