const Contact = require('../models/contact');
const Agent = require('../models/agent');

// @desc    Get all contacts for logged-in agent
// @route   GET /api/contacts
// @access  Private
exports.getContacts = async (req, res) => {
  try {
    const { search, tag, favorite } = req.query;
    
    // Build query - only show contacts created by this agent
    const query = { createdBy: req.user.id };
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by tag
    if (tag) {
      query.tags = tag;
    }
    
    // Filter by favorite
    if (favorite === 'true') {
      query.isFavorite = true;
    }
    
    const contacts = await Contact.find(query)
      .sort({ name: 1 })
      .populate('createdBy', 'username name email');
    
    res.json({
      success: true,
      count: contacts.length,
      contacts
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts',
      error: error.message
    });
  }
};

// @desc    Get single contact
// @route   GET /api/contacts/:id
// @access  Private
exports.getContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      createdBy: req.user.id // Ensure agent can only access their own contacts
    }).populate('createdBy', 'username name email');
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact',
      error: error.message
    });
  }
};

// @desc    Create new contact
// @route   POST /api/contacts
// @access  Private
exports.createContact = async (req, res) => {
  try {
    const { name, phoneNumber, email, company, jobTitle, address, notes, alternatePhone, tags } = req.body;
    
    // Validate required fields
    if (!name || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required'
      });
    }
    
    // Check for duplicate phone number for this agent
    const existingContact = await Contact.findOne({
      phoneNumber,
      createdBy: req.user.id
    });
    
    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'A contact with this phone number already exists'
      });
    }
    
    // Create contact
    const contact = await Contact.create({
      name,
      phoneNumber,
      email,
      company,
      jobTitle,
      address,
      notes,
      alternatePhone,
      tags: tags || [],
      createdBy: req.user.id,
      agentExtension: req.user.username || req.user.userExtension
    });
    
    console.log(`📇 Contact created: ${name} by agent ${req.user.username}`);
    
    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      contact
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contact',
      error: error.message
    });
  }
};

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private
exports.updateContact = async (req, res) => {
  try {
    const { name, phoneNumber, email, company, jobTitle, address, notes, alternatePhone, tags, isFavorite } = req.body;
    
    // Find contact and ensure it belongs to the agent
    let contact = await Contact.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    // Check if phone number is being changed and if it's duplicate
    if (phoneNumber && phoneNumber !== contact.phoneNumber) {
      const existingContact = await Contact.findOne({
        phoneNumber,
        createdBy: req.user.id,
        _id: { $ne: req.params.id }
      });
      
      if (existingContact) {
        return res.status(400).json({
          success: false,
          message: 'A contact with this phone number already exists'
        });
      }
    }
    
    // Update fields
    contact.name = name || contact.name;
    contact.phoneNumber = phoneNumber || contact.phoneNumber;
    contact.email = email !== undefined ? email : contact.email;
    contact.company = company !== undefined ? company : contact.company;
    contact.jobTitle = jobTitle !== undefined ? jobTitle : contact.jobTitle;
    contact.address = address !== undefined ? address : contact.address;
    contact.notes = notes !== undefined ? notes : contact.notes;
    contact.alternatePhone = alternatePhone !== undefined ? alternatePhone : contact.alternatePhone;
    contact.tags = tags !== undefined ? tags : contact.tags;
    contact.isFavorite = isFavorite !== undefined ? isFavorite : contact.isFavorite;
    
    await contact.save();
    
    console.log(`📇 Contact updated: ${contact.name} by agent ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Contact updated successfully',
      contact
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact',
      error: error.message
    });
  }
};

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    await contact.deleteOne();
    
    console.log(`📇 Contact deleted: ${contact.name} by agent ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact',
      error: error.message
    });
  }
};

// @desc    Toggle favorite status
// @route   PATCH /api/contacts/:id/favorite
// @access  Private
exports.toggleFavorite = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    contact.isFavorite = !contact.isFavorite;
    await contact.save();
    
    res.json({
      success: true,
      message: `Contact ${contact.isFavorite ? 'added to' : 'removed from'} favorites`,
      contact
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle favorite',
      error: error.message
    });
  }
};

// @desc    Bulk delete contacts
// @route   POST /api/contacts/bulk-delete
// @access  Private
exports.bulkDeleteContacts = async (req, res) => {
  try {
    const { contactIds } = req.body;
    
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Contact IDs array is required'
      });
    }
    
    const result = await Contact.deleteMany({
      _id: { $in: contactIds },
      createdBy: req.user.id
    });
    
    console.log(`📇 Bulk delete: ${result.deletedCount} contacts by agent ${req.user.username}`);
    
    res.json({
      success: true,
      message: `${result.deletedCount} contacts deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contacts',
      error: error.message
    });
  }
};

// @desc    Get contact statistics
// @route   GET /api/contacts/stats
// @access  Private
exports.getContactStats = async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments({ createdBy: req.user.id });
    const favoriteContacts = await Contact.countDocuments({ createdBy: req.user.id, isFavorite: true });
    
    // Get all unique tags
    const tagsAggregation = await Contact.aggregate([
      { $match: { createdBy: req.user.id } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      stats: {
        total: totalContacts,
        favorites: favoriteContacts,
        tags: tagsAggregation
      }
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact statistics',
      error: error.message
    });
  }
};
