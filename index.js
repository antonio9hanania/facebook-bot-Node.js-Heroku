'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')

const app = express()

app.set('port', (process.env.PORT || 5000))


//allows us to process the data
app.use(bodyParser.urlencoded({extended: false}))

app.use(bodyParser.json())

//Routs

app.get('/', function(req, res){
	res.send("Hi I am a chatBot")
})


//facebook

app.get('/webhook/', function(req, res){
	if(req.query['hub.verify_token'] === process.env.VERIFY_TOKEN){
		res.send(req.query['hub.challenge'])
	}
	res.send("Wrong token")
})


app.post('/webhook/', function(req, res){
	if (req.body.object === 'page'){
		let messaging_events = req.body.entry[0].messaging

		for (let i = 0; i < messaging_events.length; i++) {
			let event = messaging_events[i]
			let sender = event.sender.id
			if (event.postback){
				processPostback(event);
			} 
			else if (event.message){
				processMessage(event);
			}
		}
		res.sendStatus(200) // everything went ok
	}
})


function processPostback(event) {
	const senderID = event.sender.id;
	const payload = event.postback.payload;
	console.log(payload);
	if (payload === 'first_time') {
		console.log("1");
		request({ url: "https://graph.facebook.com/v5.0/" + senderID,
			qs: { access_token: process.env.PAGE_ACCESS_TOKEN,
				fields: "first_name"
			},
			method: "GET"
		}, function(error, response, body) {
			console.log("2");
			let greeting = '';
			if (error) {
				console.error("Error getting user name: " + error);
			} else {
				console.log("3");
				let bodyObject = JSON.parse(body);
				console.log(bodyObject);
				let name = bodyObject.first_name;
				greeting = "Hello " + name  + ". ";
			}
			let message = greeting + "\nWelcome to your Personal Lawer. \nHope you are doing good today.\nWhat is your question?";
			console.log(message);
			senderAction(senderID);
			sendMessage(senderID, {text: message});
		});
	}
}

function processMessage(event) {
	if (!event.message.is_echo) {
		const message = event.message;
		const senderID = event.sender.id;
		if (message.text) {
			let text = message.text;
			let request = require("request");
			//sendText(event.sender, "test...")
			sendMessage(senderID, { text: 'need to process message: "'+ message+'"' });
			});
		}
	}
}



function sendMessage(recipientId, messageData){
	console.log("sendMessage, "+ messageData);
	return new Promise(function(resolve, reject) {
		request({
			url: "https://graph.facebook.com/v5.0/me/messages",
			headers: {'User-Agent': 'request'},
			qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
			method: "POST",
			json: {
				recipient: {id: recipientId},
				message: messageData,
			}

		}, function(error, response, body) {
			if (error) {
				console.log("Error sending message: " + response.error);
				reject(response.error);
			}
			else if(response.body.error){
				console.log("response body error")
				console.log(response.body.error);
			} 
			else {
				console.log("resolving body");
				resolve(body);
			}
		});
	});
	console.log("resolved");
}

function senderAction(recipientId){
	console.log("senderAction");
	request({
		url: "https://graph.facebook.com/v5.0/me/messages",
		qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
		method: "POST",
		json: { 
			recipient: {id: recipientId},
			"sender_action":"typing_on"
		}
	}, function(error, response, body) {
		if (error) {
			console.log("Error sending message: " + response.error);
		}
	});
}

app.listen(app.get('port'), function(){
	console.log("running: port")
})