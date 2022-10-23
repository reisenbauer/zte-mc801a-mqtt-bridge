## Features
 - MQTT Support
 - SSE Support

## Supported Modems
 - ZTE mc801a

## Docker Configuration
<pre>
# docker-compose.yml
version: '3'
services:
  zte-sms:
    image: ghcr.io/reisenbauer/zte-mc801a-mqtt-bridge:main
    container_name: zte-sms
    restart: unless-stopped
    ports:
      - "1099:3000"
    environment:
      - ZTE_HOST=http://192.168.0.1/
      - ZTE_PASS=highsecurepassword
      - ZTE_INTERVAL=2500
      - ZTE_MQTT_HOST=mqtt://10.10.10.20
      - ZTE_MQTT_TOPIC=inbound-sms
</pre>

## Environment Variables
| Flag  | Example Value  | Description  |
|---|---|---|
| ZTE_HOST  | http://192.168.0.1  | URI to connect your LTE Modem  |   |   |
| ZTE_PASS  | highsecurepassword  | Password to connect your LTE Modem  |   |   |
| ZTE_INTERVAL  |2500  | Interval your Modem is scanned for SMS (in ms)  |   |   |
| ZTE_MQTT_HOST  | mqtt://10.10.10.20  | MQTT Broker  |   |   |
| ZTE_MQTT_TOPIC  | sms  | MQTT Topic  |   |   |
| ZTE_MQTT_USER  | app  | MQTT Username  |   |   |
| ZTE_MQTT_PASS  | sec  | MQTT Password  |   |   |

## API Endpoints
| URL  | Description  |
|---|---|
| /push | SSE Event Source
| /sms | get last SMS |
| /status | Show how many clients are connected
