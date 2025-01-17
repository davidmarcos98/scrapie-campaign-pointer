const TMIO = require("trackmania.io");
const fs = require("fs").promises;

const CLUB_ID = process.env.CLUB_ID;
const CAMPAIGN_ID = process.env.CAMPAIGN_ID;
const POINTS_AT = process.env.AT;
const POINTS_GOLD = process.env.GOLD;
const POINTS_SILVER = process.env.SILVER;
const POINTS_BRONZE = process.env.BRONZE;
const POINTS_TOP_10 = process.env.TOP10.split(",").map((i) => parseInt(i));

const data = {};

console.log(
  process.env.TEST,
  POINTS_AT,
  POINTS_GOLD,
  POINTS_SILVER,
  POINTS_BRONZE,
  POINTS_TOP_10
);

const getCampaign = async () => {
  console.log(`Getting campaign ${CAMPAIGN_ID} from club ${CLUB_ID}`);
  let client = new TMIO.Client();
  let campaign = await client.campaigns.get(
    (clubId = CLUB_ID),
    (id = CAMPAIGN_ID)
  );
  let maps = await campaign.maps();
  for (let map of maps.slice(0, 2)) {
    await processMap(map);
  }
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const processMap = async (map) => {
  let medals = map.medalTimes;
  data[map.id] = {
    mapId: map.id,
    mapName: map.name,
    author: map.authorName,
    leaderboard: [],
    medals: {
      at: medals.author,
      gold: medals.gold,
      silver: medals.silver,
      bronze: medals.bronze,
    },
  };
  let lb = await map.leaderboardLoadMore();
  while (lb.length < 200 && lb.length > 0 && lb.at(-1).time <= medals.bronze) {
    lb = await map.leaderboardLoadMore();
    console.log(
      "Getting leaderboard for map" + map.name + "... " + lb.at(-1).position
    );
    await sleep(1600);
  }
  for (let player of lb) {
    data[map.id].leaderboard.push({
      position: player.position,
      time: player.time,
      player: player.playerName,
    });
  }
};

getCampaign().then(() => {
  console.log("Saving file...");
  fs.writeFile("./output.json", JSON.stringify(data), (err) => {
    console.log(err);
  }).then(() => {
    process.exit();
  });
});
