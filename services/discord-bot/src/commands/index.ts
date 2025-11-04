import { Client, Collection, REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import * as pingCommand from './ping.js';
import * as logCommand from './log.js';

dotenv.config();

export interface Command {
  data: any;
  execute: (interaction: any) => Promise<void>;
}

const commands: Command[] = [pingCommand, logCommand];

export async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(
    process.env.DISCORD_TOKEN || ''
  );

  const commandsData = commands.map((cmd) => cmd.data.toJSON());

  try {
    console.log('🗑️  Clearing global application commands...');
    
    // Clear global commands first
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID || ''),
      { body: [] }
    );
    
    console.log('✅ Successfully cleared global commands.');
    console.log('📝 Started refreshing guild application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID || '',
        process.env.DISCORD_GUILD_ID || ''
      ),
      { body: commandsData }
    );

    console.log('✅ Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

export function setupCommandHandlers(client: Client) {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.find(
      (cmd) => cmd.data.name === interaction.commandName
    );

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('❌ Error executing command:', error);
      const errorMessage = {
        content: 'There was an error while executing this command!',
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  });
}
