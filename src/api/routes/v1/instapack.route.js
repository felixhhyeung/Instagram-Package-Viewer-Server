const express = require('express');
const { authorize } = require('../../middlewares/auth');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const homedir = require('os').homedir();

const router = express.Router();

const packageFileDirectory = process.env.PACKAGE_FILE_DIRECTORY;
const packageServeDirectory = process.env.PACKAGE_SERVE_DIRECTORY;
const fsReadablePackageServeDirectory = packageServeDirectory.replace('~', homedir);

/**
 * Load user when API with userId route parameter is hit
 */
// router.param('userId', controller.load);

router
  .route('/')
  /**
   * @api {get} v1/instapack get package names
   * @apiDescription get package names
   * @apiVersion 1.0.0
   * @apiName get package names
   * @apiGroup Instapack
   * @apiPermission master
   *
   * @apiHeader {String} Authorization  master password
   *
   * @apiSuccess {String[]} packages  package names
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated users can access the data
   * @apiError (Forbidden 403)  Forbidden  Only authenticated users can access the data
   * @apiError (InternalServerError 500)  InternalServerError Internal error
   */
  .get(authorize(), (req, res, next) => {
    const packages = [];
    fs.readdirSync(fsReadablePackageServeDirectory).forEach(x => {
      // console.log(`file: ${file}`);
      if (fs.statSync(path.join(fsReadablePackageServeDirectory, x)).isDirectory()) {
        packages.push(x);
      }
    });
    res.json({ packages });
  });

router
  .route('/:username')
  /**
   * @api {put} v1/instapack/:username Pack a user
   * @apiDescription Pack a user
   * @apiVersion 1.0.0
   * @apiName Pack a user
   * @apiGroup Instapack
   * @apiPermission master
   *
   * @apiHeader {String} Authorization  master password
   * @apiHeader {String} loginusername  loginusername
   *
   * @apiSuccess {number} code  Just the 200 code to notify packing success
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated users can access the data
   * @apiError (Forbidden 403)  Forbidden  Only authenticated users can access the data
   * @apiError (InternalServerError 500)  InternalServerError Internal error
   */
  .put(authorize(), (req, res, next) => {
    const [loginUsername, username] = [req.headers.loginusername, req.params.username];
    exec(`cd ${packageFileDirectory} && instapack ${loginUsername ? `-l ${loginUsername}` : ''} -p ${username} -s ${packageServeDirectory} || cd ~`, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error}`);
        throw new Error(error);
      }
      // if (stderr) {
      //   console.log(`stderr: ${stderr}`);
      //   throw new Error(stderr);
      // }
      res.json(stdout);
    });
  })
  /**
   * @api {get} v1/username Get file names
   * @apiDescription Get file names
   * @apiVersion 1.0.0
   * @apiName Get file names
   * @apiGroup Instapack
   * @apiPermission master
   *
   * @apiHeader {String} Authorization  master password
   * @apiHeader {String} username  username
   *
   * @apiSuccess {Object[]} files  files
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated users can access the data
   * @apiError (Forbidden 403)  Forbidden  Only authenticated users can access the data
   * @apiError (InternalServerError 500)  InternalServerError Internal error
   */
  .get(authorize(), (req, res, next) => {
    const [username] = [req.params.username];
    const files = [];
    const baseDirectory = path.join(fsReadablePackageServeDirectory, username);
    fs.readdirSync(baseDirectory).forEach(x => {
      if (
        !x.startsWith('.')
        && !fs.statSync(path.join(baseDirectory, x)).isDirectory()
      ) {
        files.push(x);
      }
    });
    res.json({ files });
  });

router
  .route('/download/:package/:file')
  /**
   * @api {put} v1/instapack/download/:package/:file Download a file
   * @apiDescription Download a file
   * @apiVersion 1.0.0
   * @apiName Download a file
   * @apiGroup Instapack
   * @apiPermission master
   *
   * @apiHeader {String} Authorization  master password
   *
   * @apiSuccess {number} code  Just the 200 code to notify packing success
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated users can access the data
   * @apiError (Forbidden 403)  Forbidden  Only authenticated users can access the data
   * @apiError (InternalServerError 500)  InternalServerError Internal error
   */
  .get(authorize(), (req, res, next) => {
    const [packageName, fileName] = [req.params.package, req.params.file];
    res.download(path.join(fsReadablePackageServeDirectory, packageName, fileName));
  });

module.exports = router;
