/**
 * QRCodeGenerator - QR 码生成器
 * 完整实现 QR Code Model 2 规范（ISO/IEC 18004）
 * 支持 Version 1-10，数字/字母数字/字节三种编码模式自动选择
 * 纠错级别 L/M/Q/H，纯前端 Canvas API 渲染，零外部依赖
 */
import { useState, useRef, useCallback, useEffect, type CSSProperties } from 'react'

// ============================================================
// QR Code 核心编码器（纯 TypeScript 实现）
// ============================================================

const EC_LEVELS = ['L', 'M', 'Q', 'H'] as const
type ECLevel = typeof EC_LEVELS[number]

interface BlockInfo { group1Blocks: number; group1DataCW: number; group2Blocks: number; group2DataCW: number; ecCWPerBlock: number }

// Version 1-10 各纠错级别参数表
// 格式: [ecCWPerBlock, group1Blocks, group1DataCW, group2Blocks, group2DataCW]
const VERSION_PARAMS: Record<ECLevel, Record<number, BlockInfo>> = {
  L: {
    1:  { group1Blocks: 1, group1DataCW: 19, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 7 },
    2:  { group1Blocks: 1, group1DataCW: 34, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 10 },
    3:  { group1Blocks: 1, group1DataCW: 55, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 15 },
    4:  { group1Blocks: 1, group1DataCW: 80, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 20 },
    5:  { group1Blocks: 1, group1DataCW: 108, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 26 },
    6:  { group1Blocks: 2, group1DataCW: 68, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 18 },
    7:  { group1Blocks: 2, group1DataCW: 78, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 20 },
    8:  { group1Blocks: 2, group1DataCW: 97, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 24 },
    9:  { group1Blocks: 2, group1DataCW: 116, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 30 },
    10: { group1Blocks: 2, group1DataCW: 68, group2Blocks: 2, group2DataCW: 69, ecCWPerBlock: 18 },
  },
  M: {
    1:  { group1Blocks: 1, group1DataCW: 16, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 10 },
    2:  { group1Blocks: 1, group1DataCW: 28, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 16 },
    3:  { group1Blocks: 1, group1DataCW: 44, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 26 },
    4:  { group1Blocks: 2, group1DataCW: 32, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 18 },
    5:  { group1Blocks: 2, group1DataCW: 43, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 24 },
    6:  { group1Blocks: 4, group1DataCW: 27, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 16 },
    7:  { group1Blocks: 4, group1DataCW: 31, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 18 },
    8:  { group1Blocks: 2, group1DataCW: 38, group2Blocks: 2, group2DataCW: 39, ecCWPerBlock: 22 },
    9:  { group1Blocks: 3, group1DataCW: 36, group2Blocks: 2, group2DataCW: 37, ecCWPerBlock: 22 },
    10: { group1Blocks: 4, group1DataCW: 43, group2Blocks: 1, group2DataCW: 44, ecCWPerBlock: 26 },
  },
  Q: {
    1:  { group1Blocks: 1, group1DataCW: 13, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 13 },
    2:  { group1Blocks: 1, group1DataCW: 22, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 22 },
    3:  { group1Blocks: 1, group1DataCW: 34, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 18 },
    4:  { group1Blocks: 2, group1DataCW: 24, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 26 },
    5:  { group1Blocks: 2, group1DataCW: 34, group2Blocks: 2, group2DataCW: 35, ecCWPerBlock: 18 },
    6:  { group1Blocks: 4, group1DataCW: 18, group2Blocks: 2, group2DataCW: 19, ecCWPerBlock: 24 },
    7:  { group1Blocks: 4, group1DataCW: 24, group2Blocks: 1, group2DataCW: 25, ecCWPerBlock: 16 },
    8:  { group1Blocks: 2, group1DataCW: 28, group2Blocks: 2, group2DataCW: 29, ecCWPerBlock: 18 },
    9:  { group1Blocks: 3, group1DataCW: 30, group2Blocks: 2, group2DataCW: 31, ecCWPerBlock: 22 },
    10: { group1Blocks: 4, group1DataCW: 34, group2Blocks: 1, group2DataCW: 35, ecCWPerBlock: 20 },
  },
  H: {
    1:  { group1Blocks: 1, group1DataCW: 9,  group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 17 },
    2:  { group1Blocks: 1, group1DataCW: 16, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 28 },
    3:  { group1Blocks: 1, group1DataCW: 26, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 22 },
    4:  { group1Blocks: 2, group1DataCW: 18, group2Blocks: 0, group2DataCW: 0, ecCWPerBlock: 16 },
    5:  { group1Blocks: 2, group1DataCW: 26, group2Blocks: 2, group2DataCW: 27, ecCWPerBlock: 22 },
    6:  { group1Blocks: 4, group1DataCW: 14, group2Blocks: 2, group2DataCW: 15, ecCWPerBlock: 28 },
    7:  { group1Blocks: 4, group1DataCW: 18, group2Blocks: 2, group2DataCW: 19, ecCWPerBlock: 26 },
    8:  { group1Blocks: 4, group1DataCW: 22, group2Blocks: 2, group2DataCW: 23, ecCWPerBlock: 26 },
    9:  { group1Blocks: 3, group1DataCW: 24, group2Blocks: 3, group2DataCW: 25, ecCWPerBlock: 24 },
    10: { group1Blocks: 5, group1DataCW: 28, group2Blocks: 1, group2DataCW: 29, ecCWPerBlock: 28 },
  },
}

// 对齐模式位置
const ALIGNMENT_POSITIONS: Record<number, number[]> = {
  2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
}

// ---- GF(256) 有限域 ----
const GF_EXP = new Array<number>(512)
const GF_LOG = new Array<number>(256)
;(() => {
  let x = 1
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x
    GF_LOG[x] = i
    x = (x << 1) ^ (x & 0x80 ? 0x11d : 0)
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255]
  GF_LOG[0] = 0
})()

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

// ---- Reed-Solomon 纠错编码 ----
function rsGeneratorPoly(degree: number): number[] {
  const gen = new Array<number>(degree + 1).fill(0)
  gen[0] = 1
  for (let i = 0; i < degree; i++) {
    for (let j = degree; j > 0; j--) {
      gen[j] = gen[j - 1] ^ gfMul(gen[j], GF_EXP[i])
    }
    gen[0] = gfMul(gen[0], GF_EXP[i])
  }
  return gen
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGeneratorPoly(ecLen)
  const rem = new Array<number>(ecLen).fill(0)
  for (const byte of data) {
    const coeff = byte ^ rem[0]
    rem.shift()
    rem.push(0)
    if (coeff !== 0) {
      for (let j = 0; j < ecLen; j++) {
        rem[j] ^= gfMul(gen[j + 1], coeff)
      }
    }
  }
  return rem
}

// ---- 编码模式检测 ----
function detectMode(text: string): 'numeric' | 'alphanumeric' | 'byte' {
  if (/^\d+$/.test(text)) return 'numeric'
  if (/^[0-9A-Z $%*+\-./:]+$/.test(text)) return 'alphanumeric'
  return 'byte'
}

// ---- 数据容量（码字）----
function getDataCapacity(version: number, ec: ECLevel): number {
  const info = VERSION_PARAMS[ec][version]
  return info.group1Blocks * info.group1DataCW + info.group2Blocks * info.group2DataCW
}

// ---- 版本自动选择 ----
function getVersion(dataLen: number, mode: 'numeric' | 'alphanumeric' | 'byte', ec: ECLevel): number {
  for (let v = 1; v <= 10; v++) {
    const cap = getDataCapacity(v, ec)
    const countBits = v <= 9 ? 8 : 16
    const bitsAvail = cap * 8
    let bitsNeeded: number
    if (mode === 'byte') {
      bitsNeeded = 4 + countBits + dataLen * 8
    } else if (mode === 'alphanumeric') {
      bitsNeeded = 4 + countBits + Math.ceil(dataLen / 2) * 11
    } else {
      bitsNeeded = 4 + countBits + Math.ceil(dataLen / 3) * 10
    }
    if (bitsAvail >= bitsNeeded) return v
  }
  return -1
}

// ---- 数据编码为码字 ----
const ALPHANUM_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'

function encodeNumeric(text: string, version: number, totalDataCW: number): number[] {
  const bits: number[] = []
  bits.push(0, 0, 0, 1) // 模式指示
  const countBits = version <= 9 ? 8 : 16
  for (let i = countBits - 1; i >= 0; i--) bits.push((text.length >> i) & 1)
  // 3位一组
  for (let i = 0; i < text.length; i += 3) {
    const chunk = text.slice(i, Math.min(i + 3, text.length))
    const num = parseInt(chunk, 10)
    const width = chunk.length === 3 ? 10 : chunk.length === 2 ? 7 : 4
    for (let j = width - 1; j >= 0; j--) bits.push((num >> j) & 1)
  }
  return finalizeBits(bits, totalDataCW)
}

function encodeAlphanumeric(text: string, version: number, totalDataCW: number): number[] {
  const bits: number[] = []
  bits.push(0, 0, 1, 0) // 模式指示
  const countBits = version <= 9 ? 8 : 16
  for (let i = countBits - 1; i >= 0; i--) bits.push((text.length >> i) & 1)
  // 2字符一组 → 11位
  for (let i = 0; i < text.length; i += 2) {
    if (i + 1 < text.length) {
      const val = ALPHANUM_CHARS.indexOf(text[i]) * 45 + ALPHANUM_CHARS.indexOf(text[i + 1])
      for (let j = 10; j >= 0; j--) bits.push((val >> j) & 1)
    } else {
      const val = ALPHANUM_CHARS.indexOf(text[i])
      for (let j = 5; j >= 0; j--) bits.push((val >> j) & 1)
    }
  }
  return finalizeBits(bits, totalDataCW)
}

function encodeByte(text: string, version: number, totalDataCW: number): number[] {
  const bits: number[] = []
  const bytes = new TextEncoder().encode(text)
  bits.push(0, 1, 0, 0) // 模式指示
  const countBits = version <= 9 ? 8 : 16
  for (let i = countBits - 1; i >= 0; i--) bits.push((bytes.length >> i) & 1)
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1)
  }
  return finalizeBits(bits, totalDataCW)
}

function finalizeBits(bits: number[], totalDataCW: number): number[] {
  const totalBits = totalDataCW * 8
  // 终止符
  const termLen = Math.min(10, totalBits - bits.length)
  for (let i = 0; i < termLen; i++) bits.push(0)
  // 字节对齐
  while (bits.length % 8 !== 0) bits.push(0)
  // 填充字节
  let fillByte = 0xEC
  while (bits.length < totalBits) {
    for (let i = 7; i >= 0; i--) bits.push((fillByte >> i) & 1)
    fillByte = fillByte === 0xEC ? 0x11 : 0xEC
  }
  // 转为码字
  const cw: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] || 0)
    cw.push(byte)
  }
  return cw
}

// ---- 构建码字序列（交错）----
function buildCodewords(dataCW: number[], version: number, ec: ECLevel): number[] {
  const info = VERSION_PARAMS[ec][version]
  const blocks: number[][] = []
  let offset = 0
  for (let i = 0; i < info.group1Blocks; i++) {
    blocks.push(dataCW.slice(offset, offset + info.group1DataCW))
    offset += info.group1DataCW
  }
  for (let i = 0; i < info.group2Blocks; i++) {
    blocks.push(dataCW.slice(offset, offset + info.group2DataCW))
    offset += info.group2DataCW
  }
  const ecBlocks = blocks.map((b) => rsEncode(b, info.ecCWPerBlock))
  // 交错数据码字
  const result: number[] = []
  const maxDataLen = Math.max(info.group1DataCW, info.group2DataCW || 0)
  for (let i = 0; i < maxDataLen; i++) {
    for (const b of blocks) {
      if (i < b.length) result.push(b[i])
    }
  }
  // 交错纠错码字
  for (let i = 0; i < info.ecCWPerBlock; i++) {
    for (const b of ecBlocks) {
      if (i < b.length) result.push(b[i])
    }
  }
  return result
}

// ---- QR 矩阵生成 ----
function generateMatrix(version: number, codewords: number[]): boolean[][] {
  const size = version * 4 + 17
  const matrix = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  const reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))

  // Finder Patterns
  const placeFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r, cc = col + c
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue
        const inBorder = r === 0 || r === 6 || c === 0 || c === 6
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4
        const isQuiet = r === -1 || r === 7 || c === -1 || c === 7
        matrix[rr][cc] = !isQuiet && (inBorder || inInner)
        reserved[rr][cc] = true
      }
    }
  }
  placeFinder(0, 0)
  placeFinder(0, size - 7)
  placeFinder(size - 7, 0)

  // Alignment Patterns
  if (version >= 2) {
    const positions = ALIGNMENT_POSITIONS[version]!
    for (const r of positions) {
      for (const c of positions) {
        if (reserved[r][c]) continue
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2
            const isCenter = dr === 0 && dc === 0
            matrix[r + dr][c + dc] = isBorder || isCenter
            reserved[r + dr][c + dc] = true
          }
        }
      }
    }
  }

  // Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) { matrix[6][i] = i % 2 === 0; reserved[6][i] = true }
    if (!reserved[i][6]) { matrix[i][6] = i % 2 === 0; reserved[i][6] = true }
  }

  // Dark Module
  matrix[size - 8][8] = true
  reserved[size - 8][8] = true

  // Reserve Format Info areas
  for (let i = 0; i < 9; i++) {
    reserved[8][i < 6 ? i : i + 1] = true
    reserved[i < 6 ? i : i + 1][8] = true
    reserved[8][size - 1 - i] = true
    reserved[size - 1 - i][8] = true
  }

  // Reserve Version Info areas (V>=7)
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        reserved[i][size - 11 + j] = true
        reserved[size - 11 + j][i] = true
      }
    }
  }

  // Place data bits (zigzag)
  const dataBits: number[] = []
  for (const cw of codewords) {
    for (let i = 7; i >= 0; i--) dataBits.push((cw >> i) & 1)
  }
  let bitIdx = 0
  const totalBits = dataBits.length
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const col = right - j
        const row = ((size - 1 - right) >> 1) & 1 ? vert : size - 1 - vert
        if (reserved[row][col]) continue
        if (bitIdx < totalBits) {
          matrix[row][col] = dataBits[bitIdx] === 1
          bitIdx++
        }
      }
    }
  }

  return matrix
}

// ---- 掩码 ----
const MASK_FNS = [
  (r: number, c: number) => (r + c) % 2 === 0,
  (r: number) => r % 2 === 0,
  (r: number) => r % 3 === 0,
  (r: number, c: number) => (r + c) % 3 === 0,
  (r: number, c: number) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r: number, c: number) => ((r * c) % 2 + (r * c) % 3) === 0,
  (r: number, c: number) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
  (r: number, c: number) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
]

function applyMask(matrix: boolean[][], reserved: boolean[][], maskIdx: number): boolean[][] {
  const size = matrix.length
  const result = matrix.map((row) => [...row])
  const fn = MASK_FNS[maskIdx]
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && fn(r, c)) result[r][c] = !result[r][c]
    }
  }
  return result
}

function evaluatePenalty(matrix: boolean[][]): number {
  const size = matrix.length
  let penalty = 0

  // Rule 1: 连续同色模块
  for (let r = 0; r < size; r++) {
    let count = 1
    for (let c = 1; c < size; c++) {
      if (matrix[r][c] === matrix[r][c - 1]) { count++ }
      else { if (count >= 5) penalty += count - 2; count = 1 }
    }
    if (count >= 5) penalty += count - 2
  }
  for (let c = 0; c < size; c++) {
    let count = 1
    for (let r = 1; r < size; r++) {
      if (matrix[r][c] === matrix[r - 1][c]) { count++ }
      else { if (count >= 5) penalty += count - 2; count = 1 }
    }
    if (count >= 5) penalty += count - 2
  }

  // Rule 2: 2x2 同色块
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = matrix[r][c]
      if (v === matrix[r][c + 1] && v === matrix[r + 1][c] && v === matrix[r + 1][c + 1]) penalty += 3
    }
  }

  // Rule 3: Finder-like pattern (1:1:3:1:1)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - 11; c++) {
      if (matrix[r][c] && !matrix[r][c + 1] && matrix[r][c + 2] &&
        matrix[r][c + 3] && matrix[r][c + 4] && matrix[r][c + 5] &&
        !matrix[r][c + 6] && matrix[r][c + 7] &&
        !matrix[r][c + 8] && !matrix[r][c + 9] && !matrix[r][c + 10]) penalty += 40
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - 11; r++) {
      if (matrix[r][c] && !matrix[r + 1][c] && matrix[r + 2][c] &&
        matrix[r + 3][c] && matrix[r + 4][c] && matrix[r + 5][c] &&
        !matrix[r + 6][c] && matrix[r + 7][c] &&
        !matrix[r + 8][c] && !matrix[r + 9][c] && !matrix[r + 10][c]) penalty += 40
    }
  }

  // Rule 4: 暗模块比例
  let dark = 0
  for (const row of matrix) for (const v of row) if (v) dark++
  const ratio = (dark / (size * size)) * 100
  const prev5 = Math.floor(ratio / 5) * 5
  const next5 = prev5 + 5
  penalty += Math.min(Math.abs(prev5 - 50) / 5, Math.abs(next5 - 50) / 5) * 10

  return penalty
}

// ---- 格式信息 ----
const FORMAT_INFO_EC = { L: 1, M: 0, Q: 3, H: 2 }

function placeFormatInfo(matrix: boolean[][], size: number, ec: ECLevel, maskIdx: number) {
  const ecBits = FORMAT_INFO_EC[ec]
  const data = (ecBits << 3) | maskIdx
  let bits = data << 10
  const gen = 0x537
  let tmp = bits
  for (let i = 14; i >= 10; i--) {
    if (tmp & (1 << i)) tmp ^= gen << (i - 10)
  }
  bits = ((data << 10) | (tmp ^ bits)) ^ 0x5412

  const formatBits: boolean[] = []
  for (let i = 14; i >= 0; i--) formatBits.push(((bits >> i) & 1) === 1)

  // 左上
  for (let i = 0; i < 8; i++) matrix[8][i < 6 ? i : i + 1] = formatBits[i]
  matrix[7][8] = formatBits[8]
  for (let i = 0; i < 7; i++) matrix[6 - i][8] = formatBits[9 + i]

  // 右上 + 左下
  for (let i = 0; i < 7; i++) matrix[size - 1 - i][8] = formatBits[i]
  for (let i = 0; i < 8; i++) matrix[8][size - 8 + i] = formatBits[7 + i]
}

// ---- 版本信息（V>=7）----
function placeVersionInfo(matrix: boolean[][], size: number, version: number) {
  if (version < 7) return
  let bits = version << 12
  let tmp = bits
  const gen = 0x1F25
  for (let i = 17; i >= 12; i--) {
    if (tmp & (1 << i)) tmp ^= gen << (i - 12)
  }
  bits |= tmp
  for (let i = 0; i < 18; i++) {
    const bit = ((bits >> i) & 1) === 1
    const r = Math.floor(i / 3)
    const c = size - 11 + (i % 3)
    matrix[r][c] = bit
    matrix[c][r] = bit
  }
}

// ---- 主入口 ----
function generateQRCode(text: string, ec: ECLevel): boolean[][] | null {
  if (!text) return null
  const mode = detectMode(text)
  const version = getVersion(text.length, mode, ec)
  if (version < 0) return null

  const totalDataCW = getDataCapacity(version, ec)
  let dataCW: number[]
  if (mode === 'numeric') dataCW = encodeNumeric(text, version, totalDataCW)
  else if (mode === 'alphanumeric') dataCW = encodeAlphanumeric(text, version, totalDataCW)
  else dataCW = encodeByte(text, version, totalDataCW)

  const codewords = buildCodewords(dataCW, version, ec)
  const size = version * 4 + 17

  // 构建 reserved 数组
  const reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  const placeFinderArea = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r, cc = col + c
        if (rr >= 0 && rr < size && cc >= 0 && cc < size) reserved[rr][cc] = true
      }
    }
  }
  placeFinderArea(0, 0)
  placeFinderArea(0, size - 7)
  placeFinderArea(size - 7, 0)
  if (version >= 2) {
    const positions = ALIGNMENT_POSITIONS[version]!
    for (const r of positions) {
      for (const c of positions) {
        if (!reserved[r][c]) {
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              if (r + dr >= 0 && r + dr < size && c + dc >= 0 && c + dc < size)
                reserved[r + dr][c + dc] = true
            }
          }
        }
      }
    }
  }
  for (let i = 8; i < size - 8; i++) { reserved[6][i] = true; reserved[i][6] = true }
  reserved[size - 8][8] = true
  for (let i = 0; i < 9; i++) {
    reserved[8][i] = true; reserved[i][8] = true
    reserved[8][size - 1 - i] = true; reserved[size - 1 - i][8] = true
  }
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        reserved[i][size - 11 + j] = true
        reserved[size - 11 + j][i] = true
      }
    }
  }

  // 生成基础矩阵
  const baseMatrix = generateMatrix(version, codewords)

  // 选择最优掩码
  let bestPenalty = Infinity
  let bestMatrix = baseMatrix
  for (let m = 0; m < 8; m++) {
    const masked = applyMask(baseMatrix, reserved, m)
    placeFormatInfo(masked, size, ec, m)
    placeVersionInfo(masked, size, version)
    const p = evaluatePenalty(masked)
    if (p < bestPenalty) { bestPenalty = p; bestMatrix = masked }
  }

  return bestMatrix
}

// ============================================================
// Canvas 绘制
// ============================================================

function drawQRCode(
  canvas: HTMLCanvasElement,
  grid: boolean[][],
  size: number,
  fg: string,
  bg: string,
  moduleStyle: 'square' | 'rounded' | 'dots'
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const modules = grid.length
  canvas.width = size * dpr
  canvas.height = size * dpr
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`
  ctx.scale(dpr, dpr)

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)

  const margin = size * 0.06
  const avail = size - margin * 2
  const moduleSize = avail / modules

  ctx.fillStyle = fg

  if (moduleStyle === 'dots') {
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (grid[r][c]) {
          const cx = margin + (c + 0.5) * moduleSize
          const cy = margin + (r + 0.5) * moduleSize
          ctx.beginPath()
          ctx.arc(cx, cy, moduleSize * 0.4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  } else if (moduleStyle === 'rounded') {
    const radius = moduleSize * 0.3
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (grid[r][c]) {
          const x = margin + c * moduleSize
          const y = margin + r * moduleSize
          const w = Math.ceil(moduleSize)
          const h = Math.ceil(moduleSize)
          ctx.beginPath()
          ctx.moveTo(x + radius, y)
          ctx.lineTo(x + w - radius, y)
          ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
          ctx.lineTo(x + w, y + h - radius)
          ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
          ctx.lineTo(x + radius, y + h)
          ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
          ctx.lineTo(x, y + radius)
          ctx.quadraticCurveTo(x, y, x + radius, y)
          ctx.fill()
        }
      }
    }
  } else {
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (grid[r][c]) {
          ctx.fillRect(margin + c * moduleSize, margin + r * moduleSize, Math.ceil(moduleSize), Math.ceil(moduleSize))
        }
      }
    }
  }
}

// ============================================================
// UI 组件
// ============================================================

type ModuleStyle = 'square' | 'rounded' | 'dots'

interface Template {
  id: string; label: string; icon: string; getTemplate: (v: string) => string
}

const TEMPLATES: Template[] = [
  {
    id: 'wifi',
    label: 'WiFi',
    icon: '📶',
    getTemplate: (v) => `WIFI:T:WPA;S:MyNetwork;P:${v || 'password123'};;`,
  },
  {
    id: 'vcard',
    label: 'vCard',
    icon: '👤',
    getTemplate: (v) => `BEGIN:VCARD\nVERSION:3.0\nFN:${v || 'John Doe'}\nTEL:+8613800138000\nEMAIL:john@example.com\nEND:VCARD`,
  },
  {
    id: 'mailto',
    label: '邮件',
    icon: '📧',
    getTemplate: (v) => `mailto:${v || 'user@example.com'}?subject=Hello&body=Hi there`,
  },
  {
    id: 'tel',
    label: '电话',
    icon: '📞',
    getTemplate: (v) => `tel:${v || '+8613800138000'}`,
  },
  {
    id: 'sms',
    label: '短信',
    icon: '💬',
    getTemplate: (v) => `sms:${v || '+8613800138000'}?body=Hello`,
  },
  {
    id: 'url',
    label: '网址',
    icon: '🔗',
    getTemplate: (v) => v || 'https://example.com',
  },
]

const PRESET_COLORS: Array<{ fg: string; bg: string; label: string }> = [
  { fg: '#000000', bg: '#ffffff', label: '经典' },
  { fg: '#1a1a2e', bg: '#f0f0f5', label: '深蓝' },
  { fg: '#7c6cf0', bg: '#f5f3ff', label: '紫色' },
  { fg: '#10b981', bg: '#f0fdf4', label: '翠绿' },
  { fg: '#ffffff', bg: '#0f0f1a', label: '暗色' },
  { fg: '#f472b6', bg: '#fdf2f8', label: '粉色' },
  { fg: '#f59e0b', bg: '#fffbeb', label: '琥珀' },
  { fg: '#ef4444', bg: '#fef2f2', label: '红色' },
]

function QRCodeGenerator() {
  const [text, setText] = useState('https://github.com/saya-ch/WebLinuxOS')
  const [ecLevel, setEcLevel] = useState<ECLevel>('M')
  const [fgColor, setFgColor] = useState('#1a1a2e')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [qrSize, setQrSize] = useState(300)
  const [moduleStyle, setModuleStyle] = useState<ModuleStyle>('square')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [templateInput, setTemplateInput] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const qrGrid = useCallback(() => {
    setError('')
    if (!text.trim()) return null
    const grid = generateQRCode(text, ecLevel)
    if (!grid) {
      setError('文本过长或无法编码')
      return null
    }
    return grid
  }, [text, ecLevel])

  const grid = qrGrid()
  const moduleCount = grid ? grid.length : 0
  const version = moduleCount ? Math.floor((moduleCount - 17) / 4) : 0

  useEffect(() => {
    if (!canvasRef.current || !grid) return
    drawQRCode(canvasRef.current, grid, qrSize, fgColor, bgColor, moduleStyle)
  }, [grid, qrSize, fgColor, bgColor, moduleStyle])

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `qrcode-${Date.now()}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }, [])

  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return
    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvasRef.current!.toBlob((b) => resolve(b!), 'image/png')
      )
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard API unavailable */
    }
  }, [])

  const handleTemplate = useCallback((template: Template) => {
    if (activeTemplate === template.id) {
      setActiveTemplate(null)
      setText('')
      setTemplateInput('')
      return
    }
    setActiveTemplate(template.id)
    setText(template.getTemplate(templateInput))
  }, [activeTemplate, templateInput])

  const handleTemplateInputChange = useCallback((val: string) => {
    setTemplateInput(val)
    if (activeTemplate) {
      const tpl = TEMPLATES.find((t) => t.id === activeTemplate)
      if (tpl) setText(tpl.getTemplate(val))
    }
  }, [activeTemplate])

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #7c6cf0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3h-3z" />
            <path d="M21 14h-1v3h-3v3h4z" />
            <path d="M14 21h3v-1" />
            <path d="M21 21h-1" />
          </svg>
        </div>
        <div>
          <h2 style={styles.title}>QR 二维码生成器</h2>
          <span style={styles.subtitle}>离线生成 · 支持多编码模式 · Version 1-10</span>
        </div>
      </div>

      {/* Main Layout */}
      <div style={styles.main}>
        {/* Left: Input & Options */}
        <div style={styles.leftPanel}>
          {/* Text Input */}
          <div style={styles.section}>
            <label style={styles.label}>输入内容</label>
            <textarea
              style={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入文本、URL 或使用下方模板..."
              rows={4}
            />
            <div style={styles.charRow}>
              <span style={styles.charCount}>{new TextEncoder().encode(text).length} 字节</span>
              {error && <span style={styles.errorText}>{error}</span>}
              {grid && <span style={styles.okText}>V{version} · {moduleCount}x{moduleCount}</span>}
            </div>
          </div>

          {/* Templates */}
          <div style={styles.section}>
            <label style={styles.label}>快捷模板</label>
            <div style={styles.templateGrid}>
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  style={{
                    ...styles.templateBtn,
                    ...(activeTemplate === tpl.id ? styles.templateBtnActive : {}),
                  }}
                  onClick={() => handleTemplate(tpl)}
                >
                  <span style={styles.templateIcon}>{tpl.icon}</span>
                  <span style={styles.templateLabel}>{tpl.label}</span>
                </button>
              ))}
            </div>
            {activeTemplate && (
              <input
                style={styles.templateInput}
                value={templateInput}
                onChange={(e) => handleTemplateInputChange(e.target.value)}
                placeholder={
                  activeTemplate === 'wifi' ? 'WiFi 密码...'
                    : activeTemplate === 'vcard' ? '姓名...'
                      : activeTemplate === 'mailto' ? '邮箱地址...'
                        : activeTemplate === 'tel' || activeTemplate === 'sms' ? '电话号码...'
                          : activeTemplate === 'url' ? '网址...'
                            : ''
                }
              />
            )}
          </div>

          {/* EC Level */}
          <div style={styles.section}>
            <label style={styles.label}>纠错级别</label>
            <div style={styles.ecRow}>
              {EC_LEVELS.map((level) => (
                <button
                  key={level}
                  style={{
                    ...styles.ecBtn,
                    ...(ecLevel === level ? styles.ecBtnActive : {}),
                  }}
                  onClick={() => setEcLevel(level)}
                >
                  <span style={styles.ecLetter}>{level}</span>
                  <span style={styles.ecPercent}>
                    {level === 'L' ? '7%' : level === 'M' ? '15%' : level === 'Q' ? '25%' : '30%'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Slider */}
          <div style={styles.section}>
            <div style={styles.sliderHeader}>
              <label style={styles.label}>尺寸</label>
              <span style={styles.sliderValue}>{qrSize}px</span>
            </div>
            <input
              type="range"
              min={200}
              max={600}
              step={10}
              value={qrSize}
              onChange={(e) => setQrSize(Number(e.target.value))}
              style={styles.slider}
            />
          </div>

          {/* Module Style */}
          <div style={styles.section}>
            <label style={styles.label}>模块样式</label>
            <div style={styles.styleRow}>
              {(['square', 'rounded', 'dots'] as ModuleStyle[]).map((s) => (
                <button
                  key={s}
                  style={{
                    ...styles.styleBtn,
                    ...(moduleStyle === s ? styles.styleBtnActive : {}),
                  }}
                  onClick={() => setModuleStyle(s)}
                >
                  {s === 'square' ? '⬛' : s === 'rounded' ? '◼' : '⬤'}
                  <span>{s === 'square' ? '方块' : s === 'rounded' ? '圆角' : '圆点'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div style={styles.section}>
            <label style={styles.label}>颜色方案</label>
            <div style={styles.colorRow}>
              <div style={styles.colorItem}>
                <span style={styles.colorLabel}>前景</span>
                <div style={styles.colorInputWrap}>
                  <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} style={styles.colorPicker} />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    style={styles.colorHex}
                    maxLength={7}
                  />
                </div>
              </div>
              <div style={styles.colorItem}>
                <span style={styles.colorLabel}>背景</span>
                <div style={styles.colorInputWrap}>
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={styles.colorPicker} />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    style={styles.colorHex}
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
            <div style={styles.presetRow}>
              {PRESET_COLORS.map((pc, i) => (
                <button
                  key={i}
                  style={{
                    ...styles.presetDot,
                    background: pc.bg,
                    border: `2px solid ${fgColor === pc.fg && bgColor === pc.bg ? 'var(--accent, #7c6cf0)' : 'var(--window-border, rgba(255,255,255,0.08))'}`,
                  }}
                  title={pc.label}
                  onClick={() => { setFgColor(pc.fg); setBgColor(pc.bg) }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: pc.fg, display: 'block' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={styles.actionRow}>
            <button style={styles.primaryBtn} onClick={handleDownload} disabled={!grid}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              下载 PNG
            </button>
            <button
              style={{
                ...styles.secondaryBtn,
                ...(copied ? { background: '#10b981', color: '#fff', borderColor: '#10b981' } : {}),
              }}
              onClick={handleCopy}
              disabled={!grid}
            >
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  已复制
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  复制
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: QR Preview */}
        <div style={styles.rightPanel}>
          <div style={styles.canvasCard}>
            {grid ? (
              <canvas ref={canvasRef} style={styles.canvas} />
            ) : (
              <div style={styles.placeholder}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9090a4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M14 14h3v3h-3z" />
                </svg>
                <span>{error || '输入内容以生成二维码'}</span>
              </div>
            )}
          </div>
          <div style={styles.canvasMeta}>
            {grid ? `${qrSize}×${qrSize} px · ${moduleCount}×${moduleCount} 模块 · EC ${ecLevel}` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 样式
// ============================================================

const styles: Record<string, CSSProperties> = {
  container: {
    padding: '16px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: 'var(--bg-primary, #0f0f1a)',
    color: 'var(--text-primary, #e0e0e8)',
    overflow: 'hidden',
    borderRadius: 'var(--window-radius, 12px)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    background: 'rgba(124, 108, 240, 0.12)',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 600,
    color: 'var(--text-primary, #e0e0e8)',
  },
  subtitle: {
    fontSize: '11px',
    color: 'var(--text-secondary, #9090a4)',
  },
  main: {
    flex: 1,
    display: 'flex',
    gap: '16px',
    overflow: 'hidden',
    minHeight: 0,
  },
  leftPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto',
    paddingRight: '8px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-secondary, #9090a4)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
    borderRadius: '10px',
    fontSize: '13px',
    resize: 'vertical',
    minHeight: '72px',
    outline: 'none',
    background: 'var(--bg-secondary, #1a1a2e)',
    color: 'var(--text-primary, #e0e0e8)',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  charRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: '11px',
    color: 'var(--text-secondary, #9090a4)',
  },
  errorText: {
    fontSize: '11px',
    color: '#f87171',
  },
  okText: {
    fontSize: '11px',
    color: '#34d399',
  },

  // Templates
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
  },
  templateBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    padding: '8px 4px',
    border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
    borderRadius: '8px',
    background: 'var(--bg-secondary, #1a1a2e)',
    color: 'var(--text-primary, #e0e0e8)',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'all 0.15s',
  },
  templateBtnActive: {
    background: 'rgba(124, 108, 240, 0.15)',
    borderColor: 'var(--accent, #7c6cf0)',
    color: 'var(--accent, #7c6cf0)',
  },
  templateIcon: {
    fontSize: '16px',
  },
  templateLabel: {
    fontSize: '11px',
  },
  templateInput: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
    borderRadius: '8px',
    fontSize: '12px',
    outline: 'none',
    background: 'var(--bg-secondary, #1a1a2e)',
    color: 'var(--text-primary, #e0e0e8)',
    boxSizing: 'border-box',
    marginTop: '4px',
  },

  // EC Level
  ecRow: {
    display: 'flex',
    gap: '6px',
  },
  ecBtn: {
    flex: 1,
    padding: '8px 4px',
    border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
    borderRadius: '8px',
    background: 'var(--bg-secondary, #1a1a2e)',
    color: 'var(--text-primary, #e0e0e8)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1px',
    transition: 'all 0.15s',
  },
  ecBtnActive: {
    background: 'var(--accent, #7c6cf0)',
    borderColor: 'var(--accent, #7c6cf0)',
    color: '#fff',
  },
  ecLetter: {
    fontSize: '14px',
    fontWeight: 700,
  },
  ecPercent: {
    fontSize: '10px',
    opacity: 0.7,
  },

  // Slider
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: 'var(--accent, #7c6cf0)',
    fontWeight: 500,
  },
  slider: {
    width: '100%',
    height: '6px',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    borderRadius: '3px',
    background: 'var(--bg-tertiary, #16213e)',
    outline: 'none',
    cursor: 'pointer',
  },

  // Module Style
  styleRow: {
    display: 'flex',
    gap: '6px',
  },
  styleBtn: {
    flex: 1,
    padding: '6px 8px',
    border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
    borderRadius: '8px',
    background: 'var(--bg-secondary, #1a1a2e)',
    color: 'var(--text-primary, #e0e0e8)',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    transition: 'all 0.15s',
  },
  styleBtnActive: {
    background: 'rgba(124, 108, 240, 0.15)',
    borderColor: 'var(--accent, #7c6cf0)',
    color: 'var(--accent, #7c6cf0)',
  },

  // Colors
  colorRow: {
    display: 'flex',
    gap: '10px',
  },
  colorItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  colorLabel: {
    fontSize: '11px',
    color: 'var(--text-secondary, #9090a4)',
  },
  colorInputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  colorPicker: {
    width: '30px',
    height: '30px',
    border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
    borderRadius: '6px',
    cursor: 'pointer',
    padding: 0,
    background: 'none',
    flexShrink: 0,
  },
  colorHex: {
    flex: 1,
    padding: '5px 8px',
    border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'monospace',
    outline: 'none',
    background: 'var(--bg-secondary, #1a1a2e)',
    color: 'var(--text-primary, #e0e0e8)',
    minWidth: 0,
  },
  presetRow: {
    display: 'flex',
    gap: '4px',
    marginTop: '4px',
  },
  presetDot: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    transition: 'transform 0.15s',
  },

  // Actions
  actionRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '2px',
  },
  primaryBtn: {
    flex: 1,
    padding: '10px 14px',
    border: 'none',
    borderRadius: '10px',
    background: 'var(--accent, #7c6cf0)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'filter 0.15s',
  },
  secondaryBtn: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
    borderRadius: '10px',
    background: 'var(--bg-secondary, #1a1a2e)',
    color: 'var(--text-primary, #e0e0e8)',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s',
  },

  // QR Preview
  rightPanel: {
    width: '45%',
    maxWidth: '340px',
    minWidth: '220px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  canvasCard: {
    background: 'var(--bg-secondary, #1a1a2e)',
    borderRadius: '14px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
    minHeight: '200px',
    width: '100%',
  },
  canvas: {
    borderRadius: '8px',
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--text-secondary, #9090a4)',
    fontSize: '13px',
  },
  canvasMeta: {
    fontSize: '11px',
    color: 'var(--text-secondary, #9090a4)',
    fontFamily: 'monospace',
  },
}

export default QRCodeGenerator
