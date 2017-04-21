console.log("The bot is starting")
var Twit = require('twit')
var config = require('./config')
var request = require('request')
var _ = require('lodash')
const fs = require('fs')

var T = new Twit(config)

//tweetIt();

getNasaData('apollo%20SLS&media_type=image')
//thisHisDay()
//isDateMatch()
// getTweets()


// gets tweets with specified query parameters
function getTweets (params) {
  if(!params) {
    var params = { 
      q: 'global warming OR climate change :) since:2015-12-21', 
      count: 20 
    }
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

// 
// post a tweet with media 
// 
function tweetPhoto () {
  var b64content = fs.readFileSync('/path/to/img', { encoding: 'base64' })
   
  // first we must post the media to Twitter 
  T.post('media/upload', { media_data: b64content }, function (err, data, response) {
    // now we can assign alt text to the media, for use by screen readers and 
    // other text-based presentations and interpreters 
    var mediaIdStr = data.media_id_string
    var altText = "Small flowers in a planter on a sunny balcony, blossoming."
    var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }
   
    T.post('media/metadata/create', meta_params, function (err, data, response) {
      if (!err) {
        // now we can reference the media and post a tweet (media will attach to the tweet) 
        var params = { status: 'loving life #nofilter', media_ids: [mediaIdStr] }
   
        T.post('statuses/update', params, function (err, data, response) {
          console.log(data)
        })
      }
    })
  })
}

//
// NasaAPI
//
function getNasaData(q) {
  if(!q) q='apollo%2011&description=moon%20landing&media_type=image'
  var url = 'http://images-api.nasa.gov/search?q=' + q
  
  function callback(error, response, body) {
    console.log('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    //console.log('body:', body); // Print the HTML for the Google homepage.
    var photos = JSON.parse(body)
    //console.log("photos: ", photos)
    isDateMatch(photos)
  }

  request(url, callback)
}

//
// returns today's date with only month and day to match
// with the same in Nasa photos
//
function dateToday() {
  var date = new Date()
  var today = {}
  today.day = date.getDate()
  today.month = date.getMonth() + 1

  return today
}

//
// Iterates through NASA photo collection and matches
// finds photos that match current date.
function isDateMatch(photo) {
  photos = photo.collection.items
  //console.log('photos: ', photos)
  var photoData = _.forEach(photos, function(value, key) {
    var data = value.data
    photoData = _.forEach(data, function(d) {
      //console.log("value: ", d)
      var date_created = d.date_created
      var dObj = new Date(date_created)
      var day = dObj.getDate()
      var month = dObj.getMonth() + 1
      console.log("Photo Date found: ", month, day)

      // match date
      if((dateToday().month == month) && (dateToday().day == day)) {
        console.log("Date match found!")
      }
    })

  })
}
/*
keywords: 
concept
artist
apollo
*/