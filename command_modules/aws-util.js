//Module to connect to aws
var aws = require('aws-sdk');;
var fs = require('fs');
var noop = function(){};
var mkdirp = require('mkdirp');
var util = require('util');
var path = require('path');
var logger = {};
logger.log = function(message){
    if(typeof(message) =='object')
    {
        console.log(util.inspect(message));
    }
    else console.log(message);
};
function download(request,callback)
{
    logger.log('AwsUtil.download starts');
    logger.log(request);;
    callback = (callback || noop);
    if(typeof request.bucket === 'undefined' || request.bucket == '' || typeof request.key === 'undefined' || request.key == '')
    {
        throw new Error('Missing Source Bucket and Source Key');
    }
    if(typeof request.destinationPath === 'undefined' || request.destinationPath == '')
    {
        throw new Error('Missing Destination Path');
    }
    mkdirp(path.dirname(request.destinationPath), function(err){
            if(err){
            callback(new Error('Error in creating destination directory:'+err),request.destinationDirectory);
            }
            else
            {
            local.getObject(request,function(err,results){
                if(err){callback(new Error('Error in getting S3 Object' + err));}
                else{
                logger.log('AwsUtil.download ends');
                callback(null,request.destinationPath);
                }
                });
            }
            });
};
function upload(request,callback)
{
    logger.log('AwsUtil.upload starts');
    logger.log(request);;
    callback = (callback || noop);
    if(typeof request.bucket === 'undefined' || request.bucket == '' || typeof request.key === 'undefined' || request.key == '')
    {
        throw new Error('Missing Source Bucket and Source Key');
    }
    if(typeof request.sourcePath=== 'undefined' || request.sourcePath== '')
    {
        throw new Error('Missing source path');
    }
    var response = {};
    fs.readFile(request.sourcePath, function (err, data) {
            if (err) { callback(new Error('Error in reading sourcePath in AWS-Util.upload' + err)); }
            request.data = data;
            local.putObject(request,function(err,results){
                if(err){callback(new Error('Error in putting S3 Object' + err));}
                var response = {};
                response.bucket = request.bucket;
                response.key = request.key;
                logger.log('AwsUtil.upload ends');
                callback(null,response); 
                });
            });
};
var local = {
getObject: function (request,callback)
           {
               logger.log('AwsUtil.local.getObject starts');
               aws.config.loadFromPath('./config.json');
               logger.log(request);
               var file = fs.createWriteStream(request.destinationPath).on('error', function(err){
                       callback(new Error('Error during file.createWriteStream:' + err));
                       });
               new aws.S3().getObject({Bucket: request.bucket,Key: request.key})
                   .on('httpError', function(err){
                           callback(new Error('Error during S3 download' + err));
                           })
               .on('httpData', function(chunk){
                       file.write(chunk);
                       })
               .on('httpDone', function(){ 
                       file.end();
                       logger.log('AwsUtil.local.getObject ends');
                       callback(null,file);
                       }).send();
           },
putObject : function(request,callback)
            {
                var acl = request.acl || 'private';
                logger.log('acl'+acl);
                aws.config.loadFromPath('./config.json');
                var s3bucket = new aws.S3({params: {Bucket: request.bucket}});
                s3bucket.createBucket(function() {
                        var putRequest = {Key: request.key, Body: request.data, ACL:acl};
                        s3bucket.putObject(putRequest, function(err, putRequest) {
                            if (err){callback(new Error('Error in put S3 putObject' + err));}                    
                            callback(null);
                            });
                        });
            }
};
exports.download = download;
exports.upload = upload;
