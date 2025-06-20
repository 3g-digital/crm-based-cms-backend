// models/inventoryModel.js
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: function() {
      // Required only for serialized products
      return this.parent().type === 'serialized-product';
    }
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  date: {
    type: Date,
    default: Date.now
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true // Branch is required for stock entries
  },
  remark: {
    type: String,
    default: ''
  }
});

const itemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['serialized-product', 'generic-product', 'service']
  },
  name: {
    type: String,
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  unit: {
    type: String,
    required: function() {
      return this.type === 'serialized-product' || this.type === 'generic-product';
    }
  },
  warranty: {
    type: String,
    required: function() {
      return this.type === 'serialized-product' || this.type === 'generic-product';
    }
  },
  mrp: {
    type: Number,
    required: function() {
      return this.type === 'serialized-product' || this.type === 'generic-product';
    }
  },
  purchasePrice: {
    type: Number,
    required: function() {
      return this.type === 'serialized-product' || this.type === 'generic-product';
    }
  },
  salePrice: {
    type: Number,
    required: true
  },
  stock: [stockSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add this after defining the model
itemSchema.index({ 'stock.serialNumber': 1 }, { 
  unique: true, 
  partialFilterExpression: { 'stock.serialNumber': { $type: 'string' } }
});

const inventoryModel = mongoose.model('Item', itemSchema);
module.exports = inventoryModel;