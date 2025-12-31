



import WebSocket from 'ws';
import chalk from 'chalk';


// 6K9TNNCD1FG9HVDDRN7WKPML


const user_id = 'MTYxOTY1--017bdbb5a3f6a745edd94b25227b411a40d38dcd';
// const user_id = 'MTYxOTYddcdcd';


const cookie = [
	`user.id=${user_id}`,
].join('; ');


// WebSocket target and headers
const url = 'wss://profile.intra.42.fr/cable';

const campuses = {
	16: 'Khouribga',
	21: 'Ben Guerir',
	75: 'Rabat',
};

const filters = {
	campus_ids: [16],
	logins: [/^mzeggaf$/],
	// hosts: [/^e3p10p(12|14|16|18)$/, new RegExp('^e3r3p2$')]
};

// 🖨️ Pretty print function
function colorPrintJson(location) {
	const status = location.end_at
		? chalk.red('"Logged OUT"')
		: chalk.green('"Logged IN"');

	const campuse = campuses[location.campus_id] | location.campus_id;

	const output = {
		login: chalk.bold.yellow(`"${location.login}"`),
		host: chalk.cyan(`"${location.host}"`),
		status: status,
		campus_id: chalk.yellow(`"${location.campus_id}"`),
		campuse: chalk.blue(`"${campuse}"`),
		begin_at: chalk.magenta(`"${location.begin_at}"`),
		...(location.end_at ? { end_at: chalk.magenta(`"${location.end_at}"`) } : {}),
		...(location.image ? { image: chalk.underline.blue(`"${location.image}"`) } : {})
	};

	console.log(chalk.gray('{\n') +
		Object.entries(output)
			.map(([key, val]) => `  ${chalk.green(`"${key}"`)}: ${val}`)
			.join(',\n') +
		chalk.gray('\n}')
	);
}

// 🎯 Apply filters to only show what you care about
function shouldDisplay(location) {

	filters.campus_ids = filters.campus_ids || [];
	filters.logins = filters.logins || [];
	filters.hosts = filters.hosts || [];

	const campusMatch = filters.campus_ids.length === 0 || filters.campus_ids.includes(location.campus_id);

	const loginMatch =
		filters.logins.length === 0 ||
		filters.logins.some((regex) => regex.test(location.login));

	const hostMatch =
		filters.hosts.length === 0 ||
		filters.hosts.some((regex) => regex.test(location.host));

	return campusMatch && loginMatch && hostMatch;
}

// 📦 Handle incoming messages
function parseAndDisplay(data) {
	try {
		const parsed = JSON.parse(data);
		if (parsed.type === 'ping') return;

		const location = parsed?.message?.location;
		if (!location) return;


		if (shouldDisplay(location)) {
			colorPrintJson(location);
			fetch(`https://api.callmebot.com/whatsapp.php?phone=212636712255&text=${encodeURIComponent(location.login + ' is now ' + (location.end_at ? 'logged out' : 'logged in') + ' from ' + location.host)}&apikey=4264855`)
				.then(response => {
					if (!response.ok) {
						throw new Error('Network response was not ok');
					}
					return response.text();
				})
				.finally(() => {
					console.log(chalk.blue('[→] Notification sent'));
				});
		}
	} catch (err) {
		console.error(chalk.red('JSON parse error:'), err);
	}
}

// 🧠 Setup WebSocket client
const ws = new WebSocket(url, 'actioncable-v1-json', {
	headers: {
		Host: 'profile.intra.42.fr',
		Connection: 'Upgrade',
		Pragma: 'no-cache',
		'Cache-Control': 'no-cache',
		'User-Agent': 'Mozilla/5.0',
		Upgrade: 'websocket',
		Origin: 'https://meta.intra.42.fr',
		'Accept-Encoding': 'gzip, deflate',
		'Accept-Language': 'en-US,en;q=0.9',
		Cookie: `user.id=${user_id}`,
	}
});

// 📨 Subscribe to channel
const subscribeMessage = {
	command: 'subscribe',
	identifier: JSON.stringify({
		channel: 'LocationChannel',
		user_id: 161965
	}),
};

ws.on('open', () => {
	console.log(chalk.green('[✔] Connected'));
	ws.send(JSON.stringify(subscribeMessage));
	console.log(chalk.blue('[→] Sent subscription:'), subscribeMessage);
});

ws.on('message', (data) => {
	parseAndDisplay(data.toString());
});

ws.on('error', (err) => {
	console.error(chalk.red('[✘] Error:'), err.message);
});

ws.on('close', (code, reason) => {
	console.log(chalk.red(`[✘] Closed with code ${code} and reason: ${reason}`));
});



// https://api.callmebot.com/whatsapp.php?phone=[phone_number]&text=[message]&apikey=[your_apikey]
// +34 644 33 66 63 