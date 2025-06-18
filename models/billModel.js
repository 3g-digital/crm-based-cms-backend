const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['serialized-product', 'generic-product', 'service'],
    required: true
  },
  serialNumber: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
});

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  workOrder: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  orderId: {
    type: String,
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [billItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
   // ✅ New Payment Flow Fields
  amountPaid: {
    type: Number,
    required: true,
    default: 0
  },
  amountDue: {
    type: Number,
    required: true
  },
  extendedPaymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },

  // ✅ Bill Status & Rejection Tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  isReverted: {
    type: Boolean,
    default: false
  },

  // ✅ Payment & Timestamps
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'pending'],
    default: 'pending'
  },
  transactionId: {
    type: String
  },
  paidAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const BillModel = mongoose.model('Bill', billSchema);
module.exports = BillModel;