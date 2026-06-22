# Mailbox — 核间/外设 IPC

> 权威源：`Documentation/driver-api/mailbox.rst`、`include/linux/mailbox_client.h`、
> `include/linux/mailbox_controller.h`。API 以目标树为准。

何时加载本模块：写 mailbox 控制器(给 SCP/MCU/远端核传消息),或做 mailbox client 收发消息。

## Client：拿通道 → 发消息

```c
struct mbox_client cl = { .dev = dev, .rx_callback = my_rx, .tx_block = true, .tx_tout = 500 };
chan = mbox_request_channel(&cl, 0);          /* DT mboxes/mbox-names;byname 用 _byname */
if (IS_ERR(chan))
    return PTR_ERR(chan);

mbox_send_message(chan, &msg);                /* tx_block 时阻塞到完成/超时 */
/* ... 收到的消息进 my_rx() ... */
mbox_free_channel(chan);
```

`mbox_client.rx_callback` 收消息;`tx_block`/`tx_tout` 控制发送是否阻塞。

## Controller：实现 ops + 上报 TX 完成 / RX

```c
static const struct mbox_chan_ops my_ops = {
    .send_data = my_send,        /* 把一条消息下到硬件 */
    .startup = ..., .shutdown = ...,
    .last_tx_done = my_poll,     /* 仅 txdone_poll 模式 */
};
mbox->ops = &my_ops; mbox->chans = ...; mbox->num_chans = ...;
mbox->txdone_irq = true;         /* 有 TX ACK 中断 */
devm_mbox_controller_register(dev, mbox);

/* 收到消息: */ mbox_chan_received_data(chan, &msg);
/* TX 硬件完成(ACK 中断里): */ mbox_chan_txdone(chan, 0);
```

## TX 完成必须上报给核心（核心,易漏）

mailbox 核心要知道一条消息发完了才发下一条。三选一:① `txdone_irq` → 硬件 ACK 中断里调 `mbox_chan_txdone(chan, err)`;② `txdone_poll` → 实现 `mbox_chan_ops.last_tx_done` 让核心轮询;③ client 设 `knows_txdone` → client 调 `mbox_client_txdone`。一个都不做,核心以为 TX 永不完成,后续消息卡住。收到的数据用 `mbox_chan_received_data` 上报。详见 `known-bugs.md` KB-MBOX-001。`CONFIG_MAILBOX` 是框架开关。

## 常见坑

- 控制器既没 `mbox_chan_txdone`、又没 `last_tx_done`、client 也没 `knows_txdone` → TX 永不完成,发送卡死(KB-MBOX-001)。
- `send_data` 阻塞等完成(应快速下发即返回,完成靠 txdone 上报)。
- RX 不用 `mbox_chan_received_data` 上报 → client 的 rx_callback 收不到。
