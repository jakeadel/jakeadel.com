// Boids are just two vectors: velocity, and position
// Reference: https://vergenet.net/~conrad/boids/pseudocode.html
const std = @import("std");
// const print = std.debug.print;

const boid1 = Boid.init(
    @Vector(2, f64){ 1, 1 },
    @Vector(2, f64){ 1, 1 },
    "Boid 1",
);
const boid2 = Boid.init(
    @Vector(2, f64){ 20, 20 },
    @Vector(2, f64){ -1, -1 },
    "Boid 2",
);
const boid5 = Boid.init(
    @Vector(2, f64){ 50, 20 },
    @Vector(2, f64){ 10, -1 },
    "Boid 2",
);
const boid3 = Boid.init(
    @Vector(2, f64){ 90, 50 },
    @Vector(2, f64){ 9, -1 },
    "Boid 2",
);
const boid4 = Boid.init(
    @Vector(2, f64){ 40, 20 },
    @Vector(2, f64){ 10, 10 },
    "Boid 2",
);

const boid6 = Boid.init(
    @Vector(2, f64){ 400, 400 },
    @Vector(2, f64){ 0, 20 },
    "Boid 2",
);

const boid7 = Boid.init(
    @Vector(2, f64){ 400, 400 },
    @Vector(2, f64){ 0, 20 },
    "Boid 2",
);

const boid8 = Boid.init(
    @Vector(2, f64){ 400, 400 },
    @Vector(2, f64){ 0, 20 },
    "Boid 2",
);

extern fn logString(msg: [*:0]const u8) void;
extern fn logInt(value: i64) void;
extern fn logFloat(value: f64) void;
extern fn logArr(value: *const [2]f64) void;

fn logVector(vector: @Vector(2, f64)) void {
    const arr: [2]f64 = vectorToArr(vector);
    logArr(&arr);
}

fn vectorToArr(vector: @Vector(2, f64)) [2]f64 {
    return [2]f64{ vector[0], vector[1] };
}

var boids = [_]Boid{ boid1, boid2, boid3, boid4, boid5, boid6, boid7, boid8 };
const closeness = 20;
const fovRange = 50;
const maxSpeed = 5;
var allMass: @Vector(2, f64) = @Vector(2, f64){ 0, 0 };
var centerOfMass: @Vector(2, f64) = @Vector(2, f64){ 0, 0 };

export fn getNumBoids() usize {
    return boids.len;
}

fn getBoidsInFOV(boid: *Boid, range: f64) []usize {
    const MAX_SIZE: usize = 10;
    var boidsInFOV: [MAX_SIZE]usize = undefined;
    var next: usize = 0;

    for (boids, 0..) |other, index| {
        const xDiff = other.position[0] - boid.position[0];
        const yDiff = other.position[1] - boid.position[1];
        const euclideanDistance = std.math.sqrt(xDiff * xDiff + yDiff * yDiff);

        if (euclideanDistance < range and euclideanDistance != 0) {
            boidsInFOV[next] = index;
            next += 1;
        }
    }
    boidsInFOV[next] = getNumBoids() + 1;
    logInt(boidsInFOV.len);
    return boidsInFOV[0..MAX_SIZE];
}

export fn moveBoids(canvasWidth: f64, canvasHeight: f64) void {
    allMass = calcAllMass();
    centerOfMass = calcCenterOfMass();
    //const numBoids: usize = getNumBoids();
    //const numBoidsFloat: f64 = @floatFromInt(numBoids);

    for (&boids) |*boid| {
        // Rule 1: Boids try to fly towards the center of mass
        // Need to figure out how to get center of mass of all boids within the vicinity of the boid
        const boidsInFOV = getBoidsInFOV(boid, fovRange);
        logString("Boids in fov:");
        logFloat(@floatFromInt(boidsInFOV.len));

        var numBoidsInFOV: usize = 0;
        var totalMassInFOV = @Vector(2, f64){ 0, 0 };
        for (boidsInFOV) |otherInFOV| {
            if (otherInFOV == getNumBoids() + 1) {
                break;
            } else {
                totalMassInFOV += boids[otherInFOV].position;
                numBoidsInFOV += 1;
            }
        }

        var difference = @Vector(2, f64){ 0, 0 };
        if (numBoidsInFOV > 0) {
            logString("totalMassInFOV:");
            logVector(totalMassInFOV);
            const vecNumBoidsInFOV = @Vector(2, f64){ @floatFromInt(numBoidsInFOV), @floatFromInt(numBoidsInFOV) };
            logString("vecNumBoidsInFOV:");
            logVector(vecNumBoidsInFOV);
            const centerMassInFOV: @Vector(2, f64) = totalMassInFOV / vecNumBoidsInFOV;
            logString("centerMassInFOV:");
            logVector(centerMassInFOV);
            difference += ((centerMassInFOV - boid.position) / @Vector(2, f64){ 100, 100 });
            logString("difference:");
            logVector(difference);
        } else {
            difference = @Vector(2, f64){ 0, 0 };
        }

        var displacement = @Vector(2, f64){ 0, 0 };
        var veloDiff = @Vector(2, f64){ 0, 0 };
        for (&boids) |other| {

            // Rule 2: Boids try to stay closeness distance away from each other
            // If they are within closeness of each other,
            // proportional to the closeness
            const xDiff = other.position[0] - boid.position[0];
            const yDiff = other.position[1] - boid.position[1];
            const euclideanDistance = std.math.sqrt(xDiff * xDiff + yDiff * yDiff);
            //print("euclidean difference: {}\n", .{euclideanDistance});
            if (euclideanDistance < closeness) {
                displacement -= (other.position - boid.position) / @Vector(2, f64){ 10, 10 };
            }

            // Rule 3: Boids try to match velocity with nearby boids
            if (euclideanDistance < fovRange) {
                veloDiff += other.velocity;
            }
        }

        // Rule 3:
        // Avoid divide by 0 if numBoidsInFOV == 0
        if (numBoidsInFOV > 0) {
            veloDiff /= @Vector(2, f64){ @floatFromInt(numBoidsInFOV), @floatFromInt(numBoidsInFOV) };
            veloDiff -= boid.velocity;
            veloDiff /= @Vector(2, f64){ 8, 8 };
        }

        logString("veloDiff");
        logVector(veloDiff);

        boid.velocity += veloDiff + displacement + difference;

        boid.veloDiff = veloDiff;
        boid.displacement = displacement;
        boid.difference = difference;

        // Bound them to the canvas - 100 pixels
        if (boid.position[0] > canvasWidth - 100.0) {
            boid.velocity[0] -= maxSpeed / 5;
        } else if (boid.position[0] < 100.0) {
            boid.velocity[0] += maxSpeed / 5;
        }
        if (boid.position[1] > canvasHeight - 100.0) {
            boid.velocity[1] -= maxSpeed / 5;
        } else if (boid.position[1] < 100.0) {
            boid.velocity[1] += maxSpeed / 5;
        }

        // Limit speed
        const limit: f64 = maxSpeed;
        const boidMagnitude: f64 = boid.getMagnitude();
        if (boidMagnitude > limit) {
            boid.normalize();
            boid.scale(limit);
        }
        boid.position += boid.velocity;
    }
}

fn calcAllMass() @Vector(2, f64) {
    var total = @Vector(2, f64){ 0, 0 };
    for (boids) |boid| {
        total += boid.position;
    }
    return total;
}

fn calcCenterOfMass() @Vector(2, f64) {
    const numBoids: usize = getNumBoids();
    const numBoidsFloat: f64 = @floatFromInt(numBoids);

    return allMass / @Vector(2, f64){ numBoidsFloat, numBoidsFloat };
}

export fn getCenterOfMass() *@Vector(2, f64) {
    return &centerOfMass;
}

export fn getBoidPosition(index: usize) *@Vector(2, f64) {
    return &boids[index].position;
}

export fn getBoidName(index: usize) *[]const u8 {
    return &boids[index].name;
}

export fn getBoidVelocity(index: usize) *@Vector(2, f64) {
    return &boids[index].velocity;
}

export fn getBoidDisplacement(index: usize) *@Vector(2, f64) {
    return &boids[index].displacement;
}

export fn getBoidDifference(index: usize) *@Vector(2, f64) {
    return &boids[index].difference;
}

export fn getBoidVeloDiff(index: usize) *@Vector(2, f64) {
    return &boids[index].veloDiff;
}

const Boid = struct {
    position: @Vector(2, f64),
    velocity: @Vector(2, f64),
    displacement: @Vector(2, f64),
    difference: @Vector(2, f64),
    veloDiff: @Vector(2, f64),
    name: []const u8,

    pub fn init(position: @Vector(2, f64), velocity: @Vector(2, f64), name: []const u8) Boid {
        return Boid{ .position = position, .velocity = velocity, .name = name, .displacement = @Vector(2, f64){ 0, 0 }, .difference = @Vector(2, f64){ 0, 0 }, .veloDiff = @Vector(2, f64){ 0, 0 } };
    }

    pub fn getMagnitude(self: Boid) f64 {
        return std.math.sqrt(self.velocity[0] * self.velocity[0] + self.velocity[1] * self.velocity[1]);
    }

    pub fn normalize(self: *Boid) void {
        const magnitude: f64 = self.getMagnitude();
        if (magnitude != 0) {
            self.velocity[0] /= magnitude;
            self.velocity[1] /= magnitude;
        }
    }

    pub fn scale(self: *Boid, factor: f64) void {
        self.velocity[0] *= factor;
        self.velocity[1] *= factor;
    }
};

const UserBoid = struct {
    pub fn init(position: @Vector(2, f64), velocity: @Vector(2, f64), name: []const u8) Boid {
        return Boid{ .position = position, .velocity = velocity, .name = name, .displacement = @Vector(2, f64){ 0, 0 }, .difference = @Vector(2, f64){ 0, 0 }, .veloDiff = @Vector(2, f64){ 0, 0 } };
    }

    pub fn getMagnitude(self: Boid) f64 {
        return std.math.sqrt(self.velocity[0] * self.velocity[0] + self.velocity[1] * self.velocity[1]);
    }

    pub fn normalize(self: *Boid) void {
        const magnitude: f64 = self.getMagnitude();
        if (magnitude != 0) {
            self.velocity[0] /= magnitude;
            self.velocity[1] /= magnitude;
        }
    }

    pub fn scale(self: *Boid, factor: f64) void {
        self.velocity[0] *= factor;
        self.velocity[1] *= factor;
    }
};
