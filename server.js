var http=require('http');
var fs=require('fs');
var url=require('url');
var mime=require('mime');
function readBooks(callback) {
    fs.readFile('./book.json','utf8',function (err,data) {
        if(err||data=='') data='[]';
        data=JSON.parse(data);
        callback(data);
    })
}
function writeBooks(data, callback) {
    fs.writeFile('./book.json',JSON.stringify(data),callback);
}

http.createServer(function (req, res) {
    var urlObj=url.parse(req.url,true);
    var pathname=urlObj.pathname;
    if(pathname=='/'){
        res.setHeader('Content-Type','text/html;charset=utf8');
        fs.createReadStream('./index.html').pipe(res);
    }else if(/^\/book(\/\d+)?$/.test(pathname)){
        var id=/^\/book(\/\d+)?$/.exec(pathname)[1];
        switch (req.method){
            case 'GET':
                if(id){
                    id=id.slice(1);
                    readBooks(function (data) {
                        var book=data.find(function (item) {
                            return item.id==id;
                        });
                        res.end(JSON.stringify(book));
                    });
                }else {
                    readBooks(function (data) {
                        res.end(JSON.stringify(data));
                    })
                }
                break;
            case 'POST':
                var str='';
                req.on('data',function (chunk) {
                    str+=chunk;
                });
                req.on('end',function () {
                    str=JSON.parse(str);
                    readBooks(function (data) {
                        str.id=data.length?data[data.length-1].id+1:1;
                        data.push(str);
                        writeBooks(data,function () {
                            res.end(JSON.stringify(str));
                        })
                    })
                });
                break;
            case 'DELETE':
                if(id){
                    id=id.slice(1);
                    readBooks(function (data) {
                        data=data.filter(function (item) {
                            return item.id!=id;
                        });
                        writeBooks(data,function () {
                            res.end(JSON.stringify({}));
                        })
                    })
                }
                break;
            case 'PUT':
                if(id){
                    id=id.slice(1);
                    str='';
                    req.on('data',function (chunk) {
                        str+=chunk;
                    });
                    req.on('end',function () {
                        str=JSON.parse(str);
                        readBooks(function (data) {
                            data=data.map(function (item) {
                                if(item.id==id){
                                    return str;
                                }
                                return item;
                            });
                            writeBooks(data,function () {
                                res.end(JSON.stringify(str));
                            })
                        })

                    })
                }
                break;
        }
    }else {
        fs.exists('.'+pathname,function (flag) {
            if(flag){
                res.setHeader('Content-Type',mime.lookup(pathname)+';charset=utf8');
                fs.createReadStream('.'+pathname).pipe(res);
                return;
            }
            res.statusCode=404;
            res.end('not found');
        })
    }



}).listen(90);