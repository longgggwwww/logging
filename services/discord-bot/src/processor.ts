import { CONFIG } from './config.js';
import { LogMessage } from './types.js';
import { Client, TextChannel, ChannelType, CategoryChannel } from 'discord.js';

let discordClient: Client;
let generalChannelCache: TextChannel | null = null;

export const setDiscordClient = (client: Client) => {
  discordClient = client;
  generalChannelCache = null; // Reset cache when client changes
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
  let logData: LogMessage;
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
    if (!logData.project) {
      console.warn('⚠️  Warning: Message missing "projectName" field');
      return;
    }

    const project = logData.project;
    console.log(`📨 Processing message for project: ${project}`);

    // Get or create channel
    const channel = await getOrCreateChannel(project);

    if (!channel) {
      console.error(`❌ Failed to get or create channel for ${project}`);
      return;
    }

    // Send message to channel
    await sendMessageToChannel(channel, logData);

    console.log(`✅ Message sent to channel: ${channel.name}`);

    // Check if message should also be sent to general channel
    if (shouldSendToGeneralChannel(logData)) {
      const generalChannel = await getOrCreateGeneralChannel();
      if (generalChannel) {
        await sendMessageToChannel(generalChannel, logData);
        console.log(`✅ Message also sent to general channel: ${generalChannel.name}`);
      }
    }
  } catch (error: any) {
    console.error('❌ Error processing message:', error);
    // For now, just log. In production, might want to send to DLQ
  }
};

const getOrCreateCategory = async (
  guild: any
): Promise<CategoryChannel | null> => {
  const categoryName = 'Projects';

  // Check if category already exists
  let category = guild.channels.cache.find(
    (ch: any) => ch.name === categoryName && ch.type === ChannelType.GuildCategory
  ) as CategoryChannel;

  if (category) {
    return category;
  }

  // Create new category
  try {
    category = await guild.channels.create({
      name: categoryName,
      type: ChannelType.GuildCategory,
      reason: 'Category for project log channels',
    });
    console.log(`🆕 Created new category: ${category.name}`);
    return category;
  } catch (error) {
    console.error('❌ Error creating category:', error);
    return null;
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

  // Get or create category first
  const category = await getOrCreateCategory(guild);
  if (!category) {
    console.error('❌ Failed to get or create category');
    return null;
  }

  // Check if channel already exists
  let channel = guild.channels.cache.find(
    (ch) => ch.name === projectName && ch.type === ChannelType.GuildText
  ) as TextChannel;

  if (channel) {
    // Move channel to category if not already there
    if (channel.parentId !== category.id) {
      try {
        await channel.setParent(category.id, {
          reason: `Moving ${projectName} to category ${category.name}`,
        });
        console.log(`📁 Moved channel ${channel.name} to category: ${category.name}`);
      } catch (error) {
        console.error('❌ Error moving channel to category:', error);
      }
    }
    return channel;
  }

  // Create new channel
  try {
    channel = await guild.channels.create({
      name: projectName,
      type: ChannelType.GuildText,
      parent: category.id,
      reason: `Channel for project ${projectName} logs`,
    });
    console.log(`🆕 Created new channel: ${channel.name} in category: ${category.name}`);
    return channel;
  } catch (error) {
    console.error('❌ Error creating channel:', error);
    return null;
  }
};

const sendMessageToChannel = async (
  channel: TextChannel,
  logData: LogMessage
): Promise<void> => {
  // Format message similar to webhook
  const embed = {
    title: `${logData.type || 'LOG'} - ${logData.project}`,
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

const shouldSendToGeneralChannel = (logData: LogMessage): boolean => {
  const { generalChannelFilter } = CONFIG.discord;
  
  if (!generalChannelFilter.enabled) {
    return false;
  }

  // Check if message type is in critical types
  const isCriticalType = generalChannelFilter.criticalTypes.includes(
    logData.type || ''
  );

  // Check if severity code meets minimum
  const meetsMinSeverity = logData.response?.code >= generalChannelFilter.minSeverityCode;

  return isCriticalType || meetsMinSeverity;
};

const getOrCreateGeneralChannel = async (): Promise<TextChannel | null> => {
  // Return cached channel if available and still valid
  if (generalChannelCache) {
    try {
      // Verify channel still exists
      await generalChannelCache.fetch();
      return generalChannelCache;
    } catch (error) {
      console.warn('⚠️  Cached general channel no longer valid, will recreate');
      generalChannelCache = null;
    }
  }

  if (!discordClient || !CONFIG.discord.guildId) {
    console.error('❌ Discord client or guild ID not set');
    return null;
  }

  const guild = discordClient.guilds.cache.get(CONFIG.discord.guildId);
  if (!guild) {
    console.error(`❌ Guild ${CONFIG.discord.guildId} not found`);
    return null;
  }

  const channelName = 'general-logs';

  // Fetch all channels to ensure we have the latest data
  await guild.channels.fetch();

  // Get Projects category ID to exclude channels in it
  const projectsCategory = guild.channels.cache.find(
    (c) => c.name === 'Projects' && c.type === ChannelType.GuildCategory
  ) as CategoryChannel | undefined;

  // Find existing general channel (not in Projects category)
  let channel = guild.channels.cache.find((ch) => {
    return (
      ch.name === channelName &&
      ch.type === ChannelType.GuildText &&
      ch.parentId !== projectsCategory?.id
    );
  }) as TextChannel | undefined;

  if (channel) {
    generalChannelCache = channel; // Cache the found channel
    return channel;
  }

  // Double-check by fetching again before creating
  await guild.channels.fetch();
  channel = guild.channels.cache.find((ch) => {
    return (
      ch.name === channelName &&
      ch.type === ChannelType.GuildText &&
      ch.parentId !== projectsCategory?.id
    );
  }) as TextChannel | undefined;

  if (channel) {
    generalChannelCache = channel; // Cache the found channel
    return channel;
  }

  // Create new general channel (without category)
  try {
    channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      topic: 'General log channel for warnings and errors from all projects',
      reason: 'Channel for general warning and error logs',
    });
    console.log(`🆕 Created new general channel: ${channel.name}`);
    generalChannelCache = channel; // Cache the newly created channel
    return channel;
  } catch (error) {
    console.error('❌ Error creating general channel:', error);
    return null;
  }
};
