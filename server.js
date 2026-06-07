const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL || 'mongodb://mongo:27017/ecommerce')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  stock: Number
});

const Product = mongoose.model('Product', productSchema);

// Seed Database
async function seedDB() {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany([
      { name: 'Laptop', price: 50000, category: 'Electronics', stock: 10 },
      { name: 'Mouse', price: 500, category: 'Accessories', stock: 50 },
      { name: 'Keyboard', price: 1500, category: 'Accessories', stock: 30 },
      { name: 'Headphones', price: 2000, category: 'Electronics', stock: 25 },
      { name: 'Webcam', price: 3500, category: 'Electronics', stock: 15 },
      { name: 'Monitor', price: 12000, category: 'Electronics', stock: 8 }
    ]);
    console.log('Database Seeded');
  }
}
seedDB();

// API Routes
app.get('/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post('/products', async (req, res) => {
  const newProduct = new Product(req.body);
  await newProduct.save();
  res.json({ message: 'Product Added', product: newProduct });
});

app.delete('/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product Deleted' });
});

app.put('/products/:id', async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ message: 'Product Updated', product: updated });
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' });
});

// Frontend UI
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ecommerce App</title>
      <style>
        body { font-family: Arial; background: #1e3a8a; margin: 0; padding: 40px; }
        .card { background: white; padding: 30px; border-radius: 12px; max-width: 1000px; margin: auto; }
        .badge { padding: 4px 12px; border-radius: 20px; font-size: 14px; margin: 0 5px; }
        .green { background: #10b981; color: white; }
        .blue { background: #3b82f6; color: white; }
        .yellow { background: #f59e0b; color: white; }
        .red { background: #ef4444; color: white; }
        button { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin: 5px; }
        .btn-red { background: #ef4444; }
        .btn-green { background: #10b981; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 30px; }
        .product { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
        input { padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
        .form-row { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }
        .actions { margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🚀 Ecommerce App - CRUD</h1>
        <p>Running in Docker + MongoDB</p>
        <div>
          Container: <span class="badge green">my-shop</span>
          Port: <span class="badge blue">3000</span>
          DB: <span class="badge yellow">Connected</span>
        </div>
        <br>
        
        <h3>Add New Product</h3>
        <div class="form-row">
          <input id="name" placeholder="Product Name">
          <input id="price" type="number" placeholder="Price">
          <input id="category" placeholder="Category">
          <input id="stock" type="number" placeholder="Stock">
          <button class="btn-green" onclick="addProduct()">Add Product</button>
        </div>

        <button onclick="loadProducts()">Refresh Products</button>
        <div id="product-list"></div>
      </div>

      <script>
        async function loadProducts() {
          const res = await fetch('/products');
          const products = await res.json();
          
          let html = '<div class="grid">';
          products.forEach(p => {
            html += \`
              <div class="product">
                <h3>\${p.name}</h3>
                <p><b>Category:</b> \${p.category}</p>
                <p><b>Price:</b> ₹<input id="price-\${p._id}" value="\${p.price}" style="width:80px"> </p>
                <p><b>Stock:</b> <input id="stock-\${p._id}" value="\${p.stock}" style="width:60px"> </p>
                <div class="actions">
                  <button onclick="updateProduct('\${p._id}')">Update</button>
                  <button class="btn-red" onclick="deleteProduct('\${p._id}')">Delete</button>
                </div>
              </div>
            \`;
          });
          html += '</div>';
          document.getElementById('product-list').innerHTML = html;
        }

        async function addProduct() {
          const name = document.getElementById('name').value;
          const price = document.getElementById('price').value;
          const category = document.getElementById('category').value;
          const stock = document.getElementById('stock').value;
          
          if(!name || !price || !category || !stock) {
            alert('Saare fields bhar bhai');
            return;
          }

          await fetch('/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, category, stock })
          });
          
          document.getElementById('name').value = '';
          document.getElementById('price').value = '';
          document.getElementById('category').value = '';
          document.getElementById('stock').value = '';
          loadProducts();
        }

        async function deleteProduct(id) {
          if(!confirm('Pakka delete karna hai?')) return;
          await fetch('/products/' + id, { method: 'DELETE' });
          loadProducts();
        }

        async function updateProduct(id) {
          const price = document.getElementById('price-' + id).value;
          const stock = document.getElementById('stock-' + id).value;
          
          await fetch('/products/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price, stock })
          });
          alert('Updated!');
          loadProducts();
        }

        loadProducts();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});