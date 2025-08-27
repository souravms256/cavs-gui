require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers'); // Import ethers.js

const asyncHandler = require('express-async-handler');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));

// --- User Model ---
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Hash the password before saving the user
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', UserSchema);

// --- Auth Routes ---
app.post('/api/auth/signup', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  // Create new user
  const newUser = await User.create({ name, email, password });
  
  if (newUser) {
    // Generate a token for the new user
    const token = jwt.sign({ id: newUser._id, name: newUser.name, email: newUser.email }, process.env.JWT_SECRET || 'your_jwt_secret', {
      expiresIn: '1h',
    });
    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      token,
      message: "Account created successfully"
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
}));

app.post('/api/auth/signin', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    // Generate a token for the user
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET || 'your_jwt_secret', {
      expiresIn: '1h',
    });
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
      message: "Sign in successful"
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
}));
// Basic test route
app.get('/', (req, res) => {
  res.send('Backend is running and ready for authentication.');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
