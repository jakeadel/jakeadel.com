const request = require('request-promise-native');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
var GtfsRealtimeBindings = require('gtfs-realtime-bindings');

const app = express();
app.use(cors());
const port = 3000;

app.get('/update', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  req.setTimeout(0);

  function sendData() {
    const data = {test: Date.now()};
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  async function handleUpdate() {
    let MTrains = await makeRequest('https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm')
    let JZTrains = await makeRequest('https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz')
    let freshTrains = MTrains.concat(JZTrains)
    if (freshTrains != trains) {
      sendData();
    }
  }
  
  sendData();
  const interval = setInterval(handleUpdate, 30000);
  req.on('close', () => {
    clearInterval(interval)
  });
});

app.listen(port, () => {
  console.log('server running on port:', port)
});

let trains = []

async function makeRequest(url) {

  let options = {
    method: 'GET',
    url: url,
    headers: { "x-api-key": process.env.MTA_KEY},
    encoding: null
  };

  let body = await request(options);
  var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(body);
  console.log("Feed timestamp", feed.header.timestamp)
  let locations = [];
  feed.entity.forEach(function(entity) {
    if (entity.tripUpdate?.stopTimeUpdate) {
      return;
    }
    // Is the train between Essex and Marcy in either direction
    if (entity.vehicle.stopId === 'M16N' || entity.vehicle.stopId === 'M18S') {
      locations.push(new Train(entity));
    }
  });
  return locations;
}

class Train {
  constructor(FeedEntity) {
    this.id = FeedEntity.id;
    this.lastMoved = FeedEntity.vehicle.timestamp;
    this.routeId = FeedEntity.vehicle.trip.routeId;
    this.direction = FeedEntity.vehicle.stopId.slice(-1);
  }
}

async function main() {

  let MTrains = await makeRequest('https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm')
  let JZTrains = await makeRequest('https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz')
  let trains = MTrains.concat(JZTrains)

  for (const train of trains) {
    console.log(trains)
  }
}

main()


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