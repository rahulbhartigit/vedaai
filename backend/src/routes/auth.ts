import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Otp } from '../models/Otp';
import { sendOtpEmail } from '../services/emailService';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const signToken = (userId: string, email: string, schoolName: string) =>
  jwt.sign(
    { userId, email, schoolName },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '30d' }
  );

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return void res.status(400).json({ success: false, error: 'Name, email and password are required' });

    if (password.length < 8)
      return void res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing.isVerified)
      return void res.status(409).json({ success: false, error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);

    // Upsert user (allow re-signup before verification)
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { name, email: email.toLowerCase(), passwordHash, isVerified: false },
      { upsert: true, new: true }
    );

    // Invalidate old OTPs
    await Otp.deleteMany({ email: email.toLowerCase() });

    const otp = generateOtp();
    await Otp.create({
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await sendOtpEmail(email, otp);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, error: 'Signup failed. Try again.' });
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return void res.status(400).json({ success: false, error: 'Email and OTP are required' });

    const record = await Otp.findOne({
      email: email.toLowerCase(),
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record || record.otp !== otp)
      return void res.status(400).json({ success: false, error: 'Invalid or expired OTP' });

    record.used = true;
    await record.save();

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isVerified: true },
      { new: true }
    );

    if (!user)
      return void res.status(404).json({ success: false, error: 'User not found' });

    const token = signToken(user._id.toString(), user.email, user.schoolName);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, schoolName: user.schoolName },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return void res.status(400).json({ success: false, error: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return void res.status(401).json({ success: false, error: 'Invalid email or password' });

    if (!user.isVerified)
      return void res.status(403).json({ success: false, error: 'Please verify your email first' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return void res.status(401).json({ success: false, error: 'Invalid email or password' });

    const token = signToken(user._id.toString(), user.email, user.schoolName);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, schoolName: user.schoolName },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// ── PUT /api/auth/school ──────────────────────────────────────────────────────
router.put('/school', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { schoolName } = req.body;
    if (!schoolName?.trim())
      return void res.status(400).json({ success: false, error: 'School name is required' });

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { schoolName: schoolName.trim() },
      { new: true }
    );

    if (!user)
      return void res.status(404).json({ success: false, error: 'User not found' });

    // Issue fresh token with updated schoolName
    const token = signToken(user._id.toString(), user.email, user.schoolName);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, schoolName: user.schoolName },
    });
  } catch (err) {
    console.error('Set school error:', err);
    res.status(500).json({ success: false, error: 'Failed to update school name' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId).select('-passwordHash');
    if (!user)
      return void res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

export default router;
