
const mongodb = require('mongodb');

const mongoDBServerUrl = 'mongodb://localhost:27017';
const dbName = 'hw2db';

const usersCollectionName = 'users';
const loginsCollectionName = 'logins';
const playlistsCollectionName = 'playlists';

async function sendCommand(dbCommand) {
    const client = new mongodb.MongoClient(mongoDBServerUrl);
    let db = await client.db(dbName);
    return await dbCommand(db);
}

async function storeNewUser(username, hashedPassword) {
    let newUser = {
        username: username,
        hashedPassword: hashedPassword
    };

    await sendCommand(async (db) => {
        return await db.collection(usersCollectionName).insertOne(newUser);
    });
}

async function findUserByUserName(username) {
    return await sendCommand(async (db) => {
        return await db.collection(usersCollectionName).findOne({ username: username });
    });
}

async function storeLogin(username, authToken) {
    let newLogin = {
        username: username,
        authToken: authToken
    };

    await sendCommand(async (db) => {
        return await db.collection(loginsCollectionName).insertOne(newLogin);
    });
}

async function getUserNameByAuthToken(authToken) {
    return await sendCommand(async (db) => {
        let login = await db.collection(loginsCollectionName).findOne({ authToken: authToken })
        return login ? login.username : null;
    });
}

async function deleteLogin(authToken) {
    return await sendCommand(async (db) => {
        return await db.collection(loginsCollectionName).deleteOne({ authToken: authToken });
    });
}

async function storePlaylist(creatorUserName, playlistName, isPrivate, tracks) {
    let newPlaylist = {
        name: playlistName,
        creatorUserName: creatorUserName,
        isPrivate: isPrivate,
        tracks: tracks
    };

    return await sendCommand(async (db) => {
        return await db.collection(playlistsCollectionName).insertOne(newPlaylist);
    });
}

async function getPlaylistByName(playlistName, userName) {
    return await sendCommand(async (db) => {
        return await db.collection(playlistsCollectionName).findOne({ name: playlistName, creatorUserName: userName });
    });
}

async function findPublicPlaylists() {
    return await sendCommand(async (db) => {
        return (await db.collection(playlistsCollectionName).find({ isPrivate: false })).toArray();
    });
}

async function findPrivatePlaylists(username) {
    return await sendCommand(async (db) => {
        return (await db.collection(playlistsCollectionName).find({ creatorUserName: username, isPrivate: true })).toArray();
    });
}

async function updatePlaylistFlag(userName, playlistName, isPrivate) {
    return await sendCommand(async (db) => {
        return await db.collection(playlistsCollectionName).updateOne({
            name: playlistName, creatorUserName: userName
        }, { $set: { isPrivate: isPrivate } });
    });
}

// tracks

async function addTrackToPlaylist(userName, playlistName, trackName, artistName) {
    return await sendCommand(async (db) => {
        let newTrack = { name: trackName, tags: [], artist: artistName };

        return await db.collection(playlistsCollectionName).updateOne({
            name: playlistName, creatorUserName: userName
        }, {
            $push: { tracks: newTrack }
        });
    });
}

async function deleteTrackToPlaylist(userName, playlistName, trackName, artistName) {
    return await sendCommand(async (db) => {
        return await db.collection(playlistsCollectionName).updateOne({
            name: playlistName, creatorUserName: userName
        }, {
            $pull: { tracks: { name: trackName, artist: artistName } },
        });
    });
}

async function updatePlaylistTracks(userName, playlistName, newTracks) {
    return await sendCommand(async (db) => {
        return await db.collection(playlistsCollectionName).updateOne({
            name: playlistName, creatorUserName: userName
        }, { $set: { tracks: newTracks } });
    });
}

module.exports = {
    storeNewUser, findUserByUserName, storeLogin, getUserNameByAuthToken, deleteLogin,
    storePlaylist, getPlaylistByName, findPublicPlaylists, findPrivatePlaylists, addTrackToPlaylist, deleteTrackToPlaylist,
    updatePlaylistTracks, updatePlaylistFlag
};