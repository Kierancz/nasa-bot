console.log("The bot is starting")
var Twit = require('twit')
var config = require('./config')
var request = require('request')
var _ = require('lodash')
const fs = require('fs')
const keywords = require('./keywords.json')
var _ = require('lodash');
//var async = require('async')

var T = new Twit(config)

var bot_name = 'NASA Time Machine'
var bot_screen_name = 'NasaTimeMachine'
var foundPhotoObjs = []
var isMatchIter = 0
const iterNum = 200


var search = function search() {
  return getNasaData(buildSearchQ(getKeys()))
}

//setInterval(iterateFunction(iterNum, search), 1000*60*60*24)
iterateFunction(iterNum, search)
// Downloads resource at any URL provided
var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type'])
    console.log('content-length:', res.headers['content-length'])

    request(uri).pipe(fs.createWriteStream('./imgs/' + filename)).on('close', callback)
  })
}

// Filter and sort our photos by age
function processPhotos() {
  console.log("In processPhoto()")
  var foundPhotos = _.uniqBy(foundPhotoObjs, 'nasa_id')
  //console.log("Unique found photos: ", foundPhotos)
  var byOldest = _.sortBy(foundPhotos, 
                        [function(p) { return p.year }])
  console.log("Photos by year: ", byOldest)

  postPhoto(byOldest[0])
}


// Posts provided photo and adds status to twitter
function postPhoto(photo) {
  console.log("In postPhoto()")
  if(photo) {
    console.log("Photo to post: ", photo)
    const photoTitle = photo.nasa_id + ".jpg"
    const details = "https://images.nasa.gov/#/details-" + photo.nasa_id + ".html"

    var yearsAgo = dateToday().year - photo.year
    var tweet = yearsAgo + " yrs ago today: " + photo.title + ". More details: " + details
    
    // download the photo so we can upload to post
    download(photo.href, photoTitle, function(){
      console.log('Photo downloaded: ', photoTitle)
      tweetPhoto(photo, tweet)
    })
  }
}

//
// NasaAPI
// Gets NASA data from provided q
// and checks for historical matches with the current month/day
function getNasaData(q) {
  //console.log("In getNasaData(" + q + ")")
  if(!q) q='apollo%2011&description=moon%20landing&media_type=image'
  var url = 'http://images-api.nasa.gov/search?q=' + q

  function callback(error, response, body) {
    //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    if(body) var data = JSON.parse(body)
    //console.log("photos: ", photos)
    if(error) {
      console.log('error:', error) // Print the error if one occurred
    } else if(data) {
      isDateMatch(data)
    }
  }
  request(url, callback)
}


//
// Iterates through NASA photo collection and
// finds photos that match current date.
function isDateMatch(photoData) {
  console.log("In isDateMatch()")
  photos = photoData.collection.items
  var photoCount = photos.length
  var matchedPhoto = {}

  //get date today
  const mToday = dateToday().month
  const dToday = dateToday().day

  var photoData = _.forEach(photos, function(value, key) {
    var data = value.data
    var href = value.links[0].href
    photoData = _.forEach(data, function(d) {
      //console.log("value: ", d)
      d.href = href
      var date_created = d.date_created
      var dObj = new Date(date_created)
      var day = dObj.getDate()
      var month = dObj.getMonth() + 1 //0-11 + 1
      var year = dObj.getFullYear()

      //console.log("Photo Date found: ", month, day)

      // match date
      if((mToday == month) && (dToday == day)) {
        matchedPhoto.title = d.title
        matchedPhoto.description = d.description
        matchedPhoto.href = d.href
        matchedPhoto.nasa_id = d.nasa_id
        matchedPhoto.year = year
        //console.log("Matched Photo: ", matchedPhoto)

        foundPhotoObjs.push(matchedPhoto)
        console.log("found photo with date match")
      }
    })
  })
  isMatchIter++
  // when finished searching process the photos found
  if(isMatchIter == iterNum) processPhotos()
}


//
// returns two random keywords in an array to narrow search to 
// interesting things
//
function getKeys() {
  //console.log("In getKeys()")
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


function iterateFunction(num, iterFunction) {
  console.log("In iterateFunction()")
  if(!num) num = 10
  for(var i = 0; i < num; i++) {
    iterFunction()
  }
}

function buildSearchQ(keys) {
  //console.log("In buildSearchQ()")
  if(!keys) var randKeys = getKeys()
  var randKeys = keys
  //console.log("Random keys: ", randKeys)
  var searchQ = randKeys[0] + '%20' + randKeys[1] + '&media_type=image'
  //console.log("Search Query: ", searchQs[s])
  //getNasaData(searchQ)
  return searchQ
}

//
//----------------------------------------------------------
// Helper functions
//----------------------------------------------------------
//

//
// returns today's date as object with properties Y/M/D
// and matches comparison format with NASA photos
//
function dateToday() {
  //console.log("In dateToday()")
  var date = new Date()
  var today = {}
  today.day = date.getDate() - 24
  today.month = date.getMonth() + 2
  today.year = date.getFullYear()

  return today
}


//
//----------------------------------------------------------
// Twitter functions
//----------------------------------------------------------
//

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
stream.on('error', function (err) { 
  console.log("stream error: ", err)
})

function followed(eventMsg) {
  console.log("follow event ")
  var name = eventMsg.source.name
  var screen_name = eventMsg.source.screen_name
  if(screen_name !== bot_screen_name) {
    tweetIt('@' + screen_name + ' Thank you for following me!')
  }
  T.post('friendships/create', {screen_name: screen_name}, 
    function(err, data, response) { // Follow the user back
      if (err) { // If error results
        console.log(err); // Print error to the console
      }
    }
  )
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
function tweetPhoto (photoObj, tweet) {
  var b64Photo = fs.readFileSync('./imgs/' + photoObj.nasa_id + '.jpg', { encoding: 'base64' })
   
  // first we must post the media to Twitter 
  T.post('media/upload', { media_data: b64Photo }, function (err, data, response) {
    // now we can assign alt text to the media, for use by screen readers and 
    // other text-based presentations and interpreters 
    var mediaIdStr = data.media_id_string
    var altText = photoObj.title
    var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }
   
    T.post('media/metadata/create', meta_params, function (err, data, response) {
      if (!err) {
        // now we can reference the media and post a tweet (media will attach to the tweet) 
        var params = { status: [tweet], media_ids: [mediaIdStr] }
   
        T.post('statuses/update', params, function (err, data, response) {
          console.log(data)
        })
      }
    })
  })
}


//
function tweetAtUs(eventMsg) {
  var replyTo = eventMsg.in_reply_to_screen_name
  var text = eventMsg.text
  var fromUser = eventMsg.user.screen_name

  if(replyTo === 'NasaTimeMachine') {
    var newTweet = '@' + fromUser + ' thanks for saying hi!'
    tweetIt(newTweet)
  }
} 