import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';

export function parseXMLtoJSON(path : fs.PathOrFileDescriptor) : {parseXMLObject: object} {

    const buffer = fs.readFileSync(path);
    const XMLString = buffer.toString();
    
    const parser = new XMLParser();
    return parser.parse(XMLString);
}

export function findKeyAndValue(obj: any, targetKey: string): { key: string, value: any } | undefined {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (key === targetKey) {
                return { key, value };
            } else if (typeof value === 'object' && value !== null) {
                const result = findKeyAndValue(value, targetKey);
                if (result) {
                    return { key: `${key}.${result.key}`, value: result.value };
                }
            }
        }
    }
    return undefined;
}