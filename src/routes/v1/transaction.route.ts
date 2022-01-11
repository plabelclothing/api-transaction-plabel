/* External modules */
import {Router} from 'express';

/* Locale modules */
import {init, refund} from '../../controllers/transation';

const router = Router();

// Transaction init
router.post('/sale', init);

// Transaction refund
router.post('/refund', refund);

export default router;
