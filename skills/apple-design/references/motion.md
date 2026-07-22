# Apple Motion — 页面动效 + 交互手感

> 两层体系,边界是铁律:
>
> - **第一层 · 页面动效**(入场 / 滚动浮现 / hover / tab 切换)—— 缓动曲线 + 固定时长,**禁弹簧禁过冲**。
> - **第二层 · 手势组件**(可拖拽轮播 / 对比滑块 / configurator / 可拖 sheet)—— spring,默认临界阻尼。
>
> 页面没有手势组件时,第二层一个字都用不上。别为了用而用——apple 一页通常只有 2-3 个动画节点。

## 第一层 · 页面动效(所有页面)

### 缓动

- 默认:`--ease-apple-out` (`cubic-bezier(0.25, 1, 0.5, 1)`) —— 用于入场、hover。
- 平滑:`--ease-apple` (`cubic-bezier(0.42, 0, 0.58, 1)`) —— 用于持续中性过渡。

### 时长

- `--duration-sm` 240ms:hover、按钮态、tab 切换
- `--duration-md` 400ms:卡片入场
- `--duration-lg` 700ms:视频 fade-in、大块页面过渡

### 入场模式(IntersectionObserver)

```javascript
const io = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      e.target.style.opacity = 1;
      e.target.style.transform = 'translateY(0)';
      e.target.style.transition = `opacity 700ms cubic-bezier(0.25,1,0.5,1) ${i * 80}ms,
        transform 700ms cubic-bezier(0.25,1,0.5,1) ${i * 80}ms`;
    }
  });
});
document.querySelectorAll('.apple-reveal').forEach(el => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(24px)';
  io.observe(el);
});
```

### 按压反馈 — 反馈在按下,不在松开

延迟一出现,"直接操纵"的感觉立刻消失。按钮必须在 pointer-down 的瞬间给反馈,
等 `click`(touch-up)才反馈 = 手感死。

`apple.css` 已内置:

```css
.apple-button:active {
  transform: scale(0.97);   /* 按下瞬间缩一点,松开回弹 */
}
```

页面里自定义的可点元素照此办理。反馈要**贯穿交互全程**——滑块 / 抽屉拖动时
UI 必须 1:1 跟着指针走,不许等手势结束才动。

### 空间一致性 — 同路径进出

- **从哪来,回哪去。** 从右滑入的面板必须向右退出;从右进、向下出,读者会立刻迷失。
- **菜单 / popover 从触发元素长出来。** `transform-origin` 锚定到触发按钮的位置,
  不要从自身中心缩放——按钮和内容的空间关系要一眼看懂。
- **可逆过渡镜像缓动。** 出场缓动用入场的反向 cubic-bézier,来回路径才对称。

### 材质

- nav 毛玻璃(`backdrop-filter: blur(20px)`)apple.css 已内置。
- 真材质感 = **blur 和 scale 一起动**:玻璃面板入场时同时动模糊半径和缩放,
  读起来像一块材质到场,而不是一张图淡入。
- 浅色毛玻璃**不许叠**浅色毛玻璃——可读性直接塌。
- sticky header 下不用 1px 硬分割线,用一小段渐隐 blur / gradient mask,
  且只在浮动 UI 真的压住内容时出现。

## 第二层 · 手势组件(仅当页面确实有)

适用:可拖拽轮播、before/after 对比滑块、configurator、可拖 sheet、图片浏览器。
不适用:入场、滚动浮现、hover、tab 切换——那些归第一层,别拿弹簧碰。

### spring 两参数(Apple 的思考单位)

- **damping**(阻尼比)—— 管过冲。`1.0` = 临界阻尼,不弹,平滑落定;`< 1.0` 会过冲回摆,越小越弹。
- **response**(响应)—— 到达目标的快慢,单位秒,越小越跟手。**这不是"时长"**——
  spring 没有固定时长,落定时间由参数自然涌现。

**默认 damping `1.0`(不弹)。** 只有手势本身带动量(甩、扔、拖拽松手)才许 `~0.8`:
刚淡入的菜单弹跳很怪,被甩出去的卡片弹一下才对。

Apple 实际出货值:

| 交互 | damping | response |
| --- | --- | --- |
| 移动 / 归位(如 PiP) | `1.0` | `0.4` |
| 旋转 | `0.8` | `0.4` |
| 抽屉 / sheet | `0.8` | `0.3` |

### 五条手感规则

1. **1:1 跟手。** `setPointerCapture` 保证指针出界也继续跟踪;记住**抓取点偏移**
   (抓边缘就得跟着边缘,吸到中心 = 立刻穿帮)。顺手记录最近几个
   `pointermove` 的位置 + 时间戳,松手时要算速度。
2. **可中断。** 动画途中必须能被抓住、反转。不锁输入;新动画**从当前呈现值起步**
   (读元素实时 transform),从逻辑目标值起步会跳一下。CSS transition / `@keyframes`
   做不到中途接管,手势驱动的动画一律走 spring。
3. **速度交接。** 松手瞬间把手指速度传给 spring 作初速度,拖拽和动画之间就没有接缝。
   这是"流畅"和"还行"的分界线。
4. **动量投射。** 别从松手位置吸附最近点——用速度**投射出滑行落点**,再吸附离落点最近的目标。
   这才是"甩"的感觉(scroll 减速同款)。
5. **橡皮筋边界。** 到边界不硬停,越拖越拖不动。硬停读作"卡死",渐进阻力读作"到头了"。

### 零依赖实现(页面是单文件 HTML,不引库)

```javascript
// spring:damping/response 直接对应 Apple 参数。返回句柄可中途 retarget(可中断)。
function spring(from, target, v0, onUpdate, { damping = 1, response = 0.4 } = {}) {
  const w0 = (2 * Math.PI) / response;
  let x = from, v = v0, t = target, raf, last = performance.now();
  function tick(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
    v += (-w0 * w0 * (x - t) - 2 * damping * w0 * v) * dt;
    x += v * dt;
    if (Math.abs(v) < 0.05 && Math.abs(x - t) < 0.05) { onUpdate(t); return; }
    onUpdate(x);
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  return {
    retarget(nt) { t = nt; },              // 中断 = 改目标,速度自然延续,无"撞墙"
    stop() { cancelAnimationFrame(raf); },
    get value() { return x; }, get velocity() { return v; },
  };
}

// 动量投射(Apple 官方样例的指数衰减式,不是教科书 v²/2a)
function project(velocityPxPerSec, decelerationRate = 0.998) {
  return (velocityPxPerSec / 1000) * decelerationRate / (1 - decelerationRate);
}
// 用法:const landing = current + project(releaseVelocity);
//       const target = nearestSnapPoint(landing);   // 用落点选目标
//       spring(current, target, releaseVelocity, apply);  // 再交接速度

// 橡皮筋:越过边界越拖不动
function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
```

松手判定用**速度方向**,不用位置:sheet 拖过一半但手指正往回甩,应该收回去。

### 手势消歧(仅当同一表面有竞争手势)

- **水平拖拽组件(轮播 / 滑块)和页面垂直滚动竞争**:CSS `touch-action: pan-y`
  把垂直滚动留给浏览器,JS 只接管水平;前 ~10px 做方向判定(斜着动看主轴),
  定向后才开始 1:1 跟手,判定期间不要让元素跟着抖。
- **双击语义(图片查看器双击放大)才为它付出单击延迟**;表面上没有双击,单击就立即响应。

只动 `transform` 和 `opacity`(合成器友好);2D 拖拽拆成 X / Y 两条独立 spring,
一条 spring 管 2D 距离会在两轴速度不同时脱节。

## reduced-motion(MUST)

`apple.css` 的全局兜底只管 CSS:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

**JS 动画(rAF / spring)不受这条管**——写第二层组件时必须自查:

```javascript
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// reduce 时:拖拽照常 1:1 跟手(那是直接操纵不是动画),
// 但松手后的 spring / 投射滑行换成直接跳到目标或 200ms cross-fade。
```

透明度偏好 apple.css 也已兜底(`prefers-reduced-transparency` 时 nav / 搜索层转不透明、去 blur)。

## 禁止

❌ 入场 / 滚动浮现 / hover 用弹簧、过冲、rotate —— 弹跳只属于带动量的手势(第二层)
❌ 大幅缩放(> 1.2)
❌ 每个元素都动 —— Apple 一页通常只有 2-3 个动画节点
❌ 使用 `transition: all`(用显式属性列表代替)
❌ 手势动画锁输入、不可中断,或从逻辑目标值(而非当前呈现值)起步
❌ JS 驱动的动画不查 `prefers-reduced-motion`
❌ 面板进出路径不对称(右进下出)、popover 从自身中心缩放

---

来源:Apple WWDC *Designing Fluid Interfaces* (2018)、*Details of UI Typography* (2020)
的 web 化提炼,改编自 [emilkowalski/skills](https://github.com/emilkowalski/skills)(MIT)。
