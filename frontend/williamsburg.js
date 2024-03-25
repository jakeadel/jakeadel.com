let trains = new Map();

const width = 350;
const height = 400;

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('bridgeCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    const bridgeY = canvas.height / 2;
    const trainWidth = 50;
    const trainHeight = 20;
    let trainX = -trainWidth;

    let bumps = []
    const min = 1
    const max = 10

    const trainCarsOld = [
        {x: trainX - trainWidth - 10 , y: bridgeY - trainHeight, bumpOffset: 0},
        {x: trainX - 2 * (trainWidth + 10), y: bridgeY - trainHeight, bumpOffset: 0},
        {x: trainX - 3 * (trainWidth + 10), y: bridgeY - trainHeight, bumpOffset: 0},
        {x: trainX - 4 * (trainWidth + 10), y: bridgeY - trainHeight, bumpOffset: 0},
        {x: trainX - 5 * (trainWidth + 10), y: bridgeY - trainHeight, bumpOffset: 0},
    ];

    // Function to draw the bridge
    function drawBridge() {
        ctx.beginPath();
        ctx.moveTo(0, bridgeY);
        ctx.lineTo(canvas.width, bridgeY);
        ctx.strokeStyle = '#686868';
        ctx.lineWidth = 10;
        ctx.stroke();
    }

    function getOffset(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled) * 0.1;
      }

    function updateBumps() {
        bumps.shift();
        if (bumps.length <= trainCars.length * 60) {
            // Check if it's time to start a new bump
            if (Math.random() < 0.1) { // 10% chance to start a bump
                // Start a new bump with initial strength
                let initialOffset = getOffset(min, max) * 10 - 2.5;
                for (let car = 0; car < trainCars.length; car++) {
                    let currOffset = initialOffset;
                    let stopOffset = 0.25;

                    while (true) {
                        if (Math.abs(currOffset) < stopOffset) {
                            bumps.push(0);
                            break;
                        }
                        else {
                            for (let i = 0; i < 60; i++) {
                                bumps.push(currOffset)
                            }
                            currOffset = currOffset * 0.75
                        }
                    }
                }
            } 
            else {
                bumps.push(0);
            }
        }
    }

    function drawTrains() {
        if (trains.size == 0) {
            console.log("No trains :(");
            return
        }
        for (const train of trains.values()) {
            if (train.isNew) {
                if (train.direction === "S") {
                    train.location = width - train.location;
                }
                else {
                    train.location = train.location;
                }
                train.isNew = false;
            }
            else {
                if (train.direction === "S") {
                    train.location -= 1;
                }
                else {
                    train.location += 1;
                }
            }
            if (train.location >= 360 || trains.location <= 0) {
                trains.delete(train.id)
            }

            ctx.fillStyle = '#FF0000';
            ctx.fillRect(train.location, bridgeY - trainHeight, trainWidth, trainHeight);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '16px Arial';

            const textWidth = ctx.measureText(train.tripId).width;
            const textX = train.location + (trainWidth - textWidth) / 2;
            const textY = bridgeY - trainHeight / 2 + bridgeY / 20 - 5;

            ctx.fillText(train.tripId, textX, textY);
        }
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBridge();
        drawTrains();
        isNewGlobal = false;

    }
    animate();
    setInterval(animate, 1000);
});

const eventSource = new WebSocket('ws://localhost:3000');

eventSource.onopen = function(event) {
    console.log('Connection opened:', event);
    // You can also send messages to the server if needed
    // ws.send('Hello, server!');
  };
  
  eventSource.onerror = function(error) {
    console.log('WebSocket error:', error);
  };
  
  eventSource.onclose = function(event) {
    console.log('Connection closed:', event);
  };
  

eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    document.getElementById('updates').innerHTML = `<p>${JSON.stringify(data)}</p>`;

    for (const train of data.trains) {
        let tempTrain = train;
        if (!trains.has(train.id)) {
            tempTrain.isNew = true;
            trains.set(tempTrain.id, tempTrain)
        }
        else {
            let currTrain = trains.get(tempTrain.id);
            currTrain.isMoving = tempTrain.isMoving;
            currTrain.serverLocation = tempTrain.location
            trains.set(currTrain.id, currTrain);
        }
    }
    let freshTrainsMap = new Map();
    data.trains.forEach((train) => {
        freshTrainsMap.set(train.id, train);
    });

    for (const trainId of trains.keys()) {
        if (!freshTrainsMap.has(trainId)) {
            // Just continue it to the end and it will be deleted once it finishes
            let tempTrain = trains.get(trainId);
            tempTrain.isMoving = true;
            trains.set(trainId, tempTrain)
        }
    }

    console.log("trains", trains)

    // Need to keep a map of the trains on this side as well.
    // If the train is in the response, and isMoving, move
    // If the train is no longer in the response, move
    // If the train is in the response and not moving, stop
};
