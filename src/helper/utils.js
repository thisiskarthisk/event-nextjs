import crypto from 'node:crypto';

const URL_ENC_ALGORITHM = 'aes-128-gcm';
const secretKey = crypto.createHash('sha256').update(process.env.NEXT_PUBLIC_URL_ENC_KEY).digest().subarray(0, 16);
const sideBarMinScreenWidthNeed = 991.98; // In pixels

function toBase64Url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(base64url) {
  base64url = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64url.length % 4) base64url += '=';
  return Buffer.from(base64url, 'base64');
}

export function encodeURLParam(data) {
  try {
    /* const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(URL_ENC_ALGORITHM, secretKey, iv);

    const encrypted = Buffer.concat([ cipher.update(data, 'utf8'), cipher.final() ]);

    const tag = cipher.getAuthTag();

    return toBase64Url(Buffer.concat([ iv, tag, encrypted ])); */
    return btoa(data).replace(/=*$/, '');
  } catch (error) {
    console.error('[encodeURLParam] Error:', error);

    return null;
  }
}

export function decodeURLParam(encData) {
  try {
    /* encData = fromBase64Url(encData);

    const iv = encData.subarray(0, 12);
    const tag = encData.subarray(12, 28);
    const encrypted = encData.subarray(28);

    const decipher = crypto.createDecipheriv(URL_ENC_ALGORITHM, secretKey, iv);

    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([ decipher.update(encrypted), decipher.final() ]);

    return decrypted.toString('utf8'); */
    return atob(encData);
  } catch (error) {
    console.error('[decodeURLParam] Error:', error);

    return null;
  }
}

export function random(n) {
  return Math.floor( Math.random() * n );
}

function shouldToggleSidebar() {
  return window.innerWidth <= sideBarMinScreenWidthNeed;
}

export function toggleSidebar(e = null, show = -1) {
  if (e) {
    e.nativeEvent.preventDefault();
    e.nativeEvent.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  }

  // console.log('toggleSidebar()', e, show);

  // if (document.activeElement) document.activeElement.blur();

  let removeClass, addClass;

  if (typeof(show) === 'boolean') {
    removeClass = show ? 'sidebar-collapse' : 'sidebar-open';
    addClass = show ? 'sidebar-open' : 'sidebar-collapse';
  } else {
    const isSidebarOpened = document.body.classList.contains('sidebar-open');

    removeClass = isSidebarOpened ? 'sidebar-open' : 'sidebar-collapse';
    addClass = isSidebarOpened ? 'sidebar-collapse' : 'sidebar-open';
  }

  // console.log(document.body.classList, removeClass, addClass);

  document.body.classList.remove(removeClass);
  document.body.classList.add(addClass);
}

export function toggleSidebarBasedOnScreenSize() {
  if (shouldToggleSidebar()) {
    toggleSidebar(null, false);
  } else {
    toggleSidebar(null, true);
  }
}

/**
 * Set value of the nested property from strung key identifier
 * 
 * e.g:
 * obj = { name: 'John', address: { city: 'ABC' } }
 * name = 'address.city'
 * value = 'XYZ'
 */
export function setNestedObjectValue(obj, name, value) {
  const keys = name.split('.');
  const lastKey = keys.pop();
  let current = obj;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }

    current = current[key];
  }

  current[lastKey] = value;

  return obj;
}

/**
 * Duplicate object with no reference
 */
export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
