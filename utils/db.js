const mongodb = require('mongodb');

const mongoDBServerUrl = 'mongodb://localhost:27017';
const dbName = 'hw2db';

const usersCollectionName = 'users';
const loginsCollectionName = 'logins';

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

module.exports = { storeNewUser, findUserByUserName, storeLogin, getUserNameByAuthToken, deleteLogin };