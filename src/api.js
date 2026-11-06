import { CliError } from './errors.js';

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = Number(process.env.IKIRERE_TIMEOUT_MS) || 10000;

// Shared helper: fetch JSON with a timeout and friendly errors.
async function fetchJson(url) {
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new CliError(`The weather service took longer than ${TIMEOUT_MS / 1000}s to answer. Try again.`);
    }
    // fetch throws a TypeError when the network is down / DNS fails
    throw new CliError('Could not reach the weather service. Check your internet connection.');
  }
  if (!res.ok) {
    throw new CliError(`The weather service returned an error (HTTP ${res.status}).`);
  }
  try {
    return await res.json();
  } catch {
    throw new CliError('The weather service sent a response we could not read.');
  }
}

// Step 1: city name -> coordinates
export async function geocode(city) {
  const params = new URLSearchParams({ name: city, count: '1', language: 'en', format: 'json' });
  const data = await fetchJson(`${GEO_URL}?${params}`);
  if (!data.results || data.results.length === 0) {
    throw new CliError(`Couldn't find a city called '${city}'. Check the spelling.`);
  }
  const { name, country, latitude, longitude } = data.results[0];
  return { name, country, latitude, longitude };
}

// Step 2: coordinates -> weather
export async function getForecast(latitude, longitude, units, days) {
  const imperial = units === 'imperial';
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
    forecast_days: String(days),
    timezone: 'auto',
    temperature_unit: imperial ? 'fahrenheit' : 'celsius',
    wind_speed_unit: imperial ? 'mph' : 'kmh',
    precipitation_unit: imperial ? 'inch' : 'mm',
  });
  return fetchJson(`${FORECAST_URL}?${params}`);
}