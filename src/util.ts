import * as fs from 'fs';
import got from 'got';
import * as cheerio from 'cheerio';

export const enum CTR { Class, Teacher, Room };

/**
 * Reads `config/config.json` and returns it as JSON.
 * @return {number} The parsed JSON.
 */
export function GetConfig(): { webServerURL: string } {
    return JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
}

/**
 * Checks if the directory exists, and creates it if it does not exitsts.
 * @param {string} path The path of the targeted directory.
 */
export function CheckAndCreate(path: string): void {
    if(fs.existsSync(path)) return;
    fs.mkdirSync(path);
}

/**
 * Loads the base bakaweb timetable html and passes it through cheerio.
 * @return {number} A handle to an CheerioAPI.
 */
export async function GetHTMLHandle(): Promise<cheerio.CheerioAPI> {
    return GetHTMLHandleFrom('');
}

/**
 * Loads the base __with added url__ bakaweb timetable html and passes it through cheerio.
 * @param {string} additionURL A string to
 * @return {number} A handle to an CheerioAPI.
 */
export async function GetHTMLHandleFrom(additionURL: string): Promise<cheerio.CheerioAPI> {
    const url = `${GetConfig()?.webServerURL}/Timetable/Public/${additionURL}`;
    const res = got(url);
    const data = await res;
    return cheerio.load(data.body);
}

/**
 * `ctrs.json` file structure.
 */
type FileData = {
    class: [string,string][],
    teacher: [string,string][],
    room: [string,string][],
}

/**
 * Parses all the CTR infomation and saves it to cache.
 * @see {@link CacheCTRTrough} to prevenet loading the same site multiple times, by passing the allready loaded one.
 * @returns {Promise<void>} Empty promise 😥😥.
 */
export async function CacheCTR(): Promise<void> {
    const $ = await GetHTMLHandle();
    CacheCTRTrough($);
}

/**
 * Parses all the CTR infomation and saves it to cache.
 * @param {cheerio.CheerioAPI} $ A handle to parse from. 
 * @returns {Promise<void>} Empty promise 😥😥.
 */
export async function CacheCTRTrough($: cheerio.CheerioAPI): Promise<void> {
    console.time("ctr-cache");
    let fileData: FileData = {
        class: [],
        teacher: [], 
        room: []
    }    
    $('option', '#selectedClass').each((index, element) => {
        if(element.attribs['value'] === undefined) return;
        fileData.class.push([element.attribs['value'], $(element).text().trim()]);
        index;
    });
    $('option', '#selectedTeacher').each((index, element) => {
        if(element.attribs['value'] === undefined) return;
        fileData.teacher.push([element.attribs['value'], $(element).text().trim()]);
        index;
    });
    $('option', '#selectedRoom').each((index, element) => {
        if(element.attribs['value'] === undefined) return;
        fileData.room.push([element.attribs['value'], $(element).text().trim()]);
        index;
    });
    fs.writeFileSync('cache/ctrs.json', JSON.stringify(fileData));
    console.timeEnd('ctr-cache')
    console.log(`<_ Found and logged ${fileData.class.length} classes, ${fileData.teacher.length} teachers and ${fileData.room.length} rooms _>`)
}

/**
 * Loads ctr data and returns it as JSON.
 * @returns Parsed JSON ctr data.
 */
export function LoadCTR() {
    const data = fs.readFileSync('cache/ctrs.json', 'utf8');
    return JSON.parse(data);
}

/**
 * Loads the paired by name from cached ctrs.
 * @param {CTR} ctr The type of ctr.
 * @param {string} CTRvalue The ctr name value.
 * @returns {string} The returned pair.
 */
export function GetCTRPair(ctr: CTR, CTRvalue: string): [string,string] {
    const data = LoadCTR();
    return data[['class','teacher','room'][ctr]].filter((x: [string,string]) => x[1] === CTRvalue)[0];
}

export async function DownloadRawData(ctr: CTR, ctrName: string): Promise<void> {
    let whatctr: string = '';
    switch(ctr){
        case CTR.Class: whatctr = 'Class'; break;
        case CTR.Teacher: whatctr = 'Teacher'; break;
        case CTR.Room: whatctr = 'Room'; break;
    }
    const $ = await GetHTMLHandleFrom(`Actual/${whatctr}/${GetCTRPair(ctr, ctrName)[0]}`);

    let rawData: object[] = [];
    
    $('.day-item-hover').each((i, elem) => {
        rawData[i] = JSON.parse(elem.attribs['data-detail']);
    }); 

    fs.writeFileSync(`cache/${whatctr.toLowerCase()}/${ctrName}.json`, JSON.stringify(rawData));
}

// export type Data = {
//     type: 'atom' | 'absent' | 'removed'
//     lesson_number: number,
//     time_span: [Date,Date]
//     subject?: string,
//     teacher: string | null,
//     room: string | null,
//     group?: string,
//     theme?: string,
//     notice?: string
// }