# MMC/SD host — 主机控制器驱动

> 权威源：`Documentation/mmc/`、`include/linux/mmc/host.h`、`include/linux/mmc/core.h`。
> API 以目标树为准。多数平台 SDHCI 控制器复用 `sdhci` 框架,只填差异。

何时加载本模块：写 MMC/SD/eMMC 主机控制器驱动——实现 ops、收发请求。

## 驱动骨架：alloc → 填 ops → add，移除时 remove → free

```c
mmc = mmc_alloc_host(sizeof(struct my_host), dev);
if (!mmc)
    return -ENOMEM;
host = mmc_priv(mmc);
mmc->ops = &my_mmc_ops;
mmc->f_min = ...; mmc->f_max = ...; mmc->ocr_avail = ...; mmc->caps = ...;

ret = mmc_add_host(mmc);     /* 注册即对块层可见 */
/* remove: mmc_remove_host(mmc); mmc_free_host(mmc); */
```

`struct mmc_host_ops`：`.request`(下发一个请求)、`.set_ios`(设时钟/总线宽度/电压)、`.get_cd`(插拔检测)、`.get_ro`(写保护)。

## .request 完成后必须 mmc_request_done（核心,易漏）

```c
static void my_request(struct mmc_host *mmc, struct mmc_request *mrq)
{
    /* 把 mrq->cmd / mrq->data 下到硬件;完成(中断里或同步)后: */
    mmc_request_done(mmc, mrq);   /* 必须:把请求交还 MMC 核心 */
}
```

控制器处理完一个请求(成功或出错)**必须**调 `mmc_request_done(host, mrq)` 把它交还核心。漏了 MMC 栈会一直等、整个卡挂死。详见 `known-bugs.md` KB-MMC-001。`CONFIG_MMC` 是框架开关。

## 常见坑

- `.request` 处理完不调 `mmc_request_done` → MMC 栈卡死等完成(KB-MMC-001)。
- 出错路径上漏 `mmc_request_done`(只在成功路径调)→ 一遇错就挂。
- `mmc_alloc_host` 后失败不 `mmc_free_host`;插拔用 `mmc_detect_change` 通知核心重新扫卡。
