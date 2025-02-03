const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../utils/db');
const {v4: uuidv4} = require('uuid');

router.post('/', async (req, res) => {
  const { username, password } = req.body

  let user = await db.findUserByUserName(username);

  if (!user) {
    res.status(401).send({ message: "Invalid username or password" });
    return;
  }

  if (!bcrypt.compareSync(password, user.hashedPassword)) {
    res.status(401).send({ message: "Invalid username or password" });
    return;
  }

  let authToken = uuidv4();
  console.log(`authToken: ${authToken}`);

  await db.storeLogin(username, authToken);

  res.cookie('authToken', authToken, { httpOnly: true, maxAge: 3600 * 1000 });

  res.redirect(303, '/profile');
});


module.exports = router