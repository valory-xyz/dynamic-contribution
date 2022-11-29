const fs = require("fs");
const globalsFile = "globals.json";
const dataFromJSON = fs.readFileSync(globalsFile, "utf8");
const parsedData = JSON.parse(dataFromJSON);
const dynamicContributionName = parsedData.dynamicContributionName;
const dynamicContributionSymbol = parsedData.dynamicContributionSymbol;
const dynamicContributionBaseURI = parsedData.dynamicContributionBaseURI;

module.exports = [
    dynamicContributionName,
    dynamicContributionSymbol,
    dynamicContributionBaseURI
];