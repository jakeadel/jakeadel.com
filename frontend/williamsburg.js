document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('bridgeCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 400;

    const bridgeY = canvas.height / 2;
    const trainWidth = 50;
    const trainHeight = 20;
    let trainX = -trainWidth;

    let bumps = []
    const min = 1
    const max = 10

    const trainCars = [
        {x: trainX - trainWidth - 10, y: bridgeY - trainHeight, bumpOffset: 0},
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
    
    function drawTrainWithCars() {
        updateBumps();
    
        for (let i = 0; i < trainCars.length; i++) {
            trainCars[i].x += 1;
            if (trainCars[i].x > canvas.width) {
                trainCars[i].x = -trainWidth; // Reset the car to start
            }
            // Apply the bump offset from the bumps array
            trainCars[i].bumpOffset = bumps[(trainCars.length - i - 1) * 60];
    
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(trainCars[i].x, trainCars[i].y + trainCars[i].bumpOffset, trainWidth, trainHeight);
        }
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawBridge();

        trainX += 2;
        if (trainX > canvas.width) {
            trainX = -trainWidth;
        }

        drawTrainWithCars();

        requestAnimationFrame(animate);
    }

    animate();
});

const eventSource = new EventSource('http://localhost:3000/update');
        
eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log(data)
    document.getElementById('updates').innerHTML = `<p>${JSON.stringify(data)}</p>`;
};