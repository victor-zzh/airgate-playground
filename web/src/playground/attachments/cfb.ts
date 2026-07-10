// 最小 CFB（Compound File Binary / OLE2）读取器，仅够解析 .msg（Outlook 邮件）。
// 只实现读路径：解析 header → FAT/DIFAT → 目录项 → 按大小走 FAT 或 miniFAT 取流。
// 不依赖任何外部库（xlsx 内置的 CFB 在部分真实 .msg 上会崩）。

const SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const ENDOFCHAIN = 0xfffffffe;
const FREESECT = 0xffffffff;

export interface CfbEntry {
  name: string;
  type: number; // 1=storage 2=stream 5=root
  startSector: number;
  size: number;
}

export interface CfbFile {
  entries: CfbEntry[];
  read(entry: CfbEntry): Uint8Array;
}

export function isCfb(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 8) return false;
  const head = new Uint8Array(buffer, 0, 8);
  return SIGNATURE.every((b, i) => head[i] === b);
}

export function readCfb(buffer: ArrayBuffer): CfbFile {
  const bytes = new Uint8Array(buffer);
  const dv = new DataView(buffer);
  if (!isCfb(buffer)) throw new Error('not a CFB file');

  const sectorSize = 1 << dv.getUint16(30, true);
  const miniSectorSize = 1 << dv.getUint16(32, true);
  const numFATSectors = dv.getUint32(44, true);
  const firstDirSector = dv.getUint32(48, true);
  const miniCutoff = dv.getUint32(56, true);
  const firstMiniFAT = dv.getUint32(60, true);
  const numMiniFAT = dv.getUint32(64, true);
  const firstDIFAT = dv.getUint32(68, true);
  const numDIFAT = dv.getUint32(72, true);

  const sectorOffset = (sector: number) => 512 + sector * sectorSize;
  const entriesPerSector = Math.floor(sectorSize / 4);

  // ── DIFAT：收集所有 FAT 扇区号 ──
  const fatSectors: number[] = [];
  for (let i = 0; i < 109 && fatSectors.length < numFATSectors; i++) {
    const s = dv.getUint32(76 + i * 4, true);
    if (s === FREESECT || s === ENDOFCHAIN) break;
    fatSectors.push(s);
  }
  let difatSector = firstDIFAT;
  for (let n = 0; n < numDIFAT && difatSector !== ENDOFCHAIN && difatSector !== FREESECT; n++) {
    const base = sectorOffset(difatSector);
    for (let i = 0; i < entriesPerSector - 1; i++) {
      const s = dv.getUint32(base + i * 4, true);
      if (s === FREESECT || s === ENDOFCHAIN) break;
      fatSectors.push(s);
    }
    difatSector = dv.getUint32(base + (entriesPerSector - 1) * 4, true);
  }

  // ── FAT：扇区分配表（扁平数组）──
  const fat = new Uint32Array(fatSectors.length * entriesPerSector);
  fatSectors.forEach((sector, idx) => {
    const base = sectorOffset(sector);
    for (let i = 0; i < entriesPerSector; i++) {
      fat[idx * entriesPerSector + i] = dv.getUint32(base + i * 4, true);
    }
  });

  const readChain = (start: number, size: number, secSize: number, offsetOf: (s: number) => number): Uint8Array<ArrayBuffer> => {
    const out = new Uint8Array(new ArrayBuffer(size));
    let written = 0;
    let sector = start;
    let guard = 0;
    const maxSectors = Math.ceil(size / secSize) + 1;
    while (sector !== ENDOFCHAIN && sector !== FREESECT && written < size && guard++ <= maxSectors) {
      const from = offsetOf(sector);
      const chunk = Math.min(secSize, size - written);
      if (from + chunk <= bytes.length) {
        out.set(bytes.subarray(from, from + chunk), written);
      }
      written += chunk;
      sector = fat[sector] ?? ENDOFCHAIN;
    }
    return out;
  };

  // ── 目录：线性读所有 128 字节项（忽略红黑树，全量枚举）──
  const dirBytes = readChainViaFat(firstDirSector);
  function readChainViaFat(start: number): Uint8Array {
    // 目录/miniFAT/mini 容器链未知长度，按扇区累积到 ENDOFCHAIN
    const chunks: Uint8Array[] = [];
    let sector = start;
    let guard = 0;
    while (sector !== ENDOFCHAIN && sector !== FREESECT && guard++ < fat.length + 1) {
      const from = sectorOffset(sector);
      chunks.push(bytes.subarray(from, Math.min(from + sectorSize, bytes.length)));
      sector = fat[sector] ?? ENDOFCHAIN;
    }
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) { out.set(c, off); off += c.length; }
    return out;
  }

  const dirDv = new DataView(dirBytes.buffer, dirBytes.byteOffset, dirBytes.byteLength);
  const entries: CfbEntry[] = [];
  let rootEntry: CfbEntry | null = null;
  const entryCount = Math.floor(dirBytes.length / 128);
  for (let i = 0; i < entryCount; i++) {
    const base = i * 128;
    const type = dirBytes[base + 66];
    if (type !== 1 && type !== 2 && type !== 5) continue;
    const nameLen = dirDv.getUint16(base + 64, true);
    let name = '';
    for (let c = 0; c < nameLen - 2 && c < 64; c += 2) {
      const code = dirDv.getUint16(base + c, true);
      if (code === 0) break;
      name += String.fromCharCode(code);
    }
    const entry: CfbEntry = {
      name,
      type,
      startSector: dirDv.getUint32(base + 116, true),
      size: dirDv.getUint32(base + 120, true),
    };
    if (type === 5) rootEntry = entry;
    entries.push(entry);
  }

  // ── mini stream 容器（Root 的流，供小于 miniCutoff 的流复用）──
  let miniStream = new Uint8Array(0);
  if (rootEntry && rootEntry.size > 0) {
    miniStream = readChain(rootEntry.startSector, rootEntry.size, sectorSize, sectorOffset);
  }
  // ── miniFAT ──
  let miniFat = new Uint32Array(0);
  if (numMiniFAT > 0) {
    const miniFatBytes = readChainViaFat(firstMiniFAT);
    miniFat = new Uint32Array(Math.floor(miniFatBytes.length / 4));
    const mdv = new DataView(miniFatBytes.buffer, miniFatBytes.byteOffset, miniFatBytes.byteLength);
    for (let i = 0; i < miniFat.length; i++) miniFat[i] = mdv.getUint32(i * 4, true);
  }

  const read = (entry: CfbEntry): Uint8Array => {
    if (entry.size === 0) return new Uint8Array(0);
    if (entry.size >= miniCutoff || entry.type === 5) {
      return readChain(entry.startSector, entry.size, sectorSize, sectorOffset);
    }
    // 小流走 miniFAT + mini stream 容器
    const out = new Uint8Array(entry.size);
    let written = 0;
    let sector = entry.startSector;
    let guard = 0;
    const maxSectors = Math.ceil(entry.size / miniSectorSize) + 1;
    while (sector !== ENDOFCHAIN && sector !== FREESECT && written < entry.size && guard++ <= maxSectors) {
      const from = sector * miniSectorSize;
      const chunk = Math.min(miniSectorSize, entry.size - written);
      if (from + chunk <= miniStream.length) {
        out.set(miniStream.subarray(from, from + chunk), written);
      }
      written += chunk;
      sector = miniFat[sector] ?? ENDOFCHAIN;
    }
    return out;
  };

  return { entries, read };
}
