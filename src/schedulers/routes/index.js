import express from 'express';
import nblArchiverRunRoutes from './nblArchiverRun.js';

const router = express.Router();

router.use('/', nblArchiverRunRoutes);

export default router;
