const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/', async (req, res) => {
  console.log('Received signup request:', req.body);
  const { username, email, password, confirmPassword, terms } = req.body;

  try {
    // Input validation
    if (!username || !email || !password || !confirmPassword) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      return res.status(400).json({ 
        success: false,
        message: 'Passwords do not match' 
      });
    }

    if (!terms) {
      console.log('Terms not accepted');
      return res.status(400).json({ 
        success: false,
        message: 'Terms must be accepted' 
      });
    }

    // Check existing user
    const userExists = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });
    
    if (userExists) {
      console.log('User exists:', userExists.email === email.toLowerCase() ? 'email' : 'username');
      return res.status(400).json({ 
        success: false,
        message: userExists.email === email.toLowerCase() 
          ? 'Email already exists' 
          : 'Username already exists'
      });
    }

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      userFrameworks: []
    });

    console.log('User created successfully:', user._id);
    res.status(201).json({
      success: true,
      message: 'User signed up successfully'
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating user account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;