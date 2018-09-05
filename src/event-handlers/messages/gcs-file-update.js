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
    return addIntoFolder(pscData)
    .then(checkEntryNeedsUpdate)
    .then(getWatchers)
    .then(data=>{
      if (data.type === "DELETE") {return deleteEntry(data);}
      if (["ADD", "UPDATE"].includes(data.type)) {return updateEntry(data);}
    })
    .then(data=>{
      if (!data.watchers.length) {return;}

      return module.exports.doOnAllPods(data)
      .then(() => redisPubsub.publishToPods(data));
    })
    .catch(err=>{
      if (err) {console.error(pscData, err.stack);}
    });
  },
  doOnAllPods(data) {
    const {filePath, version, type} = data;
    const isAddOrUpdate = ["ADD", "UPDATE"].includes(type);

    return Promise.all(data.watchers
      .filter(displayConnections.hasSparkFor)
      .map(watcher =>
        db.watchList.lastChanged(watcher)
        .then(watchlistLastChanged => {
          const message = {
            filePath, version, type, topic: "MSFILEUPDATE", watchlistLastChanged
          };

          if (isAddOrUpdate) {
            message.token = makeToken({filePath, version, displayId: watcher}).token;
          }

          return displayConnections.sendMessage(watcher, message);
    })));
  }
};

function addIntoFolder(data) {
  if (!["ADD", "UPDATE"].includes(data.type)) {return Promise.resolve(data);}

  return db.folders.watchingFolder(data.filePath)
  .then(watching=>{
    if (!watching) {return Promise.resolve(data);}

    return db.folders.addFileToFolder(data);
  });
}

function checkEntryNeedsUpdate(data) {
  if (data.addedIntoFolder) {return data;}

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
    db.folders.removeFileFromFolder(data.filePath).then(removeCount => {
      if (removeCount > 0) {
        return db.watchList.removeEntry(data.filePath, data.watchers);
      }
    }),
    db.fileMetadata.setFileVersion(data.filePath, "0")
  ])
  .then(()=>data);
}

function updateEntry(data) {
  logger.log(`Updating entry for ${JSON.stringify(data)}`);
  const {filePath, version} = data;

  return db.fileMetadata.setFileVersion(filePath, version)
  .then(()=>db.watchList.updateVersion(filePath, version, data.watchers))
  .then(()=>{
    if (data.addedIntoFolder) {
      return db.fileMetadata.addDisplaysTo(filePath, data.watchers);
    }
  })
  .then(()=>data);
}
