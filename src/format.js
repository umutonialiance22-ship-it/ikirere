// Open-Meteo returns a numeric weather code. This turns it into words.
const CODES = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light showers', 81: 'Showers', 82: 'Violent showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
};

const describe = (code) => CODES[code] ?? 'Unknown';

function unitLabels(units) {
  return units === 'imperial'
    ? { temp: '°F', wind: 'mph', rain: 'in' }
    : { temp: '°C', wind: 'km/h', rain: 'mm' };
}

export function formatCurrent(place, forecast, units) {
  const u = unitLabels(units);
  const c = forecast.current;
  return [
    `${place.name}, ${place.country}`,
    `  Conditions : ${describe(c.weather_code)}`,
    `  Temperature: ${c.temperature_2m}${u.temp} (feels like ${c.apparent_temperature}${u.temp})`,
    `  Humidity   : ${c.relative_humidity_2m}%`,
    `  Wind       : ${c.wind_speed_10m} ${u.wind}`,
    `  Rain       : ${c.precipitation} ${u.rain}`,
  ].join('\n');
}

export function formatForecast(place, forecast, units) {
  const u = unitLabels(units);
  const d = forecast.daily;
  const lines = [`${place.name}, ${place.country} - ${d.time.length}-day forecast`];
  for (let i = 0; i < d.time.length; i++) {
    const day = new Date(d.time[i] + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
    lines.push(
      `  ${day.padEnd(11)} ${describe(d.weather_code[i]).padEnd(24)}` +
      `${d.temperature_2m_min[i]}${u.temp} to ${d.temperature_2m_max[i]}${u.temp}   ` +
      `rain ${d.precipitation_sum[i]} ${u.rain}`
    );
  }
  return lines.join('\n');
}
