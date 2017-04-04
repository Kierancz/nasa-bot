console.log("The bot is starting")

var Twit = require('twit')
var config = require('./config')

console.log(config)
var T = new Twit(config)


var params = { 
  q: 'banana since:2011-07-11', 
  count: 100 
}


T.get('search/tweets', params, gotData)

function gotData(err, data, response) {
  console.log(data)
}