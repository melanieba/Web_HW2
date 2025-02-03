const db = require('../utils/db');

async function getLoggedUserName(req, res) {
    const authToken = req.cookies.authToken;
    if (!authToken) {
        res.status(401).send({ message: "Not authorized" });
        return;
    }

    let userName = await db.getUserNameByAuthToken(authToken);
    if (!userName) {
        res.status(401).send({ message: "Wrong auth token" });
        return;
    }

    return userName;
}

module.exports = { getLoggedUserName };