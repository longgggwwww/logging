import { CONFIG } from './config';
import { LogData } from './types';
import { Client, TextChannel, ChannelType } from 'discord.js';

let discordClient: Client;

export const setDiscordClient = (client: Client) => {
  discordClient = client;
};

export const processMessage = async ({
  topic: _topic,
  partition: _partition,
  message,
}: {
  topic: string;
  partition: number;
  message: any;
}): Promise<void> => {
  let logData: LogData = {};
  let attemptCount = 0;

  try {
    // Parse message
    const rawMessage = message.value.toString();
    logData = JSON.parse(rawMessage);

    // Check if this is a retry message
    if (logData._retry) {
      attemptCount = logData._retry.attemptCount || 0;
      console.log(`🔄 Processing retry message (attempt ${attemptCount})`);
    }

    // Validate message structure
    if (!logData.projectName) {
      console.warn('⚠️  Warning: Message missing "projectName" field');
      return;
    }

    const projectName = logData.projectName;
    console.log(`📨 Processing message for project: ${projectName}`);

    // Get or create channel
    const channel = await getOrCreateChannel(projectName);

    if (!channel) {
      console.error(`❌ Failed to get or create channel for ${projectName}`);
      return;
    }

    // Send message to channel
    await sendMessageToChannel(channel, logData);

    console.log(`✅ Message sent to channel: ${channel.name}`);
  } catch (error: any) {
    console.error('❌ Error processing message:', error);
    // For now, just log. In production, might want to send to DLQ
  }
};

const getOrCreateChannel = async (
  projectName: string
): Promise<TextChannel | null> => {
  if (!discordClient || !CONFIG.discord.guildId) {
    console.error('❌ Discord client or guild ID not set');
    return null;
  }

  const guild = discordClient.guilds.cache.get(CONFIG.discord.guildId);
  if (!guild) {
    console.error(`❌ Guild ${CONFIG.discord.guildId} not found`);
    return null;
  }

  // Check if channel already exists
  let channel = guild.channels.cache.find(
    (ch) => ch.name === projectName && ch.type === ChannelType.GuildText
  ) as TextChannel;

  if (channel) {
    return channel;
  }

  // Create new channel
  try {
    channel = await guild.channels.create({
      name: projectName,
      type: ChannelType.GuildText,
      reason: `Channel for project ${projectName} logs`,
    });
    console.log(`🆕 Created new channel: ${channel.name}`);
    return channel;
  } catch (error) {
    console.error('❌ Error creating channel:', error);
    return null;
  }
};

const sendMessageToChannel = async (
  channel: TextChannel,
  logData: LogData
): Promise<void> => {
  // Format message similar to webhook
  const embed = {
    title: `${logData.type || 'LOG'} - ${logData.projectName}`,
    description:
      logData.consoleLog || logData.response?.message || 'No message',
    color: getColorForType(logData.type),
    fields: [
      {
        name: 'Function',
        value: logData.function || 'N/A',
        inline: true,
      },
      {
        name: 'Method',
        value: logData.method || 'N/A',
        inline: true,
      },
      {
        name: 'Created By',
        value: logData.createdBy?.fullname || 'N/A',
        inline: true,
      },
      {
        name: 'URL',
        value: logData.request?.url || 'N/A',
        inline: false,
      },
    ],
    timestamp: logData.createdAt,
  };

  try {
    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Error sending message to channel:', error);
  }
};

const getColorForType = (type?: string): number => {
  const typeColors: Record<string, number> = {
    ERROR: 0xff0000, // Red
    WARNING: 0xffa500, // Orange
    INFO: 0x0099ff, // Blue
    SUCCESS: 0x00ff00, // Green
    DEBUG: 0x808080, // Gray
  };
  return typeColors[type || 'INFO'] || 0x0099ff;
};
