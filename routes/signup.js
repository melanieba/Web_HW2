const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../utils/db');

router.post('/', async (req, res) => {
  const { username, password } = req.body
  const hashedPassword = bcrypt.hashSync(password, 10);

  let user = await db.findUserByUserName(username);
  if (user) {
    res.status(400).send({ message: 'User already exists' });
    return;
  }

  await db.storeNewUser(username, hashedPassword);

  let responseContext = {
    message: "User created successfully",
    user: {
        username: username,
    }};

  res.send(responseContext);
});


module.exports = router