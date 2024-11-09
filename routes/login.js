const express = require('express');
const router = express.Router();
const fs = require('fs');

router.post('/', (req, res) => { 
  const { username, password } = req.body;
  console.log(`Login attempt with username: ${username} and password: ${password}`);

  fs.readFile('users.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading users.json:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    let users = [];
    if (data) {
      users = JSON.parse(data);
    }

    const user = users.find(user => user.username === username && user.password === password);
    console.log(`User found: ${user ? 'Yes' : 'No'}`);

    if (user) {
      res.status(200).json({ 
        message: 'User logged in successfully', 
        username: user.username,
        userFrameworks: user.userFrameworks || []
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
});

module.exports = router;