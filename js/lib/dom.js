window.BL = window.BL || {};

/* DOM 조각 만드는 최소 도구. innerHTML 대신 textContent 를 쓴다. */
(function (BL) {
  function put(parent, kids) {
    if (kids == null) return;
    if (kids instanceof Array) {
      for (var i = 0; i < kids.length; i++) put(parent, kids[i]);
      return;
    }
    if (kids.nodeType) { parent.appendChild(kids); return; }
    parent.appendChild(document.createTextNode(String(kids)));
  }

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        var v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'text') node.textContent = String(v);
        else if (k === 'class') node.className = String(v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v === true) node.setAttribute(k, '');
        else node.setAttribute(k, String(v));
      }
    }
    put(node, kids);
    return node;
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  BL.dom = { el: el, qs: qs, qsa: qsa, clear: clear };
})(window.BL);