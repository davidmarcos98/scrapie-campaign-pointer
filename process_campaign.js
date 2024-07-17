const TMIO = require("trackmania.io");
const fs = require("node:fs");

const CLUB_ID = "18974";
const CAMPAIGN_ID = "70188";
const POINTS_AT = 6;
const POINTS_GOLD = 3;
const POINTS_SILVER = 2;
const POINTS_BRONZE = 1;
const POINTS_TOP_10 = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10];

const data = {};

const getCampaign = async () => {
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
    console.log(lb.at(-1).position);
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
  fs.writeFile("./output.json", JSON.stringify(data), (err) => {
    console.log(err);
  });
  process.exit();
});
