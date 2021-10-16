'use strict';
/* External modules */
import {Router} from 'express';
/* Locale modules */
import check from './check.route';
import transaction from './transaction.route';

const router = Router();

router.use('/check', check);
router.use('/transaction', transaction);

export default router;
