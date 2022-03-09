const fs = require('fs');

let save = null;
const saveFilePath = 'save.json';
const syncInfoPath = 'syncInfo.json';
let syncInfo = null;

let queue = [];

/**
 * Load save, create if doesn’t exist
 * @return {Promise} that resolves to save
 */
function loadSave() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(saveFilePath)) {
      save = {};
      fs.writeFileSync(saveFilePath, '{}', (err) => {
        if (err) {
          console.log('Error creating save:', err);
          reject(err);
        }
        resolve(save);
      });
    }
    fs.readFile(saveFilePath, (err, content) => {
      if (err) {
        console.log('Error loading save:', err);
        reject(err);
      }
      save = JSON.parse(content);
      resolve(save);
    });
  });
}

/**
 * Load syncInfo, create if doesn’t exist
 * @return {Promise} that resolves to syncInfo
 */
function loadSyncInfo() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(syncInfoPath)) {
      syncInfo = {};
      fs.writeFile(syncInfoPath, '{}', (err) => {
        if (err) {
          console.log('Error creating syncInfo:', err);
          reject(err);
        }
        resolve(syncInfo);
      });
    }
    fs.readFile(syncInfoPath, (err, content) => {
      if (err) {
        console.log('Error loading syncInfo:', err);
        reject(err);
      }
      syncInfo = JSON.parse(content);
      if (syncInfo.upQueue) queue = syncInfo.upQueue;
      resolve(syncInfo);
    });
  });
}

/**
 * Save save file
 */
function saveSave() {
  fs.writeFile(saveFilePath, JSON.stringify(save, null, 2), (err) => {
    if (err) return console.log('Error saving save:', err);
  });
}

/**
 * Save syncToken to file + date of sync (though right now the date is not used
 *  for anything).
 * @param {String} syncToken
 */
function saveSyncToken(syncToken) {
  const date = new Date();
  syncInfo.syncToken = syncToken;
  syncInfo.date = date;
  fs.writeFileSync(syncInfoPath, JSON.stringify(syncInfo), (err) => {
    if (err) return console.log('Error saving sync token:', err);
  });
}

/**
 * Save queue to file.
 * @param {Array} newQueue
 */
function saveQueue(newQueue) {
  syncInfo.upQueue = queue = newQueue;
  console.log('saveQueue queue state:', queue);
  fs.writeFileSync(syncInfoPath, JSON.stringify(syncInfo), (err) => {
    if (err) return console.log('Error saving upQueue:', err);
  });
}

/**
 * Check if there is a sync token in syncInfo, returning it if so, or null if
 *  there isn’t one
 * @return {String} sync token or null
 */
function getSyncToken() {
  if (fs.existsSync(syncInfoPath)) {
    try {
      syncInfo = JSON.parse(fs.readFileSync(syncInfoPath));
      const syncToken = syncInfo.syncToken;
      if (syncToken) {
        return syncToken;
      } else {
        return null;
      }
    } catch (err) {
      return console.log('Error loading sync token:', err);
    }
  } else {
    return null;
  }
}

const getSave = async () => {
  if (save == null) {
    return await loadSave();
  } else {
    return save;
  }
};

const getSyncInfo = async () => {
  if (syncInfo == null) {
    syncInfo = await loadSyncInfo();
  }
  return syncInfo;
};

const getQueue = async () => {
  if (syncInfo == null) {
    syncInfo = await loadSyncInfo();
  }
  return syncInfo.upQueue || [];
};

module.exports = {
  getSave,
  getSyncInfo,
  getQueue,
  saveSave,
  saveSyncToken,
  saveQueue,
  getSyncToken,
};
