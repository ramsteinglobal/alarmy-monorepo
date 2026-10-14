import AsyncStorage from '@react-native-async-storage/async-storage';

const WEATHER_CACHE_KEY = '@wakely_weather_cache';

export type WeatherData = {
  city: string;
  temperature: number;
  condition: string;
  icon: string;
  high: number;
  low: number;
  windSpeed: number;
  lastUpdated: string;
};

const WEATHER_CODES: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Clear Sky', icon: '☀️' },
  1: { condition: 'Mainly Clear', icon: '🌤️' },
  2: { condition: 'Partly Cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },
  45: { condition: 'Foggy', icon: '🌫️' },
  48: { condition: 'Rime Fog', icon: '🌫️' },
  51: { condition: 'Light Drizzle', icon: '🌦️' },
  53: { condition: 'Moderate Drizzle', icon: '🌦️' },
  55: { condition: 'Dense Drizzle', icon: '🌧️' },
  61: { condition: 'Slight Rain', icon: '🌧️' },
  63: { condition: 'Moderate Rain', icon: '🌧️' },
  65: { condition: 'Heavy Rain', icon: '🌧️' },
  71: { condition: 'Slight Snow', icon: '❄️' },
  73: { condition: 'Moderate Snow', icon: '❄️' },
  75: { condition: 'Heavy Snow', icon: '❄️' },
  77: { condition: 'Snow Grains', icon: '❄️' },
  80: { condition: 'Rain Showers', icon: '🌦️' },
  81: { condition: 'Heavy Showers', icon: '🌧️' },
  82: { condition: 'Violent Showers', icon: '⛈️' },
  95: { condition: 'Thunderstorm', icon: '⛈️' },
  96: { condition: 'Thunderstorm with Hail', icon: '⛈️' },
  99: { condition: 'Heavy Hail Thunderstorm', icon: '⛈️' },
};

function getWeatherDetails(code: number): { condition: string; icon: string } {
  return WEATHER_CODES[code] ?? { condition: 'Fair', icon: '🌤️' };
}

/**
 * Gets cached weather immediately for instantaneous render
 */
export async function getCachedWeather(): Promise<WeatherData | null> {
  try {
    const raw = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Fetches real-time weather using Open-Meteo & IP location
 */
export async function fetchCurrentWeather(): Promise<WeatherData | null> {
  try {
    // 1. Get approximate coordinates from IP (no API key needed)
    let lat = 28.6139;
    let lon = 77.209;
    let city = 'Your City';

    try {
      const geoRes = await fetch('http://ip-api.com/json', {
        headers: { Accept: 'application/json' },
      });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.status === 'success' && geoData.lat && geoData.lon) {
          lat = geoData.lat;
          lon = geoData.lon;
          city = geoData.city || geoData.regionName || 'Your City';
        }
      }
    } catch (geoErr) {
      console.warn('Geolocation fallback to default:', geoErr);
    }

    // 2. Fetch real-time weather from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error('Weather API request failed');

    const data = await weatherRes.json();
    const current = data.current_weather;
    const daily = data.daily;

    const { condition, icon } = getWeatherDetails(current.weathercode);
    const weather: WeatherData = {
      city,
      temperature: Math.round(current.temperature),
      condition,
      icon,
      high: Math.round(daily?.temperature_2m_max?.[0] ?? current.temperature + 2),
      low: Math.round(daily?.temperature_2m_min?.[0] ?? current.temperature - 4),
      windSpeed: Math.round(current.windspeed),
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Cache weather for instant offline viewing
    await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weather));
    return weather;
  } catch (error) {
    console.warn('Failed to fetch weather:', error);
    return getCachedWeather();
  }
}
