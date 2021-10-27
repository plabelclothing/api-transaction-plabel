'use strict';
/* External modules */
import {Router} from 'express';
/* Locale modules */
import check from './check.route';
import transaction from './transaction.route';
import notification from './notification.route';

const router = Router();

router.use('/check', check);
router.use('/transaction', transaction);
router.use('/notification', notification);

export default router;
