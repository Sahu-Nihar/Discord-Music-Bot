const Discord = require("discord.js");
const ytdl = require("ytdl-core");

// const { prefix, token, youtubeAPIKey } = require("./config.json");
require('dotenv').config();

// Environment variable used for keys.
const prefix = process.env.PREFIX;
const token = process.env.DISCORD_BOT_TOKEN;
const youtubeAPIKey = process.env.YOUTUBE_API_KEY;

const Youtube = require('simple-youtube-api');
const youtube = new Youtube(youtubeAPIKey);

const client = new Discord.Client();

const queue = new Map();

client.once("ready", () => {
    console.log("Ready!");
});

client.once("reconnecting", () => {
    console.log("Reconnecting!");
});

client.once("disconnect", () => {
    console.log("Disconnect!");
});

client.on("message", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith(`${prefix}play`)) {
        await execute(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
        stop(message, serverQueue);
        return;
    } else {
        message.channel.send("You need to enter a valid command!");
    }
});

async function playByName(searchQueryByName, voiceChannel) {
    try {
        console.log('Searched query by name:', searchQueryByName);

        const videos = await youtube.searchVideos(searchQueryByName, 5);

        console.log('List of all videos searched:', videos);

        if (videos.length == 0) {
            return {
                success: false,
                message: 'Searched name returned empty list, No song found!'
            }
        }

        var video = await youtube.getVideoByID(videos[0].id);

        const url = `https://www.youtube.com/watch?v=${video.raw.id}`;
        const title = video.title;
        const thumbnail = video.thumbnails.high.url;
        const song2 = {
            url,
            title,
            thumbnail,
            voiceChannel
        };

        const songInfo2 = await ytdl.getInfo(song2.url);
        const song = {
            title: songInfo2.videoDetails.title,
            url: songInfo2.videoDetails.video_url,
        };

        return {
            success: true,
            message: `Found song successfully!`,
            data: song
        }
    }
    catch (error) {
        console.log('Error:', error);
        return {
            success: false,
            message: error
        }
    }
}

async function playByUrl (searchQueryByUrl) {
    const songInfo = await ytdl.getInfo(searchQueryByUrl);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
    };
    return song;
}

async function execute(message, serverQueue) {
    const args = message.content.split(" ");

    console.log('Args returned:', args);

    const nameOrUrl = args.slice(1).join(" ")

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
            "You need to be in a voice channel to play music!"
        );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(
            "I need the permissions to join and speak in your voice channel!"
        );
    }

    let songObject = {};

    // * Check if song is searched via url, return song object for url.
    if (nameOrUrl.match(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/)){
        songObject = await playByUrl(nameOrUrl);
    }
    // * check if song is searched via name, return song object for name.
    else {
        let playSongByNameResponse = await playByName(nameOrUrl, voiceChannel);
        if (playSongByNameResponse.success == false) {
            console.log("*******playSongByNameResponse*******",playSongByNameResponse);
            return message.channel.send(playSongByNameResponse.message);
        }
        songObject = playSongByNameResponse.data;
    }

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(songObject);

        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        serverQueue.songs.push(songObject);
        return message.channel.send(`${songObject.title} has been added to the queue!`);
    }
}

function skip(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
            "You have to be in a voice channel to stop the music!"
        );
    if (!serverQueue)
        return message.channel.send("There is no song that I could skip!");
    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
            "You have to be in a voice channel to stop the music!"
        );

    if (!serverQueue)
        return message.channel.send("There is no song that I could stop!");

    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

client.login(token);
