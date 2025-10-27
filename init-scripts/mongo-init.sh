#!/bin/bash
set -e

# Wait for MongoDB to start
sleep 10

# Initialize replica set
mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    {
      _id: 0,
      host: 'localhost:27017'
    }
  ]
})
"

echo "MongoDB replica set initialized"