# Discord Bot

This project is a simple Discord bot built with TypeScript. It serves as a template for creating your own Discord bots with a modular structure, allowing for easy command and event management.

## Features

- Command handling with Discord slash commands
- Event handling
- Kafka integration for consuming and producing log messages
- TypeScript support
- ESLint and Prettier for code quality and formatting
- Test command for sending mock data to Kafka

## Project Structure

```
discord-bot
├── src
│   ├── bot.ts               # Entry point of the bot
│   ├── commands             # Directory for command handlers
│   │   ├── index.ts         # Command registration and handling
│   │   ├── ping.ts          # Ping command handler
│   │   └── log.ts           # Log command for sending mock data
│   ├── events               # Directory for event handlers
│   │   └── ready.ts         # Ready event handler
│   ├── messages             # Mock log messages for testing
│   │   ├── 0.ts - 19.ts     # Individual message files
│   │   └── messages.ts      # Message exports
│   ├── types                # Directory for custom types
│   │   └── index.ts         # Custom types and interfaces
│   ├── config.ts            # Configuration
│   ├── kafka.ts             # Kafka consumer and producer
│   ├── processor.ts         # Message processing logic
│   └── types.ts             # Type definitions
├── .eslintrc.js             # ESLint configuration
├── .prettierrc              # Prettier configuration
├── package.json             # npm configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project documentation
```

## Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```
   cd discord-bot
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Usage

Before running the bot, set up your environment variables:

1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```

2. Update the `.env` file with your Discord bot credentials:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `DISCORD_CLIENT_ID`: Your Discord application client ID
   - `DISCORD_GUILD_ID`: Your Discord server (guild) ID
   - Configure Kafka settings if needed

To start the bot, run:

```
npm start
```

Or for development with auto-reload:

```
npm run dev
```

## Available Commands

The bot supports the following slash commands:

### `/ping`
Simple health check command that responds with "Pong!"

### `/log`
Send log messages to Kafka for testing the logging pipeline.

**Options:**
- `sample` (required): Choose data sample (currently only Sample 0 - E-commerce Platform)
- `count` (required): Number of messages to send (1-20)

**Example:**
```
/log sample:0 count:5
```

This will send 5 log messages to the configured Kafka topic.

## Contributing

Feel free to submit issues or pull requests to improve the bot or add new features.

## License

This project is licensed under the MIT License.
