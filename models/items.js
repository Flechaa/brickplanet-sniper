const mongoose = require('mongoose');

const itemsSchema = mongoose.Schema({
  id: String 
});

module.exports = mongoose.model('items', itemsSchema)