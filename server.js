io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('sendJudgeName', (data) => {
        console.log('Judge name received:', data.name);
        judgeName = data.name;
        io.emit('updateJudgeName', { judgeName });
    });

    // Listen for baseColor changes
    socket.on('baseColorChanged', (data) => {
        const { red, green, blue } = data;
        console.log(`Base color changed to Red: ${red}, Green: ${green}, Blue: ${blue}`);
        if (os.platform() === 'linux') {
            setRGBLight(red, green, blue);
        } else {
            console.log('DMX functionality not available on this platform.');
        }
    });

    socket.on('setRGBLight', (data) => {
        if (os.platform() === 'linux') {
            setRGBLight(data.red, data.green, data.blue);
        } else {
            console.log('DMX functionality not available on this platform.');
        }
    });

    socket.on('setBlackLight', (state) => {
        if (os.platform() === 'linux') {
            setBlackLight(state);
        } else {
            console.log('DMX functionality not available on this platform.');
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});
