#!/bin/bash

# Script to run web-app with predefined environment variables

API_BASE_URL=http://localhost:3000 \
KEYCLOAK_SERVER_URL=https://keycloak.iit.vn \
KEYCLOAK_REALM=master \
KEYCLOAK_API_CLIENT_ID=BE-log-monitoring \
KEYCLOAK_PUBLIC_CLIENT_ID=FE-log-monitoring \
KEYCLOAK_CLIENT_SECRET=KExgFbvftbzjJKkytIVaZiyf9fDjNw9w \
./scripts/run-web-app.sh