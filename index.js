import { got } from 'got';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import { type } from 'os';


const LoadData = async () => {
    try {
        const url = `https://bakalari.spst.cz/Timetable/Public/`;
        const res = got(url);
        const data = await res;
        return cheerio.load(data.body);
    }
    catch (err) {
        console.log(err);
    }
};

const LoadDataFrom = async (addUrl) => {
    try {
        const url = `https://bakalari.spst.cz/Timetable/Public/${addUrl}`;
        const res = got(url);
        const data = await res;
        return cheerio.load(data.body);
    }
    catch (err) {
        console.log(err);
    }
};

const cacheLongtime = async () => {
    console.log('\x1b[35m', '-=-=-=-=-=-Caching longtime-=-=-=-=-=-', '\x1b[0m');
    let timed = Date.now();
    const $ = await LoadData();
    let classes = [], teachers = [], rooms = [];
    try { // CLASSES
        $('option', '#selectedClass').each((i, elem) => { classes[i] = [elem.attribs['value'], $(elem).text().replace(/\s+/g, '')]; });
        classes = classes.slice(1);
        console.log('Cached ' + classes.length.toString() + ' classes');
    } catch (err) { console.log(err); }

    try { // TEACHERS
        $('option', '#selectedTeacher').each((i, elem) => { teachers[i] = [elem.attribs['value'], $(elem).text().replace(/\s{2,}/g, '')]; });
        teachers = teachers.slice(1);
        console.log('Cached ' + teachers.length.toString() + ' teachers');
    } catch (err) { console.log(err); }

    try { // ROOMS
        $('option', '#selectedRoom').each((i, elem) => { rooms[i] = [elem.attribs['value'], $(elem).text().replace(/\s+/g, '')]; });
        rooms = rooms.slice(1);
        console.log('Cached ' + rooms.length.toString() + ' rooms');
    } catch (err) { console.log(err); }

    try { // cache into a .json file
        if (!fs.existsSync('cache')) fs.mkdirSync('cache');
        let ctrInfo = JSON.stringify({ classes: classes, teachers: teachers, rooms: rooms });
        fs.writeFileSync("cache/longtime.json", ctrInfo);
        timed = Date.now() - timed;
        console.log('\x1b[32m', '✔ Cached and saved to file in ' + timed.toString() + 'ms ✔', '\x1b[0m');
    } catch (err) { console.log(err); }
};

const getLongtimeCache = () => {
    const data = fs.readFileSync('cache/longtime.json', 'utf8');
    return JSON.parse(data);
};

const LoadCTRData = async (ctr, CTRvalue) => {
    const longtime = getLongtimeCache();
    let path;
    switch (ctr) {
        case 'class': {
            let value = longtime['classes'].filter((x) => { return x[1] == CTRvalue })[0];
            if (value === undefined) {
                console.log('\x1b[31m', '⚠ No match found for argument >' + CTRvalue + '<', '\x1b[0m');
                break;
            }
            path = 'Actual/Class/' + value[0];
            break;
        }
        case 'teacher': {
            let value = longtime['teachers'].filter((x) => { return x[1] == CTRvalue })[0];
            if (value === undefined) {
                console.log('\x1b[31m', '⚠ No match found for argument >' + CTRvalue + '<', '\x1b[0m');
                break;
            }
            path = 'Actual/Teacher/' + value[0];
            break;
        }
        case 'room': {
            let value = longtime['rooms'].filter((x) => { return x[1] == CTRvalue })[0];
            if (value === undefined) {
                console.log('\x1b[31m', '⚠ No match found for argument >' + CTRvalue + '<', '\x1b[0m');
                break;
            }
            path = 'Actual/Room/' + value[0];
            break;
        }
        default: {
            console.log('\x1b[31m', '⚠ Incorrect ctr argument >' + ctr + '<', '\x1b[0m');
        }
    }
    const $ = await LoadDataFrom(path);
    return $;
}

const GetCTRPair = (ctr, CTRvalue) => {
    const data = fs.readFileSync('cache/longtime.json', 'utf8');
    return JSON.parse(data)[ctr].filter(x => x[1] === CTRvalue)[0];
};

const ParseTime = (timeValues) => {
    const timeNow = new Date();
    return [
        new Date(
            Date.parse(
                timeNow.getFullYear().toString() + '-' +
                timeValues[1].toString() + '-' +
                timeValues[0].toString() + 'T' +
                (timeValues[3] < 10 ? '0' : '') + timeValues[3].toString() + ':' + timeValues[4].toString() + ':00.000Z')
        ),
        new Date(
            Date.parse(
                timeNow.getFullYear().toString() + '-' +
                timeValues[1].toString() + '-' +
                timeValues[0].toString() + 'T' +
                (timeValues[5] < 10 ? '0' : '') + timeValues[5].toString() + ':' + timeValues[6].toString() + ':00.000Z')
        )
    ];
}

const CacheClassData = async (className) => {
    const $ = await LoadCTRData('class',className);

    let lessons = [];
    let readyForExp = [];
    
    $('.day-item-hover').each((i, elem) => {
        lessons[i] = JSON.parse(elem.attribs['data-detail']);
        //console.log(lessons);
        readyForExp[i] = 
        {
            type: null,
            subject: null,
            lesson: null,
            time: null,
            teacher: null,
            room: null,
            group: null,
            theme: null,
            notice: null,
            changeInfo: {
                type: null,
                subject: null,
                teacher: null,
                room: null
            },
            removedinfo: {
                type: null,
                subject: null,
                teacher: null
            }
        };
    
        switch(lessons[i]['type']) {
            case 'atom': {
                readyForExp[i]['type'] = lessons[i]['type']; 
                readyForExp[i]['subject'] = lessons[i]['subjecttext'].match(/^[^\|]+/)[0].slice(0,-1);
                let timeValues = lessons[i]['subjecttext'].match(/-?\d{1,2}/g);
                readyForExp[i]['lesson'] = timeValues[2];
                readyForExp[i]['time'] = ParseTime(timeValues);
                readyForExp[i]['teacher'] = lessons[i]['teacher']; 
                readyForExp[i]['room'] = GetCTRPair('rooms',lessons[i]['room']); 
                readyForExp[i]['group'] = lessons[i]['group'] === '' ? null : lessons[i]['group']; 
                readyForExp[i]['theme'] = lessons[i]['theme'] === '' ? null : lessons[i]['theme']; 
                readyForExp[i]['notice'] = lessons[i]['notice'] === '' ? null : lessons[i]['notice']; 
                if(lessons[i]['changeinfo'] !== '') {
                    let values = lessons[i]['changeinfo'].match(/[^\:,]+/g);
                    readyForExp[i]['changeInfo']['type'] = values[0];
                    if(/\d/.test(values[0])) {
                        if(/Přesun z/.test(values[0])){
                            readyForExp[i]['changeInfo']['type'] = 'Přesun z';
                            readyForExp[i]['changeInfo']['subject'] = values[2].slice(1);
                            readyForExp[i]['changeInfo']['teacher'] = values[3].slice(1);
                            readyForExp[i]['changeInfo']['room'] = GetCTRPair('rooms',values[4].slice(1));
                            break;
                        }
                    }
                    switch(values[0]) {
                        case 'Spojeno':{          
                            if(values.length === 4){
                                readyForExp[i]['changeInfo']['subject'] = values[1].slice(1);
                                readyForExp[i]['changeInfo']['teacher'] = values[2].slice(1);
                                readyForExp[i]['changeInfo']['room'] = GetCTRPair('rooms',values[3].slice(1));
                            }
                            if(values.length === 3){
                                readyForExp[i]['changeInfo']['teacher'] = values[1].slice(1);
                                readyForExp[i]['changeInfo']['room'] = GetCTRPair('rooms',values[2].slice(1));
                            }
                            break;
                        }
                        case 'Suplování':{
                            readyForExp[i]['changeInfo']['teacher'] = values[1].slice(1);
                            break;
                        }
                        case 'Změna místnosti':{
                            readyForExp[i]['changeInfo']['room'] = GetCTRPair('rooms',values[1].slice(1));
                            break;
                        }
                        case  'Přidáno do rozvrhu':{
                            readyForExp[i]['changeInfo']['subject'] = values[1].slice(1);
                            readyForExp[i]['changeInfo']['teacher'] = values[2].slice(1);
                            readyForExp[i]['changeInfo']['room'] = GetCTRPair('rooms',values[3].slice(1));
                            break;
                        }
                        default: {
                            let msg = 'Unknown type in changed >' + values[0] + '< at >' + className + '<';
                            console.log(msg);
                            fs.writeFileSync('log/' + Date.now().toString() + '.log', msg);
                        }
                    }
                }
                break;
            }
            case 'removed': {
                readyForExp[i]['type'] = lessons[i]['type'];
                let timeValues = lessons[i]['subjecttext'].match(/\d{1,2}/g);
                readyForExp[i]['time'] = ParseTime(timeValues);
    
                let values = lessons[i]['removedinfo'].match(/[^\(\),]+/g);
                    readyForExp[i]['removedinfo']['type'] = values[0].slice(0,-1);
                    if(/\d/.test(values[0])) {
                        if(/Přesun na/.test(values[0])){
                            readyForExp[i]['removedinfo']['type'] = 'Přesun na';
                            readyForExp[i]['removedinfo']['subject'] = values[2].slice(1);
                            readyForExp[i]['removedinfo']['teacher'] = values[3].slice(1);
                            break;
                        }
                    }
                    switch(values[0].slice(0,-1)) {
                        case 'Zrušeno':{          
                            readyForExp[i]['removedinfo']['subject'] = values[1];
                            readyForExp[i]['removedinfo']['teacher'] = values[2].slice(1);
                            break;
                        }
                        case 'Vyjmuto z rozvrhu':{
                            readyForExp[i]['removedinfo']['subject'] = values[1];
                            readyForExp[i]['removedinfo']['teacher'] = values[2].slice(1);
                            break;
                        }
                        default: {
                            let msg = 'Unknown type in removed >' + values[0].slice(0,-1) + '< at >' + className + '<';
                            console.log(msg);
                            fs.writeFileSync('log/' + Date.now().toString() + '.log', msg);
                        }
                    }
                break;
            }
            case 'absent': {
                readyForExp[i]['type'] = lessons[i]['type'];
                let timeValues = lessons[i]['subjecttext'].match(/\d{1,2}/g);
                readyForExp[i]['time'] = ParseTime(timeValues);
                break;
            }
            default: {
                let msg = 'Unknown type >' + lessons[i]['type'] + '< at >' + className + '<';
                console.log(msg);
                fs.writeFileSync('log/' + Date.now().toString() + '.log', msg);
            }
        }
    })
    if (!fs.existsSync('cache')) fs.mkdirSync('cache');
    if (!fs.existsSync('cache/classes')) fs.mkdirSync('cache/classes');
    fs.writeFileSync(`cache/classes/${className}.json`, JSON.stringify(readyForExp));
}


//setup code

if (!fs.existsSync('cache/longtime.json')) {
    await cacheLongtime();
}

// await CacheClassData('ENE4');


console.log('\x1b[35m', '-=-=-=-=-=-Caching classes-=-=-=-=-=-', '\x1b[0m')
const finalcount = getLongtimeCache()['classes'].length;
let nowScount = 0;
let nowDcount = 0;
process.stdout.write(`Began caching 0/${finalcount} classes`);
getLongtimeCache()['classes'].forEach(async (elem) => {
    nowScount++;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Began caching ${nowScount}/${finalcount} classes`);
    await CacheClassData(elem[1]);
    nowDcount++;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Cached ${nowDcount}/${finalcount} classes`);
});
process.stdout.write('\n');



// 🔥🔥 code (not lit but on fire)
