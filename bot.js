console.log("The bot is starting")
var Twit = require('twit')
var config = require('./config')

var T = new Twit(config)

//tweetIt();


// gotData()
//
var params = { 
  q: 'global warming OR climate change :) since:2015-12-21', 
  count: 20 
}
T.get('search/tweets', params, gotData)

function gotData(err, data, response) {
  if(err) console.log("there was an error: ", err)
  else console.log("data received successfully")

  var tweets = data.statuses;
  for(var i = 0; i < tweets.length; i++){
    console.log(tweets[i].text)
  }
  //console.log(data)
}

// tweetIt()
//
function tweetIt(txt) {
  var tweet = {
    status: txt
  }

  T.post('statuses/update', tweet, tweeted)

  function tweeted(err, data, response) {
    if(err) console.log("something went wrong: ", err)
    else console.log("it tweeted!", response)

    console.log(data)
  }
}

// followed()
//
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

// 
//  reTweet()
//
function reTweet(tweetId) {
  T.post('statuses/retweet/:id', tweetId, reTweetIt)

  function reTweetIt(err, data, response) {
    console.log("reTweet data: ", data)
  }
}