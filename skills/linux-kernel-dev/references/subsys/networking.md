# Networking · Net Device Drivers (netdev)

> 权威源：`Documentation/networking/`（`netdevices.rst`、`napi.rst`、`driver.rst`）、
> `include/linux/netdevice.h`、`include/linux/skbuff.h`。API 以目标树为准。
> 总线/DT 绑定见对应模块(`device-tree.md` / `i2c.md` …);本模块讲 net_device 这层。

何时加载本模块：写网卡/以太网控制器驱动——注册 net_device、收发包、NAPI、sk_buff。

## 注册 net_device

```c
struct net_device *ndev = alloc_etherdev(sizeof(struct my_priv));  /* 私有区跟在后面 */
struct my_priv *priv = netdev_priv(ndev);
ndev->netdev_ops = &my_netdev_ops;     /* struct net_device_ops */
SET_NETDEV_DEV(ndev, &pdev->dev);
register_netdev(ndev);                  /* 卸载时 unregister_netdev + free_netdev */
```

`struct net_device_ops` 的核心回调：`ndo_open`(ifconfig up,申请中断/启 DMA/启 NAPI)、`ndo_stop`(down)、`ndo_start_xmit`(发包)、`ndo_get_stats64`(统计)。

## 收包：NAPI(现代驱动一律用)

```c
netif_napi_add(ndev, &priv->napi, my_poll);   /* 现代签名:无 weight 参 */
/* 中断里:关收中断 + napi_schedule(&priv->napi); */
static int my_poll(struct napi_struct *napi, int budget) {
    int done = 0;
    while (done < budget && /* 有包 */) {
        struct sk_buff *skb = netdev_alloc_skb(ndev, len);
        /* 填 skb,skb_put,eth_type_trans */
        napi_gro_receive(napi, skb);          /* 上交协议栈 */
        done++;
    }
    if (done < budget) { napi_complete_done(napi, done); /* 重开收中断 */ }
    return done;
}
```

**NAPI poll 在软中断上下文跑——不能睡**(见 SKILL Forbidden #1 / `interrupts.md`)。**必须尊重 `budget`**:收满 budget 就返回(下一轮再来),`done < budget` 时才 `napi_complete_done` 并重开收中断,返回实际处理数。见 `known-bugs.md` KB-NET-001。

## 发包：ndo_start_xmit

```c
static netdev_tx_t my_xmit(struct sk_buff *skb, struct net_device *ndev) {
    /* 把 skb 数据交给硬件 DMA(buffer 要 DMA-able,见 memory.md) */
    if (/* 环满 */) { netif_stop_queue(ndev); return NETDEV_TX_BUSY; }
    /* 发完(或 TX 完成中断里)dev_kfree_skb;环有空位 netif_wake_queue */
    return NETDEV_TX_OK;
}
```

- `ndo_start_xmit` 在持锁、关 BH 的上下文调用——**不能睡**。
- 返回 `NETDEV_TX_OK` 表示已接管 skb(你负责最终 `dev_kfree_skb`);环满用 `netif_stop_queue` + 返回 `NETDEV_TX_BUSY`,有空位再 `netif_wake_queue`。

## sk_buff 速记

`netdev_alloc_skb` 分配 → `skb_put` 扩数据区 → `eth_type_trans` 定协议 → `napi_gro_receive`/`netif_receive_skb` 上交;发完 `dev_kfree_skb`。

## 版本敏感(按目标树 `include/linux/netdevice.h` 核)

- `netif_napi_add` 旧版本带 weight 参 `netif_napi_add(dev, napi, poll, weight)`,新内核去掉 weight(默认 64)用 `netif_napi_add(dev, napi, poll)`。按目标树核签名。

## 常见坑

- NAPI poll 里睡眠 / 不尊重 budget(收完 budget 不返回)→ 软锁、其他任务饿死(KB-NET-001)。
- `ndo_start_xmit` 里睡眠(它在原子上下文)。
- 发包路径 DMA 用了栈/不可 DMA 的 buffer(见 `memory.md` / `spi.md` 同理)。
- 忘了 TX 完成后 `dev_kfree_skb` → skb 泄漏;或环满不 `netif_stop_queue` → 丢包。
