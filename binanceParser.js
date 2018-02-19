// Will be filled up as transactions are parsed.
let Coins = {
}

// global pointer to teh the xlsx sheet so dont' need to keep
// passing it around to functions.
let sheet = undefined;

var populateDefault = function() {
  Coins = {}
  Coins["BTC"] = 0
  Coins["ETH"] = 0
  UpdateTokens()
}

var addCoin = function(coin, amt) {
 if (!Coins[coin]) {
  Coins[coin] = amt
 } else {
  Coins[coin] += amt;
 }
}


var getRaw = function(raw) {
  if (!sheet[raw]) {
    return undefined;
  }
  return sheet[raw].v;
}

var getDate = function(i) {
  return getRaw("A" + i)
}

var isFilledStatus = function(i) {
  var raw = getRaw("I" + i);
  if (raw == "Filled") {
    return true;
  } else if (raw == "Canceled") {
    return false;
  } else {
    console.error("Unknown status type: " + raw);
    return false;
  }
}

// All pairs that you can purchase coins with.
const DOMINANCE = ["BTC", "ETH", "BNB", "USDT"]

// Parses the pair string into the two tokens.
var parsePair = function(str) {
  for (let i = 0; i < DOMINANCE.length; i++) {
    var index = str.indexOf(DOMINANCE[i]);
    if (index == -1) {
      continue;
    }
    var other = str.substr(0, index)
    if (other.length == 0) {
      console.error("Fatal error parsing pair: " + str)
      return;
    }
    return [other, DOMINANCE[i]]
  }
  console.error("Unable to parse pair: " + str);
  return;
}

// Parses a trade. Updates Coins based on it.
var parseTrade = function(i) {
 var pair = getRaw("B" + i)
 if (!pair) {
  console.error("Parsing error. Expected trade pair in col B" + i);
  return;
 }
 var type = getRaw("C" + i);
 var pairArray = parsePair(pair);
 var qty = parseFloat(getRaw("G" + i));
 var price = parseFloat(getRaw("H" + i));

 if (type == "SELL") {
  console.log("" + qty + " "+ pairArray[0] + " for " + price + " " + pairArray[1])
  qty = -qty;
 } else if (type == "BUY") {
  console.log("" + price + " "+ pairArray[1] + " for " + qty + " " + pairArray[0])
  price = -price;
 } else {
  console.error("Unknown trade type: " + type);
  return;
 }

 addCoin(pairArray[0], qty)
 addCoin(pairArray[1], price)
}

// File change event handler.
const ParseBinance = function(file) {
  if (file.SheetNames.length != 1) {
    console.error("Expecting exactly one sheet. Actual: " + file.SheetNames.length);
    return;
  }
  sheet = file.Sheets[file.SheetNames[0]];
  if (sheet["!cols"].length != 9) {
    console.error("Expecting 9 columns in the file. Actual: " + sheet["!cols"].length)
    return;
  }
  const range = sheet["!ref"];
  const rows = parseInt(range.split(':')[1].substr(1));
  if (!rows) {
    console.error("Unable to parse number of rows. Ref is: " + range);
    return;
  }
  // Skip first row since it's headers.
  for (let i = 2; i < rows; i++) {
    if (!getDate(i)) {
      // Skipping row i since it's not a main row (e.g has fee info)
      // We only parse rows that have a date.
      continue;
    }
    if (!isFilledStatus(i)) {
      // Skip cancelled statuses.
      continue;
    }
    parseTrade(i)
  }
UpdateTokens();
}

const UpdateTokens = function() {
  var parent = document.getElementById("tokens");
  parent.innerHTML = '';
  for (coin in Coins) {
    var childDiv = document.createElement('div');
    childDiv.innerText = coin + ': ' + Coins[coin];
    parent.appendChild(childDiv);
  }
}