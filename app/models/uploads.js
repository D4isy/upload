// Example model

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var uploadsSchema = new Schema({
  title: String,
  imagePath: String,
  imageOriginalName: String,
  imageSize: String,
  create_at: {
    type: Date,
    default: Date.now()
  },
  imagePath2: String,
  imageOriginalName2: String,
  imageSize2: String
});


mongoose.model('uploads', uploadsSchema);
