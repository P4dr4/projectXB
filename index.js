require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const fs = require('fs');
// Remove the Octokit require here

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
  const { username } = req.body;

  fs.readFile('users.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading users.json:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    let users = [];
    if (data) {
      users = JSON.parse(data);
    }

    const user = users.find(user => user.username === username);
    if (user) {
      if (!user.userFrameworks) {
        user.userFrameworks = ['React'];
      } else if (Array.isArray(user.userFrameworks)) {
        if (!user.userFrameworks.includes('React')) {
          user.userFrameworks.push('React');
        }
      } else {
        user.userFrameworks = [user.userFrameworks, 'React'];
      }

      fs.writeFile('users.json', JSON.stringify(users, null, 2), err => {
        if (err) {
          console.error('Error writing to users.json:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(200).json({ message: 'Framework added to user', framework: 'React' });
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });
});

app.post('/vue', (req, res) => {
  const { username } = req.body;

  fs.readFile('users.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading users.json:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    let users = [];
    if (data) {
      users = JSON.parse(data);
    }

    const user = users.find(user => user.username === username);
    if (user) {
      if (!user.userFrameworks) {
        user.userFrameworks = ['Vue'];
      } else if (Array.isArray(user.userFrameworks)) {
        if (!user.userFrameworks.includes('Vue')) {
          user.userFrameworks.push('Vue');
        }
      } else {
        user.userFrameworks = [user.userFrameworks, 'Vue'];
      }

      fs.writeFile('users.json', JSON.stringify(users, null, 2), err => {
        if (err) {
          console.error('Error writing to users.json:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(200).json({ message: 'Framework added to user', framework: 'Vue' });
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });
});

// chamada para criar um repositorio no github
app.post('/github', async (req, res) => {
  try {
    const { username, repository } = req.body;
    console.log(`Creating repository ${repository} for user ${username}`);

    // Dynamic import of Octokit
    const { Octokit } = await import('@octokit/core');
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    fs.readFile('users.json', 'utf8', async (err, data) => {
      if (err) {
        console.error('Error reading users.json:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      let users = [];
      if (data) {
        users = JSON.parse(data);
      }

      const user = users.find(user => user.username === username);
      if (user) {
        try {
          const response = await octokit.request('POST /user/repos', {
            name: repository,
            private: true,
          });
          console.log('Repository created:', response.data);
          res.status(201).json({ message: 'Repository created successfully', repository: response.data });
        } catch (error) {
          console.error('Error creating repository:', error);
          res.status(500).json({ message: 'Error creating repository' });
        }
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
