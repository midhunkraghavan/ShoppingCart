

function addtocart(productid){

$.ajax({


url:'/addtocart/'+productid,
methode:'get',
success:(response)=>{
   if(response.status){
    let count=$('#cartcount').html()
    count=parseInt(count)+1
   $("#cartcount").html(count)
   }
}

})


}