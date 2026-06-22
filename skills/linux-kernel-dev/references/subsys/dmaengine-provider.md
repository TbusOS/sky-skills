# DMA engine provider — 写 DMA 控制器驱动

> 权威源：`Documentation/driver-api/dmaengine/provider.rst`、`include/linux/dmaengine.h`、
> `include/linux/dma/virt-dma.h`(vchan)。API 以目标树为准。
> 消费侧(dma_request_chan/submit)见 `dmaengine.md`;本模块是 **provider 侧**。

何时加载本模块：写 SoC 的 DMA 控制器驱动——实现 dma_device、备描述符、上报完成。

## dma_device:设能力 + 实现 ops + 注册

```c
dma_cap_set(DMA_SLAVE, dma->cap_mask);          /* 声明能力,必做 */
dma_cap_set(DMA_CYCLIC, dma->cap_mask);
dma->device_prep_slave_sg   = my_prep_sg;       /* 备描述符 */
dma->device_issue_pending   = my_issue_pending; /* 真启动队列里的传输 */
dma->device_tx_status       = my_tx_status;
dma->device_config          = my_config;
dma->device_terminate_all   = my_terminate;
dma->dev = dev;
dma_async_device_register(dma);                 /* devm 版 dmaenginem_async_device_register */
```

## 用 virt-dma(vchan)管 cookie/队列 + 完成时回调（核心）

虚拟通道层(`vchan_*`)帮你管 cookie、pending/已提交链表。完成一个描述符时:分配/完成 cookie、把它移出在途链表、**调用 client 注册的完成回调**。

```c
vchan_init(&c->vc, dma);
/* prep 里: */ return vchan_tx_prep(&c->vc, &desc->vd, flags);
/* 完成中断里: */ vchan_cookie_complete(&desc->vd);   /* 完成 cookie + 触发 client 回调 */
```

漏了完成上报(cookie 不 complete、client 回调不触发),消费者的 `dma_async_issue_pending` 之后永远等不到完成。详见 `known-bugs.md` KB-DMAP-001。`CONFIG_DMA_ENGINE` 是框架开关。

## 常见坑

- 没 `dma_cap_set` 声明能力 → 消费者按能力找通道找不到。
- 完成时不 complete cookie / 不触发 client 回调 → 传输"发了但永不完成"(KB-DMAP-001)。
- 自己手撸 cookie/链表管理,而 virt-dma(vchan)层就是干这个的(易错)。
