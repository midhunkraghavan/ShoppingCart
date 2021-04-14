var express = require('express');
var router = express.Router();
var adminhelper = require('../helper/adminhelper')
var userhelper=require('../helper/userhelper')

const verifylogin=(req,res,next)=>{
  if(req.session.adminlogedin)
  {
    next()
  }else
  {
    res.redirect('/admin/login')
  }
}

router.get('/admin',verifylogin, function (req, res, next) {
  adminhelper.getallproducts((products) => {
    let admin=req.session.admin
    res.render('admin/view-products', { products, admin})
  })
});


router.get('/admin/addproducts',verifylogin, (req, res) => {
  let admin=req.session.admin
  res.render('admin/add-products',{admin})
})



router.post('/admin/addproducts', (req, res, next) => {
  adminhelper.addproduct(req.body, (id) => {
    let image = req.files.image
    image.mv('./public/productimages/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.redirect('/admin/addproducts')
      }
      else {
        console.log(err)
      }
    })
  })
})

router.get('/admin/deleteproduct/:id',verifylogin,(req,res)=>{
let id=req.params.id
adminhelper.deleteproduct(id).then((reponse)=>{
  res.redirect('/admin')
})
})

router.get('/admin/editproduct/:id',verifylogin,(req,res)=>{
let id=req.params.id
let admin=req.session.admin
adminhelper.editproduct(id).then((product)=>{

  res.render('admin/edit-product',{product,admin})
})
})
router.post('/admin/editproduct/:id',(req,res)=>{
  let id=req.params.id
  updatedproduct=req.body
adminhelper.updateproduct(id,updatedproduct).then(()=>{
  if(req.files.image)
  {
    let  image=req.files.image
    image.mv('./public/productimages/'+id+'.jpg')
  }
  res.redirect('/admin')
})
})
router.get('/admin/users',verifylogin, function (req, res, next) {

  adminhelper.getallusers().then((users)=>{
    let admin=req.session.admin
    res.render('admin/view-users',{users,admin})

  })
})

router.get('/admin/orders',verifylogin,async(req,res)=>{
   let admin=req.session.admin
let orders=await adminhelper.getallorders()
res.render('admin/view-orders',{orders,admin})
})

router.get('/admin/view-ordered-products/:id',verifylogin, async(req,res)=>{
  let orderid=req.params.id
   let admin=req.session.admin
  let products=await userhelper.getorderedproducts(orderid)
  res.render('admin/view-ordered-products',{products,orderid,admin})
})
router.get('/admin/verify-order/:id',(req,res)=>{
  adminhelper.verifyorder(req.params.id).then(()=>{
    res.redirect('/admin/orders')
  })
})
router.get('/admin/login',(req,res)=>{
  if(req.session.adminlogedin){
    res.redirect('/admin')
  }else{
    let err=req.session.adminloginerr
    res.render('admin/login',{err})
  }

})
router.post('/admin/login',(req,res)=>{
adminhelper.dologin(req.body).then((response)=>{
  if(response.status){
    req.session.admin=response.admin
    req.session.adminlogedin=true
    res.redirect('/admin')
  }
  else{
    req.session.adminloginerr=true
    res.redirect('/admin/login')
  }

})
})
router.get('/admin/logout',(req,res)=>{
  req.session.admin=null
  req.session.adminlogedin=null
  req.session.adminloginerr=null
  res.redirect('/admin/login')
})
module.exports = router;
