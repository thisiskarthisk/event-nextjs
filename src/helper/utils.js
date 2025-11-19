export function mapObject(obj, fn = null) {
  return Object.fromEntries(
    Object.entries(obj).map((k, v) => {
      if (fn) {
        return fn(k, v);
      } else {
        return [k, v];
      }
    })
  );
}

export function random(n) {
  return Math.floor( Math.random() * n );
}
