import express from 'express';
import bodyParser from 'body-parser';
var router = express.Router();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'VCE' });
});

router.post('/record/video-chunk', bodyParser.raw({ type: "*/*", limit: "5000mb" }), function(req, res) {
    const data = req.body;
    
    res.status(200).json({
      success: "ok"
    })
});

export default router;
