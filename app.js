const weatherCodeMap = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  80: "Rain showers",
  81: "Strong rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm"
};

const elements = {
  locationName: document.getElementById("location-name"),
  updatedAt: document.getElementById("updated-at"),
  condition: document.getElementById("condition"),
  temperature: document.getElementById("temperature"),
  wind: document.getElementById("wind"),
  humidity: document.getElementById("humidity"),
  status: document.getElementById("status"),
  locationBtn: document.getElementById("location-btn"),
  searchForm: document.getElementById("search-form"),
  cityInput: document.getElementById("city-input")
};

let refreshTimer;

function showStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.style.color = isError ? "#c62828" : "#1b5e20";
}

async function loadWeather(lat, lon, label = "Current location") {
  showStatus("Fetching latest conditions...");

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`);
  }

  const data = await response.json();
  const current = data.current;

  elements.locationName.textContent = label;
  elements.updatedAt.textContent = `Updated: ${new Date(current.time).toLocaleString()}`;
  elements.condition.textContent = weatherCodeMap[current.weather_code] ?? `Code ${current.weather_code}`;
  elements.temperature.textContent = `${current.temperature_2m} °C`;
  elements.wind.textContent = `${current.wind_speed_10m} km/h`;
  elements.humidity.textContent = `${current.relative_humidity_2m}%`;

  showStatus("Live weather updated.");
}

async function searchCity(cityName) {
  const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geoUrl.searchParams.set("name", cityName);
  geoUrl.searchParams.set("count", "1");
  geoUrl.searchParams.set("language", "en");
  geoUrl.searchParams.set("format", "json");

  const response = await fetch(geoUrl);
  if (!response.ok) {
    throw new Error(`City search failed (${response.status})`);
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("City not found. Try a more specific name.");
  }

  return data.results[0];
}

function scheduleRefresh(lat, lon, label) {
  clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    loadWeather(lat, lon, label).catch((error) => showStatus(error.message, true));
  }, 60_000);
}

async function useCurrentLocation() {
  if (!navigator.geolocation) {
    showStatus("Geolocation is not supported in this browser.", true);
    return;
  }

  showStatus("Requesting your location...");
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      const label = "Your location";
      try {
        await loadWeather(latitude, longitude, label);
        scheduleRefresh(latitude, longitude, label);
      } catch (error) {
        showStatus(error.message, true);
      }
    },
    () => showStatus("Unable to access your location. You can search by city instead.", true),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

elements.locationBtn.addEventListener("click", useCurrentLocation);

elements.searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = elements.cityInput.value.trim();
  if (!city) return;

  try {
    showStatus("Searching city...");
    const result = await searchCity(city);
    const label = `${result.name}, ${result.country}`;
    await loadWeather(result.latitude, result.longitude, label);
    scheduleRefresh(result.latitude, result.longitude, label);
  } catch (error) {
    showStatus(error.message, true);
  }
});

useCurrentLocation();
