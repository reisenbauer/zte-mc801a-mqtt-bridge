const axios = require("axios");
const crypto = require("crypto");
const EventEmitter = require('events');
const mqtt = require('mqtt')
class zte extends EventEmitter {
    instance = null;
    password = null;
    cookie = null;
    lastId = null;
    isLoggedIn = false;
    mqtt_client  = null;
    mqtt_topic = null;
    sms = [];
    constructor(password, instance, interval, mqtt_config) {
        super();
        this.instance = instance;
        this.password = password;
        this.WebSocketEvents();
        let { host = null, topic = null, user = null, pass = null } = mqtt_config.mqtt;
        if(host && topic) {
            console.log("INFO: Relaying SMS to MQTT enabled (Broker: "+host+", Topic: "+topic+").")
            const options = {

            }
            if(user && pass) {
                options.username = user;
                options.password = pass;
                console.log("INFO: Using Authentication for MQTT (User: "+options.username+").");
            }
            this.mqtt_client  = mqtt.connect(host, options);
            this.mqtt_topic = topic;
        }
        console.log("INFO: Polling ZTE Modem every ", interval/1000, "seconds.")
        setInterval(() => {
            this.WebSocketEvents();
        }, interval)
    }

    async WebSocketEvents() {
        const sms = await this.getSMS();
        if(sms[0] && this.lastId !== sms[0].id) {
            this.emit('sms', sms[0]);
            this.lastId = sms[0].id;
            delete sms[0].event;
            if(this.mqtt_client) {
                this.mqtt_client.publish(this.mqtt_topic, JSON.stringify(sms[0]));
            }
            console.log("INFO: Sending to Clients:", sms[0])
            this.sms.push(sms[0]);
        }
    }

    getSMSList() {
        return this.sms;
    }
    async getLD() {
        return new Promise((resolve, reject) => {
            this.instance.get("/goform/goform_get_cmd_process?isTest=false&cmd=LD")
            .then((r) => {
                resolve(r.data.LD);
            })            
        })
    }

    async login() {
        return new Promise(async (resolve, reject) => {
            if(this.isLoggedIn) {
                resolve(true);
            }
            const ld = await this.getLD();
            const hashPassword = crypto.createHash('sha256').update(this.password).digest("hex").toUpperCase()
            const ztePass = crypto.createHash('sha256').update(hashPassword+ld).digest("hex").toUpperCase()
            const params = new URLSearchParams();
            params.append('parisTestam1', false);
            params.append('goformId', 'LOGIN');
            params.append('password', ztePass);
            this.instance.post("/goform/goform_set_cmd_process", params)
            .then((r) => {
                this.cookie = r.headers["set-cookie"][0];
                resolve(true);
            })
            .catch((e) => {
                console.log("ERROR: login() failed.");
            })
        })
    }
    async getSMS() {
        await this.login();
        return new Promise((resolve, reject) => {
            this.instance.get("/goform/goform_get_cmd_process?isTest=false&cmd=sms_data_total&page=0&data_per_page=1&mem_store=1&tags=1&order_by=order+by+id+desc", {
                headers: {
                    Cookie: this.cookie,
                }
            })
            .then((r) => {
                const smsList = r.data.messages.map((s) => {
                    let buf = Buffer.from(s.content, "hex");
                    const date = s.date.split(",");
                    const realDate = date[0]+"."+date[1]+"."+date[2]+" "+date[3]+":"+date[4]+":"+date[5];
                    return {
                        id: parseFloat(s.id),
                        date: realDate,
                        from: s.number,
                        content: buf.toString().replace(/[^ -~]+/g, ""),
                        event: "newSMS",
                    }
                })
                resolve(smsList.sort(function(a, b){return a.id - b.id}));
            })
            .catch(() => {
                resolve({})
                this.isLoggedIn = false;
            })         
        })
    }
    static init(url = null, password = null, interval, mqtt_config) {
        const uri = new URL(url);
        const instance = axios.create({
            baseURL: url,
            headers: {
                referer: url+"/index.html",
                Host: uri.host,
            }
        });

        return new zte(password, instance, interval, mqtt_config);
    }
}

module.exports = zte;