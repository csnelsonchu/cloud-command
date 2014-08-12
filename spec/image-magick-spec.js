var imageMagick = require("../command_modules/image-magick.js");
var path = require('path');
var appDir = path.dirname(require.main.filename).replace(/\\/g,'/');
var rewire = require("rewire");

describe("ImageMagick.getCommand" , function (){
        it("should return an error if toKey or toBucket is blank",function() {

            console.log('\r\n---Test ImageMagick.getCommand Starts----------------');

            //Assign
            var request = {'fromBucket':'fromBucket','fromKey':'FromKey.png','toBucket':'','toKey':'', 'command':'identify --version'};

            //Action
            expect(function(){imageMagick.getCommand(request,function(err,results){
                    if(err){
                    console.log('Error:'+err);
                    }
                    });
                }).toThrow(new Error("Destination Bucket and Key was not defined"));

            console.log('\r\n---Test Ends--------------------');
            });
        });
describe("ImageMagick.getCommand" , function (){
        it("should return an error if toKey or toBucket is null",function() {

            console.log('\r\n---Test ImageMagick.getCommand Starts----------------');

            //Assign
            var request = {'fromBucket':'fromBucket','fromKey':'FromKey.png', 'command':'identify --version'};

            //Action
            expect(function(){imageMagick.getCommand(request,function(err,results){
                    if(err){
                    console.log('Error:'+err);
                    }
                    });
                }).toThrow(new Error("Destination Bucket and Key was not defined"));

            console.log('\r\n---Test Ends--------------------');
            });
        });
describe("ImageMagick.getCommand" , function (){
        it("should return the expected command",function() {

            console.log('\r\n---Test ImageMagick.getCommand Starts----------------');

            //Assign
            var request = {'fromBucket':'fromBucket','fromKey':'FromKey.png','toBucket':'toBucket','toKey':'toKey.png', 'command':'convert {input} {output}'};
            var expected = 'dfd';
            var acutal = '';
            var completed = false;

            //Action
            imageMagick.getCommand(request, function(err,results){
                completed = true;
                if(err){}
                else
                {
                actual = results;
                }
                });

            //Assert
            waitsFor(function(){
                    return completed;
                    },"callback returned",1000);

            runs(function()
                    {
                    expect(actual.command).toMatch("toKey.png");
                    expect(actual.command).toMatch("toBucket");
                    console.log('Test Ends----------------');
                    });
        });
});
describe("ImageMagick.execute" , function (){
        it("should return the correct responsek",function() {
            console.log('\r\n---Test ImageMagick.execute starts----------------');
            //Assign
            var imageMagickMock = rewire('../command_modules/image-magick.js');
            var expected = {};
            var request = {};
            var actual = {};
            request.params = {'fromBucket':'tickticktee-media-qa-temp','fromKey':'00903a8d-3107-4b1c-bd2e-3db148e4703c.png','toBucket':'toBucket','toKey':'toKey.png', 'command':'convert {input} {output}'};
            var res = {};
            res.send = function(response){
                console.log(response.bucketName);
                console.log(response.keyName);
            };
            var completed = false;
            var awsUtilDownloadMock = function (request,callback) {
                console.log('mocked download function');
                console.log(request.destinationPath);
                callback(null,request.destinationPath);
            };
            var awsUtilUploadMock = function (request,callback) {
                console.log('mocked upload function');
                console.log(request.sourcePath);;
                callback(null,null);
                };
                
                imageMagickMock.__set__('awsUtil',{
                download : awsUtilDownloadMock,
                upload: awsUtilUploadMock
                });

            imageMagickMock.__set__('child_process', {exec: function (request,callback) {
                console.log('mocked child_process exec');
                callback(null,null,null);
                }});

            imageMagickMock.__set__('local', {mkdirp: function(request,callback){
                console.log('mock mkdirp');
                callback(null,null);
            }});
            
            //Action
            imageMagickMock.execute(request,res,function(err,results){
                completed = true;
                if(err){
                console.log('Error:'+err);
                }
                else
                {
                actual = results;
                console.log('results = ' + results.bucketName + '/' + results.keyName);
                }
                });

            //Assert
            waitsFor(function(){
                    return completed;
                    },"callback returned",100);

            runs(function()
                    {
                    expect(request.params.toBucket).toBe(actual.bucketName);    
                    expect(request.params.toKey).toBe(actual.keyName);    
                    console.log('Test Ends----------------');
                    });
        });
});
