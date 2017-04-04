console.log("The bot is starting")

var Twit = require('twit')
var config = require('./config')

var T = new Twit(config)

var params = { 
  q: 'banana since:2011-07-11', 
  count: 2 
}

//Sets up user stream
var stream = T.stream('user')

//Anytime someone follows us
stream.on('follow', followed)

function followed(eventMsg) {
  console.log("follow event ")
  var name = eventMsg.source.name
  var screenName = eventMsg.source.screen_name
  tweetIt('@' + screenName + ' Thank you for following transitBot!')
}

T.get('search/tweets', params, gotData)

function gotData(err, data, response) {
  var tweets = data.statuses;
  for(var i = 0; i < tweets.length; i++){
    console.log(tweets[i].text)
  }
  //console.log(data)
}

tweetIt();

function tweetIt(txt) {
  var tweet = {
    status: txt
  }

  T.post('statuses/update', tweet, tweeted)

  function tweeted(err, data, response) {
    if(err) {
      console.log("something went wrong")
    }
    else {
      console.log("it tweeted!")
    }
    console.log(data)
  }
}