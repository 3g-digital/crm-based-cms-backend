const jwt = require('jsonwebtoken');
const User = require('../../models/userModel');

const loginController = async (req, res) => {
  try {
    const { username, password } = req.body;
   
    // Check for user
    const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
        error: true,
        success: false
      });
    }
   
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials',
        error: true,
        success: false
      });
    }
   
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        message: 'Your account is inactive',
        error: true,
        success: false
      });
    }
   
    // Create token
    const token = jwt.sign({ userId: user._id }, process.env.TOKEN_SECRET_KEY, { expiresIn: '365d' });
   
     // Set token as HTTP-only cookie
     res.cookie('token', token, {
      httpOnly: true,
      secure: true, // HTTPS पर डिप्लॉय होने के कारण true होना चाहिए
      sameSite: 'None',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
    });
    // Return user without password
    const userData = user.toObject();
    delete userData.password;
   
    res.status(200).json({
      message: 'Login successful',
      error: false,
      success: true,
      data: userData,
      token: token
    });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({
      message: 'Server error',
      error: true,
      success: false
    });
  }
};

module.exports = { loginController };