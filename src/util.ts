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
 * Loads the base bakaweb timetable html and passes it through cheerio.
 * @return {number} A handle to an CheerioAPI.
 */
export async function GetHTMLHandle(): Promise<cheerio.CheerioAPI> {
    const url = `${GetConfig()?.webServerURL}/Timetable/Public/`;
    const res = got(url, { throwHttpErrors: true });
    const data = await res;
    return cheerio.load(data.body);
}

/**
 * Loads the base __with added url__ bakaweb timetable html and passes it through cheerio.
 * @param {string} additionURL A string to
 * @return {number} A handle to an CheerioAPI.
 */
export async function GetHTMLHandleFrom(additionURL: string): Promise<cheerio.CheerioAPI> {
    const url = `${GetConfig()}/Timetable/Public/${additionURL}`;
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
}