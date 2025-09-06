const mongoose = require('mongoose');

// Work Order Schema
const workOrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  projectId: {
    type: String,
    required: true
  },
  projectType: {
    type: String,
    required: true
  },
  // Add this field if it's missing
  projectCategory: {
    type: String,
    enum: ['New Installation', 'Repair'],
    default: 'New Installation'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'paused', 'pending-approval', 'completed', 'transferring', 'transferred', 'rejected'],
    default: 'pending'
  },
  initialRemark: {  // Add this field
    type: String
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['assigned', 'in-progress', 'paused', 'pending-approval', 'completed', 'payment', 'approval', 'remark', 'communication', 'transferring', 'transferred', 'pending', 'rejected'],
      required: true
    },
    remark: {
      type: String,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  activeTimestamp: {
    type: Date
  },
  bills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill'
  }],
  
  // नया billingInfo फील्ड
  billingInfo: [{
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill'
    },
    billNumber: String,
    amount: Number,
    paymentMethod: String,
    transactionId: String,
    paidAt: Date
  }],
  itemsUsed: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    },
    serialNumber: {
      type: String
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  instructions: {
    type: String
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });


const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
    firmName:{
     type: String,
  },
  // email: {
  //   type: String,
  //   match: /^\S+@\S+\.\S+$/,
  //   sparse: true
  // },
  whatsappNumber: {
    type: String
  },
  address: {
    type: String
  },
  // age: {
  //   type: Number
  // },
  projects: [{
    projectId: {
      type: String,
      required: true
    },
    projectType: {
      type: String,
      enum: [
        'CCTV Camera',
        'Attendance System',
        'Safe and Locks',
        'Home/Office Automation',
        'IT & Networking Services',
        'Software & Website Development',
        'Custom'
      ],
      required: true
    },
    projectCategory: {
      type: String,
      enum: ['New Installation', 'Repair'],
    },
    initialRemark: {
      type: String
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  workOrders: [workOrderSchema],
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  convertedFromLead: {
    type: Boolean,
    default: false
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create index for search optimization
customerSchema.index({ name: 'text', phoneNumber: 'text', email: 'text' });

const customerModel = mongoose.model('Customer', customerSchema);

module.exports = customerModel;
