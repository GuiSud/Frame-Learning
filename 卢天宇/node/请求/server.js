const http = require('http');
const { URL } = require('url');
const path = require('path');
const fs = require('fs');
const querystring = require('querystring');
const interface = require('./interface/index.js');
// console.log(new URL('http://www.baodu.com/api12/nem/?age=1&ne=2'))
const port = 1121;

const extArr = {
    'html': 'text/html;charset=utf-8',
    'js': 'application/javascript;charset=utf-8',
}

http.createServer((req, res) => {
    let { url, method } = req;
    let { name, ext, dir } = path.parse(url);
    console.log(`url：${url}\nmethod：${method}`);
    console.log(`name：${name}\next：${ext}\ndir：${dir}`);
    const dirPath = path.join(__dirname, url);
    console.log(dirPath);
    if (ext) {
        fs.access(dirPath, (err) => {
            if (err) {
                res.writeHead(404, {
                    'content-type': "text/plain;charset=utf-8"
                });
                res.end('没有该路径');
                return;
            }
            const { size } = fs.statSync(dirPath);
            console.log('size：', size);
            console.log('------END------');
            if (req.headers['if-none-match'] == size) {
                res.writeHead(304);
                res.end();
            } else {
                res.writeHead(200, {
                    'content-type': extArr[ext.split('.')[1]] || 'text/plain;charset=utf-8',
                    "Etag": size,
                    'Cache-control': `max-age=${10}`
                })
                res.end(fs.readFileSync(dirPath));
            }
        })
    } else { // 接口文件
        const apiPath = path.join(__dirname, dir);
        fs.access(apiPath, (err) => {
            if (err) {
                res.writeHead(404);
                res.end();
                return;
            }

            let api = require(`${path.join(__dirname, dir)}`);
            // console.log(api)
            // console.log(api[name]);

            if (!api[name]) {
                res.writeHead(400, {
                    "content-type": "text/plain;charset=utf-8"
                });
                res.end('接口请求错误！');
                return;
            }

            // 拿到传参
            let str = '';
            req.on('data', (chuck) => {
                console.log(chuck);
                str += chuck;
            })

            req.on('end', async () => {
                str = str ? JSON.parse(str) : {};
                // console.log('前台传参：', str);
                let result = await api[name](str);
                console.log("result:", result);
                res.writeHead(200, {
                    "content-type": "application/json;charset=utf-8"
                });
                result = typeof result === 'string' ? result : JSON.stringify(result);
                res.end(result);
            })
        })
    }
}).listen(port, () => {
    console.log(`http://localhost:${port}`);
});
