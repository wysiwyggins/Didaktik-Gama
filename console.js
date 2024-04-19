//npm install onoff

const Gpio = require('onoff').Gpio;
const encoderA = new Gpio(17, 'in', 'both'); // Example pin number
const encoderB = new Gpio(18, 'in', 'both'); // Example pin number

let lastEncoded = 0;
let encoderValue = 0;
const open = require('open');

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    open(`http://localhost:${PORT}`);  // Automatically opens the default browser
});

function updateEncoder() {
    const MSB = encoderA.readSync();
    const LSB = encoderB.readSync();
    const encoded = (MSB << 1) | LSB;
    const sum = (lastEncoded << 2) | encoded;

    if (sum === 0b1101 || sum === 0b0100 || sum === 0b0010 || sum === 0b1011) encoderValue++;
    if (sum === 0b1110 || sum === 0b0111 || sum === 0b0001 || sum === 0b1000) encoderValue--;

    lastEncoded = encoded;

    io.emit('changeSketch', encoderValue); // Emitting the change sketch event with the new value
}

encoderA.watch((err, value) => {
    if (err) {
        console.error('There was an error', err);
        return;
    }
    updateEncoder();
});

encoderB.watch((err, value) => {
    if (err) {
        console.error('There was an error', err);
        return;
    }
    updateEncoder();
});
