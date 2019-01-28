const cheerio = require('cheerio')
const async = require('async')
const fs = require('fs')
const url = require('url')
const request = require('request')
const path = require('path')
//爬去虎扑爆照区图片
const url1 = 'https://bbs.hupu.com/selfie'
let ssr = []
let allUrl = []
getData(5)

function getData(pages) {
    for (let i = 1; i <= pages; i++) {
        url2 = 'https://bbs.hupu.com/selfie-' + i
        request(url2, function (err, res) {
            if (err) {
                console.log(err)
            }
            let $ = cheerio.load(res.body.toString());
            $('.titlelink>a:first-child').each((idx, element) => {
                let $element = $(element)
                let href = url.resolve(url1, $element.attr('href'))
                allUrl.push(href)
                request(href, function (err, res) {
                    if (err) {
                        console.log(err)
                    }
                    let $ = cheerio.load(res.body.toString())
                    let add = href
                    let title = $('.bbs-hd-h1>h1').attr('data-title')
                    let tximg = $('.headpic:first-child>img').attr('src');//用户头像
                    let txname = $('.j_u:first-child').attr('uname');//用户ID
                    let contentimg1 = $('.quote-content>p:nth-child(1)>img').attr('src');//图1
                    let contentimg2 = $('.quote-content>p:nth-child(2)>img').attr('src');//图2
                    let contentimg3 = $('.quote-content>p:nth-child(3)>img').attr('src');//图3
                    ssr.push({
                        tx: tximg,
                        name: txname,
                        pic: contentimg1, contentimg2, contentimg3
                    })
                    let stad = {
                        "address": add,
                        "title": title,
                        "ID": txname,
                        "touxiang": tximg,
                        "pic1": contentimg1,
                        "pic2": contentimg2,
                        "pic3": contentimg3
                    };
                    let picArr = [contentimg1, contentimg2, contentimg3];
                    for (let i = 0; i < picArr.length; i++) {
                        if (picArr[i]) {
                            picArr[i] = picArr[i].split('?')[0]
                        }
                    }
                    //写入到json
                    fs.appendFile('result1.json', JSON.stringify(stad) + '&*&', 'utf-8', function (err) {
                        if (err) {
                            throw new Error("appendFile failed...")
                        }
                    })
                    async.mapSeries(picArr, function (item, callback) {
                        if (item) {
                            var filename = parseUrlForFileName(item)
                            downloadImg(item, filename, function () {
                                console.log(filename + ' done');
                            });
                        }
                    })
                })
            })
        })
    }
}

//命名
function parseUrlForFileName(address) {
    //提取出用 ‘/' 隔开的path的最后一部分
    var filename = path.basename(address);
    return filename;
}

//下载图片
function downloadImg(uri, filename, callback) {
    //http请求
    request.head(uri, function (err, res, body) {
        if (err) {
            console.log('err:' + err);
            return false;
        }
        //水管式保存数据，防止未来得及记录数据又开始读取数据而导致数据丢失
        request(uri).pipe(fs.createWriteStream('./data/' + filename)).on('close', callback);
    });
}