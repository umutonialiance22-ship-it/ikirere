import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { CliError } from './errors.js';

const MAX_HISTORY = 20;

// Folder: IKIRERE_DATA_DIR if set, otherwise ~/.ikirere
function dataDir() {
  return process.env.IKIRERE_DATA_DIR || path.join(os.homedir(), '.ikirere');
}

function dataFile() {
  return path.join(dataDir(), 'data.json');
}

function defaults() {
  return { favourites: [], history: [], settings: { units: 'metric' } };
}

// Read the file. First run (file missing) -> create it with defaults.
export async function loadData() {
  try {
    const text = await fs.readFile(dataFile(), 'utf8');
    const parsed = JSON.parse(text);
    // Merge with defaults so missing keys never crash us
    return {
      ...defaults(),
      ...parsed,
      settings: { ...defaults().settings, ...(parsed.settings || {}) },
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      const fresh = defaults();
      await saveData(fresh);
      return fresh;
    }
    if (err instanceof SyntaxError) {
      throw new CliError(`Your data file is corrupted: ${dataFile()}. Delete it to start fresh.`);
    }
    throw new CliError(`Could not read data file: ${err.message}`);
  }
}

export async function saveData(data) {
  try {
    await fs.mkdir(dataDir(), { recursive: true });
    await fs.writeFile(dataFile(), JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    throw new CliError(`Could not save data: ${err.message}`);
  }
}

export function addHistory(data, entry) {
  data.history.unshift({ ...entry, at: new Date().toISOString() });
  data.history = data.history.slice(0, MAX_HISTORY);
}

export function addFavourite(data, city) {
  const exists = data.favourites.some((f) => f.toLowerCase() === city.toLowerCase());
  if (exists) return false;
  data.favourites.push(city);
  return true;
}

export function removeFavourite(data, city) {
  const before = data.favourites.length;
  data.favourites = data.favourites.filter((f) => f.toLowerCase() !== city.toLowerCase());
  return data.favourites.length < before;
}

export function getDataFilePath() {
  return dataFile();
}
