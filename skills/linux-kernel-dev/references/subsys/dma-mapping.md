# DMA Mapping — DMA API（缓冲分配 + 映射）

> 权威源：`Documentation/core-api/dma-api.rst`、`Documentation/core-api/dma-api-howto.rst`、
> `include/linux/dma-mapping.h`。API 以目标树为准。（注意：这是给设备做 DMA 的内存
> 映射 API，跟做内存搬运的 dmaengine 子系统是两回事。）

何时加载本模块：给外设 DMA 准备内存——选 coherent 还是 streaming、设 DMA mask、映射后查错、按需做缓存同步。

## coherent vs streaming

```c
/* 先声明设备能寻址的位宽，否则映射会走 bounce buffer 或失败 */
dma_set_mask_and_coherent(dev, DMA_BIT_MASK(40));

/* coherent：长期共享(环形描述符等)，CPU 和设备都随时看一致，无需手动同步 */
void *cpu = dma_alloc_coherent(dev, size, &dma_handle, GFP_KERNEL);
/* ...用 cpu / 把 dma_handle 给设备... */
dma_free_coherent(dev, size, cpu, dma_handle);

/* streaming：一次性映射一段已有缓冲给设备，所有权在 CPU↔设备间转移 */
dma_addr_t da = dma_map_single(dev, buf, len, DMA_TO_DEVICE);
if (dma_mapping_error(dev, da))            /* 必查！映射会失败 */
    return -ENOMEM;
/* ...设备用 da 搬数据... */
dma_unmap_single(dev, da, len, DMA_TO_DEVICE);
```

开关/调试：`CONFIG_DMA_API_DEBUG`(查漏 unmap/双重映射)、`CONFIG_SWIOTLB`(无 IOMMU 时的 bounce buffer)。`dmam_alloc_coherent` 是 devm 版自动释放。

## 映射后必查 dma_mapping_error（核心，最常漏）

`dma_map_single` / `dma_map_page` **可能失败**(地址超出设备 mask、SWIOTLB 满等)，返回一个无效 `dma_addr_t`。不能拿返回值跟 0 比——必须用 `dma_mapping_error(dev, addr)` 判断。漏判直接把无效地址给设备 → DMA 到错误物理内存，数据损坏。streaming 缓冲映射后归设备所有，CPU 要回读需先 `dma_sync_single_for_cpu`，再交回设备前 `dma_sync_single_for_device`(非一致性架构上不同步就读到陈旧数据)。详见 `known-bugs.md` KB-DMAMAP-001。

## 常见坑

- `dma_map_single` 后不调 `dma_mapping_error` 查错，直接把地址给设备(KB-DMAMAP-001)。
- 没设 DMA mask(`dma_set_mask_and_coherent`)就映射 → 高地址被拒/走 bounce。
- streaming 缓冲映射期间 CPU 直接读写不做 `dma_sync_single_for_cpu/_for_device` → 缓存不一致。
- 拿 coherent API 当 streaming 用(或反之)；映射方向 `DMA_TO_DEVICE`/`FROM_DEVICE` 填反。
