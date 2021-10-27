/* External modules */
import {Router} from 'express';

/* Locale modules */
import {ping, stats, telemetry} from '../../controllers/check';

const router = Router();

router.get('/ping', ping);
router.get('/stats', stats);
router.get('/telemetry', telemetry);

export default router;
