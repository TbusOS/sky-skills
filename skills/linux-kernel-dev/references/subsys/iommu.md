# IOMMU — 写 IOMMU 驱动

> 权威源：`Documentation/driver-api/iommu`、`include/linux/iommu.h`。API 以目标树为准
> (iommu 接口版本churn 较多:`.map`→`.map_pages`,IOTLB gather 等,按目标树核)。

何时加载本模块：写 SoC IOMMU/SMMU 驱动——实现 iommu_ops、管地址转换域。

## iommu_ops + 注册

```c
static const struct iommu_ops my_iommu_ops = {
    .domain_alloc = my_domain_alloc,
    .probe_device = my_probe_device,
    .device_group = generic_device_group,
    .default_domain_ops = &(const struct iommu_domain_ops){
        .attach_dev   = my_attach_dev,
        .map_pages    = my_map_pages,      /* 现代:批量页(旧 .map 单页已改) */
        .unmap_pages  = my_unmap_pages,
        .iotlb_sync   = my_iotlb_sync,     /* 真正刷 IOTLB */
        .iova_to_phys = my_iova_to_phys,
    },
};

iommu_device_sysfs_add(&my->iommu, dev, NULL, "my-iommu");
iommu_device_register(&my->iommu, &my_iommu_ops, dev);
```

域类型:`IOMMU_DOMAIN_DMA`(给 DMA 子系统)/ `UNMANAGED`(VFIO 等自管)/ `IDENTITY`(直通)。`CONFIG_IOMMU_API` / `CONFIG_IOMMU_SUPPORT` 是开关。

## unmap 后必须刷 IOTLB（核心,安全相关）

IOMMU 内部缓存地址转换(IOTLB)。`unmap_pages` 只是改页表,**必须刷 IOTLB** 让缓存失效,之后物理页才能被复用。框架用 `struct iommu_iotlb_gather` 收集待刷范围,在合适时机调驱动的 `.iotlb_sync`(或 `.iotlb_flush_all`)真正刷;gather 的 freelist 里的页要等 sync 后才释放。不刷 → 设备拿旧转换 DMA 到已释放/错误内存(安全漏洞 + 数据损坏)。详见 `known-bugs.md` KB-IOMMU-001。

## 常见坑

- `unmap_pages` 改了页表但没经 IOTLB gather/`.iotlb_sync` 刷缓存 → 设备用旧转换踩内存(KB-IOMMU-001)。
- 还用旧的单页 `.map`/`.unmap` 而非现代 `.map_pages`/`.unmap_pages`(按目标树核)。
- `domain_alloc` 不按请求的域类型(DMA/UNMANAGED/IDENTITY)正确建域。
