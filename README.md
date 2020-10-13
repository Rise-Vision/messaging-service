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

## Deployment

### Mechanism
Deployment is completed via Circle Ci integration. A new docker image will be
created and the deployments will be updated to use the new image.

### Monitoring
Suggested deployment monitoring setup:

 1. Backend service details screen for the backend that is attached to the /messaging
    path. This will show backend utilization / rate while the deployment rolls
    out. It is typical for it to reach capacity and show a yellow hazard sign.
    See Kubernetes Engine -> Services & Ingress -> Ingress/Backend Services

 2. Monitor pods during rollout with `watch kubectl get pods`

 3. Monitor the backend responsiveness by polling the /presence path. For
    example:

    ``` bash
    while true; do sleep 5; echo -n $(date); echo -n " ";curl -H
    "content-type:application/json" -d '["some-displayid"]'
    "https://services.risevision.com/messaging/presence"; echo;done`
    ```
 4. Monitor a test connection to confirm it only drops once when its pod is
    terminated. It should not drop while other pods terminate, due to network
    backend saturation. `DISPLAY_ID=test-id-1 node test/manual/test.js`

 5. GCP Logging - GKE Cluster Operations (ensure no warnings / errors)
