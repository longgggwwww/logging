import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
} from 'discord.js';
import { conf } from '../config.js';
import { producer } from '../kafka.js';
import { testMessages } from '../messages/messages.js';

export const data = new SlashCommandBuilder()
  .setName('log')
  .setDescription('Send log messages to Kafka for testing')
  .addIntegerOption((option) =>
    option
      .setName('data_sample')
      .setDescription('Select data sample (0)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(20)
  )
  .addIntegerOption((option) =>
    option
      .setName('count')
      .setDescription('Number of log messages to send (1-20)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(20)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const dataSample = interaction.options.getInteger('data_sample', true);
  const count = interaction.options.getInteger('count', true);

  // Defer reply because sending messages may take time
  await interaction.deferReply();

  try {
    // Get messages to send
    const messagesToSend = testMessages.slice(0, count);

    // Prepare batch messages with _isTest flag
    const kafkaMessages = messagesToSend.map((message) => ({
      value: JSON.stringify({
        ...message,
        _isTest: true,
      }),
    }));

    // Send messages to Kafka (producer is already connected in bot.ts)
    await producer.send({
      topic: conf.topics.main,
      messages: kafkaMessages,
    });

    console.log(`✅ Sent ${count} log messages to Kafka topic: ${conf.topics.main}`);

    // Create success embed message
    const successEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Successfully sent log messages')
      .addFields(
        { name: 'Data Sample', value: `Sample ${dataSample}`, inline: true },
        { name: 'Count', value: `${count} messages`, inline: true },
        { name: 'Topic', value: conf.topics.main, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('❌ Error sending log messages:', error);

    const errorEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('❌ Error sending log messages')
      .setDescription(error instanceof Error ? error.message : 'Unknown error')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
