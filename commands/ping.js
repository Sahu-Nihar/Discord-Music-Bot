module.exports = {
    name: 'ping',
    description: "this is a ping command!",
    execute(message, args, cmd, client, Discord) {
        message.reply(`${client.ws.ping}ms`);
    }
}