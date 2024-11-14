process.removeAllListeners('warning');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const fs = require('fs');
const rootRoute = require('./routes/root');
const signupRoute = require('./routes/signup');
const loginRoute = require('./routes/login');
const angularRoute = require('./frameworks/angular');
const reactRoute = express.Router();
const vueRoute = express.Router();

app.use(cors());
app.use(express.json());

app.use('/', rootRoute);
app.use('/signup', signupRoute);
app.use('/login', loginRoute);

app.use('/angular', angularRoute);
app.use('/react', require('./frameworks/react'));
app.use('/vue', require('./frameworks/vue'));

app.post('/github', async (req, res) => {
  try {
    const { username, repository } = req.body;
    console.log(`Creating repository ${repository} for user ${username}`);

    const { Onctokit } = require('@octokit/core');

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
