/* External modules */
import {Router} from 'express';

/* Locale modules */
import {payPalNotify} from '../../controllers/notification';

const router = Router();

// Transaction init
router.post('/paypal', payPalNotify);

export default router;
