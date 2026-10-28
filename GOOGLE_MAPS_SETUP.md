# Google Maps API Setup Guide

## Overview
This application uses Google Maps API for location-based features including:
- Interactive map display showing workers and customers
- Location picker for profile updates
- Address autocomplete search
- Distance calculation between users and workers
- Geocoding (converting coordinates to addresses)

## Step 1: Get Google Maps API Key

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click "Select a project" → "New Project"
4. Enter project name: "Hyperlocal Jobs Platform"
5. Click "Create"

### 1.2 Enable Required APIs
1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Enable the following APIs:
   - **Maps JavaScript API** (for map display)
   - **Places API** (for location search and autocomplete)
   - **Geocoding API** (for address lookup)
   - **Geolocation API** (optional, for better location accuracy)

### 1.3 Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key
4. Click "Restrict Key" (recommended for security)

### 1.4 Restrict API Key (Recommended)
1. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add: `http://localhost:3001/*`
   - Add: `http://localhost:3000/*`
   - Add your production domain when deploying

2. Under "API restrictions":
   - Select "Restrict key"
   - Check: Maps JavaScript API
   - Check: Places API
   - Check: Geocoding API

3. Click "Save"

## Step 2: Add API Key to Application

### 2.1 Update Frontend Environment File
1. Open `frontend/.env`
2. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

### 2.2 Restart Frontend Server
```bash
cd frontend
npm start
```

## Step 3: Test the Integration

### 3.1 Test Location Picker
1. Login to the application
2. Go to Profile page
3. Click "📍 Update Location" button
4. You should see:
   - Interactive Google Map
   - Search box with autocomplete
   - "Use Current Location" button
   - Draggable marker

### 3.2 Test Worker Search Map
1. Login as customer
2. Go to "Find Workers" page
3. Click "Search Workers"
4. You should see:
   - Map showing worker locations (blue markers)
   - Your location (green marker)
   - Info windows when clicking markers

## Features Implemented

### 1. Location Picker Component
**File**: `frontend/src/components/LocationPicker.js`

Features:
- Interactive map with draggable marker
- Click anywhere on map to set location
- Search box with Google Places autocomplete
- "Use Current Location" button (uses browser geolocation)
- Displays selected address and coordinates
- Reverse geocoding (coordinates → address)

### 2. Enhanced Map Component
**File**: `frontend/src/components/MapComponent.js`

Features:
- Displays all workers on map with custom markers
- Shows user's current location
- Info windows with worker details (name, skills, rate, rating)
- Auto-fits bounds to show all markers
- Different marker colors for workers (blue) and user (green)

### 3. Profile Location Update
**File**: `frontend/src/pages/Profile.js`

Features:
- "Update Location" button opens location picker
- Visual map interface for selecting location
- Saves location to database with address
- Displays current location in profile

### 4. Worker Search with Location
**File**: `frontend/src/pages/WorkerSearch.js`

Features:
- Uses user's location for distance calculation
- Shows workers on interactive map
- Displays distance from user to each worker
- Filters workers by radius

## API Usage and Costs

### Free Tier (Monthly)
- **Maps JavaScript API**: $200 free credit
- **Places API**: $200 free credit
- **Geocoding API**: $200 free credit

### Typical Usage
- Map loads: ~$7 per 1000 loads
- Autocomplete: ~$2.83 per 1000 requests
- Geocoding: ~$5 per 1000 requests

### Cost Optimization Tips
1. Set API key restrictions
2. Enable billing alerts in Google Cloud
3. Cache geocoding results
4. Use session tokens for autocomplete
5. Implement rate limiting

## Troubleshooting

### Map Not Loading
**Error**: "This page can't load Google Maps correctly"
**Solution**: 
- Check if API key is correct in `.env`
- Verify Maps JavaScript API is enabled
- Check browser console for specific error
- Ensure billing is enabled in Google Cloud

### Autocomplete Not Working
**Error**: Search box doesn't show suggestions
**Solution**:
- Verify Places API is enabled
- Check API key restrictions
- Ensure `libraries=places` is in script URL

### "Use Current Location" Not Working
**Error**: Location permission denied
**Solution**:
- Browser must be on HTTPS (or localhost)
- User must grant location permission
- Check browser location settings

### Geocoding Errors
**Error**: Address not found
**Solution**:
- Verify Geocoding API is enabled
- Check if coordinates are valid
- Ensure API key has geocoding permission

## Security Best Practices

### 1. API Key Protection
- Never commit API keys to public repositories
- Use environment variables
- Restrict API key to specific domains
- Rotate keys periodically

### 2. Domain Restrictions
Production setup:
```
Application restrictions:
- HTTP referrers
- https://yourdomain.com/*
- https://www.yourdomain.com/*
```

### 3. API Restrictions
Only enable required APIs:
- Maps JavaScript API
- Places API
- Geocoding API

### 4. Monitoring
- Set up billing alerts
- Monitor API usage in Google Cloud Console
- Review API logs regularly

## Alternative: Free Options

If you want to avoid Google Maps costs, consider:

### 1. OpenStreetMap + Leaflet
- Completely free
- No API key required
- Good for basic mapping

### 2. Mapbox
- Free tier: 50,000 map loads/month
- Better pricing than Google Maps
- Modern API

### 3. HERE Maps
- Free tier available
- Good geocoding
- Enterprise features

## Production Deployment

### Before Deploying:
1. Get production API key
2. Add production domain to restrictions
3. Enable billing in Google Cloud
4. Set up monitoring and alerts
5. Test all location features
6. Document API key for team

### Environment Variables:
```bash
# Production .env
REACT_APP_GOOGLE_MAPS_API_KEY=your_production_key
```

## Support

### Google Maps Documentation
- [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding)

### Common Issues
- [API Key Issues](https://developers.google.com/maps/documentation/javascript/error-messages)
- [Billing Setup](https://cloud.google.com/billing/docs)
- [Usage Limits](https://developers.google.com/maps/documentation/javascript/usage-and-billing)

## Quick Start (TL;DR)

1. Get API key from Google Cloud Console
2. Enable: Maps JavaScript API, Places API, Geocoding API
3. Add to `frontend/.env`: `REACT_APP_GOOGLE_MAPS_API_KEY=your_key`
4. Restart frontend: `npm start`
5. Test location picker in Profile page
6. Test worker map in Find Workers page

Done! 🎉
