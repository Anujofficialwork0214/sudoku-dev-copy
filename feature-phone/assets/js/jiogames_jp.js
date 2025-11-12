/*
This is developed by JioGames.

'c2_callFunction' this method is used in construct only.
If you are not using the construct then replace your method as per your requirement.

Do not edit any other part.
*/

//If you are using this script then remove JioGames related all parts from the index.html file.

var adSpotInterstitial_key = "vxue1kqp"; //Ex. : zbjnq9gs
var adSpotRewardedVideo_key = "4b5pjwoh"; //Ex. : 81xnt9bw
var package = "com.kaifoundry.sudokuJP"; //Ex. : com.vendor.gamename
var gameName = "sudoku"; //Ex. : testgame
var gameVersion = "V3.0.0"; //Ex. : V1.0.1
var isAdReady = false;
var isRVReady = false;
var isRewardUser = false;

var adSpotInterstitial = "midroll";
var adSpotRewardedVideo = "rewarded";

var config = {
  autoControl: ["volume", "exit"],
  gameName: gameName,
  gameVersion: gameVersion,
};
var gameSDK;

window.addEventListener("load", (event) => {
  var script = document.createElement("script");
  script.src = "https://jiogames.akamaized.net/gameSDK/games_SDK_JioAds.js";

  script.onload = () => {
    callbacks();
    gameSDK = new Jiogames(config);
    console.log("Jiogames: Initialized SDK!");
  };

  script.onerror = () => {
    console.log("Error occurred while loading script");
  };

  document.head.appendChild(script);

  const insMidrollElement = document.createElement("ins");
  insMidrollElement.className = "adsbyjio";
  insMidrollElement.id = "midroll";
  insMidrollElement.setAttribute("data-adspot-key", adSpotInterstitial_key);
  insMidrollElement.setAttribute("data-source", package);
  insMidrollElement.setAttribute("data-idfa", package + "_midrollidfa");
  document.body.appendChild(insMidrollElement);

  const insRVElement = document.createElement("ins");
  insRVElement.className = "adsbyjio";
  insRVElement.id = "rewarded";
  insRVElement.setAttribute("data-adspot-key", adSpotInterstitial_key);
  insRVElement.setAttribute("data-source", package);
  insRVElement.setAttribute("data-rewarded", "true");
  insRVElement.setAttribute("data-idfa", package + "_rewardedidfa");
  document.body.appendChild(insRVElement);
});

function postScore(score) {
  console.log("Jiogames: postScore() ", score);
  gameSDK.postScore(score);
}

// share(‘Title\nContent’);
// Content – plain text, Char limit max 100
function share(content) {
  console.log("Jiogames: share() ", content);
  gameSDK.share(content);
}

function callbacks() {
  JioAds.onAdPrepared = function (adSpotKey) {
    console.log("JioGames: onAdPrepared " + adSpotKey.toString());
    adSpotKey == adSpotInterstitial &&
      ((isAdReady = true),
      console.log("JioGames: onAdPrepared MidRoll " + isAdReady));
    adSpotKey == adSpotRewardedVideo &&
      ((isRVReady = true),
      console.log("JioGames: onAdPrepared RewardedVideo " + isRVReady),
      c2_callFunction("rvReady"));
  };

  JioAds.onAdClosed = function (
    adSpotKey,
    pIsVideoCompleted,
    pIsEligibleForReward
  ) {
    console.log(
      "JioGames: onAdClosed " +
        adSpotKey +
        " pIsVideoCompleted " +
        pIsVideoCompleted +
        " pIsEligibleForReward " +
        pIsEligibleForReward
    );

    adSpotKey == adSpotInterstitial &&
      ((isAdReady = false),
      console.log("JioGames: onAdClosed MidRoll " + isAdReady));
    adSpotKey == adSpotRewardedVideo &&
      ((isRVReady = false),
      console.log("JioGames: onAdClosed RewardedVideo " + isRVReady),
      c2_callFunction("rvNotReady"));

    if (adSpotKey == adSpotRewardedVideo && isRewardUser) {
      isRewardUser = false;
      GratifyReward();
    } else if (adSpotKey == adSpotRewardedVideo && !isRewardUser) {
      rvSkipped();
    }
    gameCacheAd();
  };

  JioAds.onAdFailedToLoad = function (adSpotKey, pDescription) {
    console.log(
      "JioGames: onAdFailedToLoad " +
        adSpotKey +
        " pDescription " +
        JSON.stringify(pDescription)
    );

    adSpotKey == adSpotInterstitial &&
      ((isAdReady = false),
      console.log("JioGames: onAdFailedToLoad MidRoll " + isAdReady));
    adSpotKey == adSpotRewardedVideo &&
      ((isRVReady = false),
      console.log("JioGames: onAdFailedToLoad RewardedVideo " + isRVReady),
      c2_callFunction("rvNotReady"));
  };

  JioAds.onAdMediaEnd = function (
    adSpotKey,
    pIsVideoCompleted,
    pIsEligibleForReward
  ) {
    console.log(
      "JioGames: onAdMediaEnd " +
        adSpotKey +
        " pIsVideoCompleted " +
        pIsVideoCompleted +
        " rewardpoints " +
        pIsEligibleForReward
    );

    adSpotKey == adSpotInterstitial &&
      ((isAdReady = false),
      console.log("JioGames: onAdClose MidRoll " + isAdReady));
    adSpotKey == adSpotRewardedVideo &&
      ((isRVReady = false),
      console.log("JioGames: onAdClose RewardedVideo " + isRVReady));

    if (adSpotKey == adSpotRewardedVideo && pIsVideoCompleted) {
      isRewardUser = pIsVideoCompleted;
    } else if (adSpotKey == adSpotRewardedVideo && !pIsVideoCompleted) {
      isRewardUser = false;
    }
  };
  JioAds.onAdClick = function (adSpotKey) {};
  JioAds.onAdMediaCollapse = function (adSpotKey) {};
  JioAds.onAdMediaExpand = function (adSpotKey) {};
  JioAds.onAdMediaStart = function (adSpotKey) {};
  JioAds.onAdRefresh = function (adSpotKey) {};
  JioAds.onAdRender = function (adSpotKey) {};
  JioAds.onAdRender = function (adSpotKey) {};
  JioAds.onAdReceived = function (adSpotKey) {};
  JioAds.onAdSkippable = function (adSpotKey) {};
  JioAds.onAdView = function (adSpotKey) {};
}

function GratifyReward() {
  console.log("JioGames: GratifyReward Game user here");
  if(game){
    game.solve();
  }
  c2_callFunction("gratifyUser");
}

function rvSkipped() {
  console.log("JioGames: rvSkipped");
  c2_callFunction("rvSkipped");
}

function gratifyUser() {
  return isRewardUser;
}

function cacheAd() {
  console.log("JioGames: cacheAd : " + isAdReady);
  if (!isAdReady) {
    JioAds.cacheAd(adSpotInterstitial);
  }
}
function cacheAdRewarded() {
  console.log("JioGames: cacheAdRewarded : " + isRVReady);
  if (!isRVReady) {
    JioAds.cacheAd(adSpotRewardedVideo);
  }
}
function showAd() {
  console.log("JioGames: showAd : " + isAdReady);
  if (isAdReady) {
    JioAds.showAd(adSpotInterstitial);
  }
}
function showAdRewarded() {
  console.log("JioGames: showAdRewarded : " + isRVReady);
  if (isRVReady) {
    JioAds.showAd(adSpotRewardedVideo);
  }
}

function gameCacheAd() {
  console.log("JioGames: gameCacheAd");
  cacheAd();
  setTimeout(function () {
    cacheAdRewarded();
  }, 5000);
}

function isRVAvailable() {
  if (isRVReady) {
    c2_callFunction("rvReady");
  } else {
    c2_callFunction("rvNotReady");
  }
}
