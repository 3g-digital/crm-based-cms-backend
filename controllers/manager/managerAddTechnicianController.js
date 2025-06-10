const User = require('../../models/userModel');

const managerAddTechnicianController = async (req, res) => {
  try {
    // console.log("Request body:", req.body);
    // Check if user is manager or admin
    if (req.userRole !== 'manager' && req.userRole !== 'admin') {
      return res.status(403).json({
        message: 'Permission denied',
        error: true,
        success: false
      });
    }
    
    const { firstName, lastName, username, email, password, phone, branch } = req.body;

    // Validate username for allowed characters (letters, numbers, _, ., -)
    const usernameRegex = /^[a-zA-Z0-9_.-@#]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message: 'Username can only contain letters, numbers, and symbols (_ . -). Spaces are not allowed.',
        error: true,
        success: false
      });
    }
    
    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        message: 'Username or email already exists',
        error: true,
        success: false
      });
    }
    
    // If manager is adding technician, override branch with manager's branch
    let branchId = branch;
    
    if (req.userRole === 'manager') {
      branchId = req.userBranch; // Assuming middleware sets userBranch
    }
    
    // Create new technician
    const newTechnician = new User({
      firstName,
      lastName,
      username,
      email,
      password,
      phone,
      role: 'technician',
      branch: branchId
    });
    
    await newTechnician.save();
    
    // Remove password from response
    const technicianData = newTechnician.toObject();
    delete technicianData.password;
    
    res.status(201).json({
      message: 'Technician added successfully',
      error: false,
      success: true,
      data: technicianData
    });
  } catch (err) {
    console.error('Error in managerAddTechnician:', err);
    res.status(500).json({
      message: err.message || 'Server error',
      error: true,
      success: false
    });
  }
};

module.exports = managerAddTechnicianController;