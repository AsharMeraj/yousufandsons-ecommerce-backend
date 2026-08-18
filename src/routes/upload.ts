import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

// POST /upload - admin only, uploads an image, returns public URL
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  try {
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error } = await supabaseAdmin.storage
      .from('product-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(fileName);

    res.status(201).json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;