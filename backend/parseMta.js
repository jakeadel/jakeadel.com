const http = require('http');
const request = require('request-promise-native');
const WebSocket = require('ws');
const fs = require('fs');
require('dotenv').config();
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');


const PORT = 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    console.log("Healthy")
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({status: 'healthy'}))
  }
  else {
    res.statusCode = 404;
    res.end();
  }
})

const wss = new WebSocket.Server({ port: PORT });
let trains = new Map();

wss.on('connection', function connection(ws) {
  console.log("Client connected");
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  const sendData = () => {
    const trainsArray = Array.from(trains.values());
    const data = { trains: trainsArray };
    ws.send(JSON.stringify(data));
  };

  sendData();
  const interval = setInterval(sendData, 10000);

  ws.on('close', () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

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
      console.log("Train has crossed after", trains.get(trainId).location, "seconds")
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
}

handleUpdate();
const interval = setInterval(handleUpdate, 10000);

async function makeRequest(url) {
  if (!process.env.MTA_KEY) {
    throw Error("MTA_KEY not set.")
  }
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
    // TODO: handle this more elegantly
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
    const destination = calcDestinationStation(entity);
    if (destination) {
      locations.push(new Train(entity, feed.header.timestamp, destination));
    }
  });
  return locations;
}

function calcDestinationStation(entity) {
  const stopId = entity.vehicle.stopId;
  const routeId = entity.vehicle.trip.routeId;
  if (stopId === "M16N" && routeId === "M" || stopId === "M16S" && routeId === "J") {
    return "Essex";
  }
  else if (stopId === "M18S" && routeId === "M" || stopId === "M18N" && routeId === "J") {
    return "Marcy";
  } 
  else {
    return false
  }
}

class Train {
  constructor(FeedEntity, timestamp, destination) {
    this.id = FeedEntity.vehicle.trip.tripId;
    this.routeId = FeedEntity.vehicle.trip.routeId;
    this.lastMoved = FeedEntity.vehicle.timestamp;
    this.tripId = FeedEntity.vehicle.trip.tripId;
    this.destination = destination;
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
// the last 24 hours.  Could be per line as well.

// Day/night/season stuff, moon

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
