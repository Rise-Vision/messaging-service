# 2 - Trashed files handling

### Status
Accepted

### Decision
A custom GCS metadata field named "trashed" is set to true/false indicating that the file is trashed or restored. GCS buckets for every company is [configured to notifiy changes](https://cloud.google.com/storage/docs/pubsub-notifications) in the metadata through the OBJECT_METADATA_UPDATE event. Pub/Sub [connector](https://github.com/Rise-Vision/pub-sub-connector) listens to this event, sending DELETE/ADD messages to messaging service.

### Context
Displays should not show "trashed" content. When a file is trashed, [storage server](https://github.com/Rise-Vision/storage-server/) keeps it in the GCS bucket removing the public read permission of the file. We decided to create a specific metadata field for the trashed state because we can eventually change the way we set permissions regardless of the trashed state.

### Consequences
Trashed state handling is not coupled to permission changes, altough we still remove read permissions to trashed files.

All existing and new GCS buckets are configured to notify OBJECT_METADATA_UPDATE events.

Messaging service publishes DELETE or ADD messages to displays when files are trashed or restored so that local storage module can expose the messages to widgets react accordingly on content.

### Rejected alternatives
#### Handle file permission changes
Instead of creating a separate GCS metadata field, Pub/Sub connector could listen to the same metadata change event but check for public read permission to send DELETE/ADD messages. However trashed state would be coupled to public permission absence preventing us from setting more restrict permissions in the future.

## Related documents

 - Issue [#732](https://github.com/Rise-Vision/rise-launcher-electron/issues/732)
 - Design [document](https://docs.google.com/document/d/15GXam2BtNWSXVjYPk9KWUaShQ8CUd3OWDTCHxG8KCu0/)
