const Customer = require('../../models/customerModel');
const User = require('../../models/userModel');
const getTechnicianWorkOrders = async (req, res) => {
  try {
    // Only technicians can access their work orders
    if (req.user.role !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only technicians can view their work orders.'
      });
    }
   
    // Find all customers with work orders assigned to this technician
    const customers = await Customer.find({
      'workOrders.technician': req.user._id
    })
    .populate('branch', 'name location')
    .populate('workOrders.assignedBy', 'firstName lastName')
    // Add this new populate to get original technician info
    .populate({
      path: 'projects.completedBy',
      model: 'User',
      select: 'firstName lastName phone'
    });
   
    // Extract and format work orders
    const workOrders = [];
   
    customers.forEach(customer => {
      // Filter work orders assigned to this technician
      const technicianOrders = customer.workOrders.filter(
        order => order.technician && order.technician.toString() === req.user._id.toString()
      );
     
      // Add customer details to each work order
      technicianOrders.forEach(order => {
        // Find the matching project to get category and initial remark
        const project = customer.projects.find(
          p => p.projectId === order.projectId
        );

        // New code: Get original technician info if this is a repair/complaint
        let originalTechnician = null;
        
        // Check if this is a repair or complaint type work order
        const isRepair = (project && project.projectCategory === 'Repair') || 
                         (order.projectCategory === 'Repair') ||
                         (order.type === 'complaint');
        
        // Determine the correct category based on work order type
        let category = 'New Installation';
        if (isRepair) {
          category = 'Repair';
        } else if (project && project.projectCategory) {
          category = project.projectCategory;
        } else if (order.projectCategory) {
          category = order.projectCategory;
        }
        
        // Get original technician info for repairs
        if (isRepair && project && project.completedBy) {
          originalTechnician = {
            firstName: project.completedBy.firstName || '',
            lastName: project.completedBy.lastName || '',
            phoneNumber: project.completedBy.phone || '',
            completedAt: project.createdAt
          };
        }
       
        workOrders.push({
          ...order.toObject(),
          customerId: customer._id,
          customerName: customer.name,
          customerPhone: customer.phoneNumber,
          customerWhatsapp: customer.whatsappNumber,
          customerEmail: customer.email,
          customerAddress: customer.address,
          branchName: customer.branch ? customer.branch.name : null,
          projectCategory: category, // Using our determined category here
          projectCreatedAt: project ? project.createdAt : null,
          assignedByName: order.assignedBy ?
            `${order.assignedBy.firstName} ${order.assignedBy.lastName}` : 'Admin',
          // Add the original technician info to the returned data
          originalTechnician: originalTechnician
        });
      });
    });
   
    // Sort by creation date (newest first)
    workOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log("technician workorers:", workOrders);
   
    res.status(200).json({
      success: true,
      count: workOrders.length,
      data: workOrders
    });
  } catch (err) {
    console.error('Error fetching technician work orders:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching work orders'
    });
  }
};
module.exports = getTechnicianWorkOrders;