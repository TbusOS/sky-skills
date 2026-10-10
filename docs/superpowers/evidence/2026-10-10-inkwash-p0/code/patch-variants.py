# 生成两种减负版本的画笔,和原版对比性能:
#   brush-proto.nofilter.js  去掉整组打毛滤镜,边缘抖动全放进几何(0.7 → 1.2)
#   brush-proto.unmask.js    每笔画完后用一个 1ms 的 CSS 动画把遮罩换成 none
import pathlib
src = pathlib.Path('brush-proto.js').read_text()

s = src
for a, b in [
    ("'<g class=\"bp-ink\" filter=\"url(#bp-rough)\">'", "'<g class=\"bp-ink\">'"),
    ("0.7 * edgeL(t)", "1.2 * edgeL(t)"),
    ("0.7 * edgeR(t)", "1.2 * edgeR(t)"),
]:
    assert a in s, a
    s = s.replace(a, b)
pathlib.Path('brush-proto.nofilter.js').write_text(s)

s = src
for a, b in [
    ("art.push('<g class=\"bp-stroke bp-' + tone + '\" mask=\"url(#' + mid + ')\">' +",
     "art.push('<g class=\"bp-stroke bp-' + tone + '\" mask=\"url(#' + mid + ')\" style=\"animation-delay:' + f1(start + dur) + 's\">' +"),
    ("'.bp-reveal{stroke-dasharray",
     "'.bp-stroke{animation:bp-unmask 1ms step-end forwards}@keyframes bp-unmask{to{mask:none}}' +\n    '.bp-reveal{stroke-dasharray"),
]:
    assert a in s, a
    s = s.replace(a, b)
pathlib.Path('brush-proto.unmask.js').write_text(s)
print('写出 brush-proto.nofilter.js brush-proto.unmask.js')
