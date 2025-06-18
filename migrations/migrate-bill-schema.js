
const mongoose = require('mongoose');
const Bill = require('../models/billModel'); // apne actual Bill model ka path lagao

// ⚙️ Change this to your actual MongoDB connection string
const MONGO_URI = 'mongodb+srv://3gdigitalindia:beyond789@crmproject.vaxgwjt.mongodb.net/CRM-based-cms?retryWrites=true&w=majority&appName=CRMProject'; // Replace this

async function migrateBills() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const bills = await Bill.find({
      $or: [
        { amountPaid: { $exists: false } },
        { amountDue: { $exists: false } },
        { extendedPaymentStatus: { $exists: false } },
        { status: { $exists: false } },
        { rejectionReason: { $exists: false } },
        { isReverted: { $exists: false } }
      ]
    });

    console.log(`🔍 Found ${bills.length} old bills to migrate`);

    for (let bill of bills) {
      let updated = false;

      if (bill.amountPaid === undefined) {
        bill.amountPaid = 0;
        updated = true;
      }

      if (bill.amountDue === undefined) {
        // default logic: assume full amount due (you can customize this if needed)
        bill.amountDue = bill.totalAmount || 0;
        updated = true;
      }

      if (!bill.extendedPaymentStatus) {
        bill.extendedPaymentStatus = 'unpaid';
        updated = true;
      }

      if (!bill.status) {
        bill.status = 'pending';
        updated = true;
      }

      if (bill.rejectionReason === undefined) {
        bill.rejectionReason = null;
        updated = true;
      }

      if (bill.isReverted === undefined) {
        bill.isReverted = false;
        updated = true;
      }

      if (updated) {
        await bill.save();
        console.log(`✅ Updated bill: ${bill._id}`);
      }
    }

    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    mongoose.disconnect();
  }
}

migrateBills();