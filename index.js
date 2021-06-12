const Discord = require("discord.js");
const client = new Discord.Client({partials: ["MESSAGE", "CHANNEL", "REACTION"]});

const ytdl = require('ytdl-core');

const fs = require('fs');

require('dotenv').config();

// Environment variable used for keys.
const prefix = process.env.PREFIX;
const token = process.env.DISCORD_BOT_TOKEN;
const youtubeAPIKey = process.env.YOUTUBE_API_KEY;

client.commands = new Discord.Collection();
client.events = new Discord.Collection();

['command_handler', 'event_handler'].forEach(handler => {
    require(`./handlers/${handler}`)(client, Discord)
});

// const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
// for (const file of commandFiles) {
//     const command = require(`./commands/${file}`);

//     client.commands.set(command.name, command);
// }

// client.once('ready', () => {
//     console.log('Hent-AI-chaN is online!')
// })

// client.on('message', message => {
//     // if no prefix is provided or if the message was originated from the bot, return nothing to stop the action.
//     if (!message.content.startsWith(prefix) || message.author.bot) return;

//     const args = message.content.slice(prefix.length).split(/ +/);
//     const command = args.shift().toLowerCase();

//     if (command === 'ping') {
//         client.commands.get('ping').execute(message, args, client);
//     }
//     else if (command == 'play') {
//         client.commands.get('play').execute(message, args, client);
//     } 
//     else if (command == 'leave') {
//         client.commands.get('leave').execute(message, args, client);
//     }
// })

client.login(token);
