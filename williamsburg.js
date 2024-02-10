document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800; // Adjust as needed
    canvas.height = 400; // Adjust as needed

    const bridgeY = canvas.height / 2;
    const trainWidth = 50;
    const trainHeight = 20;
    let trainX = -trainWidth;

    let bumps = [0, 0, 0]
    const min = 1
    const max = 10

    // Define a train with multiple cars
    const trainCars = [
        {x: trainX, y: bridgeY - trainHeight, bumpOffset: 0}, // Engine
        // Additional cars, initially positioned behind the engine
        {x: trainX - trainWidth - 10, y: bridgeY - trainHeight, bumpOffset: 0}, // Car 1
        {x: trainX - 2 * (trainWidth + 10), y: bridgeY - trainHeight, bumpOffset: 0}, // Car 2
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
        return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled) * 0.1; // The maximum is inclusive and the minimum is inclusive
      }

    function updateBumps() {
        bumps.shift();
        if (bumps.length <= trainCars.length) {

            // Check if it's time to start a new bump
            if (Math.random() < 0.1) { // 10% chance to start a bump
                // Start a new bump with initial strength
                let initialOffset = getOffset(min, max) * 5 - 2.5;
                bumps.push(initialOffset);
                let currOffset = initialOffset;
                let stopOffset = 0.25;
                while (true) {
                    if (Math.abs(currOffset) < stopOffset) {
                        bumps.push(0);
                        break;
                    }
                    else {
                        currOffset = currOffset = currOffset * 0.5
                        bumps.push(currOffset)
                        bumps.push(currOffset)
                        bumps.push(currOffset)
                        bumps.push(currOffset)
                    }
                }

            } else {
                // Ensure there's no abrupt start of a bump at the end of the array
                bumps.push(0);
            }
        }
        // Shift the bump effect down the train
        console.log(bumps)
    }
    
    function drawTrainWithCars() {
        updateBumps();
    
        for (let i = 0; i < trainCars.length; i++) {
            trainCars[i].x += 1;
            if (trainCars[i].x > canvas.width) {
                trainCars[i].x = -trainWidth; // Reset the car to start
            }
            // Apply the bump offset from the bumps array
            trainCars[i].bumpOffset = bumps[trainCars.length - i - 1];
    
            ctx.fillStyle = '#FF0000'; // Red train car
            ctx.fillRect(trainCars[i].x, trainCars[i].y + trainCars[i].bumpOffset, trainWidth, trainHeight);
        }
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

        drawBridge(); // Draw the bridge

        trainX += 2; // Move the train
        if (trainX > canvas.width) { // Reset the train position after crossing
            trainX = -trainWidth;
        }

        drawTrainWithCars(); // Draw the moving train

        requestAnimationFrame(animate); // Continue the loop
    }

    animate(); // Start the animation
});

