const Customer = require('../../models/customerModel');

const rejectTechnicianProjectTransfer = async (req, res) => {
  try {
    const { customerId, orderId, rejectReason } = req.body;
    const userId = req.user._id;

    // Find the customer
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

    // Make sure the work order is in transferring status
    if (workOrder.status !== 'transferring') {
      return res.status(400).json({
        success: false,
        message: 'Work order is not in transferring status'
      });
    }

    // Add entry to status history for the work order
    workOrder.statusHistory.push({
      status: 'rejected',
      remark: rejectReason,
      updatedBy: userId,
      updatedAt: new Date()
    });

    // Update the work order status to rejected
    workOrder.status = 'rejected';
    workOrder.updatedAt = new Date();

    await customer.save();

    // Format the updated work order for response
    const updatedWorkOrder = {
      ...workOrder.toObject(),
      customerId: customer._id,
      customerName: customer.name,
      customerAddress: customer.address,
      customerPhone: customer.phoneNumber
    };

    res.status(200).json({
      success: true,
      message: 'Transfer request rejected successfully',
      data: updatedWorkOrder
    });
  } catch (err) {
    console.error('Error rejecting transfer:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting transfer'
    });
  }
};

module.exports = rejectTechnicianProjectTransfer;
