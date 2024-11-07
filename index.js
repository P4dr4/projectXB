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
  res.send('');
});

app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;
  const newUser = { username, email, password, userFrameworks: [] };

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

app.post('/login', (req, res) => { 
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
      console.log('Users:', users);
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

app.post('/angular', (req, res) => {
  const { username } = req.body;

  fs.readFile('users.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading users.json:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    let users = [];
    if (data) {
      users = JSON.parse(data);
      console.log('Users:', users);
    }

    const user = users.find(user => user.username === username);
    if (user) {
      if (!user.userFrameworks) {
        user.userFrameworks = ['Angular'];
      } else if (Array.isArray(user.userFrameworks)) {
        if (!user.userFrameworks.includes('Angular')) {
          user.userFrameworks.push('Angular');
        }
      } else {
        user.userFrameworks = [user.userFrameworks, 'Angular'];
      }

      fs.writeFile('users.json', JSON.stringify(users, null, 2), err => {
        if (err) {
          console.error('Error writing to users.json:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(200).json({ message: 'Framework added to user', framework: 'Angular' });
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });
});

app.post('/react', (req, res) => {
  fs.readFile('frameworks.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading frameworks.json:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    let frameworks = [];
    if (data) {
      frameworks = JSON.parse(data);
      console.log('Frameworks:', frameworks);
    }

    const reactFramework = frameworks.find(fw => fw.name === 'React');
    res.status(200).json({ framework: reactFramework });
  });
});

app.post('/vue', (req, res) => {
  fs.readFile('frameworks.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading frameworks.json:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    let frameworks = [];
    if (data) {
      frameworks = JSON.parse(data);
      console.log('Frameworks:', frameworks);
    }

    const vueFramework = frameworks.find(fw => fw.name === 'Vue');
    res.status(200).json({ framework: vueFramework });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});