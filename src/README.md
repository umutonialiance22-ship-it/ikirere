# ikirere

A weather tool for your terminal, built with Node.js. *Ikirere* means "weather" in Kinyarwanda.

```
ikirere Kigali
ikirere forecast Kigali --days 5
ikirere fav add Kigali
ikirere history
```

It takes a city name, finds that city's coordinates, fetches the weather for them, and prints it. It also remembers favourites, history and settings between runs.

## How it works (the chained request)

Weather APIs only understand latitude and longitude, not city names, so there are two requests and the second depends on the first. Both use the free [Open-Meteo](https://open-meteo.com) API, which needs no API key.

1. **Geocoding:** `Kigali` becomes `-1.94, 30.06`
2. **Forecast:** `-1.94, 30.06` becomes temperature, wind, rain and so on

## Install

You need **Node.js 18 or newer** (it has `fetch` built in). Check with `node -v`.

```bash
git clone https://github.com/umutonialiance22-ship-it/ikirere.git
cd ikirere
npm install
npm link
```

`npm link` creates the global `ikirere` command. Check it works:

```bash
ikirere --version
```

To remove it later: `npm unlink -g ikirere`.

## Usage

| Command | What it does |
|---|---|
| `ikirere <city>` | Current weather |
| `ikirere forecast <city> --days 5` | Daily forecast (1 to 16 days, default 3) |
| `ikirere fav add <city>` | Save a favourite city |
| `ikirere fav remove <city>` | Remove a favourite |
| `ikirere fav list` | List favourites (plain `ikirere fav` does the same) |
| `ikirere history` | Show your last 20 searches |
| `ikirere history clear` | Clear the history |
| `ikirere config` | Show saved settings and the data file location |
| `ikirere config set units imperial` | Save a default unit system |
| `ikirere --help` | Show help |
| `ikirere --version` | Show the version |

Options:

| Flag | Meaning |
|---|---|
| `-u`, `--units <metric\|imperial>` | Units for this run only |
| `-d`, `--days <n>` | Number of forecast days |
| `-h`, `--help` | Help |
| `-v`, `--version` | Version |

City names with spaces work with or without quotes for the current-weather command (`ikirere New York`). Use quotes with other commands to be safe (`ikirere forecast "New York" --days 2`).

### Examples

Current weather:

```
$ ikirere Kigali
Kigali, Rwanda
  Conditions : Partly cloudy
  Temperature: 24.1°C (feels like 24.5°C)
  Humidity   : 58%
  Wind       : 9.4 km/h
  Rain       : 0 mm
```

Forecast:

```
$ ikirere forecast Kigali --days 3
Kigali, Rwanda - 3-day forecast
  Fri 6 Nov   Light showers           15.2°C to 25.8°C   rain 1.4 mm
  Sat 7 Nov   Partly cloudy           15.0°C to 26.1°C   rain 0 mm
  Sun 8 Nov   Rain                    14.8°C to 24.3°C   rain 5.2 mm
```

Favourites and history:

```
$ ikirere fav add Kigali
Added Kigali to favourites.

$ ikirere fav list
1. Kigali

$ ikirere history
06/11/2026, 14:02:11  Kigali (forecast)
06/11/2026, 14:01:40  Kigali (current)
```

An error:

```
$ ikirere Kigalli
Error: Couldn't find a city called 'Kigalli'. Check the spelling.
```

*(The numbers above are examples. Real output depends on the day.)*

## Errors and exit codes

The tool never shows a stack trace. It prints a short message and exits with a code: `0` means success and `1` means failure.

| Situation | Example message | Exit code |
|---|---|---|
| Success | normal output | `0` |
| No city given | `No city given. Example: ikirere Kigali` | `1` |
| Bad `--days` | `Invalid --days 'abc'. Use a whole number from 1 to 16.` | `1` |
| Bad units | `Invalid units 'x'. Use 'metric' or 'imperial'.` | `1` |
| City not found | `Couldn't find a city called 'Kigalli'. Check the spelling.` | `1` |
| Network down | `Could not reach the weather service. Check your internet connection.` | `1` |
| Timeout | `The weather service took longer than ... to answer. Try again.` | `1` |

Check the exit code after a command:

```bash
# macOS / Linux / Git Bash
ikirere Kigalli
echo $?
```

```powershell
# Windows PowerShell
ikirere Kigalli
echo $LASTEXITCODE
```

## Configuration

**Units priority:** the `--units` flag, then the `IKIRERE_UNITS` environment variable, then the saved setting (`ikirere config set units ...`), then the default (`metric`).

| Environment variable | Meaning | Default |
|---|---|---|
| `IKIRERE_UNITS` | `metric` or `imperial` | saved setting, then `metric` |
| `IKIRERE_DATA_DIR` | Folder where `data.json` is stored | `~/.ikirere` |
| `IKIRERE_TIMEOUT_MS` | How long to wait for the weather service, in milliseconds | `10000` |

macOS / Linux / Git Bash:

```bash
IKIRERE_UNITS=imperial ikirere Kigali
IKIRERE_DATA_DIR=/tmp/ik ikirere history
IKIRERE_TIMEOUT_MS=20000 ikirere Kigali
```

Windows PowerShell:

```powershell
$env:IKIRERE_UNITS="imperial"
ikirere Kigali
Remove-Item Env:IKIRERE_UNITS
```

### Where data is saved

Favourites, history and settings live in one JSON file, `~/.ikirere/data.json` (on Windows, `C:\Users\<you>\.ikirere\data.json`). It is created automatically on first run.

```json
{
  "favourites": ["Kigali"],
  "history": [{ "city": "Kigali", "type": "current", "at": "2026-11-06T14:01:40.000Z" }],
  "settings": { "units": "metric" }
}
```

## Troubleshooting

- **`ikirere` is not recognised:** close the terminal, open a new one and try again. If it still fails, run `npm link` again.
- **"The weather service took longer than ... to answer":** your connection is slow. Raise the timeout with `IKIRERE_TIMEOUT_MS` (see above).
- **Corrupted data file:** delete `~/.ikirere/data.json` and run any command to recreate it.

## Walkthrough

> Replace each screenshot placeholder with your own screenshot or a terminal recording.

1. **Install.** Clone, run `npm install` and `npm link`, then `ikirere --version`.
   `![install](screenshots/01-install.png)`
2. **Current weather.** Run `ikirere Kigali`. The tool geocodes the city, fetches the weather and prints it.
   `![current](screenshots/02-current.png)`
3. **Forecast.** Run `ikirere forecast Kigali --days 5`.
   `![forecast](screenshots/03-forecast.png)`
4. **Units.** Run `ikirere forecast Kigali --units imperial`, then `ikirere config set units imperial`.
   `![units](screenshots/04-units.png)`
5. **Favourites.** Run `ikirere fav add Kigali`, then `ikirere fav list`.
   `![favourites](screenshots/05-favourites.png)`
6. **History.** Run `ikirere history`.
   `![history](screenshots/06-history.png)`
7. **Errors.** Run `ikirere Kigalli`, then check the exit code.
   `![errors](screenshots/07-errors.png)`

## Project structure

```
ikirere/
├── package.json
├── README.md
├── .gitignore
└── src/
    ├── index.js     entry point (shebang), parses arguments, routes commands
    ├── api.js       geocode() and getForecast(), with a timeout
    ├── storage.js   reads and writes data.json
    ├── format.js    turns API data into readable text
    └── errors.js    CliError class and the single error handler
```

- `"bin"` in `package.json` plus the `#!/usr/bin/env node` first line make `ikirere` a real command.
- `"type": "module"` lets the code use `import` instead of `require`.
- `util.parseArgs` reads flags such as `--days 3` without any library.
- `AbortSignal.timeout()` cancels a request that hangs.
- `os.homedir()` and `path.join()` build the data path safely on any operating system.
- On the first run the data file does not exist, so it is created with defaults.

## License

MIT