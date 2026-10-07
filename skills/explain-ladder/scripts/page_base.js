(function () {
  'use strict';
  var D = JSON.parse(document.getElementById('page-data').textContent);
  window.PAGE_DATA = D;
  var TABLE_CAP = 3000, LOG_CAP = 5000;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // 子串(不分大小写),或 /正则/flags。正则写错返回 'bad'。
  function matcher(q) {
    q = q.trim();
    if (!q) return null;
    var m = /^\/(.+)\/([a-z]*)$/.exec(q);
    if (m) {
      try {
        var re = new RegExp(m[1], m[2].replace('g', ''));
        return function (s) { return re.test(s); };
      } catch (e) { return 'bad'; }
    }
    var lq = q.toLowerCase();
    return function (s) { return s.toLowerCase().indexOf(lq) >= 0; };
  }

  function srcLine(i) {
    var p = el('div', 'src');
    if (i == null || !D.sources[i]) return p;
    var s = D.sources[i];
    p.appendChild(document.createTextNode('出处 '));
    var a = el('a', null, '[' + (i + 1) + '] ' + (s.path || ('$ ' + s.cmd)));
    a.href = '#src-' + i;
    p.appendChild(a);
    return p;
  }

  function head(sec, w) {
    sec.appendChild(el('h2', null, w.title));
    if (w.note) sec.appendChild(el('p', 'note', w.note));
    sec.appendChild(srcLine(w.src));
  }

  function toolbar(sec, placeholder, onInput) {
    var bar = el('div', 'toolbar');
    var inp = el('input');
    inp.type = 'search';
    inp.placeholder = placeholder;
    var cnt = el('span', 'count');
    bar.appendChild(inp);
    bar.appendChild(cnt);
    sec.appendChild(bar);
    var t = null;
    inp.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { onInput(inp.value, cnt); }, 150);
    });
    return cnt;
  }

  function isNum(v) { return typeof v === 'number' || (/^-?\d+(\.\d+)?$/).test(String(v)); }

  function renderTable(sec, w) {
    head(sec, w);
    var sortCol = -1, sortDir = 1, query = '';
    var box = el('div', 'scroll'), tbl = el('table'), thead = el('thead'), tbody = el('tbody');
    var cap = el('div', 'cap');
    var tr = el('tr');
    w.columns.forEach(function (c, ci) {
      var th = el('th', null, c);
      th.addEventListener('click', function () {
        sortDir = (sortCol === ci) ? -sortDir : 1;
        sortCol = ci;
        Array.prototype.forEach.call(tr.children, function (x) { x.className = ''; });
        th.className = sortDir > 0 ? 'asc' : 'desc';
        draw();
      });
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    tbl.appendChild(thead);
    tbl.appendChild(tbody);
    var cnt = toolbar(sec, '过滤:子串,或 /正则/', function (q) { query = q; draw(); });
    box.appendChild(tbl);
    sec.appendChild(box);
    sec.appendChild(cap);

    function draw() {
      var f = matcher(query);
      if (f === 'bad') { cnt.textContent = '正则写错了'; return; }
      var rows = w.rows.filter(function (r) { return !f || f(r.join('\t')); });
      if (sortCol >= 0) {
        rows = rows.slice().sort(function (a, b) {
          var x = a[sortCol], y = b[sortCol];
          if (isNum(x) && isNum(y)) return (Number(x) - Number(y)) * sortDir;
          return String(x).localeCompare(String(y), 'zh') * sortDir;
        });
      }
      tbody.textContent = '';
      rows.slice(0, TABLE_CAP).forEach(function (r) {
        var row = el('tr');
        r.forEach(function (v) { row.appendChild(el('td', isNum(v) ? 'num' : null, v == null ? '' : String(v))); });
        tbody.appendChild(row);
      });
      cnt.textContent = '显示 ' + Math.min(rows.length, TABLE_CAP) + ' / 匹配 ' + rows.length + ' / 共 ' + w.rows.length + ' 行';
      cap.textContent = rows.length > TABLE_CAP ? '只画了前 ' + TABLE_CAP + ' 行,用过滤缩小范围' : '';
    }
    draw();
  }

  function renderLog(sec, w) {
    head(sec, w);
    var box = el('div', 'scroll'), pre = el('div', 'log'), cap = el('div', 'cap');
    var cnt = toolbar(sec, '过滤:子串,或 /正则/;行号是源文件里的原始行号', draw);
    box.appendChild(pre);
    sec.appendChild(box);
    sec.appendChild(cap);

    function draw(q) {
      var f = matcher(q || '');
      if (f === 'bad') { cnt.textContent = '正则写错了'; return; }
      pre.textContent = '';
      var shown = 0, hit = 0;
      for (var i = 0; i < w.lines.length; i++) {
        var s = w.lines[i];
        if (f && !f(s)) continue;
        hit++;
        if (shown >= LOG_CAP) continue;
        var ln = el('div', 'ln');
        ln.appendChild(el('span', 'no', String(i + 1)));
        ln.appendChild(el('span', 'tx', s));
        pre.appendChild(ln);
        shown++;
      }
      cnt.textContent = (f ? '匹配 ' + hit + ' / ' : '') + '共 ' + w.lines.length + ' 行';
      cap.textContent = hit > LOG_CAP ? '只画了前 ' + LOG_CAP + ' 行,用过滤缩小范围' : '';
    }
    draw('');
  }

  D.widgets.forEach(function (w) {
    var sec = document.getElementById(w.id);
    if (!sec) return;
    if (w.type === 'table') renderTable(sec, w);
    else if (w.type === 'log') renderLog(sec, w);
    sec.setAttribute('data-widget-ready', '1');
  });

  var ol = document.querySelector('#sources ol');
  D.sources.forEach(function (s, i) {
    var li = el('li');
    li.id = 'src-' + i;
    if (s.path) {
      li.appendChild(el('code', null, s.path));
      li.appendChild(document.createTextNode('  ' + s.lines + ' 行 · ' + s.bytes + ' 字节 · sha256 ' + s.sha256.slice(0, 12)));
    } else {
      li.appendChild(el('code', null, '$ ' + s.cmd));
      li.appendChild(document.createTextNode('  在 ' + s.cwd + ' · 输出 ' + s.bytes + ' 字节 · sha256 ' + s.sha256.slice(0, 12)));
    }
    ol.appendChild(li);
  });
})();
