# DMA engine — slave/外设 DMA 消费

> 权威源：`Documentation/driver-api/dmaengine/`、`include/linux/dmaengine.h`。
> API 以目标树为准。DMA buffer 必须 dma-map 过(见 `memory.md` 的 dma_map_*)。

何时加载本模块：驱动要用 DMA 控制器搬外设数据(slave/外设 DMA)——拿通道、配参数、提交传输。

## 五步：拿通道 → 配置 → prep → submit → issue_pending

```c
chan = dma_request_chan(dev, "tx");          /* DT dmas/dma-names */
if (IS_ERR(chan))
    return PTR_ERR(chan);

struct dma_slave_config cfg = { .direction = DMA_MEM_TO_DEV, .dst_addr = fifo_phys, ... };
dmaengine_slave_config(chan, &cfg);

desc = dmaengine_prep_slave_single(chan, dma_buf, len, DMA_MEM_TO_DEV, DMA_PREP_INTERRUPT);
desc->callback = my_done;
cookie = dmaengine_submit(desc);             /* 只是排队,返回 cookie */
dma_async_issue_pending(chan);               /* 必须:这一步才真把传输推给硬件 */
```

`dmaengine_submit` 只把描述符排进队列，**`dma_async_issue_pending` 才真启动**。漏了它 DMA 不动。详见 `known-bugs.md` KB-DMA-001。

- 多段：`dmaengine_prep_slave_sg`;循环(音频)：`dmaengine_prep_dma_cyclic`。
- 停止：`dmaengine_terminate_sync`(同步)/ `dmaengine_terminate_async`;查状态 `dmaengine_tx_status`。
- 用完 `dma_release_channel`(非 devm)。`CONFIG_DMA_ENGINE` 是框架开关。

## 版本敏感

- 拿通道接口：旧 `dma_request_slave_channel` → 新 **`dma_request_chan`**(可返 -EPROBE_DEFER,要传播)。按目标树确认。

## 常见坑

- `dmaengine_submit` 后漏 `dma_async_issue_pending` → DMA 永远不启动(KB-DMA-001)。
- DMA buffer 用栈上数组(不可 DMA)→ 应 dma_map_single 过的内核缓冲(见 `memory.md`)。
- 拿通道返 -EPROBE_DEFER 当错误处理掉，而不是传播给 probe 重试。
