const request = require('request-promise-native');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();
var GtfsRealtimeBindings = require('gtfs-realtime-bindings');

const app = express();
app.use(cors());
const port = 3000;

let trains = new Map()

app.get('/update', (req, res) => {
  console.log("Received request to update endpoint")
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  req.setTimeout(0);

  function sendData() {
    const trainsArray = Array.from(trains.entries());

    const data = { trains: trainsArray };

    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  async function handleUpdate() {
    let MTrains = await makeRequest('https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm')
    let JZTrains = await makeRequest('https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz')
    let freshTrains = MTrains.concat(JZTrains)

    let freshTrainsMap = new Map();
    freshTrains.forEach((train) => {
      freshTrainsMap.set(train.id, train);
    })

    // Check if this is a known or new train
    for (const trainId of freshTrainsMap.keys()) {
      if (trains.has(trainId)) {
        let tempTrain = trains.get(trainId);
        tempTrain.isMoving = freshTrainsMap.get(trainId).isMoving;
        if (tempTrain.isMoving) {
          tempTrain.location += 10;
        }
        trains.set(trainId, tempTrain);
      }
      else {
        trains.set(trainId, freshTrainsMap.get(trainId));
      }
    }
    // Check if a train we are tracking is no longer on the bridge
    for (const trainId of trains.keys()) {
      if (!freshTrainsMap.has(trainId)) {
        console.log("train has crossed after", trains.get(trainId).location, "seconds")
        fs.appendFile('times_to_cross.txt', `${trains.get(trainId).location}, `, (err) => {
          if (err) {
            console.error("An error occurred:", err);
            return;
          }
          console.log("File was written successfully!");
        });
        trains.delete(trainId)
      }
    }
    console.log("Trains at:", Date.now(), trains)
    sendData()
  }

  sendData();
  const interval = setInterval(handleUpdate, 10000);
  req.on('close', () => {
    clearInterval(interval)
  });
});

app.listen(port, () => {
  console.log('server running on port:', port)
});

async function makeRequest(url) {

  let options = {
    method: 'GET',
    url: url,
    headers: { "x-api-key": process.env.MTA_KEY},
    encoding: null
  };

  let body;
  try {
    body = await request(options);
  } catch (error) {
    console.log(error.message)
    process.exit(9)
  }
  var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(body);

  let locations = [];
  feed.entity.forEach(function(entity) {
    if (entity.tripUpdate?.stopTimeUpdate) {
      return;
    }
    // Is the train between Essex and Marcy in either direction
    if (entity.vehicle.stopId === 'M16N' || entity.vehicle.stopId === 'M18S') {
      locations.push(new Train(entity, feed.header.timestamp));
    }
  });
  return locations;
}

class Train {
  constructor(FeedEntity, timestamp) {
    this.id = FeedEntity.vehicle.trip.tripId;
    this.lastMoved = FeedEntity.vehicle.timestamp;
    this.routeId = FeedEntity.vehicle.trip.routeId;
    this.direction = FeedEntity.vehicle.stopId.slice(-1);
    this.timeOfRequest = timestamp;
    this.isMoving = this.isMoving();
    this.location = 0;
  }

  isMoving() {
    let diff = (this.timeOfRequest - this.lastMoved) / 1000 / 60;
    if (diff < 10) {
      return true;
    }
    else {
      return false;
    }
  }
}


// Maybe do some stats like number of trains of each kind per day, number of trains per hour for
// the last 24 hours

// So we know roughly how long it takes trains to cross the bridge, and we know roughly how long each train
// has been moving between the stations.

/*

}
FeedEntity {
  id: '000022M',                                                    -- I think unique id
  vehicle: VehiclePosition {
    multiCarriageDetails: [],
    trip: TripDescriptor {
      tripId: '140650_M..S25R',                                     -- Direction N or S
      startTime: '23:26:30',
      startDate: '20240214',
      routeId: 'M'                                                  -- Line Signifier
    },
    timestamp: Long { low: 1707971190, high: 0, unsigned: true },   -- The last time the train moved
    stopId: 'M18S'                                                  -- The last station the train stopped at
  }
}

*/