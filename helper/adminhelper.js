

var db = require('../config/connection')
var collection = require('../config/collection')
var objectid = require('mongodb').ObjectID
var bcrypt = require('bcrypt')
module.exports = {
    addproduct: (products, callback) => {
        products.price = parseInt(products.price)
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(products).then((data) => {

            return callback(data.ops[0]._id)
        })
    },

    getallproducts: async (callback) => {

        let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
        return callback(products)

    },
    deleteproduct: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({ _id: objectid(id) }).then((response) => {
                resolve(response)
            })
        })

    },
    editproduct: (id) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectid(id) }).then((product) => {
                resolve(product)
            })
        })
    },
    updateproduct: (id, product) => {
        product.price = parseInt(product.price)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectid(id) }, {
                $set: {
                    name: product.name,
                    category: product.category,
                    description: product.description,
                    price: product.price
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    getallusers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users= await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    getallorders:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders= await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },
    verifyorder:(orderid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectid(orderid)},
            {$set:{status:"SHIPPED"}}).then(()=>{
                resolve()
            })
        })
    },
    dologin:(admindetails)=>{
        return new Promise(async(resolve,reject)=>{
            let response={}
            let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({email:admindetails.email})
            let password=await bcrypt.hash(admindetails.password, 10)
            console.log(password)
            if(admin){
                bcrypt.compare(admindetails.password,admin.password).then((status)=>{
                    if(status){
                        response.admin=admin
                        response.status=true
                        resolve(response)
                    }else{
                        resolve({status:false})
                    }
                })
            }else{
                resolve({status:false})
            }
        })
    }
   
}