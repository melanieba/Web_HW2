const express = require('express');

const loginRouter = require('./routes/login')

const app = express();

app.use('/login', loginRouter);

// Define the sendGreeting function
function sendGreeting(req, res) {
  res.send('Hello! How are you?');
}

// Create a route that uses the sendGreeting function
app.get('/greet', sendGreeting);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});