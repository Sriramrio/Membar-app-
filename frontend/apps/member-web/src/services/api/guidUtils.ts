/**
 * Utility to validate and deterministically resolve string IDs to standard .NET GUIDs.
 * Matches DevDataSeeder.DeterministicGuid(input) in C#.
 */

// Pure JS MD5 implementation for standard browser/client execution
function md5(input: string): number[] {
  function safeAdd(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  function bitRol(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return safeAdd(bitRol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  // Convert UTF-8 string to word array
  const utf8: number[] = [];
  for (let i = 0; i < input.length; i++) {
    let charcode = input.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (input.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }

  const words: number[] = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= (utf8[i] & 0xff) << ((i % 4) * 8);
  }

  const numBits = utf8.length * 8;
  words[numBits >> 5] |= 0x80 << (numBits % 32);
  words[(((numBits + 64) >>> 9) << 4) + 14] = numBits;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < words.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    a = ff(a, b, c, d, words[i + 0] || 0, 7, -680876936);
    d = ff(d, a, b, c, words[i + 1] || 0, 12, -389564586);
    c = ff(c, d, a, b, words[i + 2] || 0, 17, 606105819);
    b = ff(b, c, d, a, words[i + 3] || 0, 22, -1044525330);
    a = ff(a, b, c, d, words[i + 4] || 0, 7, -176418897);
    d = ff(d, a, b, c, words[i + 5] || 0, 12, 1200080426);
    c = ff(c, d, a, b, words[i + 6] || 0, 17, -1473231341);
    b = ff(b, c, d, a, words[i + 7] || 0, 22, -45705983);
    a = ff(a, b, c, d, words[i + 8] || 0, 7, 1770035416);
    d = ff(d, a, b, c, words[i + 9] || 0, 12, -1958414417);
    c = ff(c, d, a, b, words[i + 10] || 0, 17, -42063);
    b = ff(b, c, d, a, words[i + 11] || 0, 22, -1990404162);
    a = ff(a, b, c, d, words[i + 12] || 0, 7, 1804603682);
    d = ff(d, a, b, c, words[i + 13] || 0, 12, -40341101);
    c = ff(c, d, a, b, words[i + 14] || 0, 17, -1502002290);
    b = ff(b, c, d, a, words[i + 15] || 0, 22, 1236535329);

    a = gg(a, b, c, d, words[i + 1] || 0, 5, -165796510);
    d = gg(d, a, b, c, words[i + 6] || 0, 9, -1069501632);
    c = gg(c, d, a, b, words[i + 11] || 0, 14, 643717713);
    b = gg(b, c, d, a, words[i + 0] || 0, 20, -373897302);
    a = gg(a, b, c, d, words[i + 5] || 0, 5, -701558691);
    d = gg(d, a, b, c, words[i + 10] || 0, 9, 38016083);
    c = gg(c, d, a, b, words[i + 15] || 0, 14, -660478335);
    b = gg(b, c, d, a, words[i + 4] || 0, 20, -405537848);
    a = gg(a, b, c, d, words[i + 9] || 0, 5, 568446438);
    d = gg(d, a, b, c, words[i + 14] || 0, 9, -1019803690);
    c = gg(c, d, a, b, words[i + 3] || 0, 14, -187363961);
    b = gg(b, c, d, a, words[i + 8] || 0, 20, 1163531501);
    a = gg(a, b, c, d, words[i + 13] || 0, 5, -1444681467);
    d = gg(d, a, b, c, words[i + 2] || 0, 9, -51403784);
    c = gg(c, d, a, b, words[i + 7] || 0, 14, 1735328473);
    b = gg(b, c, d, a, words[i + 12] || 0, 20, -1926607734);

    a = hh(a, b, c, d, words[i + 5] || 0, 4, -378558);
    d = hh(d, a, b, c, words[i + 8] || 0, 11, -2022574463);
    c = hh(c, d, a, b, words[i + 11] || 0, 16, 1839030562);
    b = hh(b, c, d, a, words[i + 14] || 0, 23, -35309556);
    a = hh(a, b, c, d, words[i + 1] || 0, 4, -1530992060);
    d = hh(d, a, b, c, words[i + 4] || 0, 11, 1272893353);
    c = hh(c, d, a, b, words[i + 7] || 0, 16, -155497632);
    b = hh(b, c, d, a, words[i + 10] || 0, 23, -1094730640);
    a = hh(a, b, c, d, words[i + 13] || 0, 4, 681279174);
    d = hh(d, a, b, c, words[i + 0] || 0, 11, -358537222);
    c = hh(c, d, a, b, words[i + 3] || 0, 16, -722521979);
    b = hh(b, c, d, a, words[i + 6] || 0, 23, 76029189);
    a = hh(a, b, c, d, words[i + 9] || 0, 4, -640364487);
    d = hh(d, a, b, c, words[i + 12] || 0, 11, -421815835);
    c = hh(c, d, a, b, words[i + 15] || 0, 16, 530742520);
    b = hh(b, c, d, a, words[i + 2] || 0, 23, -995338651);

    a = ii(a, b, c, d, words[i + 0] || 0, 6, -198630844);
    d = ii(d, a, b, c, words[i + 7] || 0, 10, 1126891415);
    c = ii(c, d, a, b, words[i + 14] || 0, 15, -1416354905);
    b = ii(b, c, d, a, words[i + 5] || 0, 21, -57434055);
    a = ii(a, b, c, d, words[i + 12] || 0, 6, 1700485571);
    d = ii(d, a, b, c, words[i + 3] || 0, 10, -1894986606);
    c = ii(c, d, a, b, words[i + 10] || 0, 15, -1051523);
    b = ii(b, c, d, a, words[i + 1] || 0, 21, -2054922799);
    a = ii(a, b, c, d, words[i + 8] || 0, 6, 1873313359);
    d = ii(d, a, b, c, words[i + 15] || 0, 10, -30611744);
    c = ii(c, d, a, b, words[i + 6] || 0, 15, -1560198380);
    b = ii(b, c, d, a, words[i + 13] || 0, 21, 1309151649);
    a = ii(a, b, c, d, words[i + 4] || 0, 6, -145523070);
    d = ii(d, a, b, c, words[i + 11] || 0, 10, -1120210379);
    c = ii(c, d, a, b, words[i + 2] || 0, 15, 718787259);
    b = ii(b, c, d, a, words[i + 9] || 0, 21, -343485551);

    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  const bytes: number[] = [];
  const state = [a, b, c, d];
  for (let i = 0; i < 4; i++) {
    const val = state[i];
    bytes.push(val & 0xff, (val >> 8) & 0xff, (val >> 16) & 0xff, (val >> 24) & 0xff);
  }
  return bytes;
}

/**
 * Converts a string into .NET Guid format, matching DevDataSeeder.DeterministicGuid(input)
 */
export function toDotNetGuid(input: string): string {
  const b = md5(input);
  // .NET new Guid(byte[]):
  // bytes 0..3: little-endian int32
  // bytes 4..5: little-endian int16
  // bytes 6..7: little-endian int16
  // bytes 8..15: big-endian
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  const p1 = hex(b[3]) + hex(b[2]) + hex(b[1]) + hex(b[0]);
  const p2 = hex(b[5]) + hex(b[4]);
  const p3 = hex(b[7]) + hex(b[6]);
  const p4 = hex(b[8]) + hex(b[9]);
  const p5 = hex(b[10]) + hex(b[11]) + hex(b[12]) + hex(b[13]) + hex(b[14]) + hex(b[15]);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`.toLowerCase();
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isGuid(value: unknown): boolean {
  return typeof value === 'string' && UUID_REGEX.test(value.trim());
}

const KNOWN_MEMBER_GUIDS: Record<string, string> = {
  'member-member': '634c7f3b-c63d-2acf-19e4-886e3d5da1ff',
  'member:member': '634c7f3b-c63d-2acf-19e4-886e3d5da1ff',
  'member-secretary': '2c00e69c-4c5e-85b3-97d5-ec5ef1738ddd',
  'member:secretary': '2c00e69c-4c5e-85b3-97d5-ec5ef1738ddd',
  'member-treasurer': 'eb545ec2-eb98-030f-1a8f-89f47a39a726',
  'member:treasurer': 'eb545ec2-eb98-030f-1a8f-89f47a39a726',

  // Database users
  'yamal': '47b268de-4f35-436d-b5b7-00bceca96f05',
  'member-yamal': '47b268de-4f35-436d-b5b7-00bceca96f05',
  'member:yamal': '47b268de-4f35-436d-b5b7-00bceca96f05',
  'yamal@gmail.com': '47b268de-4f35-436d-b5b7-00bceca96f05',

  'krishna kanth': '791077f7-8a63-4ccf-a2b2-6b52eb473f60',
  'krishhhhhhh': '791077f7-8a63-4ccf-a2b2-6b52eb473f60',
  'member-krishhhhhhh': '791077f7-8a63-4ccf-a2b2-6b52eb473f60',
  'member:krishhhhhhh': '791077f7-8a63-4ccf-a2b2-6b52eb473f60',
  'krishhhhhhh@gmail.com': '791077f7-8a63-4ccf-a2b2-6b52eb473f60',

  'akash velan': '85bbcde5-4744-478b-9260-be5d72ef9e31',
  'member-akash': '85bbcde5-4744-478b-9260-be5d72ef9e31',
  'krishhhhhhh824@gmail.com': '85bbcde5-4744-478b-9260-be5d72ef9e31',

  'manikandan': 'e9190a5f-ece2-45e6-a056-8580d796b5b1',
  'sabasabarish431@gmail.com': 'e9190a5f-ece2-45e6-a056-8580d796b5b1',
};

const KNOWN_MEMBER_SLUGS: Record<string, string> = {
  '634c7f3b-c63d-2acf-19e4-886e3d5da1ff': 'member-member',
  '3b7f4c63-3dc6-cf2a-19e4-886e3d5da1ff': 'member-member',
  '2c00e69c-4c5e-85b3-97d5-ec5ef1738ddd': 'member-secretary',
  '9ce6002c-5e4c-b385-97d5-ec5ef1738ddd': 'member-secretary',
  'eb545ec2-eb98-030f-1a8f-89f47a39a726': 'member-treasurer',
  'c25e54eb-98eb-0f03-1a8f-89f47a39a726': 'member-treasurer',

  '47b268de-4f35-436d-b5b7-00bceca96f05': 'member-yamal',
  '791077f7-8a63-4ccf-a2b2-6b52eb473f60': '791077f7-8a63-4ccf-a2b2-6b52eb473f60',
  '85bbcde5-4744-478b-9260-be5d72ef9e31': '85bbcde5-4744-478b-9260-be5d72ef9e31',
  'e9190a5f-ece2-45e6-a056-8580d796b5b1': 'e9190a5f-ece2-45e6-a056-8580d796b5b1',
};

export function toMemberSlug(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  const clean = value.trim().toLowerCase();
  if (KNOWN_MEMBER_SLUGS[clean]) return KNOWN_MEMBER_SLUGS[clean];
  if (clean.startsWith('member-')) return clean;
  return clean;
}

/**
 * Resolves any identifier to a valid GUID.
 * - If already a GUID, returns it directly.
 * - If it's a seed or mock identifier (e.g., 'business-member', 'member-007', 'cat-precision'),
 *   transforms it into the corresponding .NET DeterministicGuid.
 */
export function toGuid(value: unknown, fallbackKey = 'default'): string {
  if (typeof value !== 'string' || !value.trim()) {
    return toDotNetGuid(fallbackKey);
  }
  const clean = value.trim();
  const lower = clean.toLowerCase();
  if (KNOWN_MEMBER_GUIDS[lower]) {
    return KNOWN_MEMBER_GUIDS[lower];
  }

  // Dynamic session account resolution
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem('sethu:account');
      if (raw) {
        const acct = JSON.parse(raw);
        if (acct?.memberId && UUID_REGEX.test(acct.memberId)) {
          if (
            lower === String(acct.id || '').toLowerCase() ||
            lower === `member-${String(acct.id || '').toLowerCase()}` ||
            lower === String(acct.email || '').toLowerCase()
          ) {
            return acct.memberId.toLowerCase();
          }
        }
      }
    } catch {
      // fallback
    }
  }

  if (UUID_REGEX.test(clean)) {
    return clean.toLowerCase();
  }

  const prefixMatch = clean.match(/^(?:member|business|biz|user)[-:]?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  if (prefixMatch) {
    return prefixMatch[1].toLowerCase();
  }

  // Canonical alias normalization matching DevDataSeeder
  let normalized = clean;
  if (clean.startsWith('business-')) {
    normalized = `business:${clean.slice('business-'.length)}`;
  } else if (clean.startsWith('member-')) {
    normalized = `member:${clean.slice('member-'.length)}`;
  } else if (clean.startsWith('user-')) {
    normalized = `user:${clean.slice('user-'.length)}`;
  } else if (clean.startsWith('opp-')) {
    normalized = clean === 'opp-001' ? 'opp:cloud-migration' : clean === 'opp-002' ? 'opp:warehouse-logistics' : `opp:${clean}`;
  } else if (clean.startsWith('event-')) {
    normalized = clean === 'event-001' ? 'event:hosur-weekly-conclave' : clean === 'event-002' ? 'event:chennai-networking-meet' : `event:${clean}`;
  }

  return toDotNetGuid(normalized);
}
