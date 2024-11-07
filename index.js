require('dotenv').config();
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

async function createAngularFiles(octokit, owner, repo) {
  const files = {
    'package.json': {
      content: JSON.stringify({
        "name": repo,
        "version": "0.0.0",
        "scripts": {
          "ng": "ng",
          "start": "ng serve",
          "build": "ng build",
          "watch": "ng build --watch --configuration development",
          "test": "ng test"
        },
        "private": true,
        "dependencies": {
          "@angular/animations": "^17.0.0",
          "@angular/common": "^17.0.0",
          "@angular/compiler": "^17.0.0",
          "@angular/core": "^17.0.0",
          "@angular/forms": "^17.0.0",
          "@angular/platform-browser": "^17.0.0",
          "@angular/platform-browser-dynamic": "^17.0.0",
          "@angular/router": "^17.0.0",
          "rxjs": "~7.8.0",
          "tslib": "^2.3.0",
          "zone.js": "~0.14.2"
        },
        "devDependencies": {
          "@angular-devkit/build-angular": "^17.0.0",
          "@angular/cli": "^17.0.0",
          "@angular/compiler-cli": "^17.0.0",
          "@types/jasmine": "~5.1.0",
          "jasmine-core": "~5.1.0",
          "karma": "~6.4.0",
          "karma-chrome-launcher": "~3.2.0",
          "karma-coverage": "~2.2.0",
          "karma-jasmine": "~5.1.0",
          "karma-jasmine-html-reporter": "~2.1.0",
          "typescript": "~5.2.2"
        }
      }, null, 2)
    },
    'src/app/app.component.ts': {
      content: `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: \`
    <h1>Welcome to {{ title }}!</h1>
    <router-outlet></router-outlet>
  \`,
  styles: []
})
export class AppComponent {
  title = '${repo}';
}`
    },
    'src/main.ts': {
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([])
  ]
}).catch(err => console.error(err));`
    },
    'README.md': {
      content: `# ${repo}

This project was generated with Angular CLI.

## Development server

Run \`ng serve\` for a dev server. Navigate to \`http://localhost:4200/\`. The application will automatically reload if you change any of the source files.`
    }
  };

  for (const [path, { content }] of Object.entries(files)) {
    try {
      // Try to get the file first to check if it exists
      let sha;
      try {
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
          owner,
          repo,
          path,
          ref: 'init-branch' // Changed from 'main' to 'init-branch'
        });
        sha = data.sha;
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
        // File doesn't exist, which is fine
      }

      // Create or update file
      await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path,
        message: `Add ${path}`,
        content: Buffer.from(content).toString('base64'),
        branch: 'init-branch', // Changed from 'main' to 'init-branch'
        ...(sha && { sha }) // Only include sha if file exists
      });
    } catch (error) {
      console.error(`Error creating file ${path}:`, error);
      throw error;
    }
  }
}

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

Runs the app in development mode.\nOpen [http://localhost:3000](http://localhost:3000) to view it in your browser.`
    }
  };

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
        if (error.status !== 404) throw error;
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
    } catch (error) {
      console.error(`Error creating file ${path}:`, error);
      throw error;
    }
  }
}

async function createVueFiles(octokit, owner, repo) {
  const files = {
    'package.json': {
      content: JSON.stringify({
        "name": repo,
        "version": "0.0.0",
        "private": true,
        "scripts": {
          "dev": "vite",
          "build": "vite build",
          "preview": "vite preview"
        },
        "dependencies": {
          "vue": "^3.3.8",
          "vue-router": "^4.2.5"
        },
        "devDependencies": {
          "@vitejs/plugin-vue": "^4.4.0",
          "vite": "^4.4.11"
        }
      }, null, 2)
    },
    'src/App.vue': {
      content: `<script setup>
// This is a Vue 3 component using <script setup>
</script>

<template>
  <div class="app">
    <header>
      <h1>Welcome to ${repo}</h1>
      <p>Edit src/App.vue and save to reload.</p>
    </header>
  </div>
</template>

<style>
.app {
  text-align: center;
  margin-top: 60px;
}
</style>`
    },
    'src/main.js': {
      content: `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`
    },
    'README.md': {
      content: `# ${repo}

This template should help get you started developing with Vue 3 in Vite.

## Project Setup

\`\`\`sh
npm install
\`\`\`

### Compile and Hot-Reload for Development

\`\`\`sh
npm run dev
\`\`\``
    }
  };

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
        if (error.status !== 404) throw error;
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
    } catch (error) {
      console.error(`Error creating file ${path}:`, error);
      throw error;
    }
  }
}

app.post('/angular', async (req, res) => {
  const { username, repository } = req.body;
  if (!username || !repository) {
    return res.status(400).json({ message: 'Username and repository name are required' });
  }
  console.log(`Creating Angular repository '${repository}' for user '${username}'`);

  try {
    const { Octokit } = await import('@octokit/core');
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    fs.readFile('users.json', 'utf8', async (err, data) => {
      if (err) {
        console.error('Error reading users.json:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      let users = data ? JSON.parse(data) : [];
      const user = users.find(user => user.username === username);

      if (user) {
        try {
          // Check if repository exists first
          try {
            await octokit.request('GET /repos/{owner}/{repo}', {
              owner: username,
              repo: repository
            });
            return res.status(400).json({ message: 'Repository already exists' });
          } catch (error) {
            if (error.status !== 404) {
              throw error;
            }
            // 404 means repository doesn't exist, continue with creation
          }

          // Create the repository with auto_init and wait longer
          const repoResponse = await octokit.request('POST /user/repos', {
            name: repository,
            private: true,
            auto_init: true,
            description: 'Angular project created with ProjectXB'
          });

          // Wait longer for GitHub to initialize the repository
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Add Angular files
          await createAngularFiles(octokit, username, repository);

          // Update user frameworks
          if (!user.userFrameworks.includes('Angular')) {
            user.userFrameworks.push('Angular');
            fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
          }

          res.status(201).json({ 
            message: 'Angular repository created successfully with template files', 
            repository: repoResponse.data 
          });
        } catch (error) {
          console.error('Error creating repository:', error);
          res.status(500).json({ message: 'Error creating repository: ' + error.message });
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

// Update React endpoint
app.post('/react', async (req, res) => {
  const { username, repository } = req.body;
  if (!username || !repository) {
    return res.status(400).json({ message: 'Username and repository name are required' });
  }
  console.log(`Creating React repository '${repository}' for user '${username}'`);

  try {
    const { Octokit } = await import('@octokit/core');
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    fs.readFile('users.json', 'utf8', async (err, data) => {
      if (err) {
        console.error('Error reading users.json:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      let users = data ? JSON.parse(data) : [];
      const user = users.find(user => user.username === username);

      if (user) {
        try {
          try {
            await octokit.request('GET /repos/{owner}/{repo}', {
              owner: username,
              repo: repository
            });
            return res.status(400).json({ message: 'Repository already exists' });
          } catch (error) {
            if (error.status !== 404) throw error;
          }

          const repoResponse = await octokit.request('POST /user/repos', {
            name: repository,
            private: true,
            auto_init: true,
            description: 'React project created with ProjectXB'
          });

          await new Promise(resolve => setTimeout(resolve, 2000));
          await createReactFiles(octokit, username, repository);

          if (!user.userFrameworks.includes('React')) {
            user.userFrameworks.push('React');
            fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
          }

          res.status(201).json({ 
            message: 'React repository created successfully with template files', 
            repository: repoResponse.data 
          });
        } catch (error) {
          console.error('Error creating repository:', error);
          res.status(500).json({ message: 'Error creating repository: ' + error.message });
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

// Update Vue endpoint
app.post('/vue', async (req, res) => {
  const { username, repository } = req.body;
  if (!username || !repository) {
    return res.status(400).json({ message: 'Username and repository name are required' });
  }
  console.log(`Creating Vue repository '${repository}' for user '${username}'`);

  try {
    const { Octokit } = await import('@octokit/core');
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    fs.readFile('users.json', 'utf8', async (err, data) => {
      if (err) {
        console.error('Error reading users.json:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      let users = data ? JSON.parse(data) : [];
      const user = users.find(user => user.username === username);

      if (user) {
        try {
          try {
            await octokit.request('GET /repos/{owner}/{repo}', {
              owner: username,
              repo: repository
            });
            return res.status(400).json({ message: 'Repository already exists' });
          } catch (error) {
            if (error.status !== 404) throw error;
          }

          const repoResponse = await octokit.request('POST /user/repos', {
            name: repository,
            private: true,
            auto_init: true,
            description: 'Vue project created with ProjectXB'
          });

          await new Promise(resolve => setTimeout(resolve, 2000));
          await createVueFiles(octokit, username, repository);

          if (!user.userFrameworks.includes('Vue')) {
            user.userFrameworks.push('Vue');
            fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
          }

          res.status(201).json({ 
            message: 'Vue repository created successfully with template files', 
            repository: repoResponse.data 
          });
        } catch (error) {
          console.error('Error creating repository:', error);
          res.status(500).json({ message: 'Error creating repository: ' + error.message });
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
