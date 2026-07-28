---
name: tech-pdf-reader
description: >
  Read technical PDFs — datasheets, schematics, hardware specs, protocol docs — where the answer
  is often inside a figure (timing diagram, pin table, waveform, block diagram) rather than in the
  text. Covers: locating the right page fast, rendering pages so diagrams are actually visible,
  extracting the text layer and embedded images, and — critically — diagnosing damaged/partial PDF
  copies so a missing section is never mistaken for a tool failure or, worse, filled in by guessing.
  Trigger on: "看下这个 datasheet", "读一下规格书", "PDF 里的时序图", "原理图 PDF", "查芯片手册",
  "这份 PDF 打不开/读不出来", "pdf 解析错误", "datasheet 上电时序", "read the datasheet",
  "extract timing diagram from PDF", or any request to confirm a hardware parameter from a vendor PDF.
  Not for converting whole documents to markdown (use doc-to-markdown) or generating PDFs (use md-to-pdf).
---

# Tech PDF Reader

技术 PDF(datasheet / 原理图 / 协议文档)的阅读方法。核心差别在于:
**答案常常在图里,不在文字里** —— 时序图、引脚表、波形、框图。
纯文本提取会漏掉它们,而"提取不到"又极容易被误判成工具不行。

---

## 0. 铁律

| 规则 | 为什么 |
|---|---|
| **图能看见才算读到** | 时序图的先后关系、波形的沿、框图的连线,文字层里全没有 |
| **区分「工具不行」和「文件坏了」** | 二者现象相同(都是空白),处理方式完全相反 —— 必须做对照实验 |
| **读不到就说读不到** | 技术参数错一位就是硬件问题。**绝不允许**因为"应该是这样"而补全 |
| **引用必须带页码 + 图号** | `p86 Figure 73` 这种,便于对方复核 |

---

## 1. 首选路径:直接用 Read 工具读页

**Read 工具原生支持 PDF**,`pages` 参数指定页码,会把整页**渲染出来**,
图、表、公式、水印全部可见。这是读技术 PDF 的**默认方式**。

```
Read(file_path="/path/to/datasheet.pdf", pages="86")
Read(file_path="/path/to/datasheet.pdf", pages="85-88")     # 连续页,单次最多 20 页
```

> ⚠ **反面教材(2026-07-28 真实踩坑)**:助手一上来直接上 `pdftotext`,
> 折腾了修复、重渲染、抽图一大圈,最后才想起 Read 工具本来就能读。
> **先试 Read,不行再往下走。**

超过 10 页的 PDF,`pages` 是必填的 —— 所以要先定位页码,见下一节。

---

## 2. 先定位页码,再渲染

大 datasheet 动辄几百页,不能靠翻。用文字层搜索定位:

```bash
python3 <skill-dir>/scripts/pdf_probe.py <file.pdf> --find "Power On/Off Sequence" "Sleep Enter"
```

或者直接看目录页(通常在前 5 页),用 Read 渲染出来读章节页码。

**注意页码偏移**:目录里写的页码是**文档页码**(页脚 `Page 86 of 299`),
不一定等于 **PDF 页序**。定位后用 `pdf_probe.py --footer <n>` 核对页脚,确认对齐。

---

## 3. ★ 诊断:文件是不是坏的

这是本 skill 最重要的部分。**在断言"这份文档没有某内容"之前必须做完。**

```bash
python3 <skill-dir>/scripts/pdf_probe.py <file.pdf>
```

输出会告诉你每页三件事:**有无文字层 · 内嵌图片数 · 有无 `/Contents`**。

### 三种情况分别怎么处理

| 现象 | 含义 | 处理 |
|---|---|---|
| 有文字层 | 正常矢量 PDF | 直接 Read 渲染 / 文字提取 |
| **无文字层,但有 `/Contents` 和图片** | 扫描件 | Read 渲染仍可读(是图);需要文字则 OCR |
| **无文字层 且 无 `/Contents`** | **页内容流丢失 = 文件损坏** | 见下 |

### 页对象没有 `/Contents` 时

先尝试修复,再下结论:

```bash
# ① qpdf 结构重建(xref 损坏时有效)
python3 -c "
import pikepdf,warnings; warnings.filterwarnings('ignore')
pdf=pikepdf.open('bad.pdf'); pdf.save('fixed.pdf')"

# ② 扫孤儿内容流(内容流还在、只是引用断了的情况)
python3 <skill-dir>/scripts/pdf_probe.py bad.pdf --orphans
```

- 找到孤儿流 → 可以重挂回页面
- **孤儿流为 0** → 内容真的不在文件里,**修不了**,只能换一份

### ★ 对照实验(必做)

**永远不要只测坏页就下结论。** 同时渲染一个**已知完好**的页:

```
Read(pdf, pages="<坏页>")     → 空白
Read(pdf, pages="<好页>")     → 正常显示
```

两个一起给出,才能证明"是文件坏了,不是工具不行"。
只测坏页会被误判成工具能力问题,浪费大量时间在换工具上。

### 还要查文档是否被截断

页脚 `Page N of M`:如果 PDF 实际页数 < M,**这份是截断副本**。

```bash
python3 <skill-dir>/scripts/pdf_probe.py <file.pdf> --footer 1 --footer -1
```

---

## 4. 提取内嵌图片(渲染失败时的兜底)

页面渲染不出来但 `/Resources` 里有 XObject 时,可以直接抠图:

```bash
python3 <skill-dir>/scripts/pdf_probe.py <file.pdf> --extract-images 85-92 --out ./imgs
```

抠出来的图用 Read 逐张看。注意会混进 logo / 水印这类装饰图,按尺寸筛。

---

## 5. 工具依赖

| 工具 | 用途 | 装法 |
|---|---|---|
| **Read 工具** | 渲染页面(首选) | 内置 |
| `pymupdf` (fitz) | 文字层 / 图片 / 页对象诊断 | `pip3 install --user pymupdf` |
| `pikepdf` | qpdf 结构修复、孤儿流扫描 | `pip3 install --user pikepdf` |
| `pdftotext` / `pdftoppm` | poppler 备选 | 系统包 |

`pdf_probe.py` 只依赖 pymupdf,`--orphans` 额外需要 pikepdf。

**MuPDF 报错噪音**很大且不影响结果,脚本已 `mupdf_display_errors(False)` 静音;
手写脚本时记得加,否则错误刷屏会淹没真正的输出。

---

## 6. 写结论时

- **带出处**:`ST7123PI_Datasheet_V0.1.pdf p86 Figure 73`
- **区分文件版本**:同名不同份要点明用的哪一份(残缺副本 vs 完整版)
- **图里读出的约束原样抄**:`>=0ms` 就写 `>=0ms`,不要改写成"约 0ms"或"几乎同时"
- **读不到的部分单列**,写清楚缺哪几页、已尝试过什么修复手段

---

## 关联

- 整篇文档转 markdown → `doc-to-markdown`
- markdown 出 PDF → `md-to-pdf`
- 把读到的时序画成图 → `anthropic-design`(`references/diagram-craft.md` 有波形图工艺)
