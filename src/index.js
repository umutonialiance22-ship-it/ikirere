#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { geocode, getForecast } from './api.js';
import { formatCurrent, formatForecast } from './format.js';
import {
  loadData, saveData, addHistory, addFavourite, removeFavourite, getDataFilePath,
} from './storage.js';
import { CliError, handleError } from './errors.js';

const HELP = `ikirere - weather in your terminal

Usage:
  ikirere <city>                    Current weather
  ikirere forecast <city> [--days N] Daily forecast (1-16 days, default 3)
  ikirere fav add <city>            Save a favourite city
  ikirere fav remove <city>         Remove a favourite
  ikirere fav list                  List favourites (also: ikirere fav)
  ikirere history [clear]           Show (or clear) recent searches
  ikirere config                    Show saved settings
  ikirere config set units <metric|imperial>

Options:
  -u, --units <metric|imperial>     Units for this run
  -d, --days <n>                    Days for forecast
  -h, --help                        Show this help
  -v, --version                     Show version

Environment variables:
  IKIRERE_UNITS     metric | imperial
  IKIRERE_DATA_DIR  folder for data.json (default ~/.ikirere)

Units priority: --units flag > IKIRERE_UNITS > saved setting > metric`;

const VALID_UNITS = ['metric', 'imperial'];

function parseCli() {
  try {
    return parseArgs({
      args: process.argv.slice(2),
      allowPositionals: true,
      options: {
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
        units: { type: 'string', short: 'u' },
        days: { type: 'string', short: 'd' },
      },
    });
  } catch (err) {
    // parseArgs throws on unknown flags or missing values
    throw new CliError(`${err.message}\nTry: ikirere --help`);
  }
}

function checkUnits(value, source) {
  if (!VALID_UNITS.includes(value)) {
    throw new CliError(`Invalid units '${value}' from ${source}. Use 'metric' or 'imperial'.`);
  }
  return value;
}

// flag > env var > saved setting > default
function resolveUnits(flagValue, data) {
  if (flagValue !== undefined) return checkUnits(flagValue, '--units');
  if (process.env.IKIRERE_UNITS) return checkUnits(process.env.IKIRERE_UNITS, 'IKIRERE_UNITS');
  return checkUnits(data.settings.units, 'saved settings');
}

function parseDays(value) {
  if (value === undefined) return 3;
  // Number() gives NaN for 'abc'; also reject decimals and out-of-range values
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 16) {
    throw new CliError(`Invalid --days '${value}'. Use a whole number from 1 to 16.`);
  }
  return n;
}

function requireCity(words, hint) {
  const city = words.join(' ').trim();
  if (!city) throw new CliError(`No city given. ${hint}`);
  return city;
}

// Does the chained request: geocode -> forecast
async function lookup(city, units, days) {
  const place = await geocode(city);
  const forecast = await getForecast(place.latitude, place.longitude, units, days);
  return { place, forecast };
}

async function main() {
  const { values, positionals } = parseCli();

  if (values.help) return console.log(HELP);
  if (values.version) return console.log('ikirere 1.0.0');
  if (positionals.length === 0) {
    throw new CliError('No city given. Example: ikirere Kigali\nTry: ikirere --help');
  }

  const [command, ...rest] = positionals;
  const data = await loadData();

  switch (command) {
    case 'forecast': {
      const city = requireCity(rest, 'Example: ikirere forecast Kigali --days 5');
      const days = parseDays(values.days);
      const units = resolveUnits(values.units, data);
      const { place, forecast } = await lookup(city, units, days);
      console.log(formatForecast(place, forecast, units));
      addHistory(data, { city: place.name, type: 'forecast' });
      await saveData(data);
      break;
    }

    case 'fav': {
      const [action = 'list', ...words] = rest;
      if (action === 'list') {
        if (data.favourites.length === 0) console.log('No favourites yet. Add one: ikirere fav add Kigali');
        else data.favourites.forEach((f, i) => console.log(`${i + 1}. ${f}`));
      } else if (action === 'add') {
        const city = requireCity(words, 'Example: ikirere fav add Kigali');
        const place = await geocode(city); // make sure the city is real
        if (addFavourite(data, place.name)) {
          await saveData(data);
          console.log(`Added ${place.name} to favourites.`);
        } else {
          console.log(`${place.name} is already in your favourites.`);
        }
      } else if (action === 'remove') {
        const city = requireCity(words, 'Example: ikirere fav remove Kigali');
        if (!removeFavourite(data, city)) throw new CliError(`'${city}' is not in your favourites.`);
        await saveData(data);
        console.log(`Removed ${city} from favourites.`);
      } else {
        throw new CliError(`Unknown fav action '${action}'. Use add, remove or list.`);
      }
      break;
    }

    case 'history': {
      if (rest[0] === 'clear') {
        data.history = [];
        await saveData(data);
        console.log('History cleared.');
      } else if (data.history.length === 0) {
        console.log('No history yet. Try: ikirere Kigali');
      } else {
        data.history.forEach((h) => {
          console.log(`${new Date(h.at).toLocaleString('en-GB')}  ${h.city} (${h.type})`);
        });
      }
      break;
    }

    case 'config': {
      if (rest.length === 0) {
        console.log(`Data file: ${getDataFilePath()}`);
        console.log(`units: ${data.settings.units}`);
      } else if (rest[0] === 'set' && rest[1] === 'units') {
        data.settings.units = checkUnits(rest[2], 'config set');
        await saveData(data);
        console.log(`Saved: units = ${data.settings.units}`);
      } else {
        throw new CliError('Usage: ikirere config set units <metric|imperial>');
      }
      break;
    }

    default: {
      // Anything else is treated as a city name: ikirere Kigali / ikirere New York
      const city = requireCity(positionals, 'Example: ikirere Kigali');
      const units = resolveUnits(values.units, data);
      const { place, forecast } = await lookup(city, units, 1);
      console.log(formatCurrent(place, forecast, units));
      addHistory(data, { city: place.name, type: 'current' });
      await saveData(data);
    }
  }
}

main().catch(handleError);
