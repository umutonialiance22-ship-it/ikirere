// A custom error for problems we EXPECT (bad input, city not found, network down).
// It carries a friendly message and the exit code to use.
export class CliError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
  }
}

// One place that prints errors and exits. No stack traces for the user.
export function handleError(err) {
  if (err instanceof CliError) {
    console.error(`Error: ${err.message}`);
    process.exit(err.exitCode);
  }
  // Anything else is a bug in our code, still show a short message.
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
}
