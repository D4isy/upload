var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    upload = require('../lib/localUpload'),
    fs = require('fs'),
    articleModel = mongoose.model('uploads');

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  articleModel.find(function (err, Articles) {
    if (err) {
      return next(err);
    } else {
      res.render('list', {
        title: '업로드 테스트 list',
        articles: Articles
      });
    }
  });
});

// 이미지 1개 업로드 (싱글)
router.get('/single', function (req, res, next) {
  res.render('single', {
    title: '이미지 1개 업로드 테스트 form'
  });
});


// 이미지 1개 업로드 (싱글) 처리
router.post('/single', function (req, res, next) {
  var thisUpload = upload.multerSetting('article').single('attachment');
  thisUpload(req,res,function(err){
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.end('<script>alert("파일 크기가 너무 큽니다."); location.replace("/single");</script>');
      } else {
        return next(err);
      }
    } else if (req.validateErr) {
      return res.end(req.validateErr);
    } else {
      var thisArticle = new articleModel({
        title: req.body.title,
        imagePath: '/upload/article/'+req.file.filename,
        imageOriginalName: req.file.originalname,
        imageSize: req.file.size
      });

      thisArticle.save(function (err) {
        if (err) {
          return next(err);
        } else {
          res.redirect('/');
        }
      })
    }
  });
});

// 이미지 여러개 업로드 (Array)
router.get('/array', function (req, res, next) {
  res.render('array', {
    title: '이미지 여러개 업로드 테스트 form'
  });
});

// 이미지 여러개 업로드 (Array) 처리
router.post('/array', function (req, res, next) {
  var thisUpload = upload.multerSetting('article').array('attachment');
  thisUpload(req,res,function(err){
    if (err) {
      return next(err);
    } else {
      var thisArticle = new articleModel({
        title: req.body.title,
        imagePath: upload.filePath(req.files, '/upload/article/').join(),
        imageOriginalName: upload.fileOriginalName(req.files).join(),
        imageSize: upload.fileSize(req.files).join()
      });

      thisArticle.save(function (err) {
        if (err) {
          return next(err);
        } else {
          res.redirect('/');
        }
      })
    }
  });
});

// 이미지 각각 업로드 (fields)
router.get('/fields', function (req, res, next) {
  res.render('fields', {
    title: '이미지 각각 업로드 테스트 form'
  });
});

// 이미지 각각 업로드 (fields) 처리
router.post('/fields', function (req, res, next) {
  var thisUpload = upload.multerSetting('article').fields([{ name: 'attachment1', maxCount: 1 }, { name: 'attachment2', maxCount: 1 }]);
  thisUpload(req,res,function(err){
    if (err) {
      return next(err);
    } else {
      console.log(req.files);
      var thisArticle = new articleModel({
        title: req.body.title,
        imagePath: '/upload/article/'+req.files['attachment1'][0].filename,
        imageOriginalName: req.files['attachment1'][0].originalname,
        imageSize: req.files['attachment1'][0].size,
        imagePath2: '/upload/article/'+req.files['attachment2'][0].filename,
        imageOriginalName2: req.files['attachment2'][0].originalname,
        imageSize2: req.files['attachment2'][0].size
      });

      thisArticle.save(function (err) {
        if (err) {
          return next(err);
        } else {
          res.redirect('/');
        }
      })
    }
  });
});

router.post('/remove', function (req, res, next){
  articleModel.remove({_id: req.body.id},function (err) {
    if (err) {
      return next(err);
    } else {
      upload.remove(req.body.path);
      res.json(true);
    }
  });
});

router.get('/download', function (req, res, next){
  articleModel.findOne({_id: req.query._id},function (err, Article) {
    if (err) {
      return next(err);
    } else {
      if (Article) {
        var $path,$name;
        if (Article.imagePath2) {
          $path = Article.imagePath+','+Article.imagePath;
          $name = Article.imageOriginalName+','+Article.imageOriginalName2;
        } else {
          $path = Article.imagePath;
          $name = Article.imageOriginalName;
        }
        upload.download($path , $name, function(err, Result) {
          if (err) {
            return next(err);
          } else if (typeof(Result) === 'object') {
            res.cookie('isDownload', 'complete', {
              maxAge: 10000
            });
            res.setHeader('Content-disposition', 'attachment');
            res.download(Result.path, Result.name);
          } else {
            res.cookie('isDownload', 'complete', {
              maxAge: 10000
            });
            res.setHeader('Content-disposition', 'attachment');
            res.download(Result, function (err) {
              if (err) {
                return next(err);
              } else {
                fs.unlinkSync(Result);
              }
            });
          }
        });
      } else {
        res.send('파일이 없습니다.');
      }
    }
  });
});
