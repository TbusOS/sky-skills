#!/usr/bin/env python3
"""binary_diff_classify.py — 两个二进制差在哪:是真改了代码,还是只是地址整体平移?

用在哪
    改了一处"应该不影响功能"的东西(注释、日志文本、版本串、对齐 padding),重编后
    产物却不是逐字节相同。这时要回答的是:**差异是真实的代码变化,还是链接期地址
    被整体推移导致的常量重填?**

    典型场景(本脚本就是从这个场景长出来的):
      · 只改了注释,zImage 却大了 336 字节
      · 压缩载荷长度变了 N 字节 → 其后所有符号地址 +N → 引用这些符号的立即数全变
      → 看着"到处都是差异",实际一条指令都没变。

判据
    把差异按 4 字节对齐聚合、解码成 32 位小端整数,统计 (新值 - 旧值) 的分布:
      · 差值集中在极少数几个 delta 上,且 delta 与已知的长度变化吻合 → **地址平移**
      · 差值杂乱无章 / 出现大段连续差异 → **真实内容变化**

    ⚠ 这是"提示"不是"证明"。判定为地址平移后,仍应确认:
      ① 平移量能被独立解释(如 zImage 总大小的增量、piggy 长度差)
      ② 关键结构量未变(段大小、符号表、镜像大小)
      ③ 有条件的话拿运行时打印印证(如板上打印的落点地址偏移与静态解码一致)

用法
    binary_diff_classify.py <A> <B> [--limit N] [--offset N] [--top K] [--json]
      --limit N    只比较前 N 字节(十进制或 0x 十六进制)。比 zImage 时用它把
                   比较范围限制在**未压缩的解压器代码区**(上界取 input_data 符号),
                   否则压缩载荷区的雪崩差异会淹没一切。
      --offset N   从该偏移开始比较
      --top K      最多列出 K 个 delta(默认 8)
      --json       只输出 JSON,便于上层脚本消费
      --self-test  跑内置回归(不需要外部文件)

退出码
    0 = 判定为「地址平移」或「完全相同」
    1 = 判定为「真实内容变化」(或混合,需人工看)
    3 = 检查没跑成(文件读不了 / 参数不对),不代表结论
"""
import sys, json, struct
from collections import Counter

ALIGN = 4


def parse_num(s):
    return int(s, 16) if str(s).lower().startswith("0x") else int(s)


def classify(a: bytes, b: bytes, top=8):
    """返回 (verdict, detail)。verdict ∈ {'identical','shift','content','mixed'}"""
    n = min(len(a), len(b))
    diff_idx = [i for i in range(n) if a[i] != b[i]]
    d = {
        "len_a": len(a), "len_b": len(b), "compared": n,
        "diff_bytes": len(diff_idx),
        "size_delta": len(b) - len(a),
    }
    if not diff_idx and len(a) == len(b):
        return "identical", d

    # 连续差异段(相邻 <= 8 字节归一段)——大段连续差异是"真实内容变化"的强信号
    runs = []
    if diff_idx:
        s = p = diff_idx[0]
        for i in diff_idx[1:]:
            if i <= p + 8:
                p = i
            else:
                runs.append((s, p)); s = p = i
        runs.append((s, p))
    d["runs"] = len(runs)
    d["longest_run"] = max((e - s + 1) for s, e in runs) if runs else 0

    # 按 4 字节字解码,统计 delta
    words = sorted({i // ALIGN * ALIGN for i in diff_idx})
    deltas = Counter()
    samples = {}
    undecodable = 0
    for w in words:
        if w + ALIGN > n:
            undecodable += 1
            continue
        va = struct.unpack("<I", a[w:w + ALIGN])[0]
        vb = struct.unpack("<I", b[w:w + ALIGN])[0]
        dl = vb - va
        deltas[dl] += 1
        samples.setdefault(dl, (w, va, vb))
    d["diff_words"] = len(words)
    d["distinct_deltas"] = len(deltas)
    d["deltas"] = [
        {"delta": dl, "count": c, "sample_off": samples[dl][0],
         "old": samples[dl][1], "new": samples[dl][2]}
        for dl, c in deltas.most_common(top)
    ]

    if not deltas:
        return "content", d

    # 地址平移的特征:**一两个 delta 就吃掉绝大多数差异字**。
    #   允许两个而不是一个,是因为跨字边界的立即数会让平移量差 1
    #   (实测:Δ+336 ×15 同时出现 Δ+337 ×2;Δ+568 ×11 同时出现 Δ+567 ×2)。
    #
    #   ⚠ 判据别用 top4:如果恰好只有 4 种 delta,top4 必然 100% 覆盖,
    #     "平移 + 三处杂项"会被误判成纯平移。(self-test 案例 ④ 就是抓这个的)
    #
    #   再加一条:没有长连续差异段 —— 长段说明是数据/代码块被换掉,不是几个立即数。
    top2 = sum(c for _, c in deltas.most_common(2))
    ratio = top2 / len(words)
    d["top2_coverage"] = round(ratio, 4)
    d["top2_deltas"] = [dl for dl, _ in deltas.most_common(2)]
    short_runs = d["longest_run"] <= 64
    if ratio >= 0.90 and short_runs:
        return "shift", d
    if ratio >= 0.60 and short_runs:
        return "mixed", d
    return "content", d


VERDICT_CN = {
    "identical": ("✅", "完全相同"),
    "shift": ("✅", "地址平移 —— 差异全是少数几个 delta 的常量重填,无指令码变化迹象"),
    "mixed": ("⚠", "以平移为主但有杂项 —— 需人工看剩下那部分"),
    "content": ("⛔", "真实内容变化 —— 差异杂乱或存在长连续差异段"),
}


def report(verdict, d, top=8):
    mark, text = VERDICT_CN[verdict]
    out = []
    out.append(f"  A 长度 {d['len_a']:,} B · B 长度 {d['len_b']:,} B · 比较范围 {d['compared']:,} B")
    if d["size_delta"]:
        out.append(f"  长度变化 {d['size_delta']:+,} B")
    out.append(f"  差异字节 {d['diff_bytes']:,} · 差异段 {d.get('runs',0)} 段 · 最长一段 {d.get('longest_run',0)} B")
    if d.get("diff_words"):
        out.append(f"  按 32 位字解码:{d['diff_words']} 个字,{d['distinct_deltas']} 种 delta"
                   + (f",前 2 种覆盖 {d['top2_coverage']*100:.1f}%" if 'top2_coverage' in d else ""))
        for e in d["deltas"][:top]:
            out.append(f"     Δ = {e['delta']:+d} (0x{e['delta'] & 0xffffffff:X})  ×{e['count']}  "
                       f"例 @0x{e['sample_off']:X}: 0x{e['old']:08X} → 0x{e['new']:08X}")
    out.append("")
    out.append(f"  {mark} 判定:{text}")
    if verdict == "shift":
        out.append("     ⚠ 这是提示不是证明。还要确认:平移量能被独立解释(长度差 / 载荷大小差)、")
        out.append("       关键结构量未变(段大小、镜像大小)、有条件时用运行时打印印证。")
    return "\n".join(out)


def self_test():
    """内置回归:合成数据,不依赖外部文件"""
    cases = []

    # ① 完全相同
    base = bytes(range(256)) * 8      # 2048 B,够放下 self-test 用到的所有偏移
    cases.append(("完全相同", base, base, "identical"))

    # ② 纯地址平移:若干处 32 位常量整体 +0x100
    a = bytearray(base)
    b = bytearray(base)
    for off in (0x10, 0x40, 0x80, 0x120, 0x200, 0x300):
        struct.pack_into("<I", a, off, 0x40001000 + off)
        struct.pack_into("<I", b, off, 0x40001000 + off + 0x100)
    cases.append(("纯地址平移 Δ+256", bytes(a), bytes(b), "shift"))

    # ③ 真实内容变化:一大段被换掉
    a2 = bytearray(base); b2 = bytearray(base)
    for i in range(0x100, 0x300):
        b2[i] = (b2[i] + 0x5A) & 0xFF
    cases.append(("大段内容被换", bytes(a2), bytes(b2), "content"))

    # ④ 平移 + 少量杂项(混合)
    a3 = bytearray(base); b3 = bytearray(base)
    for off in (0x10, 0x40, 0x80, 0x120, 0x200, 0x300, 0x340, 0x380):
        struct.pack_into("<I", a3, off, 0x40001000 + off)
        struct.pack_into("<I", b3, off, 0x40001000 + off + 0x100)
    for off in (0x500, 0x540, 0x580):          # 三个互不相同的 delta
        struct.pack_into("<I", a3, off, 0x11110000)
        struct.pack_into("<I", b3, off, 0x22220000 + off)
    cases.append(("平移+杂项", bytes(a3), bytes(b3), "mixed"))

    # ⑤ 长度不同但仍是平移(尾部截断)
    cases.append(("长度不同的平移", bytes(a), bytes(b) + b"\x00" * 16, "shift"))

    ok = fail = 0
    print("== binary_diff_classify self-test ==")
    for name, x, y, exp in cases:
        got, d = classify(x, y)
        if got == exp:
            ok += 1; print(f"  ✅ {name:<20} → {got}")
        else:
            fail += 1; print(f"  ⛔ {name:<20} → {got}(期望 {exp})")
    print(f"  ─────────────\n  通过 {ok} · 失败 {fail}")
    return 0 if fail == 0 else 1


def main(argv):
    if "--self-test" in argv:
        return self_test()
    args = [x for x in argv if not x.startswith("--")]
    if len(args) < 2:
        print(__doc__); return 3
    limit = offset = None; top = 8; as_json = "--json" in argv
    for i, x in enumerate(argv):
        if x == "--limit" and i + 1 < len(argv): limit = parse_num(argv[i + 1])
        if x == "--offset" and i + 1 < len(argv): offset = parse_num(argv[i + 1])
        if x == "--top" and i + 1 < len(argv): top = int(argv[i + 1])
    try:
        a = open(args[0], "rb").read()
        b = open(args[1], "rb").read()
    except OSError as e:
        print(f"⛔ 读文件失败: {e}", file=sys.stderr); return 3
    if offset:
        a, b = a[offset:], b[offset:]
    if limit:
        a, b = a[:limit], b[:limit]
    verdict, d = classify(a, b, top)
    if as_json:
        print(json.dumps({"verdict": verdict, **d}, ensure_ascii=False, indent=2))
    else:
        print("==================================================================")
        print(" 二进制差异分类")
        print("==================================================================")
        print(f"  A: {args[0]}")
        print(f"  B: {args[1]}")
        if offset or limit:
            print(f"  范围: offset={offset or 0} limit={limit or '全部'}")
        print()
        print(report(verdict, d, top))
    return 0 if verdict in ("identical", "shift") else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
