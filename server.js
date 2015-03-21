var net = require("net");

var chatServer = net.createServer(),
	clientList = [],
	commands = [
		{ name: "commands", desc: "Prints a list of commands and their uses" },
		{ name: "setname",	desc: "Changes your name. Use as !setname [newname]" },
		{ name: "smile", 	desc: "Sends a smiley to your friends." },
		{ name: "sad",		desc: "Sends a sad face to your friends."}
	];

	

chatServer.on('connection', function(client){

	client.name = client.remoteAddress + ':' + client.remotePort;
	client.write('Hi, ' + client.name + "\n");

	clientList.push(client);
	console.log("Client: " + client.name + " has connected.");
	
	client.on('data', function(data) {
		process(data.toString().trim(), client);
	});

	client.on('end', function() {
		clientList.splice(clientList.indexOf(client), 1);
		process("Client: " + client.name + " has disconnected.", client);
	});

	client.on('error', function(err) {
		console.log(err);
	});

}).listen(9000);

function process(message, client) {
	if (message.charAt(0) == "!") {
		processCommand(message.substring(1), client);
	} else {
		broadcast(message, client);
	}
}

function processCommand(command, client) {
	command = command.split(" ");
	switch(command[0]) {
		case "commands":
			for (var i = 0; i < commands.length; i++) {
				client.write("!" + commands[i]['name'] + "\t-\t" + commands[i]['desc'] + "\n");
			}
			break;
		case "setname":
			if (command.length > 2) {
				client.write("Names cannot contain spaces.\n");
			} else {
				client.previousName = client.name;
				client.name = command[1];
				client.write("Your name is now " + client.name + "\n");
				broadcast(client.previousName + " changed name to " + client.name, client);
			}
			break;
		case "smile":
			broadcast(":)", client);
			break;
		case "sad":
			broadcast(":(", client);
			break;
		default:
			client.write("!" + command[0] + " is not a valid command. Please use !commands to see a command list.\n");
			

	}
}

function broadcast(message, client) {
	var cleanup = [];
	for (var i = 0; i < clientList.length; i++) {
		if(client !== clientList[i]) {
			if (clientList[i].writable) {
				clientList[i].write(client.name + ": " + message + "\n");
			} else {
				cleanup.push(clientList[i]);
				clientList[i].destroy();
			}
		}
	}
	for (var i = 0; i < cleanup.length; i++) {
		clientList.splice(clientList.indexOf(cleanup[i]), 1);
	}
}




console.log('ChatServer Running on: localhost:9000');