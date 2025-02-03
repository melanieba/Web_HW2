const express = require('express');
const router = express.Router();
const db = require('../utils/db');

router.post('/', async (req, res) => {
    const authToken = req.cookies.authToken;
    if (!authToken) {
        res.status(401).send({ message: "Not authorized" });
        return;
    }

    await db.deleteLogin(authToken);

    res.send('Logged out');
});


module.exports = router;