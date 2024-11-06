const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const fs = require('fs');

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} request for '${req.url}'`);
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;
  const newUser = { username, email, password };

  fs.readFile('users.json', 'utf8', (err, data) => {
    let users = [];
    if (!err && data) {
      users = JSON.parse(data);
    }

    const userExists = users.some(user => user.email === email);

    if (userExists) {
      res.status(400).send('User already exists');
    } else {
      users.push(newUser);

      fs.writeFile('users.json', JSON.stringify(users, null, 2), err => {
        if (err) {
          res.status(500).send('Error saving user');
        } else {
          res.status(201).send('User signed up successfully');
        }
      });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});