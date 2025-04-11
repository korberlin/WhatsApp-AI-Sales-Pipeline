import express from 'express'
import whatsappController from '../controllers/whatsapp.js';
const router = express.Router();

router.get('/webhook/whatsapp', whatsappController.get);
router.post('/webhook/whatsapp',whatsappController.post);

export default router;