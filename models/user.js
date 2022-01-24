const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: {
    type: String,
  },
  resetTokenInfo: {
    type: Date,
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

// methods是一個object
userSchema.methods.addTocart = function (product) {
  const cartProductIndex = this.cart.items.findIndex(cp => {
    // 去找購物車裡面是否已經有一樣的商品
    return cp.productId.toString() === product._id.toString();
  });

  let newQuantity = 1;
  const cartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    cartItems[cartProductIndex].quantity = newQuantity;
  } else {
    cartItems.push({
      productId: product._id,
      quantity: newQuantity,
    });
  }
  const updatedCart = { items: cartItems };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.deleteFromCart = function (id) {
  const updatedCartItems = this.cart.items.filter(item => {
    return item.productId.toString() !== id.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
