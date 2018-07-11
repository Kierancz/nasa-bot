"use strict"
//
// Dependencies
//
console.log("The bot is starting");
const Twit = require('twit');
const config = require('./config');
const config2 = require('./config2');
const request = require('request');
const _ = require('lodash');
let fs = require('fs');

const keywords = require('./keywords.json');
const schedule = require('node-schedule');
const twitter = require('./twitter.js');
let postedPhotos = require('./posted.json');

//
// Global Configuration
//

// Global Constants
//
// Enable testing twitter account
const TEST_MODE = true;
// how many broad searches to perform if we don't find enough the first time
const ITER_NUM_BROAD = 50;


// holds photos with current date match
let FoundPhotoObjs = [];
let IsMatchIter = 0;
// how many searches to perform
let IterNum = 199;
let TriedBroad = false;
let OffsetPhotos = false;
// Declare our Global Twit object
let T;

//
// Search Scheduling Config
//
let search = function search() {
  return getNasaData(buildSearchQ(getKeys()));
}
let searchBroad = function search() {
  return getNasaData(buildSearchQ(getKeys(), true));
}
iterateFunction(IterNum, search);

// If in test mode use alt twitter account for testing
if(TEST_MODE) {
  T = new Twit(config2);
  // Run a search and photo post
  IterNum = 50;
  iterateFunction(IterNum, search);
} 
else {
  T = new Twit(config);
  // Schedule Individual Photo Searches and Post
  postSearch(timeRule(17, 0));
  postSearch(timeRule(20, 0));
}

function timeRule(hr, min) {
  let rule = new schedule.RecurrenceRule();
  rule.hour = hr;
  rule.minute = min;
  return rule;
}

function postSearch(scheduleRule) {
  let post = schedule.scheduleJob(scheduleRule, function() {
    console.log("starting photo search & post");
    iterateFunction(IterNum, search);
  });
}

//------------------

// Filter and sort our photos by age and decide which to post
function processPhotos() {
  console.log("In processPhoto()")
  let foundPhotos = _.uniqBy(FoundPhotoObjs, 'nasa_id') //eliminate duplicates
  let byOldest = _.sortBy(foundPhotos, 
      [function(p) { return p.year }]);    //sort by oldest first
  //console.log("Unique found photos: ", foundPhotos)

  let pCount = foundPhotos.length;
  // if we didn't find any photos search again with broader search
  if((pCount < 1) && !TriedBroad) {
    TriedBroad = true;
    iterateFunction(50, searchBroad);
  } 
  else if(pCount) { // check we have photos to post
    // If we found a lot of photos, post oldest and then post 
    // 2nd oldest photo in 2nd search to differentiate photo subjects
    if(pCount > 3) {
      if(OffsetPhotos)  { 
        postPhoto(byOldest[1]);
        OffsetPhotos = false;
      }
      else {
        postPhoto(byOldest[0]);
        OffsetPhotos = true;
      }
    } // not many photos, just post what we got
    else {
      postPhoto(byOldest[0]);
    }
  }
}


// Posts provided photo and adds status to twitter
function postPhoto(photo) {
  console.log("In postPhoto()");
  // throw out global photo collection we don't need anymore
  FoundPhotoObjs = [];
  TriedBroad = false;  // reset broad search status

  if(photo) {
    console.log("Photo to post: ", photo);
    const photoTitle = photo.nasa_id + ".jpg";
    const details = "https://images.nasa.gov/#/details-" + photo.nasa_id + ".html";
    const yearsAgo = dateToday().year - photo.year;
    const tweet = yearsAgo + " yrs ago today: " + photo.title + ". More details: " + details;

    console.log("posted array: ", postedPhotos);

    //read in all the previously posted photos for match comparison later
    fs.readFile('posted.json', 'utf8', function(err, data) {  
      if(err) console.error("Error reading ids from file: ", err);
      postedPhotos = JSON.parse(data);
      console.log("posted ids: ", postedPhotos, typeof(postedPhotos));
    })

    // put new posted photo into array and write to file
    postedPhotos.push(photo.nasa_id);
    const stringifiedArr = JSON.stringify(postedPhotos);
    fs.writeFile("posted.json", stringifiedArr, "utf8", 
      function(err) { 
        if(err) console.error("Error writing id to file: ", err)
      });

    // download the photo so we can upload to post
    download(photo.href, photoTitle, function(){
      console.log('Photo downloaded: ', photoTitle);
      twitter.tweetPhoto(photo, tweet);  
    });
  }
}

//
// NasaAPI
// Gets NASA data from provided q
// and checks for historical matches with the current month/day
function getNasaData(q) {
  //console.log("In getNasaData(" + q + ")")
  if(!q) q='apollo%2011&description=moon%20landing&media_type=image';
  let url = 'http://images-api.nasa.gov/search?q=' + q;

  function callback(error, response, body) {
    //console.log('statusCode:', response && response.statusCode) // Print the response status code if a response was received
    if(body) var data = JSON.parse(body);
    //console.log("photos: ", photos)
    if(error) {
      console.log('error getting NASA data:', error); 
    } else if(data) {
      isDateMatch(data);
    }
  }
  request(url, callback);
}


//
// Iterates through NASA photo collection and
// finds photos that match current date.
function isDateMatch(photoData) {
  let photos = photoData.collection.items;
  let photoCount = photos.length;
  let matchedPhoto = {}

  //get date today
  const mToday = dateToday().month;
  const dToday = dateToday().day;

  let colItem = _.forEach(photos, function(value, key) {
    let data = value.data;
    let href = value.links[0].href;
    let photo = _.forEach(data, function(d) {
      //console.log("value: ", d)
      d.href = href;
      let date_created = d.date_created;
      let dObj = new Date(date_created);
      let day = dObj.getDate();
      let month = dObj.getMonth() + 1; //0-11 + 1
      let year = dObj.getFullYear();

      // match date and check to see if posted already
      let isPosted = _.includes(postedPhotos, d.nasa_id);
      if((mToday == month) && (dToday == day) && (!isPosted)) {
        matchedPhoto.title = d.title;
        matchedPhoto.description = d.description;
        matchedPhoto.href = d.href;
        matchedPhoto.nasa_id = d.nasa_id;
        matchedPhoto.year = year;
        //console.log("Matched Photo: ", matchedPhoto)

        // push found match to global array for later processing
        FoundPhotoObjs.push(matchedPhoto);
        console.log("found photo with date match");
      }
    })
  })
  IsMatchIter++
  // when finished searching process the photos found
  if(IsMatchIter == IterNum) { 
    processPhotos();
    IsMatchIter = 0; // reset for next photo round
  }
  // when finished broad searching process photos
  if((IsMatchIter == ITER_NUM_BROAD) && TriedBroad) {
    processPhotos();
    IsMatchIter = 0;
  }
}


//
// returns two random keywords in an array to narrow search to 
// interesting things
//
function getKeys() {
  //console.log("In getKeys()")
  let places = keywords.places;
  let things = keywords.things;
  let p = Math.floor(Math.random()*places.length);
  let t = Math.floor(Math.random()*things.length);
  let randKeywords = [places[p], things[t]];

  return randKeywords;
}

function buildSearchQ(keys, broaden) {
  let searchQ = keys[0] + '%20' + keys[1] + '&media_type=image';
  //console.log("In buildSearchQ()")
  if(broaden) {
    //chose a single random key from either places or things key arrays
    let randKey = Math.random() < 0.5 ? keys[0] : keys[1];
    searchQ = randKey + 'year_end=1990&media_type=image';
  }
  // console.log("search query: ", searchQ);
  return searchQ
}

//
//----------------------------------------------------------
// Helper functions
//----------------------------------------------------------
//

// Downloads resource at any URL provided
function download(uri, filename, callback) {
  request.head(uri, function(err, res, body) {
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream('./imgs/' + filename)).on('close', callback);
  })
}

//
// returns today's date as object with properties Y/M/D
// and matches comparison format with NASA photos
//
function dateToday() {
  //console.log("In dateToday()")
  let date = new Date();
  let today = {}
  today.day = date.getDate();
  today.month = date.getMonth() + 1;
  today.year = date.getFullYear();

  return today
}

// simple function that runs provided function for specified iterations
function iterateFunction(num, iterFunction) {
  if(!num) num = 10;
  for(let i = 0; i < num; i++) {
    iterFunction();
  }
}

//
// Twitter Streams
//

//Sets up user stream
let userStream = T.stream('user');
//Anytime someone follows us
userStream.on('follow', twitter.followed);
userStream.on('error', function (err) { 
  console.log("stream error: ", err);
});

