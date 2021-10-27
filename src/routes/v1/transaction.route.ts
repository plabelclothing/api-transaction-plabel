/* External modules */
import {Router} from 'express';

/* Locale modules */
import {init} from '../../controllers/transation';

const router = Router();

// Transaction init
router.post('/sale', init);

export default router;
