#!/usr/bin/env python3
"""pdf_probe.py — 技术 PDF 体检与定位工具

用途:
  1) 逐页体检:有无文字层 / 内嵌图片数 / 有无 /Contents  → 判断文件是否损坏
  2) 关键词定位:找章节在第几页(大 datasheet 必备)
  3) 页脚读取:核对「文档页码 vs PDF 页序」偏移、判断文档是否被截断
  4) 孤儿内容流扫描:内容流还在但引用断了的情况,判断能否修
  5) 内嵌图片提取:页面渲染不出来时的兜底

依赖:
  pymupdf   (必需)   pip3 install --user pymupdf
  pikepdf   (--orphans 才需要)  pip3 install --user pikepdf

示例:
  python3 pdf_probe.py ds.pdf                          # 全文体检
  python3 pdf_probe.py ds.pdf --find "Power On" "Sleep"
  python3 pdf_probe.py ds.pdf --footer 1 --footer -1   # 首末页页脚
  python3 pdf_probe.py ds.pdf --orphans
  python3 pdf_probe.py ds.pdf --extract-images 85-92 --out ./imgs
"""
import argparse
import os
import re
import sys

try:
    import fitz  # pymupdf
except ImportError:
    sys.exit("需要 pymupdf:pip3 install --user pymupdf")

fitz.TOOLS.mupdf_display_errors(False)   # MuPDF 报错噪音很大且不影响结果

# 页内容流里几乎必现的算子:文本(BT / Tf)、绘图(re / cm / Do)、标记内容(BDC)。
# 纯图页没有 BT,所以文本算子不能单独当判据。
CONTENT_OPS = (b"BT", b" Tf", b"BDC", b" re", b" cm", b" Do")


def parse_range(spec, npages):
    """'85-92' / '85' / '85,90-92' → [0-based indices]"""
    out = []
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-", 1)
            out.extend(range(int(a) - 1, int(b)))
        else:
            out.append(int(part) - 1)
    return [i for i in out if 0 <= i < npages]


def page_report(doc, i):
    """返回单页三项体检结果"""
    try:
        text = doc[i].get_text().strip()
    except Exception:
        text = ""
    try:
        nimg = len(doc[i].get_images(full=True))
    except Exception:
        nimg = -1
    # 页对象有没有 /Contents —— 判损坏的关键
    has_contents = None
    try:
        has_contents = doc[i].get_contents() != []
    except Exception:
        try:
            has_contents = bool(doc.xref_get_key(doc[i].xref, "Contents")[1])
        except Exception:
            has_contents = None
    return len(text), nimg, has_contents


def cmd_health(doc, verbose):
    n = doc.page_count
    print(f"页数: {n}")
    notext, nocontents = [], []
    for i in range(n):
        tlen, nimg, has_c = page_report(doc, i)
        if tlen < 40:
            notext.append(i + 1)
            if has_c is False:
                nocontents.append(i + 1)
        if verbose:
            flag = "" if tlen >= 40 else ("  ← 无文字层" + ("、无 /Contents" if has_c is False else ""))
            print(f"  p{i+1:<4d} text={tlen:<6d} imgs={nimg:<3d} contents={has_c}{flag}")

    print(f"\n无文字层页: {len(notext)}")
    if notext:
        print(f"  {compact(notext)}")
    print(f"其中【无 /Contents】(内容流丢失,即文件损坏): {len(nocontents)}")
    if nocontents:
        print(f"  {compact(nocontents)}")
        print("\n  → 这些页的内容不在文件里。先跑 --orphans 看能否修复;")
        print("    孤儿流为 0 则修不了,需要换一份完整 PDF。")
        print("    ★ 下结论前务必做对照实验:Read 一个完好页,证明是文件坏了而不是工具不行。")
    elif notext:
        print("\n  → 有 /Contents 但无文字层 = 扫描件。用 Read 工具渲染仍可读(是图)。")
    else:
        print("\n  → 全文完好。")


def compact(nums):
    """[73,74,75,80] → '73-75, 80'"""
    if not nums:
        return ""
    out, start, prev = [], nums[0], nums[0]
    for x in nums[1:]:
        if x == prev + 1:
            prev = x
            continue
        out.append(f"{start}-{prev}" if prev > start else f"{start}")
        start = prev = x
    out.append(f"{start}-{prev}" if prev > start else f"{start}")
    return ", ".join(out)


def cmd_find(doc, keys):
    print(f"检索 {len(keys)} 个关键词(跳过目录页的 '....' 行)\n")
    for k in keys:
        hits = []
        for i in range(doc.page_count):
            try:
                t = doc[i].get_text()
            except Exception:
                continue
            if k not in t:
                continue
            # 目录行特征:关键词后面跟一串点号
            seg = t.split(k, 1)[1][:80]
            is_toc = seg.count(".") > 8
            hits.append((i + 1, "TOC" if is_toc else "正文"))
        if hits:
            body = [p for p, kind in hits if kind == "正文"]
            toc = [p for p, kind in hits if kind == "TOC"]
            print(f"  [{k}]")
            if body:
                print(f"      正文: {compact(body)}")
            if toc:
                print(f"      目录: {compact(toc)}")
        else:
            print(f"  [{k}]  未命中(可能在图里,或该页文字层丢失)")


def cmd_footer(doc, pages):
    print("页脚(核对文档页码 vs PDF 页序,并判断是否截断)\n")
    for p in pages:
        i = p - 1 if p > 0 else doc.page_count + p
        if not (0 <= i < doc.page_count):
            continue
        try:
            t = doc[i].get_text()
        except Exception:
            print(f"  PDF 第 {i+1} 页: <读取失败>")
            continue
        m = re.search(r"Page\s+(\d+)\s+of\s+(\d+)", t)
        if m:
            docp, total = int(m.group(1)), int(m.group(2))
            note = ""
            if docp != i + 1:
                note += f"  ⚠ 偏移 {docp-(i+1):+d}"
            if total > doc.page_count:
                note += f"  ⚠ 文档共 {total} 页,本 PDF 只有 {doc.page_count} 页 → 截断副本"
            print(f"  PDF 第 {i+1} 页 → 文档 Page {docp} of {total}{note}")
        else:
            tail = " | ".join(x.strip() for x in t.strip().split("\n")[-3:] if x.strip())
            print(f"  PDF 第 {i+1} 页 → 未匹配 'Page N of M';末尾: {tail[:100]}")


def reachable(pdf, pikepdf):
    """从 trailer 出发遍历整个对象图,返回所有可达对象的 objgen。

    「孤儿」= 从 trailer 走不到的对象。只看页 /Contents 是不够的 ——
    字体、图片、注释这些从 /Resources / /Annots 引用,页 /Contents 里当然没有,
    但它们有主,不是孤儿。判据写窄了会把一整批正常对象报成孤儿。
    """
    seen = set()
    stack = [pdf.trailer]
    while stack:
        o = stack.pop()
        try:
            og = o.objgen
        except Exception:
            og = (0, 0)
        if og != (0, 0):
            if og in seen:
                continue          # 间接对象去重,顺带断掉引用环
            seen.add(og)
        try:
            if isinstance(o, pikepdf.Array):
                stack.extend(list(o))
            elif isinstance(o, (pikepdf.Dictionary, pikepdf.Stream)):
                stack.extend(o[k] for k in o.keys())
        except Exception:
            continue              # 损坏文件里取子对象可能直接炸,跳过不影响其余遍历
    return seen


def cmd_orphans(path, doc):
    try:
        import pikepdf
    except ImportError:
        sys.exit("--orphans 需要 pikepdf:pip3 install --user pikepdf")
    import warnings
    warnings.filterwarnings("ignore")

    pdf = pikepdf.open(path)
    missing = [i + 1 for i, pg in enumerate(pdf.pages) if pg.get("/Contents") is None]

    print(f"缺 /Contents 的页: {len(missing)}  {compact(missing)}\n")

    # 没有页缺 /Contents,就不存在"内容流丢失"这回事 —— 孤儿扫描无从谈起。
    # 不早退的话,下面的启发式会在正常 PDF 上数出一堆东西,报成"可修复",
    # 把人送去修一份根本没坏的文件。
    if not missing:
        print("  → 每一页都有 /Contents,内容流没丢。孤儿扫描不适用。")
        print("    页面读不出来是别的原因(加密 / 字体 / 渲染),先做对照实验再往下查。")
        return

    live = reachable(pdf, pikepdf)
    size = int(pdf.trailer.get("/Size", 0))
    streams = unreachable = orphan = 0
    samples = []
    for n in range(1, size + 1):
        try:
            o = pdf.get_object(n, 0)
        except Exception:
            continue
        if not isinstance(o, pikepdf.Stream):
            continue
        streams += 1
        if (n, 0) in live:
            continue
        unreachable += 1
        # 排掉字体文件:FontFile / FontFile2 没有 /Subtype,但有 /Length1,
        # 且字体二进制里会随机撞上 " re" / " cm" 这种字节序列,不排会假阳。
        if o.get("/Subtype") is not None or o.get("/Length1") is not None:
            continue
        try:
            b = o.read_bytes()
        except Exception:
            continue
        # 页内容流特征:含内容流算子。两点讲究:
        #   ① 扫全篇,不能只扫开头 —— 矢量图排在文本前面时,第一个 BT 可能在几万字节
        #      之后(实测某 datasheet 页,BT 首现于第 17786 字节),只扫前 4000 会全漏。
        #   ② 不能只认 BT / Tf —— 纯图页根本没有文本算子,得连绘图 / 标记算子一起认。
        if len(b) > 200 and any(op in b for op in CONTENT_OPS):
            orphan += 1
            if len(samples) < 5:
                samples.append((n, len(b), b[:50]))

    print(f"总 stream: {streams}   从 trailer 不可达: {unreachable}")
    print(f"其中形似页内容流的(孤儿): {orphan}")
    for s in samples:
        print(f"   obj {s[0]}  {s[1]} bytes  {s[2]}")
    if orphan == 0:
        print("\n  → 孤儿流为 0:内容流真的不在文件里,【修不了】,需要换一份完整 PDF。")
    else:
        print("\n  → 存在孤儿流:内容还在、只是引用断了,可尝试重新挂回页面。")
        if orphan != len(missing):
            print(f"    ⚠ 孤儿数({orphan})和缺 /Contents 的页数({len(missing)})对不上,")
            print("      不是一一对应 —— 重挂前逐个核对每段内容属于哪一页。")


def cmd_extract(doc, spec, outdir):
    os.makedirs(outdir, exist_ok=True)
    idxs = parse_range(spec, doc.page_count)
    ok = 0
    for i in idxs:
        try:
            imgs = doc[i].get_images(full=True)
        except Exception:
            continue
        for k, info in enumerate(imgs):
            try:
                im = doc.extract_image(info[0])
            except Exception:
                continue
            fn = os.path.join(outdir, f"p{i+1:03d}_{k}.{im['ext']}")
            with open(fn, "wb") as f:
                f.write(im["image"])
            print(f"  {fn}   {im['width']}x{im['height']}")
            ok += 1
    print(f"\n共导出 {ok} 张。注意会混进 logo / 水印,按尺寸筛。")


def main():
    ap = argparse.ArgumentParser(description="技术 PDF 体检与定位")
    ap.add_argument("pdf")
    ap.add_argument("--find", nargs="+", metavar="KEY", help="关键词定位章节页码")
    ap.add_argument("--footer", type=int, action="append", metavar="N",
                    help="读第 N 页页脚(负数从末页数),可多次")
    ap.add_argument("--orphans", action="store_true", help="扫描孤儿内容流(判断损坏能否修)")
    ap.add_argument("--extract-images", metavar="RANGE", help="导出内嵌图片,如 85-92")
    ap.add_argument("--out", default="./pdf_imgs", help="图片输出目录")
    ap.add_argument("-v", "--verbose", action="store_true", help="逐页打印体检结果")
    a = ap.parse_args()

    if not os.path.exists(a.pdf):
        sys.exit(f"文件不存在: {a.pdf}")

    doc = fitz.open(a.pdf)
    print(f"=== {os.path.basename(a.pdf)} ===")

    did = False
    if a.find:
        cmd_find(doc, a.find); did = True
    if a.footer:
        print(); cmd_footer(doc, a.footer); did = True
    if a.orphans:
        print(); cmd_orphans(a.pdf, doc); did = True
    if a.extract_images:
        print(); cmd_extract(doc, a.extract_images, a.out); did = True
    if not did:
        cmd_health(doc, a.verbose)


if __name__ == "__main__":
    main()
