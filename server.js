const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cheerio = require('cheerio');
const superagent = require('superagent');
const request = require('request');
const fs = require('fs');
const items = require('./models/items');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const bits = '<:bits:609743797475344385>';
const webhook = new Discord.WebhookClient();
const webhook3 = new Discord.WebhookClient();
const webhook4 = new Discord.WebhookClient();
const webhook5 = new Discord.WebhookClient();
const webhook6 = new Discord.WebhookClient()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
mongoose.connect(process.env.mongodb, {useNewUrlParser: true})

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
  response.sendStatus(200)
});

const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

async function getItems() {
try {
let {body} = await superagent
.get('https://www.brickplanet.com/web-api/store/get-recent-items')
return body
} catch (err) {
 return [] 
}
}

let cache = [];

async function getUniques () {
 const itemss = await getItems()
 if (!itemss.length) return;
 let it = itemss.filter(x => x.IsUnique == 1)
 if (!cache.length) {
 cache = []
 it.forEach(item => cache.push(item.ID))
 }
 it.forEach(item => {
 if (!cache.includes(item.ID)) {
 cache.push(item.ID)
 let newUnique = new items({id: item.ID})
 newUnique.save()
 }
 });
}


function* infinite(arr) {
let i = 0;
while (true) {
yield arr[i];
i = (i + 1) % arr.length;
}
}

(async () => {
const array = await items.find().sort({id: 'desc'});
const endpoints = infinite(array)
setInterval(async () => {
const current = endpoints.next();
await request(`https://www.brickplanet.com/store/${current.value.id}/`, (err, res, body) => {
    if (err) console.error(err) 
    if (!body) return;
    const $ = cheerio.load(body)
    const gprice = $('div.text-center')
    const price = gprice.find('a.buy-button-bits-sm').attr('value')
    if (!price) return
    if (price <= 45) {
    const gitem = $('h2.view-item-name')
    const item = gitem.find('span').text()
    const thumbmail = $('img.img-responsive')
    const thumb = thumbmail.attr('src')
    const seller = gprice.find('a.buy-button-bits-sm').attr('seller-name')
    const guthumb = $('div.item-unique-seller-avatar')
    const uthumb = guthumb.attr('style').slice(21, -24)
    const guthumbl = gprice.find('a.buy-button-bits-sm').next()
    const uthumbl = guthumbl.attr('href')
    const embed = new Discord.RichEmbed()
    .setColor('RANDOM')
    .setAuthor(seller, uthumb, 'https://www.brickplanet.com' + uthumbl)
    .setURL('https://www.brickplanet.com/store/' + current.value.id + '/')
    .setTitle(item)
    .setThumbnail(thumb)
    .setTimestamp()
    .setDescription(bits + ' ' + price)
    //webhook.send('@here', embed)
    webhook3.send('@everyone', embed)
    webhook4.send('@everyone', embed)
    webhook5.send('@everyone', embed)
    webhook6.send('<@&614435935257493516>', embed)
    }
})
}, 216);
})()

setInterval(getUniques, 1000 * 5)