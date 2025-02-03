const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const auth = require('../utils/auth');

router.get('/', async (req, res) => {

    let userName = await auth.getLoggedUserName(req, res);
    if (!userName) {
        return;
    }

    let user = await db.findUserByUserName(userName);
    delete user.hashedPassword;
    delete user._id;

    res.send(user);
});


module.exports = router;