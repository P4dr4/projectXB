const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

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
      body: 'Adding initial Vue project files'
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
          description: 'Vue project created with ProjectXB'
        });

        await new Promise(resolve => setTimeout(resolve, 2000));
        const result = await createVueFiles(octokit, username, repository);

        // Update user frameworks
        if (!user.userFrameworks.includes('Vue')) {
          user.userFrameworks.push('Vue');
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
