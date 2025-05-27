const Customer = require('../../models/customerModel');
const User = require('../../models/userModel');

const getAllWorkOrders = async (req, res) => {
    try {
      // Filter options
      const filter = {};
      
      // Branch access control
      if (req.user.role !== 'admin') {
        filter.branch = req.user.branch;
      } else if (req.query.branch) {
        filter.branch = req.query.branch;
      }
     
      // Get customers with work orders
      const customers = await Customer.find(filter)
        .populate('branch', 'name')
        .populate('workOrders.technician', 'firstName lastName')
        .populate('workOrders.assignedBy', 'firstName lastName')
        .populate('projects.completedBy', 'firstName lastName phone');
     
      // Extract all work orders with customer info
      const workOrders = [];
     
      for (const customer of customers) {
        for (const order of customer.workOrders) {
          // Debug: Log the original order data
          console.log(`Processing order ${order.orderId} with category: ${order.projectCategory}`);
          
          // Create the basic order object with all fields
          const orderObj = {
            ...order.toObject(),
            customerName: customer.name,
            customerPhone: customer.phoneNumber,
            customerEmail: customer.email,
            branchName: customer.branch ? customer.branch.name : null,
            customerId: customer._id,
            initialRemark: order.initialRemark,
            statusHistory: order.statusHistory || []
          };
         
          // Find the matching project
          const matchingProject = customer.projects.find(p => p.projectId === order.projectId);
         
          // IMPORTANT CHANGE: Prioritize the work order's projectCategory over the project's category
          // This ensures complaints (Repair) preserve their category
          if (order.projectCategory === 'Repair') {
            orderObj.projectCategory = 'Repair';
            console.log(`Order ${order.orderId} is a Repair/Complaint - setting category explicitly`);
          } else if (matchingProject) {
            orderObj.projectCategory = matchingProject.projectCategory || order.projectCategory || 'New Installation';
            console.log(`Order ${order.orderId} has matching project with category: ${orderObj.projectCategory}`);
          } else {
            // Default values if no matching project
            orderObj.projectCategory = order.projectCategory || 'New Installation';
            console.log(`Order ${order.orderId} has no matching project, using category: ${orderObj.projectCategory}`);
          }
          
          // Set project creation date if available
          if (matchingProject) {
            orderObj.projectCreatedAt = matchingProject.createdAt;
           
            // Add original technician info for repair work orders
            if ((orderObj.projectCategory === 'Repair' || matchingProject.projectCategory === 'Repair') &&
                matchingProject.completedBy) {
             
              orderObj.originalTechnician = {
                firstName: matchingProject.completedBy.firstName || '',
                lastName: matchingProject.completedBy.lastName || '',
                phoneNumber: matchingProject.completedBy.phone || ''
              };
            }
          }
         
          // Debug: Log the final category we're using
          console.log(`Final category for order ${order.orderId}: ${orderObj.projectCategory}`);
          
          workOrders.push(orderObj);
        }
      }
     
      // Sort by creation date (newest first)
      workOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
     
      res.status(200).json({
        success: true,
        count: workOrders.length,
        data: workOrders
      });
    } catch (err) {
      console.error('Error fetching work orders:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching work orders'
      });
    }
};

module.exports = getAllWorkOrders;