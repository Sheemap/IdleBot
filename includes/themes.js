'use strict';
const app = require('../app.js')
const db = require('./db.js')
const fs = require('fs')
const ini = require('ini')

var themes = {}

exports.getMes = function(theme,things,callback){
    let retThings = {}
    for(var obj in things){
        retThings[things[obj]] = themes[theme]['messages'][things[obj]];
        // retThings.push(themes[theme]['messages'][things[obj]])
    }

    callback(retThings)
}

exports.getItems = function(theme,callback){
    let enhance = [themes[theme]['items']['itemheader'],themes[theme]['items']['upgradeheader']]
    let retItems = themes[theme]['items']
    let retUps = themes[theme]['upgrades']
    callback(enhance,retItems,retUps)
}

exports.getList = function(callback){
    var list = []
    var dlist = []
    for(var p in themes){
        list.push(p)
        dlist.push(themes[p]['description'])
    }
    callback(list,dlist)
}

exports.parseThemes = function(dirname) {
    console.log('Parsing themes in folder '+dirname)
    let list = []
    db.all('SELECT * FROM items',callback)
    var curitems = []
    var curups = []
    function callback(err,rows){
        for(var w in rows){
            if(rows[w].type == 'quantity'){
                curitems.push(w)
            }else{
                curups.push(w)
            }
        }

        fs.readdir(dirname, function(err, filenames) {
            if (err) {
                console.log(err)
                return;
            }
            filenames.forEach(function(filename) {
                var theme = ini.parse(fs.readFileSync(dirname + filename, 'utf-8'))

                 var title = theme.general.title
                 if(title in themes){
                     console.log('Already have a theme by this name! Skipping this next one...')
                 }else{
                    var desc = theme.general.desc
                    var author = theme.general.author

                    themes[title] = {}
                     if(typeof desc != 'undefined'){
                         themes[title]['description'] = desc
                     }else{
                         themes[title]['description'] = ''
                     }
                     themes[title]['items'] = {}
                     themes[title]['upgrades'] = {}
                     themes[title]['messages'] = {}

                     let tmpitems = [];
                     let tmpups = [];
                     for(var x in theme.item){
                         if(x.startsWith('item')){
                             if(theme['item'][x] != ''){
                                 themes[title]['items'][x] = theme['item'][x]
                                 tmpitems.push(x)
                             }
                         }
                         if(x.startsWith('descit')){
                             if(theme['item'][x] != ''){
                                 themes[title]['items'][x] = theme['item'][x]
                             }
                         }
                         if(x.startsWith('descup')){
                             if(theme['item'][x] != ''){
                                 themes[title]['upgrades'][x] = theme['item'][x]
                             }
                         }
                         if(x.startsWith('upgrade')){
                             if(theme['item'][x] != ''){
                                 themes[title]['upgrades'][x] = theme['item'][x]
                                 tmpups.push(x)
                             }
                         }
                     }
                     themes[title]['items']['itemheader'] = theme.item.headeritem
                     themes[title]['items']['upgradeheader'] = theme.item.headerupgrade
                     themes[title]['items']['upct'] = curups.length
                     themes[title]['items']['itemct'] = curitems.length
                     themes[title]['items']['denomitem'] = theme.item.denomitem
                     themes[title]['items']['denomupgrade'] = theme.item.denomupgrade

                     themes[title]['items']['symbol'] = theme.item.symbol
                     themes[title]['items']['prefix'] = theme.item.prefix

                    var finishstatus = theme.message.finishstatus
                    var finishtimegood = theme.message.finishtimegood
                    var finishtimebad = theme.message.finishtimebad
                    var finishformula = theme.message.finishformula
                    var checkstatus = theme.message.checkstatus
                    var purchase = theme.message.purchase
                    var failpurchase = theme.message.failpurchase

                     for(var u in theme.message){
                         themes[title]['messages'][u] = theme['message'][u]
                     }

                     var error = false
                     if(purchase == '' | failpurchase == '' | finishformula == '' | finishtimebad == '' | finishtimegood == '' | finishstatus == '' | checkstatus == '' | title == '' | typeof purchase == 'undefined' | typeof failpurchase == 'undefined' |typeof finishformula == 'undefined' | typeof finishtimebad == 'undefined' | typeof finishtimegood == 'undefined' | typeof finishstatus == 'undefined' | typeof checkstatus == 'undefined' | typeof title == 'undefined'){
                         console.log('Some of the messages have not been configured in theme '+title+'. Will be unable to use.')
                         error = true
                     }
                     if(tmpups.length < curups.length){
                         console.log('There are not enough upgrade items defined in theme '+title+'. Will be unable to use.')
                         error = true
                     }
                     if(tmpitems.length < curitems.length){
                         console.log('There are not enough production items defined in theme '+title+'. Will be unable to use.')
                         error = true
                     }
                     if(error){
                         delete themes[title]
                     }else{
                         list.push(title)
                     }
                 }
            });
            console.log('Finished parsing themes: '+list)

        });
    }
}
