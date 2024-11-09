const express = require('express');
const router = express.Router();
const fs = require('fs');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

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

  // Silently try to create PR without showing warnings
  try {
    await octokit.request('POST /repos/{owner}/{repo}/pulls', {
      owner,
      repo,
      title: 'Initial project setup',
      head: 'init-branch',
      base: 'main',
      body: 'Adding initial Angular project files'
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
  console.log(`Creating Angular repository '${repository}' for user '${username}'`);

  try {
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
            if (error.status !== 404) {
              throw error;
            }
          }

          const repoResponse = await octokit.request('POST /user/repos', {
            name: repository,
            private: true,
            auto_init: true,
            description: 'Angular project created with ProjectXB'
          });

          await new Promise(resolve => setTimeout(resolve, 2000));

          const result = await createAngularFiles(octokit, username, repository);

          if (!user.userFrameworks) {
            user.userFrameworks = [];
          }

          if (!user.userFrameworks.includes('Angular')) {
            user.userFrameworks.push('Angular');
            fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
          }

          res.status(201).json({
            success: true,
            message: result.hasErrors 
              ? 'Repository created with some files missing'
              : 'Repository created successfully',
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
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'An error occurred while creating the repository',
    });
  }
});

module.exports = router;
