import https from 'https';
import http from 'http';

/**
 * Send a message to Discord webhook
 * @param {string} webhookUrl - Discord webhook URL
 * @param {object} data - Message data
 * @returns {Promise<boolean>} - Success status
 */
export const sendDiscordWebhook = async (webhookUrl, data) => {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  try {
    const url = new URL(webhookUrl);
    const payload = JSON.stringify(data);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(true);
          } else {
            console.error('Discord webhook error:', res.statusCode, responseData);
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        console.error('Discord webhook request error:', error);
        resolve(false);
      });

      req.write(payload);
      req.end();
    });
  } catch (error) {
    console.error('Discord webhook error:', error);
    return false;
  }
};

/**
 * Post new event to Discord
 * @param {string} webhookUrl - Discord webhook URL
 * @param {object} event - Event details
 * @param {object} organizer - Organizer details
 * @returns {Promise<boolean>} - Success status
 */
export const postEventToDiscord = async (webhookUrl, event, organizer) => {
  const embed = {
    title: `🎉 New Event: ${event.eventName || event.title}`,
    description: event.eventDescription || event.description,
    color: 0x3498db, // Blue color
    fields: [
      {
        name: '📅 Event Date',
        value: new Date(event.eventStartDate || event.startDate).toLocaleString(),
        inline: true
      },
      {
        name: '🎫 Event Type',
        value: event.eventType,
        inline: true
      },
      {
        name: '👥 Eligibility',
        value: event.eligibility,
        inline: true
      },
      {
        name: '💰 Registration Fee',
        value: `₹${event.registrationFee || event.price || 0}`,
        inline: true
      },
      {
        name: '⏰ Registration Deadline',
        value: new Date(event.registrationDeadline).toLocaleString(),
        inline: true
      },
      {
        name: '📍 Venue',
        value: event.venue || 'TBD',
        inline: true
      }
    ],
    footer: {
      text: `Organized by ${organizer.organizerName || organizer.clubName}`
    },
    timestamp: new Date().toISOString()
  };

  // Add registration limit if specified
  if (event.registrationLimit || event.maxParticipants) {
    embed.fields.push({
      name: '👤 Registration Limit',
      value: String(event.registrationLimit || event.maxParticipants),
      inline: true
    });
  }

  // Add image if available
  if (event.imageUrl) {
    embed.thumbnail = {
      url: event.imageUrl
    };
  }

  const message = {
    username: 'Event Management System',
    embeds: [embed]
  };

  return await sendDiscordWebhook(webhookUrl, message);
};

/**
 * Post event update to Discord
 * @param {string} webhookUrl - Discord webhook URL
 * @param {object} event - Event details
 * @param {string} updateMessage - Update message
 * @returns {Promise<boolean>} - Success status
 */
export const postEventUpdateToDiscord = async (webhookUrl, event, updateMessage) => {
  const embed = {
    title: `📢 Event Update: ${event.eventName || event.title}`,
    description: updateMessage,
    color: 0xf39c12, // Orange color
    timestamp: new Date().toISOString()
  };

  const message = {
    username: 'Event Management System',
    embeds: [embed]
  };

  return await sendDiscordWebhook(webhookUrl, message);
};
