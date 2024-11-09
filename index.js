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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
