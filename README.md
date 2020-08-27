# Messaging service

Rise Vision Messaging Service

 - Distributes Pub/Sub notifications from [GCS](https://cloud.google.com/storage/docs/pubsub-notifications) as received from [Pub/Sub Connector](https://github.com/Rise-Vision/pub-sub-connector)

 - Debug logging can be enabled via `kill -s SIGUSR2 [pid]`

 - Attach to GKE pod via `kubectl exec -t -i [podname] bash` after `kubectl get pods`

## Development

*  Redis is installed
```bash
redis-server --version
```

*  Install dependencies:
```bash
npm install
```

* Set up `GOOGLE_APPLICATION_CREDENTIALS`

* Test:
```bash
npm run test
```

* Run locally

Start redis and run with process environment variables

```bash
redis-server &
PROJECT_ID=[] CONNECTION_STATUS_PUBSUB_TOPIC=[] PUBSUB_PUBLISH_CREDENTIAL_PATH=[] MS_PORT=[] node index.js
```

Connect to local instance

```bash
MS_PORT=[] node test/manual/test.js
```
