# Messaging service

Rise Vision Messaging Service

 - Distributes Pub/Sub notifications from [GCS](https://cloud.google.com/storage/docs/pubsub-notifications) as received from [Pub/Sub Connector](https://github.com/Rise-Vision/pub-sub-connector)

 - Debug logging can be enabled via `kill -s SIGUSR2 [pid]`

 - Attach to GKE pod via `kubectl exec -t -i [podname] bash after `kubectl get pods`
