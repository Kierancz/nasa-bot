//
//----------------------------------------------------------
// Twitter functions
//----------------------------------------------------------
//

// gets tweets with specified query parameters
exports.getTweets = function(params) {
  if(!params) {
    let params = { 
      q: 'NASA OR space science :) since:2015-12-21', 
      count: 20 
    };
  }
  T.get('search/tweets', params, gotData);

  function gotData(err, data, response) {
    if(err) console.log("there was an error: ", err);
    else console.log("data received successfully");

    let tweets = data.statuses;
    for(let i = 0; i < tweets.length; i++){
      console.log(tweets[i].text);
    }
    //console.log(data)
  }
}

// tweetIt()
// tweets simple text string
exports.tweetIt = function(txt) {
  let tweet = {
    status: txt
  };

  T.post('statuses/update', tweet, tweeted);

  function tweeted(err, data, response) {
    if(err) console.log("something went wrong: ", err);
    else console.log("it tweeted!", response);

    console.log(data);
  }
}

// follows the provided user
exports.followUser = function(userName) {
  T.post('friendships/create', {screen_name: userName}, 
    function(err, data, response) { // Follow the user back
      if (err) { // If error results
        console.log(err); // Print error to the console
      }
    }
  )
}

// follows anyone who follows us
exports.followed = function(eventMsg) {
  console.log("follow event ");
  let name = eventMsg.source.name;
  let screen_name = eventMsg.source.screen_name; // get screen name of follower
  let responses = keywords.followResponses;
  let r = Math.floor(Math.random()*responses.length);

  if(screen_name !== BotScreenName) {
    exports.tweetIt('@' + screen_name + ' ' + responses[r]);
  }
  exports.followUser(screen_name); // follow back
}

// 
//  reTweet()
//
exports.reTweet = function(tweetId) {
  T.post('statuses/retweet/:id', tweetId, reTweetIt)

  function reTweetIt(err, data, response) {
    console.log("reTweet data: ", data);
  }
}

// 
// post a tweet with media 
// 
exports.tweetPhoto = function(photoObj, status) {
  let b64Photo = fs.readFileSync('./imgs/' + photoObj.nasa_id + '.jpg', { encoding: 'base64' })
   
  // first we must post the media to Twitter 
  T.post('media/upload', { media_data: b64Photo }, function (err, data, response) {
    // now we can assign alt text to the media, for use by screen readers and 
    // other text-based presentations and interpreters 
    let mediaIdStr = data.media_id_string;
    let altText = photoObj.title;
    let meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }
    // limit to 140 chars
    let tweet = status.substring(0, 140);
   
    T.post('media/metadata/create', meta_params, function (err, data, response) {
      if (!err) {
        // now we can reference the media and post a tweet (media will attach to the tweet) 
        let params = { status: [tweet], media_ids: [mediaIdStr] }
   
        T.post('statuses/update', params, function (err, data, response) {
          console.log(data);
        })
      }
    })
  })
}


// replies to anyone that uses our screen name
exports.tweetAtUs = function(eventMsg) {
  let replyTo = eventMsg.in_reply_to_screen_name;
  let text = eventMsg.text;
  let fromUser = eventMsg.user.screen_name;

  if(replyTo === 'NasaTimeMachine') {
    let newTweet = '@' + fromUser + ' thanks for saying hi!';
    exports.tweetIt(newTweet);
  }
} 