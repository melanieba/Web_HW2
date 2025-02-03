const express = require('express');
const router = express.Router();
const db = require('../utils/db');

router.get('/', async (req, res) => {

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

    let user = await db.findUserByUserName(userName);
    delete user.hashedPassword;
    delete user._id;

    res.send(user);
});


module.exports = router;