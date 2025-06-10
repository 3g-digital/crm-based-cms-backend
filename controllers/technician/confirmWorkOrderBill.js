const Customer = require('../../models/customerModel');
const TechnicianInventory = require('../../models/technicianInventoryModel');
const BillModel = require('../../models/billModel');

const confirmWorkOrderBill = async (req, res) => {
  try {
    // Only technicians can confirm bills
    if (req.user.role !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only technicians can confirm bills.'
      });
    }

    const { billId, paymentMethod, transactionId = null, paidAmount = null } = req.body;

    // Find the bill
    const bill = await BillModel.findById(billId);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Check if technician is the one who created the bill
    if (bill.technician.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to confirm this bill'
      });
    }

    // Update the bill with payment details
    bill.paymentMethod = paymentMethod;

    // Handle partial payment logic
    if (paymentMethod === 'cash' && paidAmount !== null) {
      bill.amountPaid = paidAmount;
      bill.amountDue = bill.totalAmount - paidAmount;

      if (paidAmount === 0) {
        bill.extendedPaymentStatus = 'unpaid';
      } else if (paidAmount > 0 && paidAmount < bill.totalAmount) {
        bill.extendedPaymentStatus = 'partial';
      } else if (paidAmount === bill.totalAmount) {
        bill.extendedPaymentStatus = 'paid';
      }

      // Bill status remains pending until manager approval, but do not override if rejected
      if (bill.status !== 'rejected') {
        bill.status = 'pending';
      }
    } else if (paymentMethod === 'online') {
      bill.transactionId = transactionId;
      bill.paidAt = new Date();
      bill.amountPaid = bill.totalAmount;
      bill.amountDue = 0;
      bill.extendedPaymentStatus = 'paid';
      // Assuming manager approval needed for online as well, but do not override if rejected
      if (bill.status !== 'rejected') {
        bill.status = 'pending';
      }
    }

    await bill.save();

    // Only update inventory if some payment was made (paidAmount > 0)
    if (bill.amountPaid > 0) {
      // If we have itemsToUpdate stored in the bill from createWorkOrderBill
      if (bill.itemsToUpdate && bill.itemsToUpdate.length > 0) {
        for (const updateItem of bill.itemsToUpdate) {
          const inventory = await TechnicianInventory.findById(updateItem.inventoryId);

          if (inventory) {
            if (updateItem.type === 'serialized') {
              // Update serial item status to 'used'
              const serialIndex = inventory.serializedItems.findIndex(
                serial => serial.serialNumber === updateItem.serialNumber
              );

              if (serialIndex >= 0) {
                inventory.serializedItems[serialIndex].status = 'used';
              }
            } else {
              // Reduce generic quantity by the specified amount
              inventory.genericQuantity -= updateItem.quantity;
              if (inventory.genericQuantity < 0) inventory.genericQuantity = 0;
            }

            inventory.lastUpdated = new Date();
            inventory.lastUpdatedBy = req.user._id;

            await inventory.save();
          }
        }
      } else {
        // Fallback to using the bill items directly if itemsToUpdate is not available
        for (const item of bill.items) {
          const inventory = await TechnicianInventory.findOne({
            technician: req.user._id,
            item: item.itemId
          });

          if (inventory) {
            if (item.type === 'serialized-product' && item.serialNumber) {
              // For serialized items, mark as used
              const serialIndex = inventory.serializedItems.findIndex(
                serial => serial.serialNumber === item.serialNumber
              );

              if (serialIndex >= 0) {
                inventory.serializedItems[serialIndex].status = 'used';
              }
            } else if (item.type === 'generic-product') {
              // For generic items, reduce quantity by the amount in the bill
              inventory.genericQuantity -= item.quantity;
              if (inventory.genericQuantity < 0) inventory.genericQuantity = 0;
            }

            inventory.lastUpdated = new Date();
            inventory.lastUpdatedBy = req.user._id;

            await inventory.save();
          }
        }
      }
    }

    // Find the customer and work order
    const customer = await Customer.findById(bill.customer);
    if (customer) {
      // workOrder को सही तरीके से find करें
      const workOrder = customer.workOrders.find(order => order.orderId === bill.orderId);

      if (workOrder) {
        // Add the billing info to work order
        if (!workOrder.billingInfo) {
          workOrder.billingInfo = [];
        }

        workOrder.billingInfo.push({
          billId: bill._id,
          billNumber: bill.billNumber,
          amount: bill.totalAmount,
          paymentMethod,
          transactionId,
          paidAt: new Date()
        });

        // Add to status history too
        if (!workOrder.statusHistory) {
          workOrder.statusHistory = [];
        }

        workOrder.statusHistory.push({
          status: 'payment',
          remark: `Payment of ₹${bill.totalAmount.toFixed(2)} received via ${paymentMethod}`,
          updatedAt: new Date(),
          updatedBy: req.user._id
        });

        await customer.save();

        // After saving customer, get the updated customer and workOrder to ensure we have the latest data
        const updatedCustomer = await Customer.findById(customer._id);
        const updatedWorkOrder = updatedCustomer.workOrders.find(order => order.orderId === bill.orderId);

        res.status(200).json({
          success: true,
          message: 'Payment processed successfully',
          data: {
            billNumber: bill.billNumber,
            paymentMethod,
            amount: bill.totalAmount,
            workOrder: updatedWorkOrder // Include complete updated workOrder in response
          }
        });
        return; // Function को यहीं terminate करें
      }
    }

    // If we couldn't find the customer or work order, still return success for the payment
    res.status(200).json({
      success: true,
      message: 'Payment processed successfully, but could not update work order details',
      data: {
        billNumber: bill.billNumber,
        paymentMethod,
        amount: bill.totalAmount
      }
    });
  } catch (err) {
    console.error('Error confirming bill:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while confirming bill'
    });
  }
};

module.exports = confirmWorkOrderBill;