const jwt = require('jsonwebtoken');
const Agent = require('../models/agent');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from cookie or Authorization header
    if (req.cookies.access_token) {
      token = req.cookies.access_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if token is expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return res.status(401).json({
          success: false,
          message: 'Token has expired'
        });
      }
      
      // Get agent from token
      const agent = await Agent.findById(decoded.id).select('-password');
      
      if (!agent) {
        return res.status(401).json({
          success: false,
          message: 'Agent not found'
        });
      }
      
      req.user = agent;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};
