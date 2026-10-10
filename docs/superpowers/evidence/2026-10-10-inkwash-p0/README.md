# inkwash-design P0 证据截图

P0 三个小样和字体查证的截图。结论写在 [设计书 §16](../../specs/2026-10-10-inkwash-design-design.md#16-p0-结论2026-10-11);
产生这些图的**最终代码**在本目录的 [`code/`](code/):计划里嵌的是第一版,执行中改过的(毛笔 v3、抠层软过渡、边缘检查放大方式、录屏数帧)以这里为准。`code/layer-far.jpg`、`code/layer-near.jpg` 是出图模型的两张原图(1672×941,JPEG 质量 2),用来重跑小样 2。截图由 ffmpeg 从 PNG 转成 JPEG(质量 4)。

| 文件 | 哪个小样 | 证明了什么 |
|---|---|---|
| `fonts-sample.jpg` | 字体(Task 4) | 四个 OFL 毛笔字体写同一句话:马善政楷书、龙藏体好认;志莽行书个别字难认;刘建毛草基本认不出 |
| `spike1-compare.jpg` | 小样 1 毛笔(Task 5) | 上:黄庭坚草书(The Met DP153788,CC0,[Commons 文件页](https://commons.wikimedia.org/wiki/File:%E5%8C%97%E5%AE%8B_%E9%BB%83%E5%BA%AD%E5%A0%85_%E8%8D%89%E6%9B%B8%E5%BB%89%E9%A0%97%E8%97%BA%E7%9B%B8%E5%A6%82%E5%82%B3_%E5%8D%B7-Biographies_of_Lian_Po_and_Lin_Xiangru_MET_DP153788.jpg))、米芾《蜀素帖》(公有领域,[Commons 文件页](https://commons.wikimedia.org/wiki/File:Mi_Fu_Shu_Su_Tie.jpg))真迹裁片;中:第一版原型;下:改后。起笔、出锋、飞白、远山、印章的差别 |
| `spike1-t1.65.jpg` | 小样 1 | 画到 1.65 秒:先画远山(场景),横正在沿笔路显出,前端是圆的笔尖 |
| `spike1-t6.jpg` | 小样 1 | 画完的样子(改后版本) |
| `spike2-astra-layer-far.jpg` | 小样 2 位图(Task 6) | 出图模型(gpt-6-astra)出的远景层原图,缩到 1280 宽 |
| `spike2-astra-layer-near.jpg` | 小样 2 | 出图模型出的近景层原图(附远景当参考),缩到 1280 宽 |
| `spike2-shotsRA-t6.jpg` | 小样 2 | 两层抠成透明层后视差合成,第 6 秒 |
| `spike2-shotsRB-t6.jpg` | 小样 2 | 同两层不抠、正片叠底合成,第 6 秒;浅色纸上和上一张几乎一样 |
| `spike2-edge-check.jpg` | 小样 2 | 远景层放大 3 倍,左白底、右磁青底:雾平滑淡出(改成软过渡之后) |
| `spike2-edge-check-near.jpg` | 小样 2 | 近景层放大 3 倍:船和人物边缘没有白边,纸的位置没有灰点 |
| `spike3-v3-nofilter.jpg` | 小样 3 性能(Task 7) | 去掉整组打毛滤镜后的样子:边缘像矢量图、飞白成了生硬短条 —— 所以虽然快一倍也不采用 |

真迹裁片的许可:黄庭坚卷由大都会博物馆按 CC0 公开;米芾《蜀素帖》作者卒于 1107 年,原作属公有领域。两张都只截了几个字,用来对照笔触,出处链接在上表。
