require('dotenv').config();

// Environment variable used for keys.
const prefix = process.env.PREFIX;

module.exports = (Discord, client, message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const cmd = args.shift().toLowerCase();

    const command = client.commands.get(cmd) || client.commands.find(a => a.aliases && a.aliases.includes(cmd));

    try {
        if (command) {
            command.execute(message, args, cmd, client, Discord);
        } else {
            message.reply('❌ | You need to enter a valid command!')
        }
    }
    catch (error) {
        message.reply("There was an error trying to execute this command!");
        console.log(error);
    }
}