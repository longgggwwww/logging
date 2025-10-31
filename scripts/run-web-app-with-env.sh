#!/bin/bash

# Script to run web-app with predefined environment variables

API_BASE_URL=https://log.api.iit.vn \
KEYCLOAK_SERVER_URL=https://keycloak.iit.vn \
KEYCLOAK_REALM=master \
KEYCLOAK_API_CLIENT_ID=api-log-monitoring \
KEYCLOAK_PUBLIC_CLIENT_ID=cli-log-monitoring \
KEYCLOAK_CLIENT_SECRET= \
./scripts/run-web-app.sh