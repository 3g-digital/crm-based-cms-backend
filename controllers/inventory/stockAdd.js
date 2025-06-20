const Item = require('../../models/inventoryModel');

const stockAdd = async (req, res) => {
  try {
    // Only managers can add stock
    if (req.userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only managers can add stock.'
      });
    }

const { itemId, serialNumber, quantity, date, remark } = req.body;
   
    // Check if manager has a branch assigned
    if (!req.userBranch) {
      return res.status(400).json({
        success: false,
        message: 'You must be assigned to a branch to add stock.'
      });
    }

    // Find the item
    const item = await Item.findOne({ id: itemId });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
   
    // Validate item type vs stock data
    if (item.type === 'serialized-product') {
      // For serial products, check if serial number already exists
      if (!serialNumber) {
        return res.status(400).json({
          success: false,
          message: 'Serial number is required for serialized products'
        });
      }
     
      const existingSerialNumber = await Item.findOne({
        'stock.serialNumber': serialNumber
      });
     
      if (existingSerialNumber) {
        return res.status(400).json({
          success: false,
          message: 'Serial number already exists in inventory',
          existingItem: {
            id: existingSerialNumber.id,
            name: existingSerialNumber.name
          }
        });
      }
     
      // Add stock with serial number, remark and manager's branch ID
      item.stock.push({
        serialNumber,
        quantity: 1, // Always 1 for serial products
        date: date || new Date(),
        branch: req.userBranch, // Add branch ID to stock entry
        remark: remark || ''
      });
    } else if (item.type === 'generic-product') {
      // For non-serial products, add stock with quantity only
      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity is required for generic products'
        });
      }
     
      // Add stock without serial number but with quantity, remark and manager's branch ID
      item.stock.push({
        quantity,
        date: date || new Date(),
        branch: req.userBranch, // Add branch ID to stock entry
        remark: remark || ''
      });
    } else {
      // Service items don't have stock
      return res.status(400).json({
        success: false,
        message: 'Cannot add stock to service items'
      });
    }
   
    item.updatedAt = new Date();
    await item.save();
   
    res.json({
      success: true,
      item
    });
  } catch (err) {
    console.error('Error adding stock:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};
module.exports = stockAdd;