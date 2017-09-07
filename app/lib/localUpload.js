
/*=============================================================
=   multer, path ,fs를 이용한 로컬 파일 업로드 관련 모듈 작성   =
=============================================================*/

/* -------------------------------------------------------------------------------
  * version : 0.0.1
  * app 절대경로는 config.root 참조
  * 업로드 사용법
  var thisUpload = upload.multerSetting('업로드할 폴더명').type('input file 이름');
  //type은
      1.single == 예) db필드 1 : 파일 1
      2.array == 예) db필드 1 : 파일 n
      3.any == 예) db필드 n : 파일 n
  thisUpload(req,res,function(err){
    내용 작성
  });

  A. multerSetting == multer 셋팅관련
  B. fileName == 파일 여러개일때 (req.files) 변경된 파일명으로만  배열 반환
  C. fileOriginalName == 파일 여러개일때 (req.files) 원래 파일명으로만  배열 반환
  E. remove == 서버에서 파일 삭제

  1.dirExists == (모듈 내부용) 디렉토리가  서버에 존재하는지 체크하는 함수
  2.fileExists == (모듈 내부용) 파일이 서버에 존재하는지 체크하는 함수

-------------------------------------------------------------------------------*/

'use strict';

var path = require('path'),
    fs = require('fs'),
    multer  = require('multer'),
    zip = new require('node-zip')(),
    config = require('../../config/config');

/**
 * multer 기본 세팅
 * @param {String} 업로드할 디렉토리명
 */
module.exports.multerSetting = function(Dir){
  if (Dir) {
    var storage = multer.diskStorage({
      destination : function (req, file, callback) {
        // 업로드 root + dir
        var uploadDir = path.join(config.root, '/public/upload/') + Dir;
        // 디렉토리가 없으면 생성
        if(!dirExists(uploadDir)){ fs.mkdirSync(uploadDir); }
          callback(null, uploadDir );
      },
      // 파일명 변환
      filename : function (req, file, callback) {
        callback(null, Date.now() + '.' + file.mimetype.split('/')[1] );
      }
    });
    // 세팅된 정보 return
    return multer({
      storage: storage,
      limits: { fileSize: 2097152 }, // 2mb 제한 default byte
      fileFilter: function (req, file, callback) {
        if (file.mimetype.indexOf('image') === -1) {
          req.validateErr = '<script>alert("이미지 파일만 업로드 가능합니다."); location.replace("/single");</script>';
          callback(null, false, new Error('이미지 파일만 업로드 가능합니다.'));
        } else {
          callback(null, true);
        }
      }
    });
  } else {
    throw new Error('The parameter is omitted.. OTL');
  }

}


/**
 * multer Array 형태로 사용될 때 변환된 파일명으로만 재배열해서 반환
 * @param {Array} req.files
 * @param {String} 업로드할 경로
 */
module.exports.filePath = function(Files, Path){
  if (Files.length === 0 && !Path) {
    throw new Error('The parameter is omitted.. OTL');
  } else {
    var fileName = Files.map(function(file){
      return Path+file.filename;
    });
    return fileName;
  }
}

/**
 * multer Array 형태로 사용될 때 원래 파일명으로만 재배열해서 반환
 * @param {Array} req.files
 */
module.exports.fileOriginalName = function(Files){
  if (Files.length === 0) {
    throw new Error('The parameter is omitted.. OTL');
  } else {
    var fileOriginalName = Files.map(function(file) {
      return file.originalname;
    });
    return fileOriginalName;
  }
}

/**
 * multer Array 형태로 사용될 때 사이즈만 재배열해서 반환
 * @param {Array} req.files
 */
module.exports.fileSize = function(Files){
  if (Files.length === 0) {
    throw new Error('The parameter is omitted.. OTL');
  } else {
    var fileSize = Files.map(function(file){
      return file.size;
    });
    return fileSize;
  }
}

/**
 * 다운로드 관련
 * @param {String} DB에 저장된 파일 path
 * @param {String} DB에 저장된 파일 originalname
 */
 module.exports.download = function(uploadPath, uploadName, callback){
   var arr;
   if (!uploadPath && !uploadName) {
     callback(new Error('The parameter is omitted.. OTL'));
    // ,로 이어진 String들은 여러 파일이라 zip으로 생성
   } else if (uploadPath.indexOf(',') !== -1 && uploadPath.indexOf(',') !== -1) {
     var $split1 = [];
     var $split2 = [];
     arr = [];
     $split1 = uploadPath.split(',');
     $split2 = uploadName.split(',');
     for (var i = 0; i < $split1.length; i++) {
       zip.file($split2[i], fs.readFileSync(path.join(config.root, '/public') + $split1[i]));
     }
     var $Zip = zip.generate({base64:false, compression:'DEFLATE'});
     fs.writeFileSync(path.join(config.root, '/public')+'/upload/images.zip', $Zip, 'binary');
     arr = path.join(config.root, '/public')+'/upload/images.zip';
     callback(null, arr);
    // 그 외 하나의 문자열들은 Object 반환
   } else {
     arr = {
       path: path.join(config.root, '/public') + uploadPath,
       name: uploadName
     }
     callback(null, arr);
   }
 }

/**
 * 업로드 된 파일 삭제
 * @param {Array|String} DB에 저장된 업로드 경로
 * 파일이 업로드 된 실제 경로를 구한 다음 삭제.
 */
module.exports.remove = function(uploadPath){
  // String 형태로 넘어왔을 때
  if (uploadPath && !Array.isArray(uploadPath)) {
    var absolutePath, absoluteDir;
    // ,로 이어진 String 일 때  처리
    if (uploadPath.indexOf(',') !== -1) {
      var $split = uploadPath.split(',');
      absolutePath = [];
      absoluteDir = [];
      $split.forEach(function (Path) {
        absolutePath.push(path.join(config.root, '/public')+Path);
        absoluteDir.push(path.dirname(path.join(config.root, '/public')+Path));
      });
    // 그 외 하나의 문자열로 처리
    } else {
      absolutePath = path.join(config.root, '/public') + uploadPath;
      absoluteDir = path.dirname(absolutePath);
    }
  // 배열 형태로 넘어왔을 때
  } else if (uploadPath && uploadPath.length !== 0 && Array.isArray(uploadPath)) {
    absolutePath = [];
    absoluteDir = [];
    uploadPath.forEach(function (Path) {
      absolutePath.push(path.join(config.root, '/public')+Path);
      absoluteDir.push(path.dirname(path.join(config.root, '/public')+Path));
    });
  } else {
    throw new Error('The parameter is omitted.. OTL');
  }
  // 업로드된 폴더와 파일명이 존재하는지 체크한 후 파일 삭제
  if (dirExists(absoluteDir) && fileExists(absolutePath)) {
    try {
      // Array
      if (Array.isArray(absolutePath)) {
        absolutePath.forEach(function (Path) {
          fs.unlinkSync(Path);
        });
      // Not Array
      } else {
        fs.unlinkSync(absolutePath);
      }
    } catch (e) {
      throw e;
    }
  } else {
    throw new Error('The file or directory could not be found.');
  }
}

/**
 * 디렉토리가 존재하는지 체크
 * @param {Array|String} DB에 저장된 업로드 경로
 */
function dirExists(absoluteDir){
  try {
    // Array
    if (Array.isArray(absoluteDir)) {
      var flag = [];
      absoluteDir.forEach(function (Dir) {
        flag.push(fs.statSync(Dir).isDirectory()); // 존재하면 true 없으면 false
      });
      if (flag.indexOf(false) === -1) {
        return true;
      } else {
        return false;
      }
    // Not Array
    } else {
      return fs.statSync(absoluteDir).isDirectory(); // 이하 동일
    }
  } catch (e) {
    // 디렉토리가 존재하지 않으면 'ENOENT' 에러를 반환해줍니다. return false
    if (e.code === 'ENOENT') {
      return false;
    } else {
    // 그외 에러는 확인
      throw e;
    }
  }
}

/**
 * 파일이 존재하는지 체크
 * @param {Array|String} DB에 저장된 업로드 경로
 */
function fileExists(apsolutePath){
  try {
    // Array
    if (Array.isArray(apsolutePath)) {
      for(var i=0; i<apsolutePath.length; i++){
        return fs.statSync(apsolutePath[i]).isFile();
      }
      var flag = [];
      apsolutePath.forEach(function (Files) {
        flag.push(fs.statSync(Files).isFile()); // 존재하면 true 없으면 false
      });
      if (flag.indexOf(false) === -1) {
        return true;
      } else {
        return false;
      }
    // Not Array
    } else {
      return fs.statSync(apsolutePath).isFile(); // 이하 동일
    }
  } catch (e) {
    // 파일이 존재하지 않으면 'ENOENT' 에러를 반환해줍니다. return false
    if (e.code === 'ENOENT') {
      return false;
    } else {
    // 그 외 에러는 확인
      throw e;
    }
  }
}
