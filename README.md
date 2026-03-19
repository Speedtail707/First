# Live Weather Website

A simple weather website that shows real-time conditions using the free Open-Meteo APIs.

## Features
- Uses your current location (with browser permission)
- Lets you search any city by name
- Shows condition, temperature, wind speed, and humidity
- Refreshes data every 60 seconds

## Run locally
Because this app uses browser geolocation and external API calls, run it from a local server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.
