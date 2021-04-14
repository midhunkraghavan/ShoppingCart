var db = require('../config/connection')
var collection = require('../config/collection')
var bcrypt = require('bcrypt')
var objectid = require('mongodb').ObjectID
const { ObjectId } = require('mongodb')
const Razorpay=require('razorpay')
const { resolve } = require('path')

var instance = new Razorpay({
    key_id: 'rzp_test_Gs7Aesm0E8CQcW',
    key_secret: 'Qxm3nQFQRhn7u3iI8YaEcTT0',
  });
module.exports = {

    dosignup: (userdata) => {

        return new Promise(async (resolve, reject) => {

            userdata.password = await bcrypt.hash(userdata.password, 10)

            db.get().collection(collection.USER_COLLECTION).insertOne(userdata).then((data) => {

                resolve(data.ops[0])
            })

        })


    },


    dologin: (logindata) => {

        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: logindata.email })
            let response = {}
            if (user) {
                bcrypt.compare(logindata.password, user.password).then((status) => {
                    if (status) {
                        console.log("login succes")
                        response.status = true
                        response.user = user

                        resolve(response)
                    }
                    else {
                        console.log("wrong password")
                        resolve({ status: false })
                    }
                })
            }
            else {
                console.log("email id does not exit")
                resolve({ status: false })
            }

        })



    },

    addtocart: (productid, userid) => {

        let productdetails = {
            productid: objectid(productid),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectid(userid) })
            if (cart) {
                let productexit = cart.products.findIndex(product => product.productid == productid)
                if (productexit != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectid(userid), 'products.productid': objectid(productid) }, {
                        $inc: { 'products.$.quantity': 1 }
                    })
                }
                else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectid(userid) },
                            { $push: { products: productdetails } }).then((response) => {
                                resolve()
                            })
                }

            }
            else {
                let cartobj = {
                    user: objectid(userid),
                    products: [productdetails]

                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartobj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getcartproducts: (userid) => {
        return new Promise(async (resolve, reject) => {
            let cartitems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: {
                        user: objectid(userid)
                    }
                },
                {
                    $unwind: '$products'


                },
                {
                    $project: {
                        productid: '$products.productid',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'productid',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                }


            ]).toArray()

            resolve(cartitems)


        })
    },
    getcartcount: (userid) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectid(userid) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeproductquantity: (details) => {
        details.quantity = parseInt(details.quantity)
        details.count = parseInt(details.count)
        return new Promise((resolve, reject) => {
            if (details.quantity == 1 && details.count == -1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectid(details.cartid) }, {
                    $pull: { products: { productid: objectid(details.productid) } }
                }).then(async (response) => {
                    let count = 0
                    let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectid(details.userid) })
                    if (cart) {
                        count = cart.products.length
                    }
                    resolve({ removeproduct: true, count: count })
                })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectid(details.cartid), 'products.productid': objectid(details.productid) }, {
                    $inc: { 'products.$.quantity': details.count }
                }).then((response) => {
                    resolve({ status: true })
                })
            }

        })
    },
    removeproduct: (productid, cartid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectid(cartid) }, {
                $pull: { products: { productid: objectid(productid) } }
            }).then((response) => {
                resolve({ removeproduct: true })
            })

        })
    },
    gettotalamount: (userid) => {
        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: {
                        user: objectid(userid)
                    }
                },
                {
                    $unwind: '$products'


                },
                {
                    $project: {
                        productid: '$products.productid',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'productid',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }
                }


            ]).toArray()

            resolve(total[0].total)

        })
    },
    getcartproductslist: (userid) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectid(userid) })
            resolve(cart.products)
        })
    },
    placeorder: (orderdetails, productslist, total) => {
        return new Promise((resolve, reject) => {
            let status = orderdetails['payment-methode'] === 'COD' ? 'placed' : 'pending'
            let orderobj = {
                delivery: {
                    name:orderdetails.name,
                    address: orderdetails.address,
                    place: orderdetails.place,
                    pincode: orderdetails.pincode,
                    mobile: orderdetails.mobile
                },
                userid: objectid(orderdetails.userid),
                productslist: productslist,
                totalamount: total,
                date: new Date(),
                paymentmethode: orderdetails["payment-methode"],
                status: status
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderobj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).removeOne({ user: ObjectId(orderdetails.userid) })
                resolve(response.ops[0]._id)
            })
        })
    },
    getorders: (userid) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userid: objectid(userid) }).toArray()
            resolve(orders)

        })
    },
    getorderedproducts: (orderid) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectid(orderid) }
                },
                {
                    $unwind: '$productslist'
                },
                {
                    $project: {
                        item: '$productslist.productid',
                        quantity: '$productslist.quantity'

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind:'$product'
                }
            ]).toArray()
            resolve(products)
        })
    },
    generaterazorpay:(orderid,total)=>{
       
        return new Promise((resolve,reject)=>{
                 
            var options = {
                amount:total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt:""+orderid
              };
              instance.orders.create(options, function(err, order) {
             
                if(err){
                    console.log(err)
                  
                }else{
                    console.log(order);
                    resolve(order)
                }
              })
             
        })
    },
    verifypayment:(details)=>{
        console.log(details)
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto');
            let hash = crypto.createHmac('sha256','Qxm3nQFQRhn7u3iI8YaEcTT0')
            hash.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hash=hash.digest('hex')
            if(hash==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changepaymentstatus:(orderid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectid(orderid)},{
                $set:{status:"placed"}
            }).then(()=>{
                resolve()
            })
        })
    },
    cancelorder:(orderid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).deleteOne({_id:objectid(orderid)}).then(()=>{
                resolve()
            })
        })
    }

}