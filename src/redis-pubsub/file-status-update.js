const podname = process.env.podname;
const makeToken = require("../token/make-token.js");
const db = require("../db/api.js");
const displayConnections = require("../messages/display-connections.js");
const logger = require("../logger.js");

module.exports = {
  processUpdate(msg) {
    const data = JSON.parse(msg);

    return distribute(metadataUpdateOnPrimaryPod(watchers(data)));
  }
}

function watchers(data) {
  return db.fileMetadata.getWatchersFor(data.filePath)
  .then(watcherList=>({...data, watchers: watcherList}));
}

function metadataUpdateOnPrimaryPod(watchersPromise) {
  return watchersPromise.then(data=>{
    if (data.podname !== podname || !data.watchers.length) {return data;}

    if (data.type === "DELETE") {return deleteEntry(data);}

    if (["ADD", "UPDATE"].includes(data.type)) {return updateEntry(data);}

    logger.log("Invalid notification type received");
    return {watchers: []};
  });
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

function distribute(watchersPromise) {
  return watchersPromise.then(data=>{
    const {filePath, version, type} = data;
    let msg = {filePath, version, type, topic: "MSFILEUPDATE"};

    data.watchers.forEach(watcher=>{
      msg = msg.type === "DELETE" ?
        msg :
        makeToken({...msg, displayId: watcher});

      displayConnections.sendMessage(watcher, msg);
    });
  });
}
