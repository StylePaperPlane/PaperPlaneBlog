import {readFile} from 'node:fs/promises';
import openapiTS, {astToString, COMMENT_HEADER} from 'openapi-typescript';

const contractUrl = new URL('../../PaperPlane-Media/contracts/openapi.json', import.meta.url);
const generatedUrl = new URL('../src/features/secure-media/api/schema.d.ts', import.meta.url);
const contract = JSON.parse(await readFile(contractUrl, 'utf8'));
const generated = COMMENT_HEADER + astToString(await openapiTS(contract));
const committed = (await readFile(generatedUrl, 'utf8')).replaceAll('\r\n', '\n');

if (generated !== committed) {
    console.error('Media API 类型已与 OpenAPI 契约漂移，请运行 npm run media:types 后提交生成结果。');
    process.exitCode = 1;
}
