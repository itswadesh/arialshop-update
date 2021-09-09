db.product.find({}).forEach(function (item) {
  if (item.img) item.img = item.img.replace('?q=70', '')
  var newImages = []
  if (item.images) {
    item.images.forEach(function (c) {
      //iterate over array element in the current doc
      c = c.replace('?q=70', '')
      newImages.push(c)
    })
    item.images = newImages
    db.product.save(item)
  }
})
