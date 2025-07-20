# Deployment Guide for Render

## Prerequisites
1. A Render account (sign up at render.com)
2. OpenAI API key (optional - app works without it but with limited chat functionality)
3. Git repository with your code

## Deployment Steps

### 1. Prepare Your Repository
Make sure your repository contains:
- `app.py` - Main Flask application
- `requirements.txt` - Python dependencies  
- `start.sh` - Startup script
- `render.yaml` - Render configuration
- `templates/` - HTML templates
- `static/` - CSS and JS files
- `csv_files/` - Patient data files

### 2. Deploy to Render

#### Option A: Using render.yaml (Recommended)
1. Push your code to GitHub/GitLab
2. In Render dashboard, click "New" → "Blueprint"
3. Connect your repository
4. Render will automatically detect the render.yaml configuration

#### Option B: Manual Setup
1. In Render dashboard, click "New" → "Web Service"
2. Connect your repository
3. Configure the service:
   - **Name**: medical-assistant-app
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `./start.sh`

### 3. Set Environment Variables
In your Render service dashboard, add these environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key (optional)
- `FLASK_SECRET_KEY`: A random secret key for sessions
- `FLASK_ENV`: production

### 4. Deploy
Click "Deploy" and wait for the build to complete.

## Features Working After Deployment

✅ **Patient Data Retrieval**: Successfully retrieves patient information from CSV files
✅ **Medical Summaries**: Generates comprehensive patient summaries
✅ **Provider Dashboard**: Lists patients by provider
✅ **Patient Search**: Filter and search patients
✅ **Similar Patients**: Finds similar patients using embeddings
✅ **Chat Interface**: AI-powered medical assistant (requires OpenAI API key)

## API Endpoints

- `GET /` - Main dashboard
- `POST /ask` - Ask questions about patients
- `GET /get_providers` - List all providers
- `GET /get_patients/<provider_id>` - Get patients for a provider
- `GET /api/similar-patients/<patient_id>` - Find similar patients

## Sample Patient IDs for Testing
- patient-0001 (Mark Johnson)
- patient-0002 (David Taylor)
- patient-0003 (Michael Mcclain)

## Troubleshooting
- If chat functionality doesn't work, the app will still provide patient data summaries
- Check logs in Render dashboard for any deployment issues
- Ensure all CSV files are included in your repository 