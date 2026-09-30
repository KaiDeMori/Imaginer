export function escape_XML(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const NAMED_ENTITIES = { lt: "<", gt: ">", quot: '"', apos: "'", amp: "&" };

export function decode_XML_entities(text) {
  return text.replace(/&(#x[0-9A-Fa-f]+|#[0-9]+|lt|gt|quot|apos|amp);/g, (entity, body) => {
    if (body[0] !== "#") return NAMED_ENTITIES[body];
    const code_point = body[1] === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
    if (code_point === 0 || code_point > 0x10ffff || (code_point >= 0xd800 && code_point <= 0xdfff)) return entity;
    return String.fromCodePoint(code_point);
  });
}
