const Customer = require('../../models/customerModel');
const User = require('../../models/userModel');
const BillModel = require('../../models/billModel');
const { generateResponse } = require('../../helpers/responseGenerator');
const mongoose = require('mongoose'); // Add this for ObjectId comparison

const approveWorkOrder = async (req, res) => {
    try {
      const { userId, role } = req.user;
      const { customerId, orderId, remark } = req.body;
     
      // Check if user is authorized
      if (role !== 'admin' && role !== 'manager') {
        return res.status(403).json(generateResponse(false, 'Access denied. Only managers can approve work orders.'));
      }
     
      // Find the customer with the work order
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json(generateResponse(false, 'Customer not found'));
      }
     
      // Find the specific work order
      const workOrder = customer.workOrders.find(order => order.orderId === orderId);
      if (!workOrder) {
        return res.status(404).json(generateResponse(false, 'Work order not found'));
      }
     
      // Check if work order is in pending-approval status
      if (workOrder.status !== 'pending-approval') {
        return res.status(400).json(generateResponse(false, 'Work order is not pending approval'));
      }
     
      // Update work order status to completed
      workOrder.status = 'completed';

      // Update bill status to approved in embedded bills array
      if (workOrder.bills && Array.isArray(workOrder.bills)) {
        workOrder.bills.forEach(bill => {
          if (bill.status !== 'rejected') {
            bill.status = 'approved';
            bill.isReverted = false; // Reset isReverted on approval
          }
        });
      }
     
      // Add approval entry to status history
      workOrder.statusHistory.unshift({
        status: 'approval',
        remark: remark || 'Project approved by manager',
        updatedBy: userId,
        updatedAt: new Date()
      });
     
      // Add completed entry to status history if not already present
      const hasCompletedEntry = workOrder.statusHistory.some(entry => entry.status === 'completed');
      if (!hasCompletedEntry) {
        workOrder.statusHistory.unshift({
          status: 'completed',
          remark: 'Project marked as completed by manager approval',
          updatedBy: userId,
          updatedAt: new Date()
        });
      }
     
      // IMPORTANT: Record which technician completed this project
      // This must happen BEFORE saving the document
      const project = customer.projects.find(p => p.projectId === workOrder.projectId);
      if (project && workOrder.technician) {
        // Make sure we store the technician ID properly
        project.completedBy = workOrder.technician;
        console.log(`Setting completedBy to ${workOrder.technician} for project ${project.projectId}`);
      } else {
        console.log(`Could not set completedBy: Project found: ${!!project}, Technician: ${workOrder.technician}`);
      }

      // Save the changes
      await customer.save();

      // Update Bill documents in Bill collection to status 'approved'
      await BillModel.updateMany(
        { customer: new mongoose.Types.ObjectId(customerId), orderId: orderId, status: { $ne: 'rejected' } },
        { $set: { status: 'approved' } }
      );
     
      // Return the updated work order with populated fields
      const updatedCustomer = await Customer.findById(customerId)
        .populate({
          path: 'workOrders.technician',
          select: 'firstName lastName'
        })
        .populate({
          path: 'workOrders.assignedBy',
          select: 'firstName lastName'
        })
        .populate({
          path: 'workOrders.statusHistory.updatedBy',
          select: 'firstName lastName'
        });
     
      const updatedWorkOrder = updatedCustomer.workOrders.find(order => order.orderId === orderId);
     
      // Format the response with necessary information
      const responseData = {
        customerId: customer._id,
        customerName: customer.name,
        orderId: updatedWorkOrder.orderId,
        projectId: updatedWorkOrder.projectId,
        projectType: updatedWorkOrder.projectType,
        status: updatedWorkOrder.status,
        technician: updatedWorkOrder.technician,
        statusHistory: updatedWorkOrder.statusHistory,
        billingInfo: updatedWorkOrder.bills,
        createdAt: updatedWorkOrder.createdAt,
        updatedAt: updatedWorkOrder.updatedAt,
        approvedBy: updatedWorkOrder.statusHistory[0].updatedBy,
        approvedAt: updatedWorkOrder.statusHistory[0].updatedAt
      };
     
      return res.json(generateResponse(true, 'Work order approved successfully', responseData));
    } catch (error) {
      console.error('Error approving work order:', error);
      console.error(error.stack);
      return res.status(500).json(generateResponse(false, 'Server error while approving work order'));
    }
  }
module.exports = approveWorkOrder;
