# Discord Bot

This project is a simple Discord bot built with TypeScript. It serves as a template for creating your own Discord bots with a modular structure, allowing for easy command and event management.

## Features

- Command handling
- Event handling
- TypeScript support
- ESLint and Prettier for code quality and formatting

## Project Structure

```
discord-bot
├── src
│   ├── bot.ts               # Entry point of the bot
│   ├── commands             # Directory for command handlers
│   │   └── ping.ts          # Ping command handler
│   ├── events               # Directory for event handlers
│   │   └── ready.ts         # Ready event handler
│   └── types                # Directory for custom types
│       └── index.ts         # Custom types and interfaces
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

To start the bot, run the following command:

```
npm start
```

Make sure to set up your Discord bot token in the environment variables or directly in the code before running the bot.

## Contributing

Feel free to submit issues or pull requests to improve the bot or add new features.

## License

This project is licensed under the MIT License.
