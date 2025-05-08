const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

app.use(express.json());

// เชื่อมต่อ MongoDB
mongoose.connect('mongodb://localhost:27017/mydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// สร้างโมเดล
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
}));

// POST สมัคร user
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ตรวจสอบว่ามีผู้ใช้ซ้ำหรือไม่
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email นี้มีผู้ใช้แล้ว' });
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.json({ message: 'สมัครเรียบร้อย', user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err.message });
  }
});

// POST ล็อกอิน
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // หา user จาก email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'ไม่พบผู้ใช้นี้' });
    }

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    res.json({ message: 'เข้าสู่ระบบสำเร็จ', user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err.message });
  }
});

// POST สร้าง user (เดิม)
app.post('/user', async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.json(user);
});

// GET ทั้งหมด
app.get('/users', async (req, res) => {
  const users = await User.find().select('-password'); // ไม่ส่ง password ออกไป
  res.json(users);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:3000`);
});


app.get('/', (req, res) => {
  res.json('Server running');
});
