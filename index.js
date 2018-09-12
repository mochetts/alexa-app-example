var express = require("express");
var alexa = require("alexa-app");
var axios = require("axios");
var _ = require("lodash");
var jsdom = require("jsdom");

var { JSDOM } = jsdom;
var PORT = process.env.PORT || 8080;
var app = express();

// ALWAYS setup the alexa app and attach it to express before anything else.
var alexaApp = new alexa.app("test");
var key = "A5ETTZ6WAQ7Z7WDJFJWUUYIDAKLQPABGK4ZOXVEOBUGJPCQRUY4GHHNOCU3BTKLWGFEH2FG6RYID4SHLEFDVWWBZBINAS7JVVRMGQEEQ"
var getDocURL = "https://ixbapi.healthwise.net/KnowledgeContent/{DOC_ID}?hw.format=rhtml&hw.key="+key

alexaApp.express({
  expressApp: app,
  //router: express.Router(),

  // verifies requests come from amazon alexa. Must be enabled for production.
  // You can disable this if you're running a dev environment and want to POST
  // things to test behavior. enabled by default.
  checkCert: false,

  // sets up a GET route when set to true. This is handy for testing in
  // development, but not recommended for production. disabled by default
  debug: true
});

// now POST calls to /test in express will be handled by the app.request() function

// from here on you can setup any other express routes or middlewares as normal
app.set("view engine", "ejs");

alexaApp.launch(function(request, response) {
  response.say("You launched the app!");
});

alexaApp.dictionary = { "conditions": ["breast cancer"] };


function getDocID(condition) {
  switch(condition) {
    case "breast cancer": return "uh3697"
    case "postpartum": return "uh4197"
    case "kegel exercises": return "zc1451"
    case "breast pain": return "uf7074"
  }
}

alexaApp.intent("CareInstructionsMatchIntent", {
    "slots": { "CONDITION": "ATLAS_condition" },
    "utterances": [
      "how do I care for {conditions|CONDITION}",
    ]
  },
  function(request, alexaResponse) {
    var slot = request.slots["CONDITION"]
    var condition = slot.value
    var docID = getDocID(condition)

    if (!docID) {
      alexaResponse.say("I'm sorry. I couldn't find any result for " + slot.value)
      return
    }

    var docURL = getDocURL.replace("{DOC_ID}", docID)

    // Search for title in healthwise response: "${condition}: care instructions"
    return axios.get(docURL).then(function (docResponse) {
      var dom = new JSDOM(docResponse.data)
      var text = dom.window.document.querySelector('.HwNavigationSection.HwPiArticle.HwSectionSpecialSection').textContent.replace(" Your Care Instructions", "")
      alexaResponse.say(text)
    })
  }
);

alexaApp.intent("HackathonWinnerIntent", {
    "utterances": [
      "who's going to win the hackathon",
    ]
  },
  function(request, response) {
    response.say("That's pretty obvious, Lannisters will rock");
  }
);

app.listen(PORT, () => console.log("Listening on port " + PORT + "."));
