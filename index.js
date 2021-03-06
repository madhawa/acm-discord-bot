const Discord = require('discord.js');
const https = require('https');
const axios = require('axios');
const isJSON = require('is-valid-json');
const config = require('./config.json');

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// require('https').globalAgent.options.ca = require('ssl-root-cas/latest').create();

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

const delay = (msec) => new Promise((resolve) => setTimeout(resolve, msec));

const client = new Discord.Client();
const prefix = config.prefix;

const trim = (str, max) => (str.length > max) ? `${str.slice(0, max - 3)}...` : str;

const prepareData = (command, data) => {
    switch(command) {
      case 'price': {
         return `
**initial:**   ${data.initialprice}
**price:**     ${data.price}
**high:**      ${data.high}
**low:**       ${data.low}
**volume:**    ${data.volume}
**bid:**       ${data.bid}
**ask:**       ${data.ask}
`;
      }
      case 'fiatprice': {
         return `
**USD:** ${data.USD}
**EUR:** ${data.EUR}
**GBP:** ${data.GBP}
`;
      }
      case 'supply': {
        return `
**${data.total.toLocaleString()}** coins
`;
      }
      case 'marketcap': {
        return `
**$**${data.USD.toLocaleString()}
`;
      }
      case 'hashrate': {
        const rounded = Math.round(data.gh * 100) / 100;
        return `
        ${rounded}GH
`;
      }
      case 'difficulty': {
        return `
${data.difficulty}
`;
      }
      case 'networkinfo': {
return `
**VERSION:** ${data.version}
**SUBVERSION:** ${data.subversion}
**PROTOCOL:** ${data.protocolversion}
`;
      }
      case 'bestblockhash': {
return `${data.hash}`;
      }
      case 'block': {
      data = data.block;
return `
**Hash:** ${data.hash}
**Confirmations:** ${data.confirmations}
**Stripped size:** ${data.strippedsize}
**Size:** ${data.size}
**Weight:** ${data.weight}
**Height:** ${data.height}
**Version:** ${data.version}
**Version hex:** ${data.versionHex}
**Merkle root:** ${data.merkleroot}
**Tx:**: ${data.tx[0]}
**Time:** ${data.time}
**Median time:** ${data.mediantime}
**Nonce:** ${data.nonce}
**Bits:** ${data.bits}
**Difficulty:** ${data.difficulty}
**Chainwork:** ${data.chainwork}
**Previous blockhash:** ${data.previousblockhash}
**Next blockhash:** ${data.nextblockhash}
`;
      }
      case 'blockcount': {
return `${data.blockcount}`;
      }
      case 'acminfo': {
return `
*!price*: get BTC Price in satoshis
*!fiatprice*: get $, €, and £ price
*!supply*: get amount of mined ACMs
*!marketcap*: get marketcap in USD
*!hashrate*: get current hashrate in GH
*!difficulty*: get current difficulty
*!networkinfo*: get network info from bot's node
*!bestblockhash*: get hash of the latest block
*!blockcount*: get amount of currently mined blocks
*!block blockhash*: get details from given block
`;
      }
      default:
       return JSON.stringify(data);
    }
};

client.on('ready', () => {
	console.log('Actinium Bot is ready!');
});

client.on('message', async (message) => {
        // console.log(`Received message: ${message}`);
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();

	if (!args.length && !command.startsWith('acm')) {
             try {
                const response = await instance.get(`https://api.actinium.org/v1/acm/${command}`);
                if (isJSON(response.data)) {
                   const data = prepareData(command, response.data);
                   await message.channel.send(data);
                } else {
                   await message.channel.send(JSON.stringify("{error: \"incorrect command\"}"));
                }
             } catch (error) {
                console.log(error);
                await message.channel.send(`Could not process command: ${command}`);
             }
        } else if (command === 'acminfo' || command == 'acmhelp') {
           const info = prepareData('acminfo', null);
           await message.channel.send(info);
        } else if (command === 'block') {
           if (!args.length) {
               await message.channel.send('You need to supply a block hash!');
           } else {
              const response = await instance.get(`https://api.actinium.org/v1/acm/${command}?hash=${args[0]}`);
              const data = prepareData(command, response.data);
	      await message.channel.send(data);
           }
	} else {
            await message.channel.send("Hello, I am Actinium Bot");
        }
});

client.login(config.token);
