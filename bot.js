console.log("The bot is starting")
var Twit = require('twit')
var config = require('./config')
var request = require('request')
var _ = require('lodash')
const fs = require('fs')
var keywords = require('./keywords.json')

var T = new Twit(config)

//tweetIt();

//getNasaData('apollo&media_type=image')
//thisHisDay()
//isDateMatch()
// getTweets()
//getRandomKeywords()

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
//
var foundPhotoObjs = []

//
// NasaAPI
// Gets Nasa data from provided q
// and returns 
function getNasaData(q) {
  if(!q) q='apollo%2011&description=moon%20landing&media_type=image'
  var url = 'http://images-api.nasa.gov/search?q=' + q
  var isMatchFound = false
  var matchedPhoto = {}

  function callback(error, response, body) {
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    var photos = JSON.parse(body)
    //console.log("photos: ", photos)
    if(error) {
      console.log('error:', error) // Print the error if one occurred
    } else {
      matchedPhoto = isDateMatch(photos)
      isMatchFound = matchedPhoto
    }
  }
  request(url, callback)
  if(isMatchFound) return true
  else return false
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
// Iterates through NASA photo collection and
// finds photos that match current date.
function isDateMatch(photo) {
  photos = photo.collection.items
  var photoCount = photos.length
  // array to store objects of photos that match
  var matchedPhotos = []
  var isMatch = false
  var matchedPhoto = {}

  var photoData = _.forEach(photos, function(value, key) {
    var data = value.data
    var href = value.links[0].href
    photoData = _.forEach(data, function(d) {
      //console.log("value: ", d)
      d.href = href
      var date_created = d.date_created
      var dObj = new Date(date_created)
      var day = dObj.getDate()
      var month = dObj.getMonth() + 1
      var year = dObj.getFullYear()
      //console.log("Photo Date found: ", month, day)
      //console.log("Photo link: ", d.href)

      // match date
      if((dateToday().month == month) && (dateToday().day == day)) {
        isMatch = true
        console.log("Date match found!")
        matchedPhoto.title = d.title
        matchedPhoto.description = d.description
        matchedPhoto.href = d.href
        matchedPhoto.nasa_id = d.nasa_id

        console.log("Matched Photo: ", matchedPhoto)
        //console.log("Year: ", year)
      }
    })
  })
  if(!isMatch) {
    console.log("No photos with date match.")
    console.log("Out of the total photos found: ", photoCount)
    return false
  }
  //push found photo matchs into global array
  console.log("pushing matchedPhoto to foundPhotoObjs: ", matchedPhoto)
  foundPhotoObjs = foundPhotoObjs.push(matchedPhoto)
  return true
}

//
// returns two random keywords to narrow search to 
// interesting things
//
function getRandomKeywords() {
  var places = keywords.places
  var things = keywords.things
  var p = Math.floor(Math.random()*places.length)
  var t = Math.floor(Math.random()*things.length)
  var randKeywords = [places[p], things[t]]
  //console.log("places, things: ", places, things)
  //remove searched keywords from arrays
  //places.splice(p, p)
  //things.splice(t, t)
  return randKeywords

}

iterateSearchKeys()

function iterateSearchKeys() {
  for(var i = 0; i < 100; i++) {
    searchKeys()
  }
  for(var j = 0; j < foundPhotoObjs.length; j++) {
    console.log("Matched photo in array: ", foundPhotoObjs[j])
  }
}

function searchKeys() {
  var found = false
  var randKeys = []

  randKeys = getRandomKeywords()
  //console.log("Random keys: ", randKeys[r])
  var searchQ = randKeys[0] + '%20' + randKeys[1] + '&media_type=image'
  //console.log("Search Query: ", searchQs[s])

  getNasaData(searchQ)

}