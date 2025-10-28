const mongoose = require('mongoose');
const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicle: { make:String, model:String, year:Number },
  tyre_sku: String,
  slot: String,
  status: { type:String, enum:['booked','done','cancelled'], default:'booked' },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Booking', BookingSchema);
