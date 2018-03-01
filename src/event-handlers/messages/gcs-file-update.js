const makeToken = require("../../token/make-token");
const db = require("../../db/api");
const displayConnections = require("../display-connections");
const redisPubsub = require("../../redis-pubsub");
const logger = require("../../logger");

module.exports = {
  canHandle(data) {
    return data.filePath && ["ADD", "UPDATE", "DELETE"].includes(data.type);
  },
  doOnIncomingPod(pscData) {
    return entryExists(pscData)
    .then(getWatchers)
    .then(data=>{
      if (data.type === "DELETE") {return deleteEntry(data);}
      if (["ADD", "UPDATE"].includes(data.type)) {return updateEntry(data);}
    })
    .then(data=>{
      if (!data.watchers.length) {return;}

      module.exports.doOnAllPods(data);
      redisPubsub.publishToPods(data);
    })
    .catch(err=>{
      if (err) {console.error(pscData, err.stack);}
    });
  },
  doOnAllPods(data) {
    const {filePath, version, type} = data;
    const msg = {filePath, version, type, topic: "MSFILEUPDATE"};

    data.watchers.forEach(watcher=>{
      if (!displayConnections.hasSparkFor(watcher)) {return;}

      displayConnections.sendMessage(watcher, ["ADD", "UPDATE"].includes(type) ?
        makeToken({...msg, displayId: watcher}) : msg);
    });
  }
};

function entryExists(data) {
  return db.fileMetadata.hasMetadata(data.filePath)
  .then(hasData=>{
    if (!hasData) {
      logger.log(`No metadata for ${data.filePath}`);
      return Promise.reject(); // eslint-disable-line prefer-promise-reject-errors
    }

    return data;
  });
}

function getWatchers(data) {
  return db.fileMetadata.getWatchersFor(data.filePath)
  .then(watcherList=>({...data, watchers: watcherList}));
}

function deleteEntry(data) {
  logger.log(`Removing entry for ${JSON.stringify(data)}`);
  return Promise.all([
    db.watchList.removeEntry(data.filePath, data.watchers),
    db.fileMetadata.deleteMetadata(data.filePath)
  ]).then(()=>data);
}

function updateEntry(data) {
  logger.log(`Updating entry for ${JSON.stringify(data)}`);
  const {filePath, version} = data;

  return db.fileMetadata.setFileVersion(filePath, version)
  .then(()=>db.watchList.updateVersion(filePath, version, data.watchers))
  .then(()=>data);
}
