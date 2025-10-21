import { CommandInteraction } from 'discord.js';

export const pingCommand = {
    name: 'ping',
    description: 'Responds with Pong!',
    execute(interaction: CommandInteraction) {
        interaction.reply('Pong!');
    },
};