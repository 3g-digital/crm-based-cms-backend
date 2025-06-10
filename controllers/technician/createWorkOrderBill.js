const Customer = require('../../models/customerModel');
const TechnicianInventory = require('../../models/technicianInventoryModel');
const Item = require('../../models/inventoryModel');
const BillModel = require('../../models/billModel');
const mongoose = require('mongoose');

const createWorkOrderBill = async (req, res) => {
  try {
    // Only technicians can create bills
    if (req.user.role !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only technicians can create bills.'
      });
    }
    
    const { customerId, orderId, items } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided for billing'
      });
    }
    
    // Find the customer and work order
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Find the specific work order
    const workOrder = customer.workOrders.find(order => order.orderId === orderId);
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }
    
    // Check if technician is assigned to this work order
    if (!workOrder.technician || workOrder.technician.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this work order'
      });
    }
    
    // Get technician's inventory
    const technicianInventory = await TechnicianInventory.find({
      technician: req.user._id
    }).populate('item');
    
    // Check if all items are in technician's inventory
    const itemsToUpdate = [];
    const billItems = [];
    let totalAmount = 0;
    
    // Process each item in the bill
    for (const billItem of items) {
      // First, check if it's a service - these don't need inventory check
      if (billItem.type === 'service') {
        console.log("Processing service item:", billItem.name);

         // Generate a valid MongoDB ObjectId for the service
    const serviceObjectId = new mongoose.Types.ObjectId();
        // Services don't require inventory reduction, just add them to the bill
        billItems.push({
          itemId: serviceObjectId, // Use the generated ObjectId
          name: billItem.name,
          type: 'service',
          quantity: billItem.quantity || 1,
          price: billItem.price || 0,
          amount: (billItem.price || 0) * (billItem.quantity || 1)
        });
        
        totalAmount += (billItem.price || 0) * (billItem.quantity || 1);
        
        // Skip the rest of the loop for services
        continue;
      }
    
      // For non-service items, check inventory
      const inventoryItem = technicianInventory.find(inv => {
        // Check by ID if possible
        if (inv.item._id) {
          const matchesWithItemId = inv.item._id.toString() === billItem.itemId;
          if (matchesWithItemId) return true;
        }
        if (inv.item.id) {
          const matchesWithId = inv.item.id.toString() === billItem.itemId;
          if (matchesWithId) return true;
        }
        
        // If ID doesn't match, try matching by name
        if (inv.item.name && billItem.name) {
          return inv.item.name.toLowerCase() === billItem.name.toLowerCase();
        } else if (inv.item.itemName && billItem.name) {
          return inv.item.itemName.toLowerCase() === billItem.name.toLowerCase();
        }
        
        return false;
      });
      
      if (!inventoryItem) {
        console.log("All available inventory items:", technicianInventory.map(inv => ({
          id: inv.item._id || inv.item.id,
          name: inv.item.name || inv.item.itemName,
          itemId: inv.item.itemId
        })));
        
        return res.status(400).json({
          success: false,
          message: `Item ${billItem.itemId} not found in your inventory`
        });
      }
      
      // Check if the item has enough quantity
      if (inventoryItem.item.type === 'serialized-product') {
        // For serialized items, check if serial number exists
        if (!billItem.serialNumber) {
          return res.status(400).json({
            success: false,
            message: `Serial number required for ${inventoryItem.item.name}`
          });
        }
        
        const serialItem = inventoryItem.serializedItems.find(
          serial => serial.serialNumber === billItem.serialNumber && serial.status === 'active'
        );
        
        if (!serialItem) {
          return res.status(400).json({
            success: false,
            message: `Serial number ${billItem.serialNumber} not found in your inventory or not active`
          });
        }
        
        // Add to items to update
        itemsToUpdate.push({
          inventoryId: inventoryItem._id,
          type: 'serialized',
          serialNumber: billItem.serialNumber
        });
        
        // Add to bill items
        billItems.push({
          itemId: inventoryItem.item._id,
          name: inventoryItem.item.name,
          type: 'serialized-product',
          serialNumber: billItem.serialNumber,
          quantity: 1,
          price: inventoryItem.item.salePrice || 0,
          amount: inventoryItem.item.salePrice || 0
        });
        
        totalAmount += inventoryItem.item.salePrice || 0;
      }  else {
        // For generic items, check if quantity is available
        if (inventoryItem.genericQuantity < billItem.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough quantity for ${inventoryItem.item.name}. Available: ${inventoryItem.genericQuantity}`
          });
        }
        
        // Add to items to update
        itemsToUpdate.push({
          inventoryId: inventoryItem._id,
          type: 'generic',
          quantity: billItem.quantity
        });
        
        // Add to bill items
        billItems.push({
          itemId: inventoryItem.item._id,
          name: inventoryItem.item.name,
          type: 'generic-product',
          quantity: billItem.quantity,
          price: inventoryItem.item.salePrice || 0,
          amount: (inventoryItem.item.salePrice || 0) * billItem.quantity
        });
        
        totalAmount += (inventoryItem.item.salePrice || 0) * billItem.quantity;
      }
    }
    
    // Create the bill
    const billNumber = `BILL-${Date.now().toString().slice(-6)}`;
    
const newBill = new BillModel({
  billNumber,
  customer: customerId,
  workOrder: workOrder._id,
  orderId,
  technician: req.user._id,
  items: billItems,
  totalAmount,
  amountPaid: 0,
  amountDue: totalAmount,
  extendedPaymentStatus: 'unpaid',
  status: 'pending',
  isReverted: false,
  paymentMethod: 'pending',
  createdAt: new Date(),
  // Store itemsToUpdate for use in confirmWorkOrderBill
  itemsToUpdate: itemsToUpdate
});
    
    await newBill.save();
    
    // Important: DO NOT update inventory here. We'll update it only when payment is confirmed
    // to avoid double reduction of inventory items.
    
    // Add bill reference to work order
    if (!workOrder.bills) {
      workOrder.bills = [];
    }
    
    workOrder.bills.push(newBill._id);
    
    // Update customer record
    await customer.save();
    
    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: {
        billId: newBill._id,
        billNumber,
        items: billItems,
        totalAmount,
        customer: {
          name: customer.name,
          phone: customer.phoneNumber,
          address: customer.address
        }
      }
    });
  } catch (err) {
    console.error('Error creating bill:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating bill'
    });
  }
};

module.exports = createWorkOrderBill;