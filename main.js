const Discord = require("discord.js");
const fs = require('fs')
////#endregion
const serverData = new Map();
var token;


const guildDataDef = {
    textChannel: null,
    voiceChannel: null,
    members: [],
    admin: -1,
    message: -1
};

function importSettings(file) {
    fs.readFile(file, 'utf8', (err, data) => {
        var tree = JSON.parse(data);

        token = tree.token;

        for (var guild of tree.servers) {
            let guildSettings = tree.formats[guild.format];
            serverData[guild.id] = [guildDataDef, guildSettings];
        }
        init();
    });



    //dSet(guildID, guildPrefab);
}
importSettings("./config.json");
console.log("loaded config");

//static objects
const client = new Discord.Client();


//#region EventHandlers
client.once("ready", () => {
    console.log('ready');
});

client.once("reconnecting", () => {
    console.log("Reconnecting...");
});


client.once("disconnect", () => {
    console.log("Disconnect!");
});

client.on("error", (e) => {
    console.log(e);
});

//#endregion
function init() {
    client.login(token);
}

var include = "🌮";
var admin = "🍕";
var messagetext = "AMONGUS";

client.on("message", async (message) => {
    console.log('message sent');
    if (message.content == messagetext) {
        message.react(include);
        message.react(admin);
    }
});


client.on("messageReactionAdd", async (messagereation, user) => {

    if (user.bot)
        return;

    if (messagereation.message.content == messagetext) {
        var dataP = serverData[messagereation.message.guild.id];
        var data = dataP[0]
        console.log('among us reaction');
        data.message = messagereation.message.id;
        var tchannel = messagereation.message.channel;

        var channels = messagereation.message.guild.channels.cache.filter(c => c.type == "voice" && c.members.filter(u => u.id == user.id).size > 0);

        if (channels.size == 0) { //if user not in channel
            tchannel.send("you are not in a channel");
            return;
        }
        let c = channels.array()[0];

        if (data.voiceChannel != null && c.id != data.voiceChannel) { //if channel is not null and not equal to vc saved
            return;
        }
        if (data.voiceChannel == null) {
            data.voiceChannel = c.id;
            console.log('voice channel set');
        }
        if (data.textChannel == null) {
            data.textChannel = messagereation.message.id;
            console.log('text channel set');
        }

        if (messagereation.emoji.name == include) {
            data.members.push(user.id);
            console.log('added ' + user.username + " to memberlist");
        } else if (messagereation.emoji.name == admin) {
            data.admin = user.id;
            tchannel.send(user.username + " is set as admin");
            console.log('added ' + user.username + " as admin");
        }
    }
});

client.on("messageReactionRemove", async (messagereation, user) => {
    var dataP = serverData[messagereation.message.guild.id];
    var data = dataP[0]
    if (messagereation.message.content == messagetext) {
        if (messagereation.emoji.name == include) {
            data.members.splice(data.members.findIndex(x => x == user.id));
            console.log('removed ' + user.username + " from memberlist");
        } else if (messagereation.emoji.name == admin) {
            data.admin = -1;
            console.log('admin [' + user.username + "] left");
        }
    }
});

client.on("voiceStateUpdate", async (oldMember, newMember) => {
    let oldUserChannel = oldMember.channel;
    let newUserChannel = newMember.channel;

    const guildID = oldMember.guild.id;
    let sData = serverData[guildID];
    let data = sData[0];
    if (data == undefined)
        return;

    var userid = newMember.member.id;

    var type = 0;
    if (newUserChannel === null) //user left
        type = -1;
    else if (oldUserChannel === null) //user joined
        type = 1;

    if (type == -1)
        return;

    var muted = newMember.selfMute;
    


    if (userid == data.admin) { //admin and user deafened
        var users = newUserChannel.guild.channels.cache.find(x=>x.id == data.voiceChannel).members.filter(u=>data.members.includes(u.id) && u.id!=data.admin);
        if (muted) {
            users.each((user)=>{
                user.voice.setDeaf(true);
                user.voice.setMute(true);
            });
            console.log('deafened all');
        } else {
            users.each((user)=>{
                user.voice.setDeaf(false);
                user.voice.setMute(false);
            });
            console.log('undeafened all');
        }
    }
});