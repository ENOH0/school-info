// สร้างไฟล์ Excel (.xlsx) ในเบราว์เซอร์ ไม่ต้องลงไลบรารีเพิ่ม
// ไฟล์ .xlsx คือไฟล์ zip ที่ข้างในเป็น XML หลายไฟล์ ที่นี่เขียน zip แบบไม่บีบอัด (ไฟล์ตารางเล็ก ๆ ไม่ต่างกันมาก)

export type CellValue = string | number | null | undefined;

export interface SheetData {
  name: string; // ชื่อแท็บ (ตัดให้ไม่เกิน 31 ตัวอักษรเอง)
  rows: CellValue[][];
  styles?: Record<number, 'title' | 'head' | 'total'>; // แถวที่ (เริ่ม 0) → รูปแบบ
  widths?: number[]; // ความกว้างคอลัมน์ (หน่วยตัวอักษร) ไม่ใส่จะคำนวณให้
}

// ===== XML =====

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // ตัวอักษรควบคุมที่ XML ไม่รับ
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

/** เลขคอลัมน์ (0, 1, ...) → ตัวอักษร (A, B, ..., Z, AA) */
function colName(i: number): string {
  let s = '';
  i++;
  while (i > 0) {
    const m = (i - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

/** ความกว้างโดยประมาณ (ภาษาไทยมีสระบน-ล่างไม่กินที่ จึงไม่นับ) */
function textWidth(v: CellValue): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v.toLocaleString('en-US').length + 1;
  return v.replace(/[ัิ-ฺ็-๎]/g, '').length;
}

const STYLE_ID = { title: 1, head: 2, total: 3 } as const;
// จำนวนเต็มใช้รูปแบบมีคอมมา (#,##0) = id + 4 / ทศนิยมใช้รูปแบบปกติ (แสดงตามที่กรอก)
const INT_OFFSET = 4;

function sheetXml(sheet: SheetData): string {
  const nCols = Math.max(1, ...sheet.rows.map((r) => r.length));
  const widths =
    sheet.widths ??
    Array.from({ length: nCols }, (_, c) =>
      // ไม่นับแถวที่มีช่องเดียว (ชื่อตาราง/คำอธิบาย) เพราะยาวล้นไปช่องข้าง ๆ ได้อยู่แล้ว
      Math.min(60, Math.max(8, ...sheet.rows.filter((r) => nCols === 1 || r.length > 1).map((r) => textWidth(r[c]) + 2))),
    );

  const cols = widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
  const rows = sheet.rows
    .map((r, ri) => {
      const st = sheet.styles?.[ri];
      const base = st ? STYLE_ID[st] : 0;
      const cells = r
        .map((v, ci) => {
          if (v === null || v === undefined || v === '') {
            return base ? `<c r="${colName(ci)}${ri + 1}" s="${base}"/>` : '';
          }
          const ref = `${colName(ci)}${ri + 1}`;
          if (typeof v === 'number' && Number.isFinite(v)) {
            const s = Number.isInteger(v) ? base + INT_OFFSET : base;
            return `<c r="${ref}"${s ? ` s="${s}"` : ''}><v>${v}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"${base ? ` s="${base}"` : ''}><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`;
        })
        .join('');
      return `<row r="${ri + 1}">${cells}</row>`;
    })
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<cols>${cols}</cols><sheetData>${rows}</sheetData></worksheet>`
  );
}

// styles: 0 ปกติ, 1 ชื่อตาราง (ตัวหนาใหญ่), 2 หัวตาราง (ตัวหนา พื้นฟ้า), 3 แถวรวม (ตัวหนา เส้นบน)
//         4-7 = แบบเดียวกันแต่เป็นจำนวนเต็มมีคอมมา (numFmtId 3 = #,##0 มีในทุก Excel)
const STYLES_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="3">' +
  '<font><sz val="11"/><name val="Tahoma"/></font>' +
  '<font><b/><sz val="11"/><name val="Tahoma"/></font>' +
  '<font><b/><sz val="13"/><color rgb="FF1E3A8A"/><name val="Tahoma"/></font>' +
  '</fonts>' +
  '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFDBEAFE"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
  '<border><left/><right/><top style="thin"><color rgb="FF64748B"/></top><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="8">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>' +
  '<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="3" fontId="2" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' +
  '<xf numFmtId="3" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>' +
  '<xf numFmtId="3" fontId="1" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>' +
  '</cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  '</styleSheet>';

/** ชื่อแท็บ: ห้ามมี \ / ? * [ ] : ยาวไม่เกิน 31 และห้ามซ้ำ */
function sheetNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((raw) => {
    const base = Array.from(raw.replace(/[\\/?*[\]:]/g, ' ').replace(/^'+|'+$/g, '').trim() || 'Sheet').slice(0, 31).join('');
    let name = base;
    for (let n = 2; used.has(name.toLowerCase()); n++) {
      const suffix = ` (${n})`;
      name = Array.from(base).slice(0, 31 - suffix.length).join('') + suffix;
    }
    used.add(name.toLowerCase());
    return name;
  });
}

function workbookFiles(sheets: SheetData[]): [string, string][] {
  const names = sheetNames(sheets.map((s) => s.name));
  const files: [string, string][] = [];
  files.push([
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets
        .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
        .join('') +
      '</Types>',
  ]);
  files.push([
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>',
  ]);
  files.push([
    'xl/workbook.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets>' +
      names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
      '</sheets></workbook>',
  ]);
  files.push([
    'xl/_rels/workbook.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets
        .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
        .join('') +
      `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      '</Relationships>',
  ]);
  files.push(['xl/styles.xml', STYLES_XML]);
  sheets.forEach((s, i) => files.push([`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s)]));
  return files;
}

// ===== ZIP (แบบไม่บีบอัด) =====

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(files: [string, string][]): Uint8Array {
  const enc = new TextEncoder();
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const [name, text] of files) {
    const nameBytes = enc.encode(name);
    const data = enc.encode(text);
    const crc = crc32(data);

    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 names
    lv.setUint16(8, 0, true); // stored
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    locals.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centrals.push(central);

    offset += local.length;
  }

  const centralSize = centrals.reduce((a, c) => a + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const out = new Uint8Array(offset + centralSize + 22);
  let p = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, p);
    p += part.length;
  }
  return out;
}

/** สร้างไฟล์ .xlsx เป็น byte (ใช้ทดสอบ / ส่งต่อ) */
export function buildXlsx(sheets: SheetData[]): Uint8Array {
  return zip(workbookFiles(sheets.length ? sheets : [{ name: 'Sheet1', rows: [] }]));
}

/** สร้างแล้วดาวน์โหลดทันที */
export function downloadXlsx(fileName: string, sheets: SheetData[]) {
  const bytes = buildXlsx(sheets);
  const blob = new Blob([bytes as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.xlsx') ? fileName : fileName + '.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
