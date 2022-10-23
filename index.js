"use strict";
const ZTE = require("./zte.lib.js");
const express = require("express");
let clients = [];
let zteclient = null;
function eventsHandler(request, response, next) {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      };
      response.writeHead(200, headers);
      response.write('retry: 10000\n\n');
      const list = zteclient.getSMSList()
      list.forEach((sms) => {
        response.write('data: '+JSON.stringify(sms)+'\n\n');        
      })
      const clientId = Date.now();
      const newClient = {
        id: clientId,
        response,
        request,
      };
      clients.push(newClient);
      request.on('close', () => {
        console.log(`${clientId} Connection closed`);
        clients = clients.filter(client => client.id !== clientId);
      });     
}

async function run() {
    const app = express();
    const {
        ZTE_PASS = null,
        ZTE_HOST = null,
        ZTE_INTERVAL = 5000,
        ZTE_MQTT_HOST = null,
        ZTE_MQTT_TOPIC = null,
        ZTE_MQTT_USER = null,
        ZTE_MQTT_PASS = null,

    } = process.env;


    if(!ZTE_PASS || !ZTE_HOST) {
        console.log("Please fix your environment variables.");
        process.exit(255);
    }

    const zte = await ZTE.init(ZTE_HOST, ZTE_PASS, ZTE_INTERVAL, {
        mqtt: {
            host: ZTE_MQTT_HOST,
            topic: ZTE_MQTT_TOPIC,
            user: ZTE_MQTT_USER,
            pass: ZTE_MQTT_PASS,
        }
    });
    zteclient = zte;
    zte.on("sms", (data) => {
        clients.forEach(client => client.response.write(`data: ${JSON.stringify(data)}\n\n`))
    })
    app.get('/status', (request, response) => response.json({clients: clients.length }));
    app.get('/push', eventsHandler);
    app.get("/sms", async (req, res) => {
        const data = await zte.getSMSList()
        res.send(data.reverse());
    })
    app.set("json spaces", 2)
    app.listen(3000);
    console.log("INFO: APP is Listening on Port", 3000)
}
run()
.catch((e) => {
    console.log("ERROR: ", e)
})