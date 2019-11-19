const Discord = require('discord.js');
let token = require('./token.json');
var botconfig = require('./botconfig.json');
const rules = require('./rules.json');
const fuzz = require('fuzzball');

// Create an instance of a Discord client
const client = new Discord.Client();

function replaceWithDots(str) {
    return str.replace(/\{1\}/g, "\u2022")
            .replace(/\{2\}/g, "\u2022\u2022")
            .replace(/\{3\}/g, "\u2022\u2022\u2022")
            .replace(/\{4\}/g, "\u2022\u2022\u2022\u2022")
            .replace(/\{5\}/g, "\u2022\u2022\u2022\u2022\u2022");
}

function exitHandler(options, exitCode) {
    if (options.cleanup) {
        console.log('cleaning up');
    }
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

// Prevent the program from closing instantly
process.stdin.resume();

// Do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));

// Catch ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

// Catch "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit: true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit: true}));

// Catch uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));


// The ready event is vital, it means that only _after_ this will your bot
// start reacting to information received form Discord
client.on('ready', () => {
  console.log('I am ready!');
});

client.on('message', message => {

    // Ignore messages from bots and private messages
    if (message.author.bot) return;
    if (message.channel.type === 'dm') return;

    let cmd = message.content;
    let args = cmd.split(' ');
    let command = args.shift();

    if (command.startsWith(botconfig.prefix))
    {
        command = command.substr(1);
        switch(command)
        {
            case 'merit':
                let merit = lookupMerit(args);

                if (merit) {
                    
                    let title = merit.name + ' (';
                    let first = true;
                    merit.dots.forEach(dot => {
                        if (first) first = false;
                        else title += ', ';
                        if (Number.isInteger(dot)) {
                            for (let i = 0; i < dot; ++i)
                            title += '\u2022';
                        } else {
                            title += dot;
                        }
                    });
                    title += ')';

                    let embed = new Discord.RichEmbed()
                        .setTitle(title);
                    
                    if ('type' in merit && merit.type.length > 0) {
                        embed.addField('Type', merit.type);
                    }

                    if ('prerequisites' in merit && merit.prerequisites.length > 0) {
                        embed.addField('Prerequisites', replaceWithDots(merit.prerequisites));
                    }

                    if ('effect' in merit) {
                        let effect = replaceWithDots(merit.effect.join('\n'));
                        if (effect.length > 0)
                            embed.setDescription(effect);
                    }

                    if ('drawback' in merit) {
                        let drawback = replaceWithDots(merit.drawback.join('\n'));
                        if (drawback.length > 0)
                            embed.addField('Drawback', drawback);
                    }

                    if ('source' in merit && merit.source.length > 0) {
                        embed.addField('Source', merit.source);
                    }

                    message.channel.send(embed);
                }

            break;
        }
    }
});

function lookupMerit(args) {
    let str = args.join(' ').toLowerCase();
    let match = null;
    let matchScore = 0;

    rules['merits'].forEach(rule => {
        let score = fuzz.ratio(rule['name'].toLowerCase(), str)
        if (score >= botconfig.minscore && score > matchScore)
        {
            matchScore = score;
            match = rule;
        }
    });

    return match;
}

// Invite URL: https://discordapp.com/oauth2/authorize?&client_id=608428138690510848&scope=bot&permissions=0
// Log our bot in using the token from https://discordapp.com/developers/applications/me
client.login(token.token);
