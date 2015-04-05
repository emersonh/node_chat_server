var net = require("net");


//Create server
var chatServer = net.createServer(),
	clientList = [], //Array to store list of clients
	commands = [     //Array of commands information 
		{ name: "commands", desc: "Prints a list of commands and their uses" },
		{ name: "setname",	desc: "Changes your name. Use as !setname [newname]" },
		{ name: "smile", 	desc: "Sends a smiley to your friends." },
		{ name: "sad",		desc: "Sends a sad face to your friends."}
	];

	

chatServer.on('connection', function(client){

	//set the name attribute of the client object
	client.name = client.remoteAddress + ':' + client.remotePort;
	
	//Welcome the client and give info.
	client.write('Hi, ' + client.name + "\n"); 
	client.write('To see a list of commands, type "!commands"');

	//Add client to clientList array and log the connection.
	clientList.push(client);
	console.log("Client: " + client.name + " has connected.");
	
	//Trim whitespace and process the message
	client.on('data', function(data) {
		process(data.toString().trim(), client);
	});

	//When client disconnects, broadcast the disconnection and remove client from clientList
	client.on('end', function() {
		clientList.splice(clientList.indexOf(client), 1);
		process("Client: " + client.name + " has disconnected.", client);
	});

	//Log any errors
	client.on('error', function(err) {
		console.log(err);
	});

}).listen(9000);//Start listening on specified port number.

//process function determines if the message is a command or not and handles appropriately
function process(message, client) {
	if (message.charAt(0) == "!") {
		processCommand(message.substring(1), client);
	} else {
		broadcast(message, client);
	}
}

//processCommand function handles all command activity.
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
		case "info":
			client.write("Your name is currently " + client.name + "\n");
		default:
			client.write("!" + command[0] + " is not a valid command. Please use !commands to see a command list.\n");
			

	}
}

//Broadcast function handles all messages and sends them to all connected clients.
function broadcast(message, client) {
	var cleanup = [];
	for (var i = 0; i < clientList.length; i++) { //Loop through clientList array
		if(client !== clientList[i]) { //Don't send the message back to the sender
			if (clientList[i].writable) { //ensure the receiver is still writable.
				clientList[i].write(client.name + ": " + message + "\n"); //then broadcast the message to them
			} else {
				cleanup.push(clientList[i]); //if receiver is somehow not writable, add to cleanup array.
				clientList[i].destroy();
			}
		}
	}
	for (var i = 0; i < cleanup.length; i++) {
		clientList.splice(clientList.indexOf(cleanup[i]), 1); //loop through cleanup array and remove from clientList array.
	}
}

console.log('ChatServer Running on: localhost:9000');
