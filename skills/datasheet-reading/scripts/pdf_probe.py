#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
pdf_probe.py — 读 PDF 前的体检:告诉你【哪些页不能信文本层】。

为什么需要它:pdftotext 对表格/图形会静默丢内容,不报错、不提示,
看起来就像"文档里本来就没有"。据此下"文档里没有 X"的结论必然出错。

用法:
    pdf_probe.py <file.pdf>              体检,列出必须用 Read 看的页
    pdf_probe.py <file.pdf> -k 关键词     顺便定位关键词在哪几页
    pdf_probe.py --self-test             自检
退出码: 0=文本层可信 / 1=有可疑页,必须看渲染页 / 2=用不了(文件坏/缺工具)
"""
import os, re, subprocess, sys

os.environ["PATH"] = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
os.environ["PYTHONNOUSERSITE"] = "1"

# 一页正文低于这个字符数,判为"文本层可疑"(纯图页/表格页/扫描页)
THIN_PAGE_CHARS = 200


def parse_declared_total(text):
    """从页脚 'Page 12 of 299' 里取出标称总页数,返回出现次数最多的那个。

    页脚标称与 pdfinfo 实际页数不一致 = 明确的矛盾信号,必须当场证伪,
    不能挑一个能自圆其说的解释就往下走。
    """
    hits = re.findall(r"Page\s+\d+\s+of\s+(\d+)", text, re.I)
    if not hits:
        return None
    counts = {}
    for h in hits:
        counts[h] = counts.get(h, 0) + 1
    return int(max(counts, key=counts.get))


def thin_pages(pages, threshold=THIN_PAGE_CHARS):
    """返回 [(页码, 字符数)],页码从 1 起。"""
    out = []
    for i, p in enumerate(pages):
        n = len(p.strip())
        if n < threshold:
            out.append((i + 1, n))
    return out


def fmt_ranges(nums):
    """[1,2,3,7,9,10] -> '1-3, 7, 9-10'"""
    if not nums:
        return ""
    nums = sorted(nums)
    parts, a, b = [], nums[0], nums[0]
    for n in nums[1:]:
        if n == b + 1:
            b = n
        else:
            parts.append(f"{a}-{b}" if a != b else f"{a}")
            a = b = n
    parts.append(f"{a}-{b}" if a != b else f"{a}")
    return ", ".join(parts)


def run(pdf, keywords):
    if not os.path.isfile(pdf):
        print(f"[X] 文件不存在: {pdf}")
        return 2
    try:
        info = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True, timeout=60).stdout
        txt = subprocess.run(["pdftotext", "-layout", pdf, "-"],
                             capture_output=True, text=True, timeout=300).stdout
    except FileNotFoundError as e:
        print(f"[X] 缺工具(poppler-utils): {e}")
        return 2
    except subprocess.TimeoutExpired:
        print("[X] pdftotext 超时")
        return 2

    m = re.search(r"^Pages:\s+(\d+)", info, re.M)
    real_total = int(m.group(1)) if m else 0
    pages = txt.split("\f")
    if pages and not pages[-1].strip():
        pages.pop()

    print(f"文件      : {pdf}")
    print(f"实际页数  : {real_total}  (pdfinfo)")

    problems = 0

    declared = parse_declared_total(txt)
    if declared is not None:
        if declared != real_total:
            problems += 1
            print(f"标称页数  : {declared}  (页脚 'Page N of {declared}')")
            print(f"[!] 矛盾:页脚标称 {declared} 页,实际 {real_total} 页。")
            print("    别直接假设'文档是节选'—— 先读【目录页】证伪:")
            print("    目录若完整收尾(最后一章 + 修订历史),就是模板残留数字,文档是全的。")
        else:
            print(f"标称页数  : {declared}  (与实际一致)")
    else:
        print("标称页数  : 页脚无 'Page N of M' 格式")

    thin = thin_pages(pages)
    print(f"文本层稀薄页: {len(thin)} / {len(pages)}  (正文 < {THIN_PAGE_CHARS} 字符)")
    if thin:
        problems += 1
        print(f"    页码: {fmt_ranges([p for p, _ in thin])}")
        print("    这些页多半是表格/图形/扫描件 —— 文本层不可信,必须看渲染页面。")

    for kw in keywords:
        hit = [i + 1 for i, p in enumerate(pages) if kw.lower() in p.lower()]
        if hit:
            print(f"关键词 {kw!r}: 文本层命中页 {fmt_ranges(hit)}")
        else:
            print(f"关键词 {kw!r}: 文本层 0 命中 —— **这不等于文档里没有**,"
                  f"必须在渲染页面上确认后才能下结论")
            problems += 1

    print()
    if problems:
        print("=> 结论:文本层【不可信】。用 Read 工具读 pages 看渲染页面再下结论。")
        print("   原理图这类要看走线/NC 的,用 pdf_render_page.sh 渲染放大。")
        return 1
    print("=> 结论:文本层看起来完整,仍不建议用它证明'文档里没有 X'。")
    return 0


def self_test():
    ok = True

    def eq(name, got, want):
        nonlocal ok
        if got != want:
            print(f"  FAIL {name}: got={got!r} want={want!r}")
            ok = False
        else:
            print(f"  ok   {name}")

    print("[self-test] parse_declared_total")
    eq("取多数值", parse_declared_total("Page 1 of 299\nPage 2 of 299\nPage 158 of 158"), 299)
    eq("无页脚返回 None", parse_declared_total("nothing here"), None)
    eq("大小写不敏感", parse_declared_total("page 3 OF 42"), 42)

    print("[self-test] fmt_ranges")
    eq("连续合并", fmt_ranges([1, 2, 3, 7, 9, 10]), "1-3, 7, 9-10")
    eq("空", fmt_ranges([]), "")
    eq("单个", fmt_ranges([5]), "5")
    eq("乱序", fmt_ranges([3, 1, 2]), "1-3")

    print("[self-test] thin_pages")
    eq("全稀薄", [p for p, _ in thin_pages(["", "  ", "x"])], [1, 2, 3])
    eq("厚页不报", thin_pages(["a" * 500]), [])
    eq("混合", [p for p, _ in thin_pages(["a" * 500, "", "b" * 500, "c"])], [2, 4])

    print("PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0)
    if args[0] == "--self-test":
        sys.exit(self_test())
    kws = []
    if "-k" in args:
        i = args.index("-k")
        kws = args[i + 1:]
        args = args[:i]
    sys.exit(run(args[0], kws))
