#!/bin/bash

# Create session directory if it doesn't exist
mkdir -p /tmp/flask_session

# Start the application with gunicorn
exec gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 120 app:app 