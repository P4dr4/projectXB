const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

async function createReactFiles(octokit, owner, repo) {
  const files = {
    'package.json': {
      content: JSON.stringify({
        "name": repo,
        "version": "0.1.0",
        "private": true,
        "dependencies": {
          "@testing-library/jest-dom": "^5.17.0",
          "@testing-library/react": "^13.4.0",
          "@testing-library/user-event": "^13.5.0",
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "react-scripts": "5.0.1",
          "web-vitals": "^2.1.4"
        },
        "scripts": {
          "start": "react-scripts start",
          "build": "react-scripts build",
          "test": "react-scripts test",
          "eject": "react-scripts eject"
        },
        "eslintConfig": {
          "extends": ["react-app", "react-app/jest"]
        },
        "browserslist": {
          "production": [">0.2%", "not dead", "not op_mini all"],
          "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
        }
      }, null, 2)
    },
    'src/App.js': {
      content: `import React from 'react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to ${repo}</h1>
        <p>Edit src/App.js and save to reload.</p>
      </header>
    </div>
  );
}

export default App;`
    },
    'src/index.js': {
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
    },
    'README.md': {
      content: `# ${repo}

This project was bootstrapped with Create React App.

## Available Scripts

In the project directory, you can run:

### \`npm start\`

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.`
    }
  };

  await new Promise(resolve => setTimeout(resolve, 3000));

  let filesCreated = [];
  let hasErrors = false;

  for (const [path, { content }] of Object.entries(files)) {
    try {
      let sha;
      try {
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
          owner,
          repo,
          path,
          ref: 'init-branch'
        });
        sha = data.sha;
      } catch (error) {
        if (error.status !== 404) {
          console.warn(`Warning getting SHA for ${path}:`, error);
          continue;
        }
      }

      await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path,
        message: `Add ${path}`,
        content: Buffer.from(content).toString('base64'),
        branch: 'init-branch',
        ...(sha && { sha })
      });
      
      filesCreated.push(path);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error creating file ${path}:`, error);
      hasErrors = true;
      continue;
    }
  }

  try {
    await octokit.request('POST /repos/{owner}/{repo}/pulls', {
      owner,
      repo,
      title: 'Initial project setup',
      head: 'init-branch',
      base: 'main',
      body: 'Adding initial React project files'
    });
  } catch (error) {
    // Silently continue if PR creation fails
  }

  return {
    filesCreated,
    hasErrors,
    repoUrl: `https://github.com/${owner}/${repo}`
  };
}

router.post('/', async (req, res) => {
  const { username, repository } = req.body;
  if (!username || !repository) {
    return res.status(400).json({ message: 'Username and repository name are required' });
  }

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const user = await User.findOne({ username });

    if (user) {
      try {
        // Check if repo exists
        try {
          await octokit.request('GET /repos/{owner}/{repo}', {
            owner: username,
            repo: repository
          });
          return res.status(400).json({ message: 'Repository already exists' });
        } catch (error) {
          if (error.status !== 404) throw error;
        }

        // Create repository and files
        await octokit.request('POST /user/repos', {
          name: repository,
          private: true,
          auto_init: true,
          description: 'React project created with ProjectXB'
        });

        await new Promise(resolve => setTimeout(resolve, 2000));
        const result = await createReactFiles(octokit, username, repository);

        // Update user frameworks
        if (!user.userFrameworks.includes('React')) {
          user.userFrameworks.push('React');
          await user.save();
        }

        res.status(201).json({
          success: true,
          message: result.hasErrors ? 'Repository created with some files missing' : 'Repository created successfully',
          data: {
            name: repository,
            url: result.repoUrl,
            filesCreated: result.filesCreated
          }
        });
      } catch (error) {
        console.error('Error creating repository:', error);
        res.status(500).json({ message: 'Error creating repository: ' + error.message });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
