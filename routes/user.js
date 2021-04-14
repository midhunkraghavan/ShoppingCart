
var express = require('express');
var router = express.Router();
var adminhelper = require('../helper/adminhelper')
var userhelper = require('../helper/userhelper')
const veryfylogin = (req, res, next) => {
    if (req.session.userloggedin) {
        next()
    }
    else {
        res.redirect('/login')
    }

}

router.get('/', async function (req, res, next) {
    let cartcount = null
    let user = req.session.user
    if (user) {
        cartcount = await userhelper.getcartcount(user._id)
    }

    adminhelper.getallproducts((products) => {
        res.render('user/view-products', { products, user, cartcount });
    })
});

router.get('/login', (req, res) => {
    if (req.session.userloggedin) {
        res.redirect('/')

    }
    else {
        let err = req.session.userloginerr
        res.render('user/login', { err })
    }

})

router.post('/login', (req, res) => {
    userhelper.dologin(req.body).then((response) => {
        if (response.status) {
            req.session.userloggedin = true
            req.session.user = response.user
            res.redirect('/')
        }
        else {
            req.session.userloginerr = true
            res.redirect('/login')

        }
    })
})

router.get('/logout', (req, res) => {
    req.session.user=null
    req.session.userloggedin=null
    req.session.userloginerr=null
    res.redirect('/')
})

router.get('/signup', (req, res) => {
    res.render('user/signup')
})
router.post('/signup', (req, res) => {
    userhelper.dosignup(req.body).then((response) => {

        req.session.user = response
        req.session.userloggedin = true
        res.redirect('/')

    })
})
router.get('/cart', veryfylogin, async (req, res) => {
    let user = req.session.user
    let total = 0
    let cartcount = await userhelper.getcartcount(user._id)
    if (cartcount != 0) {
        total = await userhelper.gettotalamount(user._id)
    }
    userhelper.getcartproducts(user._id).then((products) => {
        res.render('user/cart', { user, products, cartcount, total })
    })

})

router.get('/addtocart/:id', veryfylogin, (req, res) => {
    productid = req.params.id
    user = req.session.user
    userhelper.addtocart(productid, user._id).then(() => {
        // res.redirect('/')
        res.json({ status: true })
    })
})

router.post('/changeproductquantity', (req, res) => {

    userhelper.changeproductquantity(req.body).then(async (response) => {
        response.total = 0
        if (response.count != 0) {
            response.total = await userhelper.gettotalamount(req.body.userid)
        }
        res.json(response)
    })
})
router.get('/removeproduct/', (req, res) => {
    let productid = req.query.productid
    let cartid = req.query.cartid
    userhelper.removeproduct(productid, cartid).then((response) => {
        res.redirect('/cart')
    })
})
router.get('/placeorder', veryfylogin, async (req, res) => {
    let user = req.session.user
    cartcount = await userhelper.getcartcount(user._id)
    if (cartcount == 0) {
        res.redirect('/')
    }
    else {
        let total = await userhelper.gettotalamount(user._id)
        res.render('user/placeorder', { total, user, cartcount })
    }
})
router.post('/placeorder', async (req, res) => {
    let user = req.session.user
    let cartproducts = await userhelper.getcartproductslist(user._id)
    let total = await userhelper.gettotalamount(user._id)
    userhelper.placeorder(req.body, cartproducts, total).then((orderid) => {

        if (req.body["payment-methode"] === "COD") {
            res.json({codsuccess: true })

        }
        else{
            userhelper.generaterazorpay(orderid,total).then((order)=>{
                res.json(order)
            })
        }

    })
})
router.get('/ordersuccess', veryfylogin, (req, res) => {
    let user = req.session.user
    res.render('user/ordersuccess', { user })
})
router.get('/orders', veryfylogin, async (req, res) => {
    let user = req.session.user
    let orders = await userhelper.getorders(user._id)
    res.render('user/orders', { user, orders })
})
router.get('/view-order-products/:id',veryfylogin,async(req,res)=>{
    let user=req.session.user
    let orderid=req.params.id
    let products=await userhelper.getorderedproducts(orderid)
    res.render('user/view-order-products',{user,products,orderid})
})
router.post('/verifypayment',(req,res)=>{
userhelper.verifypayment(req.body).then(()=>{
   
userhelper.changepaymentstatus(req.body['order[receipt]']).then(()=>{
    res.json({status:true})
})

}).catch(()=>{
res.json({status:false,errmsg:"payment failed"})
})
})
router.get('/cancelorder/:id',(req,res)=>{
    userhelper.cancelorder(req.params.id).then(()=>{
        res.redirect('/orders')
    })
})
module.exports = router
