import * as fs from 'fs';


export function logError(err: any): void {
    const filePath: string = `log/errors/${err.name}_${Date.now()}.log`;
    fs.writeFileSync(filePath, err.message + '\nStack:\n' + err?.stack);
}

