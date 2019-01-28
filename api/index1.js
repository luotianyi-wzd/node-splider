const cheerio = require('cheerio')
const async = require('async')
const request = require('request')
let currentCount = 0;
let newUrl = ''
let urlArr = []
const mysql = require('mysql')
const config = require('./../config/config')
let list = []
let time
//拼接链接
for (let i = 1; i < 2; i++) {
    if (i == 1) {
        newUrl = 'https://cnodejs.org'
    } else {
        newUrl = 'https://cnodejs.org/?tab=all&page=' + i
    }
    urlArr.push(newUrl)
}
// 使用连接池，提升性能
var pool = mysql.createPool(config.mysql)
//sql语句
var addSql = 'insert into bolg(title, author, href) values ?'
//数据库
var query = function (sql, params, callback) {
    pool.getConnection(function (err, connection) {
        connection.query(sql, params, function (err, request) {
            if (err) {
                console.log('error', err.message)
                return
            }
            callback(request, err)
        })
        connection.release();
    })
}

function success(request) {
    console.log(request)
}

//并发获取链接
async.mapSeries(urlArr, function (item, callback) {
    fetch(item, callback)
}, function (err, result) {
    console.log(result[0])
    console.log('共' + result[0].length + '个')
    //获取文章详情
    async.mapLimit(result[0], 10, function (item, callback) {
        currentCount++
        time = new Date().getTime()
        request({url: item.href}, (err, res) => {
            if (err) {
                console.log(err)
            }
            console.log('当前并发数:' + currentCount + ',耗时:' + (new Date().getTime() - time) + 'mm' + ',抓取地址:' + item.href)
            currentCount--
            let $ = cheerio.load(res.body);
            let author = $('#main #sidebar .user_name a').text()
            let href = item.href
            let title = item.title
            let data = {
                author,
                title,
                href
            };
            callback(null, data)
        })
    }, function (err, result) {
        console.log(result)
        let params = []
        result.map((item, index) => {
            params.push([item.title, item.author, item.href])
        })
        console.log('共抓取:' + result.length)
        query(addSql, [params], success)
    })
})

//获取所有链接
function fetch(url, callback) {
    request({
        url,
    }, (err, res) => {
        if (err) {
            console.log(err)
        }
        let $ = cheerio.load(res.body)
        $('#topic_list .cell').each(function () {
            let title = $(this).find('.topic_title_wrapper a').attr('title')
            let href = 'https://cnodejs.org' + $(this).find('.topic_title_wrapper a').attr('href')
            list.push({title, href})
        })
        callback(null, list)
    })
}





