const express = require('express');
const router = express.Router();

/*
router.post('/', (req, res) => {
  const { username, password } = req.body
  //res.send({ username, password});
  res.send('testing');
});*/

router.post('/', (req, res) => {
  res.send('testing');
});

module.exports = router;