var restify = require('restify');
var os = require('os');
var imageMagick = require ('./command_modules/image-magick');

var ip_addr = '127.0.0.1';
var port    =  process.env.PORT || '8080';
var pjson = require('./package.json');
var server = restify.createServer({
    name : "cloud-command"
});
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());
var pathImageMagick = '/imagemagick'
server.get('/ping', function ping(req, res, next){res.send(pjson.name + ' ['+pjson.version+'] is up listening at machine ' + os.hostname() +' on port:'+ port );});
server.post({path : pathImageMagick} ,function execute(req, res, next) { imageMagick.execute(req,res,next);});
server.listen(port , function(){
    console.log('%s listening at %s ', server.name , server.url);
});
