const http = require('http');

const patientId = 'd3db5e8a-9a78-4333-a33a-9e615b4e2b2a';
const ports = [3000, 3001, 3002];

function checkPort(port) {
    return new Promise((resolve) => {
        const url = `http://localhost:${port}/patients/${patientId}`;
        console.log(`Checking ${url}...`);

        const req = http.get(url, (res) => {
            console.log(`Port ${port} status: ${res.statusCode}`);
            if (res.statusCode === 200) resolve(true);
            else resolve(false);
        });

        req.on('error', () => {
            console.log(`Port ${port}: Connection Refused/Error`);
            resolve(false);
        });

        req.end();
    });
}

async function verify() {
    for (const port of ports) {
        const success = await checkPort(port);
        if (success) {
            console.log("SUCCESS: It works!");
            process.exit(0);
        }
    }
    console.log("ERROR: Could not connect to any port.");
    process.exit(1);
}

verify();
